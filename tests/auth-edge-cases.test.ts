/**
 * P0 authentication security cases (SECURITY_EDGE_CASES.md).
 *
 * @see docs/SECURITY_EDGE_CASES.md — AUTH-001, AUTH-002, AUTH-010, AUTH-011
 * @see tests/security-p0.test.ts — remaining top-15 (DOC, SRCH, ACT, CSV, AI)
 */
import { describe, expect, it, beforeAll, afterAll, vi } from "vitest";
import bcrypt from "bcryptjs";
import { Role, WorkflowEntityType } from "@prisma/client";
import {
  authenticateCredentials,
  isAccountLockedOut,
} from "@/lib/security/auth-credentials";
import { canWrite, type SessionUser } from "@/lib/rbac";
import { updateMatterAction } from "@/lib/actions/matters";
import { prisma } from "@/lib/prisma";
import {
  canConnectDatabase,
  cleanupP0Fixtures,
  seedP0Fixtures,
  type P0Fixtures,
} from "./helpers/db";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
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
}));

import { auth } from "@/lib/auth";
import { getSessionUser, loadActiveSessionUser } from "@/lib/session";

let dbReady = false;

async function ensureDb(): Promise<boolean> {
  if (!dbReady) dbReady = await canConnectDatabase();
  return dbReady;
}

function session(
  id: string,
  email: string,
  name: string,
  role: Role
): SessionUser {
  return { id, email, name, role };
}

describe("AUTH-001 — brute-force lockout (unit)", () => {
  it("is not locked below threshold", () => {
    expect(isAccountLockedOut(4, new Date(), 5, 30)).toBe(false);
  });

  it("is locked at threshold within lockout window", () => {
    const lastFailed = new Date("2026-05-21T12:00:00Z");
    const now = new Date("2026-05-21T12:10:00Z");
    expect(isAccountLockedOut(5, lastFailed, 5, 30, now)).toBe(true);
  });

  it("is not locked after lockout window elapses", () => {
    const lastFailed = new Date("2026-05-21T12:00:00Z");
    const now = new Date("2026-05-21T12:31:00Z");
    expect(isAccountLockedOut(5, lastFailed, 5, 30, now)).toBe(false);
  });
});

