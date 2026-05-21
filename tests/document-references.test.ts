/**
 * Document reference types (LOCAL-001–012).
 * @see docs/SECURITY_EDGE_CASES.md
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Role } from "@prisma/client";
import {
  isValidExternalDocumentUrl,
  isValidDocumentUrl,
} from "@/lib/validations/url";
import {
  isValidLocalPath,
  isValidManualReference,
  normalizeLocalPath,
} from "@/lib/validations/reference";
import { canOpenInBrowser } from "@/lib/document-reference";
import { globalSearch } from "@/lib/search";
import { canAccessMatter, documentWhereForUser } from "@/lib/rbac";
import { notDeleted } from "@/lib/soft-delete";
import {
  canConnectDatabase,
  cleanupP0Fixtures,
  seedP0Fixtures,
  type P0Fixtures,
} from "./helpers/db";
import { prisma } from "@/lib/prisma";

let dbReady = false;

function session(
  id: string,
  email: string,
  name: string,
  role: Role
) {
  return { id, email, name, role };
}

describe("LOCAL-001 — Windows UNC path", () => {
  it("accepts UNC with backslashes", () => {
    expect(
      isValidLocalPath("\\\\OfficeServer\\ClientFiles\\ABC Co\\Matter 001")
    ).toBe(true);
  });

  it("accepts UNC with forward slashes", () => {
    expect(
      isValidLocalPath("//OfficeServer/ClientFiles/ABC Co/Matter 001")
    ).toBe(true);
  });
});

describe("LOCAL-002 — macOS/Linux path", () => {
  it("accepts /Users/shared path", () => {
    expect(isValidLocalPath("/Users/shared/lawfirm/clients/ABC")).toBe(true);
  });

  it("accepts /Volumes path", () => {
    expect(isValidLocalPath("/Volumes/FirmDocs/Client A/Matter 001")).toBe(
      true
    );
  });
});

describe("LOCAL-003 — drive-letter path", () => {
  it("accepts D:\\ path", () => {
    expect(isValidLocalPath("D:\\FirmDocs\\Litigation\\Client A")).toBe(true);
  });

  it("accepts OneDrive desktop sync style path", () => {
    expect(
      isValidLocalPath("C:\\Users\\Lawyer\\OneDrive\\FirmDocs\\Client A")
    ).toBe(true);
  });
});

describe("LOCAL-004 — LOCAL_PATH is not validated as URL", () => {
  it("rejects pure https URL for local path validator", () => {
    expect(
      isValidLocalPath("https://drive.google.com/file/d/abc/view")
    ).toBe(false);
  });

  it("does not treat UNC as external URL", () => {
    expect(
      isValidExternalDocumentUrl("\\\\OfficeServer\\share\\file.pdf")
    ).toBe(false);
  });
});

describe("LOCAL-005 — server does not fetch paths", () => {
  it("document module has no fetch() calls", () => {
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

describe("LOCAL-008 — manual reference", () => {
  it("accepts cabinet / archive text", () => {
    expect(isValidManualReference("Cabinet 2 / Drawer B / Client ABC")).toBe(
      true
    );
  });
});

describe("LOCAL-009 — manual reference Thai text", () => {
  it("accepts Thai manual reference", () => {
    expect(
      isValidManualReference("ตู้เอกสาร 2 / ลิ้นชัก B / ลูกความ ABC")
    ).toBe(true);
  });
});

describe("LOCAL-010 — manual reference not a browser link", () => {
  it("canOpenInBrowser is false for manual reference", () => {
    expect(
      canOpenInBrowser("MANUAL_REFERENCE", "Archive Box 2024-07")
    ).toBe(false);
  });
});

describe("LOCAL-011 — dangerous schemes blocked", () => {
  it("blocks javascript: in manual reference", () => {
    expect(isValidManualReference("javascript:alert(1)")).toBe(false);
  });

  it("blocks javascript: in external URL", () => {
    expect(isValidDocumentUrl("javascript:alert(1)")).toBe(false);
  });

  it("blocks ftp: in external URL", () => {
    expect(isValidExternalDocumentUrl("ftp://files.example.com/doc")).toBe(
      false
    );
  });
});

describe("LOCAL path normalization", () => {
  it("normalizes //UNC to backslashes", () => {
    expect(normalizeLocalPath("//OfficeServer/share")).toBe(
      "\\\\OfficeServer\\share"
    );
  });
});

describe("LOCAL-006 / LOCAL-007 — RBAC and search", () => {
  let fx: P0Fixtures;

  beforeAll(async () => {
    dbReady = await canConnectDatabase();
    if (dbReady) fx = await seedP0Fixtures();
  }, 60_000);

  afterAll(async () => {
    await cleanupP0Fixtures();
  }, 30_000);

  it.runIf(() => dbReady)(
    "LOCAL-006: lawyer A cannot access hidden matter local path via canAccessMatter",
    async () => {
      const lawyerA = session(
        fx.lawyerA.id,
        fx.lawyerA.email,
        "Lawyer A",
        Role.LAWYER
      );
      expect(await canAccessMatter(lawyerA, fx.matterHiddenId)).toBe(false);
    }
  );

  it.runIf(() => dbReady)(
    "LOCAL-007: hidden local path document not in lawyer A search",
    async () => {
      const token = `local-path-token-${Date.now()}`;
      const hiddenPath = `\\\\OfficeServer\\Hidden\\${token}`;
      await prisma.documentLink.create({
        data: {
          clientId: fx.clientId,
          matterId: fx.matterHiddenId,
          title: `Local path doc ${token}`,
          url: hiddenPath,
          referenceType: "LOCAL_PATH",
          provider: "LOCAL_FOLDER",
        },
      });

      const lawyerA = session(
        fx.lawyerA.id,
        fx.lawyerA.email,
        "Lawyer A",
        Role.LAWYER
      );
      const results = await globalSearch(lawyerA, token);
      expect(results.documents.some((d) => d.url === hiddenPath)).toBe(false);

      await prisma.documentLink.deleteMany({
        where: { url: hiddenPath },
      });
    }
  );
});

describe("LOCAL-012 — copy path RBAC", () => {
  let fx: P0Fixtures;
  let localDocId: string;

  beforeAll(async () => {
    dbReady = await canConnectDatabase();
    if (!dbReady) return;
    fx = await seedP0Fixtures();
    const doc = await prisma.documentLink.create({
      data: {
        clientId: fx.clientId,
        matterId: fx.matterHiddenId,
        title: "Hidden local path",
        url: "\\\\OfficeServer\\Hidden\\secret",
        referenceType: "LOCAL_PATH",
        provider: "LOCAL_FOLDER",
      },
    });
    localDocId = doc.id;
  }, 60_000);

  afterAll(async () => {
    await cleanupP0Fixtures();
  }, 30_000);

  it.runIf(() => dbReady)(
    "unauthorized user cannot load hidden local path (same guard as copy action)",
    async () => {
      const lawyerA = session(
        fx.lawyerA.id,
        fx.lawyerA.email,
        "Lawyer A",
        Role.LAWYER
      );
      const doc = await prisma.documentLink.findFirst({
        where: {
          id: localDocId,
          ...notDeleted,
          ...documentWhereForUser(lawyerA),
        },
      });
      expect(doc).toBeNull();
    }
  );
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
