/**
 * P0 security smoke tests (SECURITY_EDGE_CASES.md — automate first).
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Role } from "@prisma/client";
import { isAccountLockedOut } from "@/lib/security/auth-credentials";
import { authenticateCredentials } from "@/lib/security/auth-credentials";
import { isValidDocumentUrl, normalizeDocumentUrl } from "@/lib/validations/url";
import { isValidLocalPath } from "@/lib/validations/reference";
import {
  canWrite,
  canAccessMatter,
  type SessionUser,
} from "@/lib/rbac";
import { activityLogsToCsv } from "@/lib/activity-export";
import { globalSearch } from "@/lib/search";
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

describe("AUTH-001 brute-force lockout (unit)", () => {
  it("locks account when failures meet threshold within window", () => {
    const lastFail = new Date("2026-01-01T12:00:00Z");
    const now = new Date("2026-01-01T12:15:00Z");
    expect(
      isAccountLockedOut(5, lastFail, 5, 30, now)
    ).toBe(true);
  });

  it("clears lockout after window expires", () => {
    const lastFail = new Date("2026-01-01T12:00:00Z");
    const now = new Date("2026-01-01T13:00:00Z");
    expect(
      isAccountLockedOut(5, lastFail, 5, 30, now)
    ).toBe(false);
  });
});

describe("DOC-009 / DOC-019 / DOC-025 document URL safety (unit)", () => {
  it("DOC-009: rejects javascript: URLs", () => {
    expect(isValidDocumentUrl("javascript:alert(1)")).toBe(false);
  });

  it("DOC-009: rejects data: URLs", () => {
    expect(isValidDocumentUrl("data:text/html,<script>")).toBe(false);
  });

  it("accepts https Drive-style URLs", () => {
    expect(
      isValidDocumentUrl("https://drive.google.com/file/d/abc/view")
    ).toBe(true);
  });

  it("DOC/local: UNC paths use LOCAL_PATH validation, not external URL", () => {
    expect(isValidDocumentUrl("\\\\server\\share\\matter\\doc.pdf")).toBe(
      false
    );
    expect(isValidLocalPath("\\\\server\\share\\matter\\doc.pdf")).toBe(true);
  });

  it("DOC-025: document module does not fetch remote URLs", () => {
    const srcDir = join(process.cwd(), "src");
    const files = walkTsFiles(srcDir);
    const offenders = files.filter((f) => {
      const text = readFileSync(f, "utf8");
      if (!f.includes("document") && !f.includes("billing")) return false;
      return /\bfetch\s*\(/.test(text);
    });
    expect(offenders).toEqual([]);
  });
});

describe("RBAC-003 viewer cannot mutate (unit)", () => {
  it("canWrite is false for VIEWER", () => {
    expect(
      canWrite(
        session("v1", "v@firm.local", "Viewer", Role.VIEWER)
      )
    ).toBe(false);
  });

  it("canWrite is true for LAWYER", () => {
    expect(
      canWrite(
        session("l1", "l@firm.local", "Lawyer", Role.LAWYER)
      )
    ).toBe(true);
  });
});

describe("CSV-006 / CSV-010 export safety (unit)", () => {
  it("CSV-010: escapes formula injection cells", () => {
    const csv = activityLogsToCsv([
      {
        id: "1",
        createdAt: new Date("2026-01-01T00:00:00Z"),
        userId: "u1",
        actorName: null,
        actorEmail: null,
        category: "DATA",
        action: "CREATE",
        entityType: "CLIENT",
        entityId: "c1",
        summary: "=cmd|'/c calc'!A0",
        metadata: null,
      },
    ]);
    expect(csv).toContain("'=cmd");
    expect(csv.split("\n")[1]).not.toMatch(/^=cmd/);
  });

  it("CSV-006: does not embed passwordHash in export rows", () => {
    const csv = activityLogsToCsv([
      {
        id: "2",
        createdAt: new Date(),
        userId: "u1",
        actorName: "Admin",
        actorEmail: "admin@firm.local",
        category: "AUTH",
        action: "VIEW",
        entityType: "USER",
        entityId: "u1",
        summary: "Successful login",
        metadata: { category: "login_success" },
      },
    ]);
    expect(csv.toLowerCase()).not.toContain("passwordhash");
    expect(csv).not.toContain("AUTH_SECRET");
  });
});

describe("AI-001 / AI-GW-001 AI gateway disabled by default (unit)", () => {
  it("policy and capabilities routes exist but do not call providers", () => {
    const policyRoute = join(
      process.cwd(),
      "src",
      "app",
      "api",
      "ai",
      "policy-check",
      "route.ts"
    );
    const text = readFileSync(policyRoute, "utf8");
    expect(text).not.toMatch(/\bfetch\s*\(/);
    expect(text).toMatch(/evaluateFirmAIPolicy/);
  });

  it("src tree has no OpenAI provider SDK calls", () => {
    const files = walkTsFiles(join(process.cwd(), "src"));
    const hits = files.filter((f) => {
      const t = readFileSync(f, "utf8");
      if (f.includes("/lib/ai/registry.ts") || f.includes("/lib/ai/types.ts")) {
        return /from\s+["']openai|from\s+["']@anthropic|@ai-sdk/i.test(t);
      }
      return /from\s+["']openai|from\s+["']@anthropic|@ai-sdk/i.test(t);
    });
    expect(hits).toEqual([]);
  });
});

describe("Database-backed P0 security tests", () => {
  let fx: P0Fixtures;
  let dbReady = false;

  beforeAll(async () => {
    dbReady = await canConnectDatabase();
    if (dbReady) {
      fx = await seedP0Fixtures();
    }
  }, 60_000);

  afterAll(async () => {
    if (dbReady) {
      await cleanupP0Fixtures();
      await prisma.$disconnect();
    }
  }, 30_000);

  it.runIf(() => dbReady)("AUTH-002: inactive user cannot login", async () => {
    await prisma.user.update({
      where: { id: fx.lawyerA.id },
      data: { active: false, failedLoginCount: 0, lastFailedLoginAt: null },
    });
    const result = await authenticateCredentials(
      fx.lawyerA.email,
      "test-p0-password"
    );
    expect(result).toBeNull();
    await prisma.user.update({
      where: { id: fx.lawyerA.id },
      data: { active: true },
    });
  });

  it.runIf(() => dbReady)("AUTH-001: lockout blocks login after threshold failures", async () => {
    const settings = await prisma.firmSettings.findFirst({
      where: { id: "default" },
    });
    const threshold = settings?.failedLoginLockoutThreshold ?? 5;

    await prisma.user.update({
      where: { id: fx.lawyerB.id },
      data: {
        active: true,
        failedLoginCount: threshold,
        lastFailedLoginAt: new Date(),
      },
    });

    const locked = await authenticateCredentials(
      fx.lawyerB.email,
      "test-p0-password"
    );
    expect(locked).toBeNull();

    await prisma.user.update({
      where: { id: fx.lawyerB.id },
      data: { failedLoginCount: 0, lastFailedLoginAt: null },
    });
  });

  it.runIf(() => dbReady)("RBAC-001: lawyer A cannot access lawyer B matter", async () => {
    const user = session(
      fx.lawyerA.id,
      fx.lawyerA.email,
      "Lawyer A",
      Role.LAWYER
    );
    const allowed = await canAccessMatter(user, fx.matterHiddenId);
    expect(allowed).toBe(false);
  });

  it.runIf(() => dbReady)(
    "RBAC-017 / SRCH-009: hidden matter and document not in search",
    async () => {
    const user = session(
      fx.lawyerA.id,
      fx.lawyerA.email,
      "Lawyer A",
      Role.LAWYER
    );
    const results = await globalSearch(user, fx.hiddenMatterTitle);
    expect(results.matters.some((m) => m.id === fx.matterHiddenId)).toBe(
      false
    );
    expect(
      results.documents.some((d) => d.id === fx.documentAssignedId)
    ).toBe(false);
  }
  );

  it.runIf(() => dbReady)("ACT-013: ActivityLog UPDATE blocked by database trigger", async () => {
    const log = await prisma.activityLog.findFirst({
      orderBy: { createdAt: "desc" },
    });
    if (!log) {
      const auditId = (
        await prisma.user.findFirst({
          where: { email: { contains: "security-audit" } },
        })
      )?.id;
      if (!auditId) return;
      await prisma.activityLog.create({
        data: {
          userId: auditId,
          entityType: "USER",
          entityId: auditId,
          category: "AUTH",
          action: "VIEW",
          summary: "P0 trigger test seed",
        },
      });
    }
    const target = await prisma.activityLog.findFirstOrThrow({
      orderBy: { createdAt: "desc" },
    });

    await expect(
      prisma.activityLog.update({
        where: { id: target.id },
        data: { summary: "tampered" },
      })
    ).rejects.toThrow();
  });
});

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules") continue;
        out.push(...walkTsFiles(p));
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        out.push(p);
      }
    }
  } catch {
    /* ignore */
  }
  return out;
}
