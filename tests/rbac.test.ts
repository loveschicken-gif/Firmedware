/**
 * P0 RBAC security cases (SECURITY_EDGE_CASES.md).
 *
 * @see docs/SECURITY_EDGE_CASES.md — RBAC-001, RBAC-003, RBAC-017
 * @see tests/security-p0.test.ts — SRCH-009 and related top-15 overlap
 */
import { describe, expect, it, beforeAll, afterAll, vi } from "vitest";
import { Role } from "@prisma/client";
import {
  canAccessMatter,
  canWrite,
  documentWhereForUser,
  type SessionUser,
} from "@/lib/rbac";
import { getMatterForUser } from "@/lib/matters";
import { globalSearch } from "@/lib/search";
import { updateMatterAction } from "@/lib/actions/matters";
import {
  canConnectDatabase,
  cleanupP0Fixtures,
  seedP0Fixtures,
  type P0Fixtures,
} from "./helpers/db";

vi.mock("@/lib/session", () => ({
  requireSessionUser: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("redirect");
  }),
}));

vi.mock("@/lib/i18n/server", () => ({
  getServerI18n: vi.fn().mockResolvedValue({
    t: (key: string) => key,
    locale: "en",
  }),
  getServerNamespaceI18n: vi.fn().mockResolvedValue({
    t: (key: string) => key,
    tn: (key: string) => key,
    locale: "en",
  }),
}));

import { requireSessionUser } from "@/lib/session";

let dbReady = false;

function session(
  id: string,
  email: string,
  name: string,
  role: Role
): SessionUser {
  return { id, email, name, role };
}

describe("RBAC-003 — viewer cannot mutate data (unit)", () => {
  it("canWrite is false for VIEWER", () => {
    expect(
      canWrite(session("v1", "viewer@firm.local", "Viewer", Role.VIEWER))
    ).toBe(false);
  });

  it("updateMatterAction rejects VIEWER before database access", async () => {
    vi.mocked(requireSessionUser).mockResolvedValue(
      session("v1", "viewer@firm.local", "Viewer", Role.VIEWER)
    );

    const form = new FormData();
    form.set("clientId", "client-id");
    form.set("title", "Should not update");
    form.set("statusId", "status-id");

    const result = await updateMatterAction("matter-id", null, form);
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe("RBAC-001 — unassigned matter URL blocked", () => {
  let fx: P0Fixtures;

  beforeAll(async () => {
    if (!(await canConnectDatabase())) return;
    dbReady = true;
    fx = await seedP0Fixtures();
  }, 60_000);

  afterAll(async () => {
    if (dbReady) await cleanupP0Fixtures();
  }, 30_000);

  it.runIf(() => dbReady)("lawyer A cannot access lawyer B matter (canAccessMatter / getMatterForUser)", async () => {
    const lawyerA = session(
      fx.lawyerA.id,
      fx.lawyerA.email,
      "Lawyer A",
      Role.LAWYER
    );

    expect(await canAccessMatter(lawyerA, fx.matterAssignedId)).toBe(true);
    expect(await canAccessMatter(lawyerA, fx.matterHiddenId)).toBe(false);

    expect(await getMatterForUser(lawyerA, fx.matterHiddenId)).toBeNull();
    expect((await getMatterForUser(lawyerA, fx.matterAssignedId))?.id).toBe(
      fx.matterAssignedId
    );
  });
});

describe("RBAC-017 — hidden document does not appear in search", () => {
  let fx: P0Fixtures;

  beforeAll(async () => {
    if (!(await canConnectDatabase())) return;
    dbReady = true;
    fx = await seedP0Fixtures();
  }, 60_000);

  afterAll(async () => {
    if (dbReady) await cleanupP0Fixtures();
  }, 30_000);

  it.runIf(() => dbReady)("globalSearch omits documents on matters the user cannot access", async () => {
    const lawyerA = session(
      fx.lawyerA.id,
      fx.lawyerA.email,
      "Lawyer A",
      Role.LAWYER
    );

    const results = await globalSearch(lawyerA, fx.documentTitle);
    expect(results.documents.some((d) => d.id === fx.documentAssignedId)).toBe(
      false
    );
  });

  it.runIf(() => dbReady)("globalSearch omits hidden matter titles (SRCH-009)", async () => {
    const lawyerA = session(
      fx.lawyerA.id,
      fx.lawyerA.email,
      "Lawyer A",
      Role.LAWYER
    );

    const results = await globalSearch(lawyerA, fx.hiddenMatterTitle);
    expect(results.matters.some((m) => m.id === fx.matterHiddenId)).toBe(false);
  });
});

describe("RBAC filters (unit)", () => {
  it("documentWhereForUser scopes non-admin users to accessible matters", () => {
    const lawyer = session("l1", "l@firm.local", "Lawyer", Role.LAWYER);
    const where = documentWhereForUser(lawyer);
    expect(where).toHaveProperty("OR");
  });
});