describe("AUTH-001 — brute-force lockout (integration)", () => {
  let fx: P0Fixtures;

  beforeAll(async () => {
    if (!(await ensureDb())) return;
    fx = await seedP0Fixtures();
  }, 60_000);

  afterAll(async () => {
    await cleanupP0Fixtures();
  }, 30_000);

  it.runIf(() => dbReady)("blocks login at threshold even with correct password, then allows after window", async () => {
    const settings = await prisma.firmSettings.findFirst({
      where: { id: "default" },
    });
    const threshold = settings?.failedLoginLockoutThreshold ?? 5;

    await prisma.user.update({
      where: { id: fx.lawyerB.id },
      data: {
        active: true,
        failedLoginCount: threshold + 1,
        lastFailedLoginAt: new Date(),
        passwordHash: await bcrypt.hash("test-p0-password", 10),
      },
    });

    const duringLockout = await authenticateCredentials(
      fx.lawyerB.email,
      "test-p0-password"
    );
    expect(duringLockout).toBeNull();

    await prisma.user.update({
      where: { id: fx.lawyerB.id },
      data: {
        lastFailedLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    });

    const afterWindow = await authenticateCredentials(
      fx.lawyerB.email,
      "test-p0-password"
    );
    expect(afterWindow).toMatchObject({ id: fx.lawyerB.id, email: fx.lawyerB.email });

    const reset = await prisma.user.findUniqueOrThrow({
      where: { id: fx.lawyerB.id },
      select: { failedLoginCount: true, lastFailedLoginAt: true },
    });
    expect(reset.failedLoginCount).toBe(0);
    expect(reset.lastFailedLoginAt).toBeNull();
  });
});

describe("AUTH-002 — inactive user cannot login", () => {
  let fx: P0Fixtures;

  beforeAll(async () => {
    if (!(await ensureDb())) return;
    fx = await seedP0Fixtures();
  }, 60_000);

  afterAll(async () => {
    await cleanupP0Fixtures();
  }, 30_000);

  it.runIf(() => dbReady)("rejects inactive user (null — no JWT)", async () => {
    await prisma.user.update({
      where: { id: fx.lawyerA.id },
      data: { active: false },
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
});

describe("AUTH-010 — role change blocks stale write permission", () => {
  it("VIEWER role cannot write (server actions use canWrite)", () => {
    expect(
      canWrite(session("v1", "viewer@firm.local", "Viewer", Role.VIEWER))
    ).toBe(false);
  });

  describe("stale JWT vs database role", () => {
    let fx: P0Fixtures;
    let statusId: string;

    beforeAll(async () => {
      if (!(await ensureDb())) return;
      fx = await seedP0Fixtures();
      const status = await prisma.workflowStatus.findFirstOrThrow({
        where: {
          entityType: WorkflowEntityType.MATTER,
          isDefault: true,
          active: true,
        },
        select: { id: true },
      });
      statusId = status.id;
    }, 60_000);

    afterAll(async () => {
      await cleanupP0Fixtures();
    }, 30_000);

    it.runIf(() => dbReady)(
      "getSessionUser returns VIEWER from DB when JWT still says LAWYER",
      async () => {
        vi.mocked(auth).mockResolvedValue({
          user: {
            id: fx.lawyerA.id,
            email: fx.lawyerA.email,
            name: "Lawyer A",
            role: Role.LAWYER,
          },
        } as Awaited<ReturnType<typeof auth>>);

        await prisma.user.update({
          where: { id: fx.lawyerA.id },
          data: { role: Role.VIEWER, active: true },
        });

        const user = await getSessionUser();
        expect(user?.role).toBe(Role.VIEWER);
        expect(canWrite(user!)).toBe(false);

        await prisma.user.update({
          where: { id: fx.lawyerA.id },
          data: { role: Role.LAWYER },
        });
      }
    );

    it.runIf(() => dbReady)(
      "updateMatterAction rejects when DB role is VIEWER but JWT was LAWYER",
      async () => {
        vi.mocked(auth).mockResolvedValue({
          user: {
            id: fx.lawyerA.id,
            email: fx.lawyerA.email,
            name: "Lawyer A",
            role: Role.LAWYER,
          },
        } as Awaited<ReturnType<typeof auth>>);

        await prisma.user.update({
          where: { id: fx.lawyerA.id },
          data: { role: Role.VIEWER, active: true },
        });

        const form = new FormData();
        form.set("clientId", fx.clientId);
        form.set("title", "Stale JWT edit attempt");
        form.set("statusId", statusId);

        const result = await updateMatterAction(
          fx.matterAssignedId,
          null,
          form
        );
        expect(result.success).toBe(false);
        expect(result.error).toBeTruthy();

        await prisma.user.update({
          where: { id: fx.lawyerA.id },
          data: { role: Role.LAWYER },
        });
      }
    );
  });
});

describe("AUTH-011 — deactivated user cannot continue mutating", () => {
  describe("stale session after deactivation", () => {
    let fx: P0Fixtures;

    beforeAll(async () => {
      if (!(await ensureDb())) return;
      fx = await seedP0Fixtures();
    }, 60_000);

    afterAll(async () => {
      await cleanupP0Fixtures();
    }, 30_000);

    it.runIf(() => dbReady)(
      "getSessionUser returns null when JWT exists but user.active=false",
      async () => {
        vi.mocked(auth).mockResolvedValue({
          user: {
            id: fx.lawyerA.id,
            email: fx.lawyerA.email,
            name: "Lawyer A",
            role: Role.LAWYER,
          },
        } as Awaited<ReturnType<typeof auth>>);

        await prisma.user.update({
          where: { id: fx.lawyerA.id },
          data: { active: false },
        });

        expect(await getSessionUser()).toBeNull();
        expect(await loadActiveSessionUser(fx.lawyerA.id)).toBeNull();

        await prisma.user.update({
          where: { id: fx.lawyerA.id },
          data: { active: true },
        });
      }
    );
  });

  describe("login blocked after deactivation", () => {
    let fx: P0Fixtures;

    beforeAll(async () => {
      if (!(await ensureDb())) return;
      fx = await seedP0Fixtures();
    }, 60_000);

    afterAll(async () => {
      await cleanupP0Fixtures();
    }, 30_000);

    it.runIf(() => dbReady)("rejects login after account deactivated (complements AUTH-002)", async () => {
      const ok = await authenticateCredentials(
        fx.lawyerA.email,
        "test-p0-password"
      );
      expect(ok).not.toBeNull();

      await prisma.user.update({
        where: { id: fx.lawyerA.id },
        data: { active: false },
      });

      const blocked = await authenticateCredentials(
        fx.lawyerA.email,
        "test-p0-password"
      );
      expect(blocked).toBeNull();

      await prisma.user.update({
        where: { id: fx.lawyerA.id },
        data: { active: true },
      });
    });
  });
});
