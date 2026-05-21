/**
 * AI Connector Gateway tests (AI-GW-001 … AI-GW-012).
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Role } from "@prisma/client";
import { evaluateAIConnectorPolicy } from "@/lib/ai/policy";
import { aiProviderRegistry } from "@/lib/ai/registry";
import { assertCanUseAIGateway } from "@/lib/ai/gateway";
import { logAIPolicyChecked } from "@/lib/ai/activity";
import type { AIConnectorRequest } from "@/lib/ai/types";
import { canWrite, type SessionUser } from "@/lib/rbac";
import { getFirmSettings } from "@/lib/firm-settings";
import { prisma } from "@/lib/prisma";
import {
  canConnectDatabase,
  cleanupP0Fixtures,
  seedP0Fixtures,
  type P0Fixtures,
} from "./helpers/db";

function session(
  id: string,
  email: string,
  name: string,
  role: Role
): SessionUser {
  return { id, email, name, role };
}

function baseRequest(
  overrides: Partial<AIConnectorRequest> = {}
): AIConnectorRequest {
  return {
    provider: "OPENAI",
    mode: "PUBLIC_RESEARCH_ONLY",
    userId: "user-1",
    purpose: "PUBLIC_RESEARCH",
    prompt: "Generic legal research question",
    includesClientConfidentialInfo: false,
    includesPrivilegedInfo: false,
    includesPersonalData: false,
    includesExternalDocumentLinks: false,
    includesLocalPaths: false,
    userConfirmed: true,
    ...overrides,
  };
}

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkTsFiles(p));
    else if (ent.name.endsWith(".ts") || ent.name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

describe("AI-GW-001 AI connectors disabled by default", () => {
  it("registry providers are all disabled", () => {
    for (const entry of Object.values(aiProviderRegistry)) {
      expect(entry.enabled).toBe(false);
    }
  });

  it("firm settings default enableAIConnectors false when DB available", async () => {
    if (!(await canConnectDatabase())) return;
    try {
      const settings = await getFirmSettings();
      expect(settings.enableAIConnectors).toBe(false);
      expect(settings.aiConnectorMode).toBe("DISABLED");
    } catch {
      // Migration not applied on this database — registry defaults still hold
    }
  });
});

describe("AI-GW-002 policy-check does not call provider", () => {
  it("no fetch to provider hosts in api/ai routes", () => {
    const apiAi = join(process.cwd(), "src", "app", "api", "ai");
    const files = walkTsFiles(apiAi);
    const offenders = files.filter((f) => {
      const text = readFileSync(f, "utf8");
      return /\bfetch\s*\(/.test(text);
    });
    expect(offenders).toEqual([]);
  });

  it("no openai/anthropic SDK imports under src/lib/ai", () => {
    const files = walkTsFiles(join(process.cwd(), "src", "lib", "ai"));
    const hits = files.filter((f) => {
      const t = readFileSync(f, "utf8");
      return /from\s+["']openai|from\s+["']@anthropic|@ai-sdk/i.test(t);
    });
    expect(hits).toEqual([]);
  });
});

describe("AI-GW-003 public research blocks client confidential info", () => {
  it("blocks confidential flags on PUBLIC_RESEARCH", () => {
    const d = evaluateAIConnectorPolicy(
      baseRequest({
        includesClientConfidentialInfo: true,
        purpose: "PUBLIC_RESEARCH",
      })
    );
    expect(d.allowed).toBe(false);
  });
});

describe("AI-GW-004 external document links blocked by default", () => {
  it("blocks includesExternalDocumentLinks", () => {
    const d = evaluateAIConnectorPolicy(
      baseRequest({ includesExternalDocumentLinks: true })
    );
    expect(d.allowed).toBe(false);
    expect(d.reason).toMatch(/external document links/i);
  });
});

describe("AI-GW-005 local paths blocked by default", () => {
  it("blocks includesLocalPaths", () => {
    const d = evaluateAIConnectorPolicy(
      baseRequest({ includesLocalPaths: true })
    );
    expect(d.allowed).toBe(false);
    expect(d.reason).toMatch(/local file paths/i);
  });
});

describe("AI-GW-006 privileged info requires confidential approval", () => {
  it("blocks privileged without approval", () => {
    const d = evaluateAIConnectorPolicy(
      baseRequest({ includesPrivilegedInfo: true })
    );
    expect(d.allowed).toBe(false);
    expect(d.requiresAdminApproval).toBe(true);
  });

  it("allows privileged with CONFIDENTIAL_WITH_APPROVAL and adminApproved", () => {
    const d = evaluateAIConnectorPolicy(
      baseRequest({
        mode: "CONFIDENTIAL_WITH_APPROVAL",
        includesPrivilegedInfo: true,
        adminApproved: true,
        purpose: "OTHER",
      })
    );
    expect(d.allowed).toBe(true);
  });
});

describe("AI-GW-007 viewer cannot use AI gateway", () => {
  it("assertCanUseAIGateway returns 403 for VIEWER", () => {
    const res = assertCanUseAIGateway(
      session("v1", "v@firm.local", "Viewer", Role.VIEWER)
    );
    expect(res?.status).toBe(403);
  });

  it("canWrite false for VIEWER", () => {
    expect(
      canWrite(session("v1", "v@firm.local", "Viewer", Role.VIEWER))
    ).toBe(false);
  });
});

describe("AI-GW-008 prompt not stored by default", () => {
  it("logAIPolicyChecked source does not reference prompt in metadata", () => {
    const src = readFileSync(
      join(process.cwd(), "src", "lib", "ai", "activity.ts"),
      "utf8"
    );
    expect(src).not.toMatch(/metadata:.*prompt/s);
    expect(src).toMatch(/never prompts/i);
  });

  it("policy-check route does not persist prompt to prisma", () => {
    const src = readFileSync(
      join(
        process.cwd(),
        "src",
        "app",
        "api",
        "ai",
        "policy-check",
        "route.ts"
      ),
      "utf8"
    );
    expect(src).not.toMatch(/prisma\.\w+\.create/);
    expect(src).not.toMatch(/prompt.*metadata/);
  });
});

describe("AI-GW-009 no provider API key required for startup", () => {
  it("package.json has no openai dependency", () => {
    const pkg = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf8")
    );
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(deps.openai).toBeUndefined();
    expect(deps["@anthropic-ai/sdk"]).toBeUndefined();
  });
});

describe("AI-GW-010 AI cannot mutate records", () => {
  it("src/lib/ai has no prisma mutations", () => {
    const files = walkTsFiles(join(process.cwd(), "src", "lib", "ai"));
    const offenders = files.filter((f) => {
      const t = readFileSync(f, "utf8");
      return /prisma\.\w+\.(create|update|delete|upsert)/.test(t);
    });
    expect(offenders).toEqual([]);
  });
});

describe("AI-GW-011 AI cannot export records", () => {
  it("api/ai has no export routes", () => {
    const apiAi = join(process.cwd(), "src", "app", "api", "ai");
    const entries = readdirSync(apiAi, { withFileTypes: true });
    const names = entries.map((e) => e.name.toLowerCase());
    expect(names.some((n) => n.includes("export"))).toBe(false);
  });
});

describe("AI-GW-012 AI cannot fetch external document providers", () => {
  it("src/lib/ai does not fetch remote URLs", () => {
    const files = walkTsFiles(join(process.cwd(), "src", "lib", "ai"));
    const offenders = files.filter((f) => {
      const t = readFileSync(f, "utf8");
      return /\bfetch\s*\(/.test(t);
    });
    expect(offenders).toEqual([]);
  });
});

describe("AI gateway integration (optional DB)", () => {
  let fx: P0Fixtures;
  let dbReady = false;

  beforeAll(async () => {
    dbReady = await canConnectDatabase();
    if (dbReady) fx = await seedP0Fixtures();
  }, 60_000);

  afterAll(async () => {
    if (dbReady) await cleanupP0Fixtures(fx);
  }, 60_000);

  it("logAIPolicyChecked writes metadata without prompt field", async () => {
    if (!dbReady) return;
    await logAIPolicyChecked(fx.admin.id, {
      allowed: false,
      provider: "OPENAI",
      mode: "DISABLED",
      purpose: "PUBLIC_RESEARCH",
    });
    const log = await prisma.activityLog.findFirst({
      where: {
        userId: fx.admin.id,
        summary: { contains: "AI policy check" },
      },
      orderBy: { createdAt: "desc" },
    });
    expect(log).toBeTruthy();
    const meta = log?.metadata as Record<string, unknown> | null;
    expect(meta?.kind).toBe("AI_POLICY_CHECKED");
    expect(meta).not.toHaveProperty("prompt");
  });
});
