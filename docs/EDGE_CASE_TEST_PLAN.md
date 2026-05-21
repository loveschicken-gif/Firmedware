# Firmedware edge-case test plan
> **Version:** 1.2 · **Scope:** single-tenant metadata + document references (URLs, local paths, manual) · **Status:** test design (top security cases partially automated)

Rigorous edge-case catalog for bugs, permission leaks, validation gaps, data corruption, UI failures, and security weaknesses—including **legal-operations risks** for metadata-only law firm software (confidential titles/notes, external DMS permission mismatch, backups, admin errors, retention). Aligns with codebase modules under `src/lib/` and operational docs. Firmedware does **not** certify compliance; tests support firm operational discipline.

## How to use this document

1. Run **P0 Must-Pass** before production (see end of doc).
2. Map failures to [FAILURE_MODE_MATRIX.md](./FAILURE_MODE_MATRIX.md).
3. Security-focused subset: [SECURITY_EDGE_CASES.md](./SECURITY_EDGE_CASES.md).
4. Suggested automation stubs: `tests/*.test.ts` (listed at end; implement when requested).

### Test case fields
Each case includes: Test ID, Module, Risk type, Persona, Preconditions, Steps, Expected result, Failure symptom, Priority (P0/P1/P2), Suggested automated test type.

### Known implementation notes (v1.2)
- `requireSessionUser` reloads `role` and `active` from the database on each request (AUTH-010, AUTH-011); JWT may still show stale values until the next navigation.
- `LAWYER` and `STAFF` share identical permissions in code.
- `defaultMatterVisibility` in schema is unused.
- URL validator uses `URL()` — verify `javascript:` / `data:` blocking (DOC-009/010).
- Search may include notes when `enableEntityNotes=false` (SRCH-012).
- AI Connector Gateway stubs in `src/lib/ai/` and `/api/ai/*` (section O + AI-GW-*); providers disabled by default.
- **Metadata is confidential:** titles, notes, and URLs can reveal facts without storing files (sections U–Y).
- Firmedware **cannot enforce** Google Drive / SharePoint / OneDrive / Dropbox ACLs (section V).

---

## A. Authentication edge cases

*15 test cases*

#### AUTH-001

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-001 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Fail login until threshold exceeded; retry with correct password during lockout; retry after lockout window |
| **Expected result** | Generic invalid-credentials only; lockout enforced; counter resets on success |
| **What failure would look like** | Unlimited attempts; lockout bypass; user enumeration via different errors |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### AUTH-002

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-002 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Login as user with active=false |
| **Expected result** | Rejected; AUTH activity logged; no JWT |
| **What failure would look like** | Inactive user session created |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### AUTH-003

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-003 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Login user only deactivated (no hard delete) |
| **Expected result** | Same as AUTH-002 |
| **What failure would look like** | Deleted user still authenticates |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### AUTH-004

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-004 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Login with email differing only by case from stored email |
| **Expected result** | Consistent behavior (match or safe fail with generic error) |
| **What failure would look like** | Wrong account match or duplicate sessions |
| **Priority** | P1 |
| **Suggested automated test type** | unit |

#### AUTH-005

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-005 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Login with padded spaces in email field |
| **Expected result** | Trim/reject; no crash |
| **What failure would look like** | Accidental account creation or wrong binding |
| **Priority** | P1 |
| **Suggested automated test type** | unit |

#### AUTH-006

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-006 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Login with 500+ char email |
| **Expected result** | Safe validation rejection |
| **What failure would look like** | 500/DB error |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### AUTH-007

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-007 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Email `admin' OR '1'='1` |
| **Expected result** | Safe failure; no SQL leak in response |
| **What failure would look like** | SQLi or auth bypass |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### AUTH-008

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-008 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Email with emoji / non-Latin local-part |
| **Expected result** | Reject or no match safely |
| **What failure would look like** | Crash or unexpected match |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### AUTH-009

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-009 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Two sessions; change password in A; submit in B |
| **Expected result** | B invalidated or must re-auth; no silent continue |
| **What failure would look like** | Stale password session indefinitely |
| **Priority** | P1 |
| **Suggested automated test type** | E2E |

#### AUTH-010

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-010 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Lawyer session; admin changes role to VIEWER; submit edit |
| **Expected result** | Server rejects mutation |
| **What failure would look like** | Stale JWT retains LAWYER writes |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### AUTH-011

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-011 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Lawyer session; admin deactivates user; continue browsing |
| **Expected result** | Document known JWT gap; ideally block on next server action |
| **What failure would look like** | Deactivated user mutates records |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### AUTH-012

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-012 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Expired/invalid session cookie; POST server action |
| **Expected result** | Redirect login; no mutation |
| **What failure would look like** | Unauthenticated write succeeds |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### AUTH-013

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-013 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Start app with missing/invalid AUTH_SECRET |
| **Expected result** | Fail fast; no insecure sessions |
| **What failure would look like** | Weak/forged tokens accepted |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### AUTH-014

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-014 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Run seed when User table non-empty |
| **Expected result** | No admin overwrite |
| **What failure would look like** | Second admin or password reset |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### AUTH-015

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-015 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | First boot seed with empty SEED_ADMIN_PASSWORD |
| **Expected result** | Reject or force change before prod (default changeme documented) |
| **What failure would look like** | Blank-password admin in production |
| **Priority** | P0 |
| **Suggested automated test type** | manual |


## B. RBAC and permission leakage

*19 test cases*

#### RBAC-001

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-001 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Open /matters/{M2} |
| **Expected result** | 404/redirect; no data |
| **What failure would look like** | Matter body or metadata exposed |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RBAC-002

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-002 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Open /clients/{hidden} direct URL |
| **Expected result** | Blocked for non-admin |
| **What failure would look like** | Client PII visible |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RBAC-003

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-003 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Viewer POST create/update/archive/export |
| **Expected result** | All rejected server-side |
| **What failure would look like** | Viewer mutates data |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RBAC-004

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-004 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Lawyer GET /admin/users |
| **Expected result** | Redirect/403 |
| **What failure would look like** | User admin reachable |
| **Priority** | P0 |
| **Suggested automated test type** | E2E |

#### RBAC-005

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-005 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Lawyer GET /admin/groups |
| **Expected result** | Blocked |
| **What failure would look like** | Group admin exposed |
| **Priority** | P0 |
| **Suggested automated test type** | E2E |

#### RBAC-006

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-006 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Lawyer GET /admin/settings |
| **Expected result** | Blocked |
| **What failure would look like** | Settings changed |
| **Priority** | P0 |
| **Suggested automated test type** | E2E |

#### RBAC-007

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-007 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Lawyer GET /admin/security |
| **Expected result** | Blocked |
| **What failure would look like** | Security settings changed |
| **Priority** | P0 |
| **Suggested automated test type** | E2E |

#### RBAC-008

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-008 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Lawyer GET /admin/workflow-statuses |
| **Expected result** | Blocked |
| **What failure would look like** | Workflow CRUD exposed |
| **Priority** | P1 |
| **Suggested automated test type** | E2E |

#### RBAC-009

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-009 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Lawyer GET /activity firm-wide |
| **Expected result** | Blocked |
| **What failure would look like** | Firm audit visible |
| **Priority** | P0 |
| **Suggested automated test type** | E2E |

#### RBAC-010

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-010 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Add user to G1; assign G1 to M1 |
| **Expected result** | User gains M1 access |
| **What failure would look like** | Group assignment ignored |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RBAC-011

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-011 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Deactivate G1 |
| **Expected result** | Group path access removed |
| **What failure would look like** | Inactive group still grants access |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RBAC-012

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-012 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Remove user from G1 |
| **Expected result** | Group-based access removed if no direct assign |
| **What failure would look like** | Access persists incorrectly |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RBAC-013

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-013 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Remove MatterGroupAssignment |
| **Expected result** | Members lose group path access |
| **What failure would look like** | Access persists |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RBAC-014

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-014 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | User direct+group on M1; remove one path |
| **Expected result** | Access remains via remaining path |
| **What failure would look like** | Premature loss or excess retention |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RBAC-015

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-015 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Archive M1 |
| **Expected result** | Hidden from non-admin lists/search |
| **What failure would look like** | Archived matter visible |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RBAC-016

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-016 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Archive all matters under client |
| **Expected result** | Non-admin loses client |
| **What failure would look like** | Client still visible |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RBAC-017

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-017 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Search document on inaccessible matter |
| **Expected result** | No hit |
| **What failure would look like** | URL/title leaked in search |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RBAC-018

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-018 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Dashboard tasks for inaccessible matter |
| **Expected result** | Excluded |
| **What failure would look like** | Task counts leak |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RBAC-019

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-019 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Invoke server actions without UI (curl/form) |
| **Expected result** | RBAC enforced same as UI |
| **What failure would look like** | Direct action bypass |
| **Priority** | P0 |
| **Suggested automated test type** | integration |


## C. Client visibility

*10 test cases*

#### CLI-001

| Field | Detail |
| --- | --- |
| **Test ID** | CLI-001 |
| **Module** | Client visibility |
| **Risk type** | Visibility |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Clients C0–C9 seeded per scenario in steps |
| **Steps** | C0 has no matters: list/detail/search as lawyer vs admin |
| **Expected result** | Admin sees; non-admin typically hidden |
| **What failure would look like** | Unexpected client exposure |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### CLI-002

| Field | Detail |
| --- | --- |
| **Test ID** | CLI-002 |
| **Module** | Client visibility |
| **Risk type** | Visibility |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Clients C0–C9 seeded per scenario in steps |
| **Steps** | C1 only archived matters |
| **Expected result** | Non-admin cannot see C1 |
| **What failure would look like** | Client visible |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### CLI-003

| Field | Detail |
| --- | --- |
| **Test ID** | CLI-003 |
| **Module** | Client visibility |
| **Risk type** | Visibility |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Clients C0–C9 seeded per scenario in steps |
| **Steps** | C2 one visible + one hidden matter |
| **Expected result** | Client visible; only M-visible listed |
| **What failure would look like** | Hidden matter listed |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### CLI-004

| Field | Detail |
| --- | --- |
| **Test ID** | CLI-004 |
| **Module** | Client visibility |
| **Risk type** | Visibility |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Clients C0–C9 seeded per scenario in steps |
| **Steps** | C3 matter only via inactive group |
| **Expected result** | No access |
| **What failure would look like** | Access via dead group |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### CLI-005

| Field | Detail |
| --- | --- |
| **Test ID** | CLI-005 |
| **Module** | Client visibility |
| **Risk type** | Visibility |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Clients C0–C9 seeded per scenario in steps |
| **Steps** | C4 matter assigned to inactive user |
| **Expected result** | That user cannot access |
| **What failure would look like** | Inactive assignee retains access |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### CLI-006

| Field | Detail |
| --- | --- |
| **Test ID** | CLI-006 |
| **Module** | Client visibility |
| **Risk type** | Visibility |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Clients C0–C9 seeded per scenario in steps |
| **Steps** | Search hidden client displayName |
| **Expected result** | Zero results for lawyer |
| **What failure would look like** | Name appears in search |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### CLI-007

| Field | Detail |
| --- | --- |
| **Test ID** | CLI-007 |
| **Module** | Client visibility |
| **Risk type** | Visibility |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Clients C0–C9 seeded per scenario in steps |
| **Steps** | Direct /clients/{hiddenId} |
| **Expected result** | Blocked |
| **What failure would look like** | 200 with PII |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### CLI-008

| Field | Detail |
| --- | --- |
| **Test ID** | CLI-008 |
| **Module** | Client visibility |
| **Risk type** | Visibility |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Clients C0–C9 seeded per scenario in steps |
| **Steps** | Admin archives all matters on C5 |
| **Expected result** | Lawyer loses C5 visibility |
| **What failure would look like** | Client still visible |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### CLI-009

| Field | Detail |
| --- | --- |
| **Test ID** | CLI-009 |
| **Module** | Client visibility |
| **Risk type** | Visibility |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Clients C0–C9 seeded per scenario in steps |
| **Steps** | Document on C6 client-only link |
| **Expected result** | Visible only if client has accessible matter per documentWhereForUser |
| **What failure would look like** | Doc visible without matter access |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### CLI-010

| Field | Detail |
| --- | --- |
| **Test ID** | CLI-010 |
| **Module** | Client visibility |
| **Risk type** | Visibility |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Clients C0–C9 seeded per scenario in steps |
| **Steps** | Task on C7 without visible matter |
| **Expected result** | Task hidden from lawyer lists |
| **What failure would look like** | Task leaked on dashboard |
| **Priority** | P1 |
| **Suggested automated test type** | integration |


## D. Matter workflow status

*12 test cases*

#### WF-001

| Field | Detail |
| --- | --- |
| **Test ID** | WF-001 |
| **Module** | Workflow status |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | Admin session; seeded workflow statuses |
| **Steps** | Deactivate current default MATTER status |
| **Expected result** | Another default promoted or create blocked with message |
| **What failure would look like** | Matters without status / crash |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### WF-002

| Field | Detail |
| --- | --- |
| **Test ID** | WF-002 |
| **Module** | Workflow status |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | Admin session; seeded workflow statuses |
| **Steps** | Set two defaults for MATTER entity type |
| **Expected result** | Second default rejected or first unset |
| **What failure would look like** | Two defaults active |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### WF-003

| Field | Detail |
| --- | --- |
| **Test ID** | WF-003 |
| **Module** | Workflow status |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | Admin session; seeded workflow statuses |
| **Steps** | Create status name duplicate slug |
| **Expected result** | Validation error |
| **What failure would look like** | Duplicate rows |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### WF-004

| Field | Detail |
| --- | --- |
| **Test ID** | WF-004 |
| **Module** | Workflow status |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | Admin session; seeded workflow statuses |
| **Steps** | Empty labelTh/labelEn |
| **Expected result** | Validation error |
| **What failure would look like** | Blank labels in UI |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### WF-005

| Field | Detail |
| --- | --- |
| **Test ID** | WF-005 |
| **Module** | Workflow status |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | Admin session; seeded workflow statuses |
| **Steps** | Label >2000 chars |
| **Expected result** | Reject or truncate safely |
| **What failure would look like** | UI/DB break |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### WF-006

| Field | Detail |
| --- | --- |
| **Test ID** | WF-006 |
| **Module** | Workflow status |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | Admin session; seeded workflow statuses |
| **Steps** | Emoji in labels |
| **Expected result** | Render stored UTF-8 |
| **What failure would look like** | Mojibake/crash |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### WF-007

| Field | Detail |
| --- | --- |
| **Test ID** | WF-007 |
| **Module** | Workflow status |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | Admin session; seeded workflow statuses |
| **Steps** | Mark status final; lawyer edits matter in that status |
| **Expected result** | Consistent firm policy (allow read-only or block) |
| **What failure would look like** | Closed matter silently reopened |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### WF-008

| Field | Detail |
| --- | --- |
| **Test ID** | WF-008 |
| **Module** | Workflow status |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | Admin session; seeded workflow statuses |
| **Steps** | Matter uses inactive statusId |
| **Expected result** | Badge fallback label |
| **What failure would look like** | Broken select |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### WF-009

| Field | Detail |
| --- | --- |
| **Test ID** | WF-009 |
| **Module** | Workflow status |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | Admin session; seeded workflow statuses |
| **Steps** | Deactivate all defaults; create matter |
| **Expected result** | Clear error or auto-pick |
| **What failure would look like** | Uncaught exception |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### WF-010

| Field | Detail |
| --- | --- |
| **Test ID** | WF-010 |
| **Module** | Workflow status |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | Admin session; seeded workflow statuses |
| **Steps** | Two statuses same sortOrder |
| **Expected result** | Stable ordering |
| **What failure would look like** | Unstable admin list |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### WF-011

| Field | Detail |
| --- | --- |
| **Test ID** | WF-011 |
| **Module** | Workflow status |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | Admin session; seeded workflow statuses |
| **Steps** | Switch UI to en with only th label populated |
| **Expected result** | Fallback en/th via i18n |
| **What failure would look like** | Raw key shown |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### WF-012

| Field | Detail |
| --- | --- |
| **Test ID** | WF-012 |
| **Module** | Workflow status |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | Admin session; seeded workflow statuses |
| **Steps** | CONTRACT workflow rows exist |
| **Expected result** | No broken /contracts routes in nav |
| **What failure would look like** | 404 loops in admin |
| **Priority** | P2 |
| **Suggested automated test type** | manual |


## E. Document link

*25 test cases*

#### DOC-001

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-001 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | Create link `drive.google.com/...` without scheme |
| **Expected result** | Stored as https://… |
| **What failure would look like** | Invalid stored URL |
| **Priority** | P1 |
| **Suggested automated test type** | unit |

#### DOC-002

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-002 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | Create `www.example.com/doc` |
| **Expected result** | https prefix added |
| **What failure would look like** | Rejected incorrectly |
| **Priority** | P2 |
| **Suggested automated test type** | unit |

#### DOC-003

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-003 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | Google Drive URL + GOOGLE_DRIVE provider |
| **Expected result** | Saved; external open only |
| **What failure would look like** | Server fetch |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### DOC-004

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-004 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | OneDrive URL |
| **Expected result** | Saved metadata |
| **What failure would look like** | Fetch/proxy |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### DOC-005

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-005 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | SharePoint URL |
| **Expected result** | Saved metadata |
| **What failure would look like** | Fetch/proxy |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### DOC-006

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-006 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | Dropbox URL |
| **Expected result** | Saved metadata |
| **What failure would look like** | Fetch/proxy |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### DOC-007

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-007 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | LOCAL_FOLDER path `\\server\share\file` |
| **Expected result** | Accepted as metadata string |
| **What failure would look like** | Path traversal server-side N/A |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### DOC-008

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-008 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | URL `not a url` |
| **Expected result** | validation.urlInvalid |
| **What failure would look like** | 500 error |
| **Priority** | P0 |
| **Suggested automated test type** | unit |

#### DOC-009

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-009 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | URL `javascript:alert(1)` |
| **Expected result** | Rejected (verify URL scheme policy) |
| **What failure would look like** | XSS via href |
| **Priority** | P0 |
| **Suggested automated test type** | unit |

#### DOC-010

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-010 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | URL `data:text/html,<script>` |
| **Expected result** | Rejected |
| **What failure would look like** | Inline content execution |
| **Priority** | P0 |
| **Suggested automated test type** | unit |

#### DOC-011

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-011 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | URL `file:///etc/passwd` |
| **Expected result** | Rejected or blocked open |
| **What failure would look like** | Local file read UX |
| **Priority** | P1 |
| **Suggested automated test type** | unit |

#### DOC-012

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-012 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | URL length >8KB |
| **Expected result** | Rejected |
| **What failure would look like** | DB error |
| **Priority** | P2 |
| **Suggested automated test type** | unit |

#### DOC-013

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-013 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | URL with `?token=secret` |
| **Expected result** | Stored; no server outbound call |
| **What failure would look like** | Token logged in server fetch |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DOC-014

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-014 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | Duplicate title+URL on same matter |
| **Expected result** | Allowed duplicate or clear UX |
| **What failure would look like** | Silent overwrite |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### DOC-015

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-015 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | provider OTHER, empty providerLabel |
| **Expected result** | providerNameRequired |
| **What failure would look like** | Saved incomplete |
| **Priority** | P1 |
| **Suggested automated test type** | unit |

#### DOC-016

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-016 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | providerLabel `<img onerror=alert(1)>` |
| **Expected result** | Escaped text in HTML |
| **What failure would look like** | Stored XSS |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DOC-017

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-017 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | title `<script>alert(1)</script>` |
| **Expected result** | Escaped |
| **What failure would look like** | XSS |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DOC-018

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-018 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | notes XSS payload |
| **Expected result** | Escaped |
| **What failure would look like** | XSS |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DOC-019

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-019 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | Submit create without permissionConfirmed checkbox |
| **Expected result** | permissionConfirmRequired when setting true |
| **What failure would look like** | Link saved without confirm |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DOC-020

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-020 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | Open /documents/{id} for inaccessible matter |
| **Expected result** | Blocked |
| **What failure would look like** | Metadata visible |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DOC-021

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-021 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | Document matterId null, clientId set |
| **Expected result** | RBAC via client matters |
| **What failure would look like** | Leak to unassigned lawyer |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### DOC-022

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-022 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | Document on archived matter |
| **Expected result** | Hidden from lawyer |
| **What failure would look like** | Still listed |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DOC-023

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-023 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | POST sensitivity INVALID |
| **Expected result** | Zod reject |
| **What failure would look like** | Wrong enum in DB |
| **Priority** | P1 |
| **Suggested automated test type** | unit |

#### DOC-024

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-024 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | Click open document |
| **Expected result** | target=_blank external; no iframe embed |
| **What failure would look like** | Proxied content in app |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### DOC-025

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-025 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | tcpdump during create/view doc |
| **Expected result** | No HTTP to drive/sharepoint host from server |
| **What failure would look like** | SSRF/fetch |
| **Priority** | P0 |
| **Suggested automated test type** | integration |


## F. Search

*16 test cases*

#### SRCH-001

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-001 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | GET /search?q= empty |
| **Expected result** | Empty state; no error |
| **What failure would look like** | Crash |
| **Priority** | P2 |
| **Suggested automated test type** | integration |

#### SRCH-002

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-002 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | q= 5000 chars |
| **Expected result** | Safe truncate/reject |
| **What failure would look like** | Timeout/500 |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### SRCH-003

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-003 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | q= Thai client name |
| **Expected result** | Matching client if RBAC allows |
| **What failure would look like** | No Thai match |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### SRCH-004

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-004 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | q= English matter title |
| **Expected result** | Match within RBAC |
| **What failure would look like** | Leak hidden matter |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### SRCH-005

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-005 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | q= mixed Thai+English |
| **Expected result** | Reasonable contains match |
| **What failure would look like** | Encoding failure |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### SRCH-006

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-006 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | q= case number with / and - |
| **Expected result** | Match matter fields |
| **What failure would look like** | Regex blow-up |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### SRCH-007

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-007 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | q= `'; DROP TABLE--` |
| **Expected result** | No SQL error |
| **What failure would look like** | Injection |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### SRCH-008

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-008 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | q= `<script>alert(1)</script>` |
| **Expected result** | No reflection XSS |
| **What failure would look like** | XSS |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### SRCH-009

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-009 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | Lawyer searches unassigned matter title |
| **Expected result** | No results |
| **What failure would look like** | Title hit |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### SRCH-010

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-010 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | Search archived matter name as admin vs lawyer |
| **Expected result** | Admin may see; lawyer not |
| **What failure would look like** | Lawyer sees archived |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### SRCH-011

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-011 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | Search archived document title |
| **Expected result** | Excluded for non-admin |
| **What failure would look like** | Leak |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### SRCH-012

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-012 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | enableEntityNotes=false; search note text |
| **Expected result** | Notes may still match in DB—document behavior |
| **What failure would look like** | Unexpected note leak in UI |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### SRCH-013

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-013 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | Search tag name attached to entity |
| **Expected result** | Match via relation |
| **What failure would look like** | Standalone tag search missing is OK |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### SRCH-014

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-014 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | Search highly confidential doc title |
| **Expected result** | RBAC before sensitivity display |
| **What failure would look like** | Leak |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### SRCH-015

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-015 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | If pagination exists, page 2 |
| **Expected result** | RBAC consistent |
| **What failure would look like** | Page 2 bypass |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### SRCH-016

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-016 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | 10k records seed; search common term |
| **Expected result** | Completes <5s dev baseline |
| **What failure would look like** | Timeout |
| **Priority** | P2 |
| **Suggested automated test type** | manual |


## G. Tasks and deadlines

*17 test cases*

#### TASK-001

| Field | Detail |
| --- | --- |
| **Test ID** | TASK-001 |
| **Module** | Tasks |
| **Risk type** | RBAC / timezone |
| **Persona** | Lawyer / Staff / Viewer |
| **Preconditions** | Firm timezone Asia/Bangkok |
| **Steps** | Create task matterId empty clientId set |
| **Expected result** | Allowed if validation permits |
| **What failure would look like** | Orphan task |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### TASK-002

| Field | Detail |
| --- | --- |
| **Test ID** | TASK-002 |
| **Module** | Tasks |
| **Risk type** | RBAC / timezone |
| **Persona** | Lawyer / Staff / Viewer |
| **Preconditions** | Firm timezone Asia/Bangkok |
| **Steps** | Task clientId only |
| **Expected result** | Visible per task filters |
| **What failure would look like** | Hidden task wrong |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### TASK-003

| Field | Detail |
| --- | --- |
| **Test ID** | TASK-003 |
| **Module** | Tasks |
| **Risk type** | RBAC / timezone |
| **Persona** | Lawyer / Staff / Viewer |
| **Preconditions** | Firm timezone Asia/Bangkok |
| **Steps** | Task on archived matter |
| **Expected result** | Hidden |
| **What failure would look like** | Shown overdue |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### TASK-004

| Field | Detail |
| --- | --- |
| **Test ID** | TASK-004 |
| **Module** | Tasks |
| **Risk type** | RBAC / timezone |
| **Persona** | Lawyer / Staff / Viewer |
| **Preconditions** | Firm timezone Asia/Bangkok |
| **Steps** | Assignee inactive user |
| **Expected result** | Policy: reject or keep historical |
| **What failure would look like** | Active assignment to inactive |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### TASK-005

| Field | Detail |
| --- | --- |
| **Test ID** | TASK-005 |
| **Module** | Tasks |
| **Risk type** | RBAC / timezone |
| **Persona** | Lawyer / Staff / Viewer |
| **Preconditions** | Firm timezone Asia/Bangkok |
| **Steps** | dueDate yesterday |
| **Expected result** | Appears in overdue filter |
| **What failure would look like** | Missing from overdue |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### TASK-006

| Field | Detail |
| --- | --- |
| **Test ID** | TASK-006 |
| **Module** | Tasks |
| **Risk type** | RBAC / timezone |
| **Persona** | Lawyer / Staff / Viewer |
| **Preconditions** | Firm timezone Asia/Bangkok |
| **Steps** | dueDate year 2099 |
| **Expected result** | Accepted |
| **What failure would look like** | DB error |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### TASK-007

| Field | Detail |
| --- | --- |
| **Test ID** | TASK-007 |
| **Module** | Tasks |
| **Risk type** | RBAC / timezone |
| **Persona** | Lawyer / Staff / Viewer |
| **Preconditions** | Firm timezone Asia/Bangkok |
| **Steps** | dueDate UTC boundary Asia/Bangkok |
| **Expected result** | Correct calendar day in firm TZ |
| **What failure would look like** | Off-by-one day |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### TASK-008

| Field | Detail |
| --- | --- |
| **Test ID** | TASK-008 |
| **Module** | Tasks |
| **Risk type** | RBAC / timezone |
| **Persona** | Lawyer / Staff / Viewer |
| **Preconditions** | Firm timezone Asia/Bangkok |
| **Steps** | dueDate midnight local |
| **Expected result** | Stable grouping |
| **What failure would look like** | Duplicate overdue |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### TASK-009

| Field | Detail |
| --- | --- |
| **Test ID** | TASK-009 |
| **Module** | Tasks |
| **Risk type** | RBAC / timezone |
| **Persona** | Lawyer / Staff / Viewer |
| **Preconditions** | Firm timezone Asia/Bangkok |
| **Steps** | Firm timezone Asia/Bangkok default |
| **Expected result** | Week filter uses firm TZ |
| **What failure would look like** | UTC-only drift |
| **Priority** | P1 |
| **Suggested automated test type** | unit |

#### TASK-010

| Field | Detail |
| --- | --- |
| **Test ID** | TASK-010 |
| **Module** | Tasks |
| **Risk type** | RBAC / timezone |
| **Persona** | Lawyer / Staff / Viewer |
| **Preconditions** | Firm timezone Asia/Bangkok |
| **Steps** | Set sprintWeekStart manually valid ISO date |
| **Expected result** | Stored; week bucket correct |
| **What failure would look like** | Invalid bucket |
| **Priority** | P1 |
| **Suggested automated test type** | unit |

#### TASK-011

| Field | Detail |
| --- | --- |
| **Test ID** | TASK-011 |
| **Module** | Tasks |
| **Risk type** | RBAC / timezone |
| **Persona** | Lawyer / Staff / Viewer |
| **Preconditions** | Firm timezone Asia/Bangkok |
| **Steps** | sprintWeekStart garbage string |
| **Expected result** | Validation error |
| **What failure would look like** | Crash |
| **Priority** | P1 |
| **Suggested automated test type** | unit |

#### TASK-012

| Field | Detail |
| --- | --- |
| **Test ID** | TASK-012 |
| **Module** | Tasks |
| **Risk type** | RBAC / timezone |
| **Persona** | Lawyer / Staff / Viewer |
| **Preconditions** | Firm timezone Asia/Bangkok |
| **Steps** | status INVALID enum via tampered form |
| **Expected result** | Rejected |
| **What failure would look like** | Bad enum in DB |
| **Priority** | P1 |
| **Suggested automated test type** | unit |

#### TASK-013

| Field | Detail |
| --- | --- |
| **Test ID** | TASK-013 |
| **Module** | Tasks |
| **Risk type** | RBAC / timezone |
| **Persona** | Lawyer / Staff / Viewer |
| **Preconditions** | Firm timezone Asia/Bangkok |
| **Steps** | Viewer changes task status |
| **Expected result** | Rejected |
| **What failure would look like** | Status changed |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### TASK-014

| Field | Detail |
| --- | --- |
| **Test ID** | TASK-014 |
| **Module** | Tasks |
| **Risk type** | RBAC / timezone |
| **Persona** | Lawyer / Staff / Viewer |
| **Preconditions** | Firm timezone Asia/Bangkok |
| **Steps** | Staff assigns task to user without matter access |
| **Expected result** | Rejected or warning |
| **What failure would look like** | Assignee sees inaccessible task |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### TASK-015

| Field | Detail |
| --- | --- |
| **Test ID** | TASK-015 |
| **Module** | Tasks |
| **Risk type** | RBAC / timezone |
| **Persona** | Lawyer / Staff / Viewer |
| **Preconditions** | Firm timezone Asia/Bangkok |
| **Steps** | Archive matter; check overdue counts |
| **Expected result** | Counts decrease |
| **What failure would look like** | Stale overdue |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### TASK-016

| Field | Detail |
| --- | --- |
| **Test ID** | TASK-016 |
| **Module** | Tasks |
| **Risk type** | RBAC / timezone |
| **Persona** | Lawyer / Staff / Viewer |
| **Preconditions** | Firm timezone Asia/Bangkok |
| **Steps** | deadlineType 500 chars |
| **Expected result** | Accept or reject per schema |
| **What failure would look like** | Truncation corruption |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### TASK-017

| Field | Detail |
| --- | --- |
| **Test ID** | TASK-017 |
| **Module** | Tasks |
| **Risk type** | RBAC / timezone |
| **Persona** | Lawyer / Staff / Viewer |
| **Preconditions** | Firm timezone Asia/Bangkok |
| **Steps** | deadlineType Thai text |
| **Expected result** | Stored UTF-8 |
| **What failure would look like** | Mojibake |
| **Priority** | P1 |
| **Suggested automated test type** | manual |


## H. Tags

*10 test cases*

#### TAG-001

| Field | Detail |
| --- | --- |
| **Test ID** | TAG-001 |
| **Module** | Tags |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | Admin /tags route |
| **Steps** | Create tag name Urgent twice |
| **Expected result** | Unique constraint error UX |
| **What failure would look like** | Duplicate silent |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### TAG-002

| Field | Detail |
| --- | --- |
| **Test ID** | TAG-002 |
| **Module** | Tags |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | Admin /tags route |
| **Steps** | Create tags `urgent` and `Urgent` |
| **Expected result** | Case sensitivity per DB collation |
| **What failure would look like** | Unintended duplicate |
| **Priority** | P2 |
| **Suggested automated test type** | integration |

#### TAG-003

| Field | Detail |
| --- | --- |
| **Test ID** | TAG-003 |
| **Module** | Tags |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | Admin /tags route |
| **Steps** | Thai tag name |
| **Expected result** | Stored/displayed |
| **What failure would look like** | Encoding issue |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### TAG-004

| Field | Detail |
| --- | --- |
| **Test ID** | TAG-004 |
| **Module** | Tags |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | Admin /tags route |
| **Steps** | Emoji tag name |
| **Expected result** | Stored or rejected |
| **What failure would look like** | Crash |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### TAG-005

| Field | Detail |
| --- | --- |
| **Test ID** | TAG-005 |
| **Module** | Tags |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | Admin /tags route |
| **Steps** | Tag name 256+ chars |
| **Expected result** | Validation |
| **What failure would look like** | DB error |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### TAG-006

| Field | Detail |
| --- | --- |
| **Test ID** | TAG-006 |
| **Module** | Tags |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | Admin /tags route |
| **Steps** | color `#ZZZZZZ` |
| **Expected result** | Reject invalid |
| **What failure would look like** | Broken CSS |
| **Priority** | P1 |
| **Suggested automated test type** | unit |

#### TAG-007

| Field | Detail |
| --- | --- |
| **Test ID** | TAG-007 |
| **Module** | Tags |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | Admin /tags route |
| **Steps** | Tag on archived matter |
| **Expected result** | Still on record; matter hidden |
| **What failure would look like** | Tag admin breaks |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### TAG-008

| Field | Detail |
| --- | --- |
| **Test ID** | TAG-008 |
| **Module** | Tags |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | Admin /tags route |
| **Steps** | Archive tag in use |
| **Expected result** | No UI delete—document gap; records keep tagId |
| **What failure would look like** | Orphan UI |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### TAG-009

| Field | Detail |
| --- | --- |
| **Test ID** | TAG-009 |
| **Module** | Tags |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | Admin /tags route |
| **Steps** | Lawyer opens /tags |
| **Expected result** | Blocked (admin-only page) |
| **What failure would look like** | Tag CRUD for lawyer |
| **Priority** | P0 |
| **Suggested automated test type** | E2E |

#### TAG-010

| Field | Detail |
| --- | --- |
| **Test ID** | TAG-010 |
| **Module** | Tags |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | Admin /tags route |
| **Steps** | Search by archived tag name |
| **Expected result** | No spurious hits |
| **What failure would look like** | Leak |
| **Priority** | P2 |
| **Suggested automated test type** | manual |


## I. Soft delete / archive

*12 test cases*

#### ARCH-001

| Field | Detail |
| --- | --- |
| **Test ID** | ARCH-001 |
| **Module** | Archive / soft delete |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | deletedAt soft delete pattern |
| **Steps** | Archive client with active matters |
| **Expected result** | Soft delete client; matters policy consistent |
| **What failure would look like** | FK violation |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### ARCH-002

| Field | Detail |
| --- | --- |
| **Test ID** | ARCH-002 |
| **Module** | Archive / soft delete |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | deletedAt soft delete pattern |
| **Steps** | Archive matter with open tasks |
| **Expected result** | Tasks hidden/archived cascade per rules |
| **What failure would look like** | Orphan visible tasks |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ARCH-003

| Field | Detail |
| --- | --- |
| **Test ID** | ARCH-003 |
| **Module** | Archive / soft delete |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | deletedAt soft delete pattern |
| **Steps** | Archive matter with documents |
| **Expected result** | Docs hidden from lawyer |
| **What failure would look like** | Docs visible |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ARCH-004

| Field | Detail |
| --- | --- |
| **Test ID** | ARCH-004 |
| **Module** | Archive / soft delete |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | deletedAt soft delete pattern |
| **Steps** | Archive document link |
| **Expected result** | Excluded from lists |
| **What failure would look like** | Still searchable |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ARCH-005

| Field | Detail |
| --- | --- |
| **Test ID** | ARCH-005 |
| **Module** | Archive / soft delete |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | deletedAt soft delete pattern |
| **Steps** | Archive tag (if implemented) |
| **Expected result** | Records retain relation |
| **What failure would look like** | Crash |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### ARCH-006

| Field | Detail |
| --- | --- |
| **Test ID** | ARCH-006 |
| **Module** | Archive / soft delete |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | deletedAt soft delete pattern |
| **Steps** | Deactivate group with matter assignments |
| **Expected result** | Access revoked |
| **What failure would look like** | Stale access |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ARCH-007

| Field | Detail |
| --- | --- |
| **Test ID** | ARCH-007 |
| **Module** | Archive / soft delete |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | deletedAt soft delete pattern |
| **Steps** | Deactivate workflow status in use |
| **Expected result** | Matters keep statusId; badge works |
| **What failure would look like** | Create matter fails globally |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### ARCH-008

| Field | Detail |
| --- | --- |
| **Test ID** | ARCH-008 |
| **Module** | Archive / soft delete |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | deletedAt soft delete pattern |
| **Steps** | Restore archived record if supported |
| **Expected result** | N/A v1.2—verify no restore button leaks |
| **What failure would look like** | Accidental restore |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### ARCH-009

| Field | Detail |
| --- | --- |
| **Test ID** | ARCH-009 |
| **Module** | Archive / soft delete |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | deletedAt soft delete pattern |
| **Steps** | Attempt hard delete via tampered action |
| **Expected result** | Rejected |
| **What failure would look like** | Row gone |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ARCH-010

| Field | Detail |
| --- | --- |
| **Test ID** | ARCH-010 |
| **Module** | Archive / soft delete |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | deletedAt soft delete pattern |
| **Steps** | Lists/search/dashboard exclude archived |
| **Expected result** | Consistent filters notDeleted |
| **What failure would look like** | Ghost records |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ARCH-011

| Field | Detail |
| --- | --- |
| **Test ID** | ARCH-011 |
| **Module** | Archive / soft delete |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | deletedAt soft delete pattern |
| **Steps** | Archive client; activity log entry |
| **Expected result** | DELETE/archived summary append-only |
| **What failure would look like** | No log |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### ARCH-012

| Field | Detail |
| --- | --- |
| **Test ID** | ARCH-012 |
| **Module** | Archive / soft delete |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | deletedAt soft delete pattern |
| **Steps** | Archive matter; FK integrity |
| **Expected result** | No orphan violations |
| **What failure would look like** | DB constraint error |
| **Priority** | P0 |
| **Suggested automated test type** | integration |


## J. Activity log

*18 test cases*

#### ACT-001

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-001 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Create client |
| **Expected result** | CREATE DATA log |
| **What failure would look like** | Missing log |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### ACT-002

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-002 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Update matter |
| **Expected result** | UPDATE log with diff metadata |
| **What failure would look like** | Missing log |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### ACT-003

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-003 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Archive matter |
| **Expected result** | DELETE/archived log |
| **What failure would look like** | Wrong action |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### ACT-004

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-004 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Open document external link |
| **Expected result** | DOCUMENT log if implemented |
| **What failure would look like** | Missing security trail |
| **Priority** | P2 |
| **Suggested automated test type** | integration |

#### ACT-005

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-005 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Successful login |
| **Expected result** | AUTH log |
| **What failure would look like** | Missing |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### ACT-006

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-006 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Failed login |
| **Expected result** | AUTH log without password |
| **What failure would look like** | Password in metadata |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ACT-007

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-007 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Admin changes user role |
| **Expected result** | ADMIN log |
| **What failure would look like** | Missing |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### ACT-008

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-008 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | User changes password |
| **Expected result** | SECURITY/AUTH log |
| **What failure would look like** | Cleartext password logged |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ACT-009

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-009 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Admin CSV export |
| **Expected result** | Export action logged |
| **What failure would look like** | No log |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### ACT-010

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-010 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Lawyer GET /api/activity/export firm-wide |
| **Expected result** | 403 |
| **What failure would look like** | Full firm CSV |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ACT-011

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-011 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Prisma activityLog.update via script |
| **Expected result** | App path N/A; DB trigger blocks |
| **What failure would look like** | Row changed |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ACT-012

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-012 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Prisma activityLog.delete |
| **Expected result** | Trigger exception |
| **What failure would look like** | Row deleted |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ACT-013

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-013 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | SQL UPDATE ActivityLog |
| **Expected result** | Trigger raises |
| **What failure would look like** | Immutable broken |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ACT-014

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-014 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Deactivate user; old logs |
| **Expected result** | actorName/actorEmail snapshot preserved |
| **What failure would look like** | Logs blanked |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### ACT-015

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-015 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Large note in metadata |
| **Expected result** | Truncated/summary only |
| **What failure would look like** | Full privileged text stored |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ACT-016

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-016 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Log entity deleted |
| **Expected result** | Graceful display |
| **What failure would look like** | Crash |
| **Priority** | P2 |
| **Suggested automated test type** | integration |

#### ACT-017

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-017 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Log entity archived |
| **Expected result** | Still readable |
| **What failure would look like** | 500 on timeline |
| **Priority** | P2 |
| **Suggested automated test type** | integration |

#### ACT-018

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-018 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Export 10000 rows |
| **Expected result** | Completes; CSV valid |
| **What failure would look like** | OOM/timeout |
| **Priority** | P2 |
| **Suggested automated test type** | manual |


## K. i18n Thai–English

*15 test cases*

#### I18N-001

| Field | Detail |
| --- | --- |
| **Test ID** | I18N-001 |
| **Module** | i18n |
| **Risk type** | Localization |
| **Persona** | All personas |
| **Preconditions** | locales th/en |
| **Steps** | Switch EN→TH via header |
| **Expected result** | UI Thai |
| **What failure would look like** | Mixed stale |
| **Priority** | P1 |
| **Suggested automated test type** | E2E |

#### I18N-002

| Field | Detail |
| --- | --- |
| **Test ID** | I18N-002 |
| **Module** | i18n |
| **Risk type** | Localization |
| **Persona** | All personas |
| **Preconditions** | locales th/en |
| **Steps** | Switch TH→EN |
| **Expected result** | UI English |
| **What failure would look like** | Missing keys |
| **Priority** | P1 |
| **Suggested automated test type** | E2E |

#### I18N-003

| Field | Detail |
| --- | --- |
| **Test ID** | I18N-003 |
| **Module** | i18n |
| **Risk type** | Localization |
| **Persona** | All personas |
| **Preconditions** | locales th/en |
| **Steps** | Remove key from th json temporarily |
| **Expected result** | Fallback en |
| **What failure would look like** | Raw key |
| **Priority** | P2 |
| **Suggested automated test type** | unit |

#### I18N-004

| Field | Detail |
| --- | --- |
| **Test ID** | I18N-004 |
| **Module** | i18n |
| **Risk type** | Localization |
| **Persona** | All personas |
| **Preconditions** | locales th/en |
| **Steps** | Status missing labelTh |
| **Expected result** | Shows labelEn or fallback |
| **What failure would look like** | Blank badge |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### I18N-005

| Field | Detail |
| --- | --- |
| **Test ID** | I18N-005 |
| **Module** | i18n |
| **Risk type** | Localization |
| **Persona** | All personas |
| **Preconditions** | locales th/en |
| **Steps** | Status missing labelEn |
| **Expected result** | Shows labelTh |
| **What failure would look like** | Blank |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### I18N-006

| Field | Detail |
| --- | --- |
| **Test ID** | I18N-006 |
| **Module** | i18n |
| **Risk type** | Localization |
| **Persona** | All personas |
| **Preconditions** | locales th/en |
| **Steps** | Long Thai workflow label |
| **Expected result** | Layout ok |
| **What failure would look like** | Overflow break nav |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### I18N-007

| Field | Detail |
| --- | --- |
| **Test ID** | I18N-007 |
| **Module** | i18n |
| **Risk type** | Localization |
| **Persona** | All personas |
| **Preconditions** | locales th/en |
| **Steps** | Thai client displayName |
| **Expected result** | Correct UTF-8 |
| **What failure would look like** | ??? |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### I18N-008

| Field | Detail |
| --- | --- |
| **Test ID** | I18N-008 |
| **Module** | i18n |
| **Risk type** | Localization |
| **Persona** | All personas |
| **Preconditions** | locales th/en |
| **Steps** | Thai matter title search |
| **Expected result** | Finds record |
| **What failure would look like** | No match |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### I18N-009

| Field | Detail |
| --- | --- |
| **Test ID** | I18N-009 |
| **Module** | i18n |
| **Risk type** | Localization |
| **Persona** | All personas |
| **Preconditions** | locales th/en |
| **Steps** | Thai document title |
| **Expected result** | Detail page ok |
| **What failure would look like** | Corrupt |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### I18N-010

| Field | Detail |
| --- | --- |
| **Test ID** | I18N-010 |
| **Module** | i18n |
| **Risk type** | Localization |
| **Persona** | All personas |
| **Preconditions** | locales th/en |
| **Steps** | Thai task description |
| **Expected result** | Stored/rendered |
| **What failure would look like** | Corrupt |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### I18N-011

| Field | Detail |
| --- | --- |
| **Test ID** | I18N-011 |
| **Module** | i18n |
| **Risk type** | Localization |
| **Persona** | All personas |
| **Preconditions** | locales th/en |
| **Steps** | Thai search query |
| **Expected result** | SRCH-003 overlap |
| **What failure would look like** | No results |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### I18N-012

| Field | Detail |
| --- | --- |
| **Test ID** | I18N-012 |
| **Module** | i18n |
| **Risk type** | Localization |
| **Persona** | All personas |
| **Preconditions** | locales th/en |
| **Steps** | User pref en, firm default th, no cookie |
| **Expected result** | User pref wins |
| **What failure would look like** | Wrong locale |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### I18N-013

| Field | Detail |
| --- | --- |
| **Test ID** | I18N-013 |
| **Module** | i18n |
| **Risk type** | Localization |
| **Persona** | All personas |
| **Preconditions** | locales th/en |
| **Steps** | Refresh after locale change |
| **Expected result** | Cookie persists |
| **What failure would look like** | Reset to default |
| **Priority** | P1 |
| **Suggested automated test type** | E2E |

#### I18N-014

| Field | Detail |
| --- | --- |
| **Test ID** | I18N-014 |
| **Module** | i18n |
| **Risk type** | Localization |
| **Persona** | All personas |
| **Preconditions** | locales th/en |
| **Steps** | Validation error in th locale |
| **Expected result** | Translated message |
| **What failure would look like** | English only leak |
| **Priority** | P2 |
| **Suggested automated test type** | integration |

#### I18N-015

| Field | Detail |
| --- | --- |
| **Test ID** | I18N-015 |
| **Module** | i18n |
| **Risk type** | Localization |
| **Persona** | All personas |
| **Preconditions** | locales th/en |
| **Steps** | Sidebar with long Thai labels |
| **Expected result** | No horizontal scroll break |
| **What failure would look like** | Layout break |
| **Priority** | P2 |
| **Suggested automated test type** | manual |


## L. Firm settings

*10 test cases*

#### FIRM-001

| Field | Detail |
| --- | --- |
| **Test ID** | FIRM-001 |
| **Module** | Firm settings |
| **Risk type** | Validation / authz |
| **Persona** | Admin / Lawyer |
| **Preconditions** | FirmSettings singleton |
| **Steps** | firmName empty string |
| **Expected result** | validation error |
| **What failure would look like** | Saved blank |
| **Priority** | P1 |
| **Suggested automated test type** | unit |

#### FIRM-002

| Field | Detail |
| --- | --- |
| **Test ID** | FIRM-002 |
| **Module** | Firm settings |
| **Risk type** | Validation / authz |
| **Persona** | Admin / Lawyer |
| **Preconditions** | FirmSettings singleton |
| **Steps** | firmName 121 chars |
| **Expected result** | max 120 reject |
| **What failure would look like** | Truncated silently |
| **Priority** | P2 |
| **Suggested automated test type** | unit |

#### FIRM-003

| Field | Detail |
| --- | --- |
| **Test ID** | FIRM-003 |
| **Module** | Firm settings |
| **Risk type** | Validation / authz |
| **Persona** | Admin / Lawyer |
| **Preconditions** | FirmSettings singleton |
| **Steps** | firmName Thai |
| **Expected result** | Saved UTF-8 |
| **What failure would look like** | Corrupt |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### FIRM-004

| Field | Detail |
| --- | --- |
| **Test ID** | FIRM-004 |
| **Module** | Firm settings |
| **Risk type** | Validation / authz |
| **Persona** | Admin / Lawyer |
| **Preconditions** | FirmSettings singleton |
| **Steps** | timezone Invalid/Zone |
| **Expected result** | Reject |
| **What failure would look like** | Bad TZ crashes dates |
| **Priority** | P1 |
| **Suggested automated test type** | unit |

#### FIRM-005

| Field | Detail |
| --- | --- |
| **Test ID** | FIRM-005 |
| **Module** | Firm settings |
| **Risk type** | Validation / authz |
| **Persona** | Admin / Lawyer |
| **Preconditions** | FirmSettings singleton |
| **Steps** | defaultLanguage `fr` |
| **Expected result** | Reject th|en only |
| **What failure would look like** | Saved invalid |
| **Priority** | P1 |
| **Suggested automated test type** | unit |

#### FIRM-006

| Field | Detail |
| --- | --- |
| **Test ID** | FIRM-006 |
| **Module** | Firm settings |
| **Risk type** | Validation / authz |
| **Persona** | Admin / Lawyer |
| **Preconditions** | FirmSettings singleton |
| **Steps** | enableEntityNotes=false |
| **Expected result** | Notes fields hidden; search behavior documented |
| **What failure would look like** | Notes shown |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### FIRM-007

| Field | Detail |
| --- | --- |
| **Test ID** | FIRM-007 |
| **Module** | Firm settings |
| **Risk type** | Validation / authz |
| **Persona** | Admin / Lawyer |
| **Preconditions** | FirmSettings singleton |
| **Steps** | enableComments toggle |
| **Expected result** | Placeholder only; no crash |
| **What failure would look like** | Broken route |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### FIRM-008

| Field | Detail |
| --- | --- |
| **Test ID** | FIRM-008 |
| **Module** | Firm settings |
| **Risk type** | Validation / authz |
| **Persona** | Admin / Lawyer |
| **Preconditions** | FirmSettings singleton |
| **Steps** | Lawyer update firm settings action |
| **Expected result** | Rejected |
| **What failure would look like** | Settings changed |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### FIRM-009

| Field | Detail |
| --- | --- |
| **Test ID** | FIRM-009 |
| **Module** | Firm settings |
| **Risk type** | Validation / authz |
| **Persona** | Admin / Lawyer |
| **Preconditions** | FirmSettings singleton |
| **Steps** | Admin update firm name |
| **Expected result** | ADMIN/DATA activity logged |
| **What failure would look like** | No audit |
| **Priority** | P2 |
| **Suggested automated test type** | integration |

#### FIRM-010

| Field | Detail |
| --- | --- |
| **Test ID** | FIRM-010 |
| **Module** | Firm settings |
| **Risk type** | Validation / authz |
| **Persona** | Admin / Lawyer |
| **Preconditions** | FirmSettings singleton |
| **Steps** | Two admins rapid double submit |
| **Expected result** | Last write wins; no corrupt row |
| **What failure would look like** | Corrupt FirmSettings |
| **Priority** | P2 |
| **Suggested automated test type** | manual |


## M. Security settings

*10 test cases*

#### SEC-001

| Field | Detail |
| --- | --- |
| **Test ID** | SEC-001 |
| **Module** | Security settings |
| **Risk type** | Auth policy |
| **Persona** | Admin / Anonymous |
| **Preconditions** | FirmSettings security fields |
| **Steps** | failedLoginLockoutThreshold=1 |
| **Expected result** | Lock after 1 fail |
| **What failure would look like** | Too aggressive UX only |
| **Priority** | P2 |
| **Suggested automated test type** | integration |

#### SEC-002

| Field | Detail |
| --- | --- |
| **Test ID** | SEC-002 |
| **Module** | Security settings |
| **Risk type** | Auth policy |
| **Persona** | Admin / Anonymous |
| **Preconditions** | FirmSettings security fields |
| **Steps** | threshold=50 |
| **Expected result** | Accepted bound |
| **What failure would look like** | Rejected valid |
| **Priority** | P2 |
| **Suggested automated test type** | unit |

#### SEC-003

| Field | Detail |
| --- | --- |
| **Test ID** | SEC-003 |
| **Module** | Security settings |
| **Risk type** | Auth policy |
| **Persona** | Admin / Anonymous |
| **Preconditions** | FirmSettings security fields |
| **Steps** | session timeout field if present—else document N/A |
| **Expected result** | N/A or validate |
| **What failure would look like** | — |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### SEC-004

| Field | Detail |
| --- | --- |
| **Test ID** | SEC-004 |
| **Module** | Security settings |
| **Risk type** | Auth policy |
| **Persona** | Admin / Anonymous |
| **Preconditions** | FirmSettings security fields |
| **Steps** | password min length invalid negative |
| **Expected result** | Reject |
| **What failure would look like** | Saved |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### SEC-005

| Field | Detail |
| --- | --- |
| **Test ID** | SEC-005 |
| **Module** | Security settings |
| **Risk type** | Auth policy |
| **Persona** | Admin / Anonymous |
| **Preconditions** | FirmSettings security fields |
| **Steps** | Change min length after users exist |
| **Expected result** | Existing users not forced until change password |
| **What failure would look like** | Mass lockout |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### SEC-006

| Field | Detail |
| --- | --- |
| **Test ID** | SEC-006 |
| **Module** | Security settings |
| **Risk type** | Auth policy |
| **Persona** | Admin / Anonymous |
| **Preconditions** | FirmSettings security fields |
| **Steps** | allowed email domains empty |
| **Expected result** | All domains allowed |
| **What failure would look like** | Unexpected lockout |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### SEC-007

| Field | Detail |
| --- | --- |
| **Test ID** | SEC-007 |
| **Module** | Security settings |
| **Risk type** | Auth policy |
| **Persona** | Admin / Anonymous |
| **Preconditions** | FirmSettings security fields |
| **Steps** | allowed email domains malformed |
| **Expected result** | Validation error |
| **What failure would look like** | Saved bad pattern |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### SEC-008

| Field | Detail |
| --- | --- |
| **Test ID** | SEC-008 |
| **Module** | Security settings |
| **Risk type** | Auth policy |
| **Persona** | Admin / Anonymous |
| **Preconditions** | FirmSettings security fields |
| **Steps** | Lawyer update security settings |
| **Expected result** | Blocked |
| **What failure would look like** | Lockout disabled |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### SEC-009

| Field | Detail |
| --- | --- |
| **Test ID** | SEC-009 |
| **Module** | Security settings |
| **Risk type** | Auth policy |
| **Persona** | Admin / Anonymous |
| **Preconditions** | FirmSettings security fields |
| **Steps** | Admin update lockout |
| **Expected result** | SECURITY/ADMIN log |
| **What failure would look like** | No audit |
| **Priority** | P2 |
| **Suggested automated test type** | integration |

#### SEC-010

| Field | Detail |
| --- | --- |
| **Test ID** | SEC-010 |
| **Module** | Security settings |
| **Risk type** | Auth policy |
| **Persona** | Admin / Anonymous |
| **Preconditions** | FirmSettings security fields |
| **Steps** | Failed login unknown vs known email |
| **Expected result** | Same generic UI message |
| **What failure would look like** | User enumeration |
| **Priority** | P0 |
| **Suggested automated test type** | integration |


## N. CSV export

*10 test cases*

#### CSV-001

| Field | Detail |
| --- | --- |
| **Test ID** | CSV-001 |
| **Module** | CSV export |
| **Risk type** | Data exfiltration / injection |
| **Persona** | Admin / Lawyer |
| **Preconditions** | activity-export.ts |
| **Steps** | Admin export /api/activity/export |
| **Expected result** | 200 CSV |
| **What failure would look like** | 403 |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### CSV-002

| Field | Detail |
| --- | --- |
| **Test ID** | CSV-002 |
| **Module** | CSV export |
| **Risk type** | Data exfiltration / injection |
| **Persona** | Admin / Lawyer |
| **Preconditions** | activity-export.ts |
| **Steps** | Lawyer firm-wide export |
| **Expected result** | 403 |
| **What failure would look like** | Full dump |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### CSV-003

| Field | Detail |
| --- | --- |
| **Test ID** | CSV-003 |
| **Module** | CSV export |
| **Risk type** | Data exfiltration / injection |
| **Persona** | Admin / Lawyer |
| **Preconditions** | activity-export.ts |
| **Steps** | Rows with Thai characters |
| **Expected result** | UTF-8 BOM optional; readable |
| **What failure would look like** | Mojibake |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### CSV-004

| Field | Detail |
| --- | --- |
| **Test ID** | CSV-004 |
| **Module** | CSV export |
| **Risk type** | Data exfiltration / injection |
| **Persona** | Admin / Lawyer |
| **Preconditions** | activity-export.ts |
| **Steps** | Metadata with commas quotes newlines |
| **Expected result** | RFC4180 escaping |
| **What failure would look like** | Broken columns |
| **Priority** | P0 |
| **Suggested automated test type** | unit |

#### CSV-005

| Field | Detail |
| --- | --- |
| **Test ID** | CSV-005 |
| **Module** | CSV export |
| **Risk type** | Data exfiltration / injection |
| **Persona** | Admin / Lawyer |
| **Preconditions** | activity-export.ts |
| **Steps** | Export 10k rows |
| **Expected result** | Completes |
| **What failure would look like** | Timeout |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### CSV-006

| Field | Detail |
| --- | --- |
| **Test ID** | CSV-006 |
| **Module** | CSV export |
| **Risk type** | Data exfiltration / injection |
| **Persona** | Admin / Lawyer |
| **Preconditions** | activity-export.ts |
| **Steps** | Inspect CSV content |
| **Expected result** | No passwordHash AUTH_SECRET |
| **What failure would look like** | Secret leak |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### CSV-007

| Field | Detail |
| --- | --- |
| **Test ID** | CSV-007 |
| **Module** | CSV export |
| **Risk type** | Data exfiltration / injection |
| **Persona** | Admin / Lawyer |
| **Preconditions** | activity-export.ts |
| **Steps** | Lawyer scoped entity export |
| **Expected result** | Only assigned matter scope |
| **What failure would look like** | Extra rows |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### CSV-008

| Field | Detail |
| --- | --- |
| **Test ID** | CSV-008 |
| **Module** | CSV export |
| **Risk type** | Data exfiltration / injection |
| **Persona** | Admin / Lawyer |
| **Preconditions** | activity-export.ts |
| **Steps** | Export triggers activity log |
| **Expected result** | Logged |
| **What failure would look like** | No trail |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### CSV-009

| Field | Detail |
| --- | --- |
| **Test ID** | CSV-009 |
| **Module** | CSV export |
| **Risk type** | Data exfiltration / injection |
| **Persona** | Admin / Lawyer |
| **Preconditions** | activity-export.ts |
| **Steps** | Content-Disposition filename |
| **Expected result** | Safe alphanumeric name |
| **What failure would look like** | Path injection |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### CSV-010

| Field | Detail |
| --- | --- |
| **Test ID** | CSV-010 |
| **Module** | CSV export |
| **Risk type** | Data exfiltration / injection |
| **Persona** | Admin / Lawyer |
| **Preconditions** | activity-export.ts |
| **Steps** | Cell `=cmd|'/c calc'!A0` |
| **Expected result** | Escaped prefix tab or quote |
| **What failure would look like** | Formula injection |
| **Priority** | P0 |
| **Suggested automated test type** | unit |


## O. AI connector disabled by default

*15 test cases*

#### AI-001

| Field | Detail |
| --- | --- |
| **Test ID** | AI-001 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | AI connector DISABLED (default) |
| **Expected result** | No AI routes/responses |
| **What failure would look like** | Endpoint exists |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### AI-002

| Field | Detail |
| --- | --- |
| **Test ID** | AI-002 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | Public research mode with client PII prompt |
| **Expected result** | Blocked by policy (future) |
| **What failure would look like** | PII sent |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### AI-003

| Field | Detail |
| --- | --- |
| **Test ID** | AI-003 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | Privileged matter prompt |
| **Expected result** | Blocked default |
| **What failure would look like** | Leak |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### AI-004

| Field | Detail |
| --- | --- |
| **Test ID** | AI-004 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | External doc link in prompt |
| **Expected result** | Blocked default |
| **What failure would look like** | Fetch |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### AI-005

| Field | Detail |
| --- | --- |
| **Test ID** | AI-005 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | userConfirmation=false |
| **Expected result** | Blocked |
| **What failure would look like** | Runs anyway |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### AI-006

| Field | Detail |
| --- | --- |
| **Test ID** | AI-006 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | Missing provider |
| **Expected result** | Blocked |
| **What failure would look like** | Call made |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### AI-007

| Field | Detail |
| --- | --- |
| **Test ID** | AI-007 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | Invalid provider enum |
| **Expected result** | Blocked |
| **What failure would look like** | Call made |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### AI-008

| Field | Detail |
| --- | --- |
| **Test ID** | AI-008 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | No OPENAI_API_KEY in env required |
| **Expected result** | App starts without AI keys |
| **What failure would look like** | Startup fail |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### AI-009

| Field | Detail |
| --- | --- |
| **Test ID** | AI-009 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | Network capture on AI UI action |
| **Expected result** | No third-party HTTPS |
| **What failure would look like** | Outbound API |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### AI-010

| Field | Detail |
| --- | --- |
| **Test ID** | AI-010 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | Blocked request audit |
| **Expected result** | Metadata-only log if implemented |
| **What failure would look like** | Full prompt stored |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### AI-011

| Field | Detail |
| --- | --- |
| **Test ID** | AI-011 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | Privileged prompt logging |
| **Expected result** | Not stored |
| **What failure would look like** | Log leak |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### AI-012

| Field | Detail |
| --- | --- |
| **Test ID** | AI-012 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | AI cannot CREATE matter |
| **Expected result** | No mutation API |
| **What failure would look like** | Record created |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### AI-013

| Field | Detail |
| --- | --- |
| **Test ID** | AI-013 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | AI cannot DELETE |
| **Expected result** | No delete |
| **What failure would look like** | Archive via AI |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### AI-014

| Field | Detail |
| --- | --- |
| **Test ID** | AI-014 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | AI cannot export CSV |
| **Expected result** | No export path |
| **What failure would look like** | CSV download |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### AI-015

| Field | Detail |
| --- | --- |
| **Test ID** | AI-015 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | AI cannot fetch Drive link |
| **Expected result** | No SSRF |
| **What failure would look like** | Server fetch |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

## O-bis. AI Connector Gateway (automated)

Implemented in `tests/ai-gateway.test.ts` (`npm run test:ai`).

| Test ID | Summary | Automated |
| --- | --- | --- |
| AI-GW-001 | Connectors disabled by default (registry + FirmSettings) | yes |
| AI-GW-002 | policy-check route does not call provider | yes |
| AI-GW-003 | Public research blocks client confidential info | yes |
| AI-GW-004 | External document links blocked by default | yes |
| AI-GW-005 | Local paths blocked by default | yes |
| AI-GW-006 | Privileged info blocked unless confidential approval mode | yes |
| AI-GW-007 | Viewer cannot use policy-check route | yes |
| AI-GW-008 | Prompt not stored by default | yes |
| AI-GW-009 | No provider API key required for app startup | yes |
| AI-GW-010 | AI cannot mutate records | yes |
| AI-GW-011 | AI cannot export records | yes |
| AI-GW-012 | AI cannot fetch Drive/SharePoint/OneDrive/Dropbox/local path | yes |


## P. Billing (when enabled)

*15 test cases*

#### BILL-001

| Field | Detail |
| --- | --- |
| **Test ID** | BILL-001 |
| **Module** | Billing |
| **Risk type** | RBAC / validation |
| **Persona** | Lawyer / Viewer |
| **Preconditions** | enableBilling=true |
| **Steps** | Invoice clientId only matter null |
| **Expected result** | Allowed when billing on |
| **What failure would look like** | Validation fail |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### BILL-002

| Field | Detail |
| --- | --- |
| **Test ID** | BILL-002 |
| **Module** | Billing |
| **Risk type** | RBAC / validation |
| **Persona** | Lawyer / Viewer |
| **Preconditions** | enableBilling=true |
| **Steps** | Billing on archived matter |
| **Expected result** | Hidden |
| **What failure would look like** | Visible |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### BILL-003

| Field | Detail |
| --- | --- |
| **Test ID** | BILL-003 |
| **Module** | Billing |
| **Risk type** | RBAC / validation |
| **Persona** | Lawyer / Viewer |
| **Preconditions** | enableBilling=true |
| **Steps** | amount -100 |
| **Expected result** | Rejected |
| **What failure would look like** | Negative stored |
| **Priority** | P0 |
| **Suggested automated test type** | unit |

#### BILL-004

| Field | Detail |
| --- | --- |
| **Test ID** | BILL-004 |
| **Module** | Billing |
| **Risk type** | RBAC / validation |
| **Persona** | Lawyer / Viewer |
| **Preconditions** | enableBilling=true |
| **Steps** | amount 0 |
| **Expected result** | Rejected positive constraint |
| **What failure would look like** | Zero stored |
| **Priority** | P1 |
| **Suggested automated test type** | unit |

#### BILL-005

| Field | Detail |
| --- | --- |
| **Test ID** | BILL-005 |
| **Module** | Billing |
| **Risk type** | RBAC / validation |
| **Persona** | Lawyer / Viewer |
| **Preconditions** | enableBilling=true |
| **Steps** | amount 1e12 |
| **Expected result** | Reject or decimal limit |
| **What failure would look like** | Overflow |
| **Priority** | P2 |
| **Suggested automated test type** | unit |

#### BILL-006

| Field | Detail |
| --- | --- |
| **Test ID** | BILL-006 |
| **Module** | Billing |
| **Risk type** | RBAC / validation |
| **Persona** | Lawyer / Viewer |
| **Preconditions** | enableBilling=true |
| **Steps** | currency INVALID |
| **Expected result** | Reject |
| **What failure would look like** | Bad currency |
| **Priority** | P2 |
| **Suggested automated test type** | unit |

#### BILL-007

| Field | Detail |
| --- | --- |
| **Test ID** | BILL-007 |
| **Module** | Billing |
| **Risk type** | RBAC / validation |
| **Persona** | Lawyer / Viewer |
| **Preconditions** | enableBilling=true |
| **Steps** | currency THB default display |
| **Expected result** | Shows ฿ or THB label |
| **What failure would look like** | Wrong default |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### BILL-008

| Field | Detail |
| --- | --- |
| **Test ID** | BILL-008 |
| **Module** | Billing |
| **Risk type** | RBAC / validation |
| **Persona** | Lawyer / Viewer |
| **Preconditions** | enableBilling=true |
| **Steps** | paidAt before issueDate |
| **Expected result** | Validation warning/error |
| **What failure would look like** | Accepted illogical |
| **Priority** | P1 |
| **Suggested automated test type** | unit |

#### BILL-009

| Field | Detail |
| --- | --- |
| **Test ID** | BILL-009 |
| **Module** | Billing |
| **Risk type** | RBAC / validation |
| **Persona** | Lawyer / Viewer |
| **Preconditions** | enableBilling=true |
| **Steps** | dueDate before issueDate |
| **Expected result** | Validation |
| **What failure would look like** | Accepted |
| **Priority** | P1 |
| **Suggested automated test type** | unit |

#### BILL-010

| Field | Detail |
| --- | --- |
| **Test ID** | BILL-010 |
| **Module** | Billing |
| **Risk type** | RBAC / validation |
| **Persona** | Lawyer / Viewer |
| **Preconditions** | enableBilling=true |
| **Steps** | status OVERDUE past due |
| **Expected result** | Dashboard overdue count |
| **What failure would look like** | Wrong count |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### BILL-011

| Field | Detail |
| --- | --- |
| **Test ID** | BILL-011 |
| **Module** | Billing |
| **Risk type** | RBAC / validation |
| **Persona** | Lawyer / Viewer |
| **Preconditions** | enableBilling=true |
| **Steps** | Viewer edits payment status |
| **Expected result** | Blocked |
| **What failure would look like** | Status changed |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### BILL-012

| Field | Detail |
| --- | --- |
| **Test ID** | BILL-012 |
| **Module** | Billing |
| **Risk type** | RBAC / validation |
| **Persona** | Lawyer / Viewer |
| **Preconditions** | enableBilling=true |
| **Steps** | Lawyer billing on inaccessible matter |
| **Expected result** | Blocked |
| **What failure would look like** | Record visible |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### BILL-013

| Field | Detail |
| --- | --- |
| **Test ID** | BILL-013 |
| **Module** | Billing |
| **Risk type** | RBAC / validation |
| **Persona** | Lawyer / Viewer |
| **Preconditions** | enableBilling=true |
| **Steps** | externalInvoiceLink javascript: |
| **Expected result** | URL validation rejects |
| **What failure would look like** | XSS |
| **Priority** | P0 |
| **Suggested automated test type** | unit |

#### BILL-014

| Field | Detail |
| --- | --- |
| **Test ID** | BILL-014 |
| **Module** | Billing |
| **Risk type** | RBAC / validation |
| **Persona** | Lawyer / Viewer |
| **Preconditions** | enableBilling=true |
| **Steps** | Billing CSV export |
| **Expected result** | Admin-only if exists |
| **What failure would look like** | Lawyer export |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### BILL-015

| Field | Detail |
| --- | --- |
| **Test ID** | BILL-015 |
| **Module** | Billing |
| **Risk type** | RBAC / validation |
| **Persona** | Lawyer / Viewer |
| **Preconditions** | enableBilling=true |
| **Steps** | Billing disclaimer visible |
| **Expected result** | Metadata only; no tax advice |
| **What failure would look like** | Misleading claims |
| **Priority** | P2 |
| **Suggested automated test type** | manual |


## Q. Deployment and environment

*15 test cases*

#### DEP-001

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-001 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | DATABASE_URL missing |
| **Expected result** | Startup error clear |
| **What failure would look like** | Silent sqlite fallback |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### DEP-002

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-002 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | DATABASE_URL wrong host |
| **Expected result** | Connection error |
| **What failure would look like** | Hang forever |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### DEP-003

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-003 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | AUTH_SECRET missing |
| **Expected result** | Auth failure |
| **What failure would look like** | Insecure default |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### DEP-004

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-004 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | AUTH_SECRET short guessable |
| **Expected result** | Document rotate; sessions weak |
| **What failure would look like** | Forge tokens |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### DEP-005

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-005 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | AUTH_URL missing |
| **Expected result** | Auth callback issues |
| **What failure would look like** | OAuth loop |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### DEP-006

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-006 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | AUTH_URL mismatch deployment |
| **Expected result** | Login redirect wrong host |
| **What failure would look like** | Open redirect |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### DEP-007

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-007 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | Postgres stopped |
| **Expected result** | 500 with safe message |
| **What failure would look like** | Stack trace to user |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### DEP-008

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-008 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | Migrations not applied |
| **Expected result** | Prisma error on query |
| **What failure would look like** | Partial schema |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### DEP-009

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-009 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | Stale Prisma client |
| **Expected result** | Type/runtime errors after pull |
| **What failure would look like** | Silent wrong queries |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### DEP-010

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-010 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | Docker volume removed |
| **Expected result** | Empty DB on restart |
| **What failure would look like** | Data loss without warning |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### DEP-011

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-011 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | pg_dump fails (disk full) |
| **Expected result** | Non-zero exit |
| **What failure would look like** | False success backup |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### DEP-012

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-012 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | Restore dump to fresh DB |
| **Expected result** | App works; seed idempotent |
| **What failure would look like** | Constraint errors |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### DEP-013

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-013 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | Production still uses changeme seed password |
| **Expected result** | Manual checklist fail |
| **What failure would look like** | Compromise |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### DEP-014

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-014 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | .env in git status |
| **Expected result** | Docs warn; gitignore blocks |
| **What failure would look like** | Secret in repo |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### DEP-015

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-015 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | Two laptops local install |
| **Expected result** | Separate DBs; no sync |
| **What failure would look like** | Users expect merge |
| **Priority** | P1 |
| **Suggested automated test type** | manual |


## R. Browser / UI

*12 test cases*

#### UI-001

| Field | Detail |
| --- | --- |
| **Test ID** | UI-001 |
| **Module** | Browser / UI |
| **Risk type** | UX / info disclosure |
| **Persona** | Lawyer |
| **Preconditions** | Playwright optional |
| **Steps** | Refresh after POST create client |
| **Expected result** | No duplicate client |
| **What failure would look like** | Double record |
| **Priority** | P1 |
| **Suggested automated test type** | E2E |

#### UI-002

| Field | Detail |
| --- | --- |
| **Test ID** | UI-002 |
| **Module** | Browser / UI |
| **Risk type** | UX / info disclosure |
| **Persona** | Lawyer |
| **Preconditions** | Playwright optional |
| **Steps** | Double-click submit |
| **Expected result** | Single record |
| **What failure would look like** | Duplicates |
| **Priority** | P1 |
| **Suggested automated test type** | E2E |

#### UI-003

| Field | Detail |
| --- | --- |
| **Test ID** | UI-003 |
| **Module** | Browser / UI |
| **Risk type** | UX / info disclosure |
| **Persona** | Lawyer |
| **Preconditions** | Playwright optional |
| **Steps** | Back after archive |
| **Expected result** | Not found or list without record |
| **What failure would look like** | Resubmit archive |
| **Priority** | P2 |
| **Suggested automated test type** | E2E |

#### UI-004

| Field | Detail |
| --- | --- |
| **Test ID** | UI-004 |
| **Module** | Browser / UI |
| **Risk type** | UX / info disclosure |
| **Persona** | Lawyer |
| **Preconditions** | Playwright optional |
| **Steps** | Two tabs edit same matter |
| **Expected result** | Last write wins or conflict message |
| **What failure would look like** | Corrupt merge |
| **Priority** | P2 |
| **Suggested automated test type** | E2E |

#### UI-005

| Field | Detail |
| --- | --- |
| **Test ID** | UI-005 |
| **Module** | Browser / UI |
| **Risk type** | UX / info disclosure |
| **Persona** | Lawyer |
| **Preconditions** | Playwright optional |
| **Steps** | Throttle network slow 3G |
| **Expected result** | Loading states; no partial secret leak |
| **What failure would look like** | Broken UI |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### UI-006

| Field | Detail |
| --- | --- |
| **Test ID** | UI-006 |
| **Module** | Browser / UI |
| **Risk type** | UX / info disclosure |
| **Persona** | Lawyer |
| **Preconditions** | Playwright optional |
| **Steps** | Invalid form fields |
| **Expected result** | Inline validation |
| **What failure would look like** | 500 |
| **Priority** | P1 |
| **Suggested automated test type** | E2E |

#### UI-007

| Field | Detail |
| --- | --- |
| **Test ID** | UI-007 |
| **Module** | Browser / UI |
| **Risk type** | UX / info disclosure |
| **Persona** | Lawyer |
| **Preconditions** | Playwright optional |
| **Steps** | Mobile width 375px |
| **Expected result** | Nav usable |
| **What failure would look like** | Overflow hidden actions |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### UI-008

| Field | Detail |
| --- | --- |
| **Test ID** | UI-008 |
| **Module** | Browser / UI |
| **Risk type** | UX / info disclosure |
| **Persona** | Lawyer |
| **Preconditions** | Playwright optional |
| **Steps** | Table 50+ columns/long text |
| **Expected result** | Truncate/wrap |
| **What failure would look like** | Layout break |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### UI-009

| Field | Detail |
| --- | --- |
| **Test ID** | UI-009 |
| **Module** | Browser / UI |
| **Risk type** | UX / info disclosure |
| **Persona** | Lawyer |
| **Preconditions** | Playwright optional |
| **Steps** | Empty client list lawyer |
| **Expected result** | Empty state copy |
| **What failure would look like** | Blank crash |
| **Priority** | P2 |
| **Suggested automated test type** | E2E |

#### UI-010

| Field | Detail |
| --- | --- |
| **Test ID** | UI-010 |
| **Module** | Browser / UI |
| **Risk type** | UX / info disclosure |
| **Persona** | Lawyer |
| **Preconditions** | Playwright optional |
| **Steps** | Loading skeleton/spinner |
| **Expected result** | Shows during fetch |
| **What failure would look like** | Flash of wrong content |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### UI-011

| Field | Detail |
| --- | --- |
| **Test ID** | UI-011 |
| **Module** | Browser / UI |
| **Risk type** | UX / info disclosure |
| **Persona** | Lawyer |
| **Preconditions** | Playwright optional |
| **Steps** | Throw error in server component |
| **Expected result** | Error boundary |
| **What failure would look like** | White screen |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### UI-012

| Field | Detail |
| --- | --- |
| **Test ID** | UI-012 |
| **Module** | Browser / UI |
| **Risk type** | UX / info disclosure |
| **Persona** | Lawyer |
| **Preconditions** | Playwright optional |
| **Steps** | Hidden matter URL vs random UUID |
| **Expected result** | Same 404/redirect (no existence leak) |
| **What failure would look like** | 403 vs 404 reveals ID valid |
| **Priority** | P1 |
| **Suggested automated test type** | integration |


## S. Database / data integrity

*12 test cases*

#### DB-001

| Field | Detail |
| --- | --- |
| **Test ID** | DB-001 |
| **Module** | Database integrity |
| **Risk type** | Constraints |
| **Persona** | DevOps |
| **Preconditions** | prisma/schema.prisma |
| **Steps** | Create matter without clientId |
| **Expected result** | DB/Prisma reject |
| **What failure would look like** | Orphan matter |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DB-002

| Field | Detail |
| --- | --- |
| **Test ID** | DB-002 |
| **Module** | Database integrity |
| **Risk type** | Constraints |
| **Persona** | DevOps |
| **Preconditions** | prisma/schema.prisma |
| **Steps** | DocumentLink without clientId |
| **Expected result** | Reject |
| **What failure would look like** | Orphan doc |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DB-003

| Field | Detail |
| --- | --- |
| **Test ID** | DB-003 |
| **Module** | Database integrity |
| **Risk type** | Constraints |
| **Persona** | DevOps |
| **Preconditions** | prisma/schema.prisma |
| **Steps** | Duplicate MatterAssignment |
| **Expected result** | Unique violation |
| **What failure would look like** | Duplicate row |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DB-004

| Field | Detail |
| --- | --- |
| **Test ID** | DB-004 |
| **Module** | Database integrity |
| **Risk type** | Constraints |
| **Persona** | DevOps |
| **Preconditions** | prisma/schema.prisma |
| **Steps** | Duplicate MatterGroupAssignment |
| **Expected result** | Unique violation |
| **What failure would look like** | Duplicate |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DB-005

| Field | Detail |
| --- | --- |
| **Test ID** | DB-005 |
| **Module** | Database integrity |
| **Risk type** | Constraints |
| **Persona** | DevOps |
| **Preconditions** | prisma/schema.prisma |
| **Steps** | Duplicate user email |
| **Expected result** | Unique violation |
| **What failure would look like** | Two users |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DB-006

| Field | Detail |
| --- | --- |
| **Test ID** | DB-006 |
| **Module** | Database integrity |
| **Risk type** | Constraints |
| **Persona** | DevOps |
| **Preconditions** | prisma/schema.prisma |
| **Steps** | Duplicate tag name |
| **Expected result** | Unique violation |
| **What failure would look like** | Duplicates |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### DB-007

| Field | Detail |
| --- | --- |
| **Test ID** | DB-007 |
| **Module** | Database integrity |
| **Risk type** | Constraints |
| **Persona** | DevOps |
| **Preconditions** | prisma/schema.prisma |
| **Steps** | Two default workflow statuses |
| **Expected result** | App enforces single default |
| **What failure would look like** | Two defaults |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DB-008

| Field | Detail |
| --- | --- |
| **Test ID** | DB-008 |
| **Module** | Database integrity |
| **Risk type** | Constraints |
| **Persona** | DevOps |
| **Preconditions** | prisma/schema.prisma |
| **Steps** | Delete client with matters |
| **Expected result** | Restrict or soft cascade per schema |
| **What failure would look like** | FK error uncaught |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### DB-009

| Field | Detail |
| --- | --- |
| **Test ID** | DB-009 |
| **Module** | Database integrity |
| **Risk type** | Constraints |
| **Persona** | DevOps |
| **Preconditions** | prisma/schema.prisma |
| **Steps** | ActivityLog UPDATE |
| **Expected result** | Trigger block |
| **What failure would look like** | Mutable log |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DB-010

| Field | Detail |
| --- | --- |
| **Test ID** | DB-010 |
| **Module** | Database integrity |
| **Risk type** | Constraints |
| **Persona** | DevOps |
| **Preconditions** | prisma/schema.prisma |
| **Steps** | Billing amount decimal precision |
| **Expected result** | Correct scale 2 |
| **What failure would look like** | Rounding bug |
| **Priority** | P2 |
| **Suggested automated test type** | unit |

#### DB-011

| Field | Detail |
| --- | --- |
| **Test ID** | DB-011 |
| **Module** | Database integrity |
| **Risk type** | Constraints |
| **Persona** | DevOps |
| **Preconditions** | prisma/schema.prisma |
| **Steps** | Dates stored UTC display Bangkok |
| **Expected result** | Consistent |
| **What failure would look like** | Off-by-one |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### DB-012

| Field | Detail |
| --- | --- |
| **Test ID** | DB-012 |
| **Module** | Database integrity |
| **Risk type** | Constraints |
| **Persona** | DevOps |
| **Preconditions** | prisma/schema.prisma |
| **Steps** | Run seed twice |
| **Expected result** | Idempotent tags/settings |
| **What failure would look like** | Duplicate admins |
| **Priority** | P0 |
| **Suggested automated test type** | integration |


## T. Thai-law workflow

*10 test cases*

#### TH-001

| Field | Detail |
| --- | --- |
| **Test ID** | TH-001 |
| **Module** | Thai workflow |
| **Risk type** | Localization |
| **Persona** | Lawyer |
| **Preconditions** | Thailand pack templates |
| **Steps** | Client INDIVIDUAL long Thai name |
| **Expected result** | UTF-8 OK |
| **What failure would look like** | Truncation |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### TH-002

| Field | Detail |
| --- | --- |
| **Test ID** | TH-002 |
| **Module** | Thai workflow |
| **Risk type** | Localization |
| **Persona** | Lawyer |
| **Preconditions** | Thailand pack templates |
| **Steps** | Client COMPANY with บจก./หจก. |
| **Expected result** | Displayed |
| **What failure would look like** | Garbled |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### TH-003

| Field | Detail |
| --- | --- |
| **Test ID** | TH-003 |
| **Module** | Thai workflow |
| **Risk type** | Localization |
| **Persona** | Lawyer |
| **Preconditions** | Thailand pack templates |
| **Steps** | Matter title with ศาล/สำนักงาน |
| **Expected result** | Searchable |
| **What failure would look like** | No match |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### TH-004

| Field | Detail |
| --- | --- |
| **Test ID** | TH-004 |
| **Module** | Thai workflow |
| **Risk type** | Localization |
| **Persona** | Lawyer |
| **Preconditions** | Thailand pack templates |
| **Steps** | Thai document title |
| **Expected result** | Detail OK |
| **What failure would look like** | Corrupt |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### TH-005

| Field | Detail |
| --- | --- |
| **Test ID** | TH-005 |
| **Module** | Thai workflow |
| **Risk type** | Localization |
| **Persona** | Lawyer |
| **Preconditions** | Thailand pack templates |
| **Steps** | Thai tags |
| **Expected result** | TAG-003 |
| **What failure would look like** | — |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### TH-006

| Field | Detail |
| --- | --- |
| **Test ID** | TH-006 |
| **Module** | Thai workflow |
| **Risk type** | Localization |
| **Persona** | Lawyer |
| **Preconditions** | Thailand pack templates |
| **Steps** | Thai deadlineType on task |
| **Expected result** | Stored |
| **What failure would look like** | — |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### TH-007

| Field | Detail |
| --- | --- |
| **Test ID** | TH-007 |
| **Module** | Thai workflow |
| **Risk type** | Localization |
| **Persona** | Lawyer |
| **Preconditions** | Thailand pack templates |
| **Steps** | Thai workflow status seed labels |
| **Expected result** | Badge bilingual |
| **What failure would look like** | — |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### TH-008

| Field | Detail |
| --- | --- |
| **Test ID** | TH-008 |
| **Module** | Thai workflow |
| **Risk type** | Localization |
| **Persona** | Lawyer |
| **Preconditions** | Thailand pack templates |
| **Steps** | Login confidentiality notice Thai |
| **Expected result** | Shown when enabled |
| **What failure would look like** | English only |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### TH-009

| Field | Detail |
| --- | --- |
| **Test ID** | TH-009 |
| **Module** | Thai workflow |
| **Risk type** | Localization |
| **Persona** | Lawyer |
| **Preconditions** | Thailand pack templates |
| **Steps** | PDPA warning copy Thai |
| **Expected result** | Docs/template only |
| **What failure would look like** | — |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### TH-010

| Field | Detail |
| --- | --- |
| **Test ID** | TH-010 |
| **Module** | Thai workflow |
| **Risk type** | Localization |
| **Persona** | Lawyer |
| **Preconditions** | Thailand pack templates |
| **Steps** | Mixed TH title EN notes |
| **Expected result** | Both render |
| **What failure would look like** | — |
| **Priority** | P1 |
| **Suggested automated test type** | manual |


## U. Metadata sensitivity (legal operations)

*8 test cases*

#### META-001

| Field | Detail |
| --- | --- |
| **Test ID** | META-001 |
| **Module** | Metadata sensitivity |
| **Risk type** | Confidentiality (metadata-only) |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Firm training: treat all metadata as confidential; RBAC seeded |
| **Steps** | Create matter title with client name + claim strategy; lawyer without matter access searches |
| **Expected result** | No search/list/detail leak of title |
| **What failure would look like** | Hidden matter title visible in search or URL |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### META-002

| Field | Detail |
| --- | --- |
| **Test ID** | META-002 |
| **Module** | Metadata sensitivity |
| **Risk type** | Confidentiality (metadata-only) |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Firm training: treat all metadata as confidential; RBAC seeded |
| **Steps** | Document title `Settlement offer 12M THB draft.pdf` on assigned matter; export activity CSV |
| **Expected result** | Title visible only to authorized users; CSV scoped |
| **What failure would look like** | Revealing title in export to wrong role |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### META-003

| Field | Detail |
| --- | --- |
| **Test ID** | META-003 |
| **Module** | Metadata sensitivity |
| **Risk type** | Confidentiality (metadata-only) |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Firm training: treat all metadata as confidential; RBAC seeded |
| **Steps** | Task description with privileged communication summary |
| **Expected result** | Visible only via matter RBAC; not in global activity for non-admin |
| **What failure would look like** | Task note in firm-wide feed |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### META-004

| Field | Detail |
| --- | --- |
| **Test ID** | META-004 |
| **Module** | Metadata sensitivity |
| **Risk type** | Confidentiality (metadata-only) |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Firm training: treat all metadata as confidential; RBAC seeded |
| **Steps** | Task deadlineType `ศาลนัดสืบพยาน 15 ส.ค.` visible on task list |
| **Expected result** | Same RBAC as task; no extra leak on dashboard |
| **What failure would look like** | Deadline text exposes case to unassigned user |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### META-005

| Field | Detail |
| --- | --- |
| **Test ID** | META-005 |
| **Module** | Metadata sensitivity |
| **Risk type** | Confidentiality (metadata-only) |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Firm training: treat all metadata as confidential; RBAC seeded |
| **Steps** | Update matter with long confidential note; view activity timeline |
| **Expected result** | Summary redacted/truncated; no full privileged text in ActivityLog metadata |
| **What failure would look like** | Full note text in activity JSON/CSV |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### META-006

| Field | Detail |
| --- | --- |
| **Test ID** | META-006 |
| **Module** | Metadata sensitivity |
| **Risk type** | Confidentiality (metadata-only) |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Firm training: treat all metadata as confidential; RBAC seeded |
| **Steps** | Search partial matter title as unassigned lawyer |
| **Expected result** | No snippet/hit (SRCH-009 alignment) |
| **What failure would look like** | Search result shows revealing substring |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### META-007

| Field | Detail |
| --- | --- |
| **Test ID** | META-007 |
| **Module** | Metadata sensitivity |
| **Risk type** | Confidentiality (metadata-only) |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Firm training: treat all metadata as confidential; RBAC seeded |
| **Steps** | Inspect browser history, referrer, and exported CSV for raw `/matters/{uuid}` paths without context |
| **Expected result** | Paths alone do not expose titles; pairing with other leaks documented |
| **What failure would look like** | UUID + title in query string or CSV column combo enables inference |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### META-008

| Field | Detail |
| --- | --- |
| **Test ID** | META-008 |
| **Module** | Metadata sensitivity |
| **Risk type** | Confidentiality (metadata-only) |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Firm training: treat all metadata as confidential; RBAC seeded |
| **Steps** | Admin exports activity CSV; verify matter/document titles in rows match RBAC scope |
| **Expected result** | No titles for matters user could not access in scoped export |
| **What failure would look like** | CSV rows include confidential titles from inaccessible matters |
| **Priority** | P0 |
| **Suggested automated test type** | integration |


## V. External storage permission mismatch

*8 test cases*

#### EXT-001

| Field | Detail |
| --- | --- |
| **Test ID** | EXT-001 |
| **Module** | External storage permissions |
| **Risk type** | Third-party ACL mismatch |
| **Persona** | Lawyer / Admin |
| **Preconditions** | requireDocumentPermissionConfirm=true; docs/SETUP_PLAYBOOK §4 |
| **Steps** | Save Google Drive link known to be “Anyone with the link”; open in incognito without firm login |
| **Expected result** | Firmedware stores metadata only; file may still be public—document in test report |
| **What failure would look like** | Firm assumes Firmedware access = file security |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### EXT-002

| Field | Detail |
| --- | --- |
| **Test ID** | EXT-002 |
| **Module** | External storage permissions |
| **Risk type** | Third-party ACL mismatch |
| **Persona** | Lawyer / Admin |
| **Preconditions** | requireDocumentPermissionConfirm=true; docs/SETUP_PLAYBOOK §4 |
| **Steps** | Save SharePoint link with broad org sharing; viewer without SP license opens link |
| **Expected result** | Link may open for org users even when Firmedware RBAC blocks |
| **What failure would look like** | Over-shared SP link undetected |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### EXT-003

| Field | Detail |
| --- | --- |
| **Test ID** | EXT-003 |
| **Module** | External storage permissions |
| **Risk type** | Third-party ACL mismatch |
| **Persona** | Lawyer / Admin |
| **Preconditions** | requireDocumentPermissionConfirm=true; docs/SETUP_PLAYBOOK §4 |
| **Steps** | Save Dropbox public link; verify opens without Dropbox firm account |
| **Expected result** | External public access despite internal restriction |
| **What failure would look like** | Same as EXT-001 |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### EXT-004

| Field | Detail |
| --- | --- |
| **Test ID** | EXT-004 |
| **Module** | External storage permissions |
| **Risk type** | Third-party ACL mismatch |
| **Persona** | Lawyer / Admin |
| **Preconditions** | requireDocumentPermissionConfirm=true; docs/SETUP_PLAYBOOK §4 |
| **Steps** | LOCAL_FOLDER path to `\\fileserver\matter\doc` from lawyer laptop without VPN |
| **Expected result** | Link saved; open fails or wrong share—user understands limit |
| **What failure would look like** | False confidence in access |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### EXT-005

| Field | Detail |
| --- | --- |
| **Test ID** | EXT-005 |
| **Module** | External storage permissions |
| **Risk type** | Third-party ACL mismatch |
| **Persona** | Lawyer / Admin |
| **Preconditions** | requireDocumentPermissionConfirm=true; docs/SETUP_PLAYBOOK §4 |
| **Steps** | Assigned lawyer copies external URL; paste to personal email (process review) |
| **Expected result** | Firm policy violation outside app scope; activity may log open not copy |
| **What failure would look like** | No technical block—training required |
| **Priority** | P2 |
| **Suggested automated test type** | manual |

#### EXT-006

| Field | Detail |
| --- | --- |
| **Test ID** | EXT-006 |
| **Module** | External storage permissions |
| **Risk type** | Third-party ACL mismatch |
| **Persona** | Lawyer / Admin |
| **Preconditions** | requireDocumentPermissionConfirm=true; docs/SETUP_PLAYBOOK §4 |
| **Steps** | Tamper form: omit permissionConfirmed while setting true in FirmSettings |
| **Expected result** | Server rejects create/update (DOC-019) |
| **What failure would look like** | Link saved without confirmation |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### EXT-007

| Field | Detail |
| --- | --- |
| **Test ID** | EXT-007 |
| **Module** | External storage permissions |
| **Risk type** | Third-party ACL mismatch |
| **Persona** | Lawyer / Admin |
| **Preconditions** | requireDocumentPermissionConfirm=true; docs/SETUP_PLAYBOOK §4 |
| **Steps** | Review firm playbook: quarterly external link permission audit checklist exists |
| **Expected result** | Checklist documented in SETUP_PLAYBOOK or internal wiki |
| **What failure would look like** | No periodic review process |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### EXT-008

| Field | Detail |
| --- | --- |
| **Test ID** | EXT-008 |
| **Module** | External storage permissions |
| **Risk type** | Third-party ACL mismatch |
| **Persona** | Lawyer / Admin |
| **Preconditions** | requireDocumentPermissionConfirm=true; docs/SETUP_PLAYBOOK §4 |
| **Steps** | Read Admin → Security + document form helper text |
| **Expected result** | Clear warning: Firmedware does not enforce Drive/SP/OneDrive/Dropbox ACLs |
| **What failure would look like** | UI implies app controls external file permissions |
| **Priority** | P0 |
| **Suggested automated test type** | manual |


## W. Backup and restore

*10 test cases*

#### BKP-001

| Field | Detail |
| --- | --- |
| **Test ID** | BKP-001 |
| **Module** | Backup / restore |
| **Risk type** | Availability / confidentiality |
| **Persona** | DevOps / Admin |
| **Preconditions** | Production-like Postgres; firm backup policy documented |
| **Steps** | Run `pg_dump` against production DB container |
| **Expected result** | Non-zero success; file size >0 |
| **What failure would look like** | Backup script fails silently |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### BKP-002

| Field | Detail |
| --- | --- |
| **Test ID** | BKP-002 |
| **Module** | Backup / restore |
| **Risk type** | Availability / confidentiality |
| **Persona** | DevOps / Admin |
| **Preconditions** | Production-like Postgres; firm backup policy documented |
| **Steps** | Store dump on encrypted volume or restricted share; verify permissions |
| **Expected result** | Only admin/IT OS accounts can read |
| **What failure would look like** | World-readable backup file |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### BKP-003

| Field | Detail |
| --- | --- |
| **Test ID** | BKP-003 |
| **Module** | Backup / restore |
| **Risk type** | Availability / confidentiality |
| **Persona** | DevOps / Admin |
| **Preconditions** | Production-like Postgres; firm backup policy documented |
| **Steps** | Restore dump to fresh DB; run smoke test login + matter list |
| **Expected result** | App functional; row counts match |
| **What failure would look like** | Restore never tested; corruption found in crisis |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### BKP-004

| Field | Detail |
| --- | --- |
| **Test ID** | BKP-004 |
| **Module** | Backup / restore |
| **Risk type** | Availability / confidentiality |
| **Persona** | DevOps / Admin |
| **Preconditions** | Production-like Postgres; firm backup policy documented |
| **Steps** | `git status` after backup job; confirm dumps in .gitignore |
| **Expected result** | No `.sql`/dump staged |
| **What failure would look like** | Backup committed to GitHub |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### BKP-005

| Field | Detail |
| --- | --- |
| **Test ID** | BKP-005 |
| **Module** | Backup / restore |
| **Risk type** | Availability / confidentiality |
| **Persona** | DevOps / Admin |
| **Preconditions** | Production-like Postgres; firm backup policy documented |
| **Steps** | Inspect backup file for `.env`, connection strings, or seed passwords |
| **Expected result** | Only DB content; secrets not embedded in dump path readme |
| **What failure would look like** | AUTH_SECRET pasted into backup folder README |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### BKP-006

| Field | Detail |
| --- | --- |
| **Test ID** | BKP-006 |
| **Module** | Backup / restore |
| **Risk type** | Availability / confidentiality |
| **Persona** | DevOps / Admin |
| **Preconditions** | Production-like Postgres; firm backup policy documented |
| **Steps** | Restore production dump to developer laptop by mistake |
| **Expected result** | Procedure prevents or scrubs after test |
| **What failure would look like** | Prod client data on unsecured laptop |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### BKP-007

| Field | Detail |
| --- | --- |
| **Test ID** | BKP-007 |
| **Module** | Backup / restore |
| **Risk type** | Availability / confidentiality |
| **Persona** | DevOps / Admin |
| **Preconditions** | Production-like Postgres; firm backup policy documented |
| **Steps** | Attempt restore from 90-day-old backup after migration |
| **Expected result** | Document stale schema risk; test or reject |
| **What failure would look like** | Wrong schema/data loss |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### BKP-008

| Field | Detail |
| --- | --- |
| **Test ID** | BKP-008 |
| **Module** | Backup / restore |
| **Risk type** | Availability / confidentiality |
| **Persona** | DevOps / Admin |
| **Preconditions** | Production-like Postgres; firm backup policy documented |
| **Steps** | Simulate missing scheduled backup (monitoring alert) |
| **Expected result** | Alert fires; runbook exists |
| **What failure would look like** | Silent no-backup |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### BKP-009

| Field | Detail |
| --- | --- |
| **Test ID** | BKP-009 |
| **Module** | Backup / restore |
| **Risk type** | Availability / confidentiality |
| **Persona** | DevOps / Admin |
| **Preconditions** | Production-like Postgres; firm backup policy documented |
| **Steps** | Truncate/corrupt dump file; run restore |
| **Expected result** | Restore fails cleanly with error |
| **What failure would look like** | Partial corrupt DB accepted |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### BKP-010

| Field | Detail |
| --- | --- |
| **Test ID** | BKP-010 |
| **Module** | Backup / restore |
| **Risk type** | Availability / confidentiality |
| **Persona** | DevOps / Admin |
| **Preconditions** | Production-like Postgres; firm backup policy documented |
| **Steps** | Non-admin user attempts read backup share |
| **Expected result** | OS/filesystem denies |
| **What failure would look like** | Lawyer downloads full firm dump |
| **Priority** | P0 |
| **Suggested automated test type** | manual |


## X. Admin misconfiguration

*10 test cases*

#### ADMIN-001

| Field | Detail |
| --- | --- |
| **Test ID** | ADMIN-001 |
| **Module** | Admin misconfiguration |
| **Risk type** | Operational error |
| **Persona** | Admin |
| **Preconditions** | Admin account; sample users/groups |
| **Steps** | Add lawyer to Litigation group also assigned to all open matters |
| **Expected result** | Review matter list—only intended matters visible |
| **What failure would look like** | User sees entire firm caseload |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### ADMIN-002

| Field | Detail |
| --- | --- |
| **Test ID** | ADMIN-002 |
| **Module** | Admin misconfiguration |
| **Risk type** | Operational error |
| **Persona** | Admin |
| **Preconditions** | Admin account; sample users/groups |
| **Steps** | Promote VIEWER to LAWYER by mistake; viewer refreshes session |
| **Expected result** | Writes blocked until re-login; activity logs role change |
| **What failure would look like** | Viewer edits after role change without audit |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ADMIN-003

| Field | Detail |
| --- | --- |
| **Test ID** | ADMIN-003 |
| **Module** | Admin misconfiguration |
| **Risk type** | Operational error |
| **Persona** | Admin |
| **Preconditions** | Admin account; sample users/groups |
| **Steps** | Departed employee: admin forgets deactivate for 30 days |
| **Expected result** | Account still logs in (AUTH-002 if deactivated); process audit |
| **What failure would look like** | Stale active account |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### ADMIN-004

| Field | Detail |
| --- | --- |
| **Test ID** | ADMIN-004 |
| **Module** | Admin misconfiguration |
| **Risk type** | Operational error |
| **Persona** | Admin |
| **Preconditions** | Admin account; sample users/groups |
| **Steps** | Set minimal lockout/password guidance; weak user passwords allowed |
| **Expected result** | Document firm policy; optional future min length enforcement |
| **What failure would look like** | Trivial passwords firm-wide |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### ADMIN-005

| Field | Detail |
| --- | --- |
| **Test ID** | ADMIN-005 |
| **Module** | Admin misconfiguration |
| **Risk type** | Operational error |
| **Persona** | Admin |
| **Preconditions** | Admin account; sample users/groups |
| **Steps** | Disable requireDocumentPermissionConfirm in Admin → Security |
| **Expected result** | Allowed only with conscious admin action; EXT-008 warning still visible |
| **What failure would look like** | Links saved without user acknowledgment |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ADMIN-006

| Field | Detail |
| --- | --- |
| **Test ID** | ADMIN-006 |
| **Module** | Admin misconfiguration |
| **Risk type** | Operational error |
| **Persona** | Admin |
| **Preconditions** | Admin account; sample users/groups |
| **Steps** | Bulk deactivate wrong workflow status used by open matters |
| **Expected result** | Matters retain statusId; badge fallback; no data loss |
| **What failure would look like** | Open matters untrackable |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### ADMIN-007

| Field | Detail |
| --- | --- |
| **Test ID** | ADMIN-007 |
| **Module** | Admin misconfiguration |
| **Risk type** | Operational error |
| **Persona** | Admin |
| **Preconditions** | Admin account; sample users/groups |
| **Steps** | Export activity CSV; save to personal Downloads without encryption |
| **Expected result** | Process review—export logged (CSV-008); firm policy on storage |
| **What failure would look like** | CSV on unsecured personal device |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### ADMIN-008

| Field | Detail |
| --- | --- |
| **Test ID** | ADMIN-008 |
| **Module** | Admin misconfiguration |
| **Risk type** | Operational error |
| **Persona** | Admin |
| **Preconditions** | Admin account; sample users/groups |
| **Steps** | SEED_ADMIN_EMAIL=gmail personal on production |
| **Expected result** | Document risk; use firm-owned mailbox |
| **What failure would look like** | Account recovery/lost employee risk |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### ADMIN-009

| Field | Detail |
| --- | --- |
| **Test ID** | ADMIN-009 |
| **Module** | Admin misconfiguration |
| **Risk type** | Operational error |
| **Persona** | Admin |
| **Preconditions** | Admin account; sample users/groups |
| **Steps** | Two lawyers share admin password (process) |
| **Expected result** | Discouraged in docs; per-user accounts |
| **What failure would look like** | No attribution in logs |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### ADMIN-010

| Field | Detail |
| --- | --- |
| **Test ID** | ADMIN-010 |
| **Module** | Admin misconfiguration |
| **Risk type** | Operational error |
| **Persona** | Admin |
| **Preconditions** | Admin account; sample users/groups |
| **Steps** | Production login still uses changeme (DEP-013) |
| **Expected result** | Block go-live until changed |
| **What failure would look like** | Trivial admin compromise |
| **Priority** | P0 |
| **Suggested automated test type** | manual |


## Y. Retention and legal hold

*8 test cases*

#### RET-001

| Field | Detail |
| --- | --- |
| **Test ID** | RET-001 |
| **Module** | Retention / legal hold |
| **Risk type** | Compliance / evidence |
| **Persona** | Admin / DevOps |
| **Preconditions** | Matter M archived; docs/SECURITY.md retention notes |
| **Steps** | Archive matter; query DB directly |
| **Expected result** | Row remains with deletedAt set |
| **What failure would look like** | Hard delete removed evidence |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RET-002

| Field | Detail |
| --- | --- |
| **Test ID** | RET-002 |
| **Module** | Retention / legal hold |
| **Risk type** | Compliance / evidence |
| **Persona** | Admin / DevOps |
| **Preconditions** | Matter M archived; docs/SECURITY.md retention notes |
| **Steps** | Archived matter absent from lawyer list/search/dashboard |
| **Expected result** | Hidden per ARCH-010 |
| **What failure would look like** | Still in active lists |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RET-003

| Field | Detail |
| --- | --- |
| **Test ID** | RET-003 |
| **Module** | Retention / legal hold |
| **Risk type** | Compliance / evidence |
| **Persona** | Admin / DevOps |
| **Preconditions** | Matter M archived; docs/SECURITY.md retention notes |
| **Steps** | Archive matter; view activity history |
| **Expected result** | Prior ActivityLog rows unchanged (immutable) |
| **What failure would look like** | Logs deleted with archive |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RET-004

| Field | Detail |
| --- | --- |
| **Test ID** | RET-004 |
| **Module** | Retention / legal hold |
| **Risk type** | Compliance / evidence |
| **Persona** | Admin / DevOps |
| **Preconditions** | Matter M archived; docs/SECURITY.md retention notes |
| **Steps** | Attempt hard delete matter via UI/API |
| **Expected result** | Only soft delete available |
| **What failure would look like** | Purge button removes row |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RET-005

| Field | Detail |
| --- | --- |
| **Test ID** | RET-005 |
| **Module** | Retention / legal hold |
| **Risk type** | Compliance / evidence |
| **Persona** | Admin / DevOps |
| **Preconditions** | Matter M archived; docs/SECURITY.md retention notes |
| **Steps** | pg_dump after archive |
| **Expected result** | Backup still contains archived rows |
| **What failure would look like** | Firm understands backups retain archived data |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### RET-006

| Field | Detail |
| --- | --- |
| **Test ID** | RET-006 |
| **Module** | Retention / legal hold |
| **Risk type** | Compliance / evidence |
| **Persona** | Admin / DevOps |
| **Preconditions** | Matter M archived; docs/SECURITY.md retention notes |
| **Steps** | Firm retention period documented in playbook/internal policy |
| **Expected result** | Written retention for metadata + backups |
| **What failure would look like** | No documented retention |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### RET-007

| Field | Detail |
| --- | --- |
| **Test ID** | RET-007 |
| **Module** | Retention / legal hold |
| **Risk type** | Compliance / evidence |
| **Persona** | Admin / DevOps |
| **Preconditions** | Matter M archived; docs/SECURITY.md retention notes |
| **Steps** | Litigation hold: docs warn Firmedware has no legal-hold automation |
| **Expected result** | SECURITY.md / playbook explicit |
| **What failure would look like** | Firm assumes hold flag exists |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### RET-008

| Field | Detail |
| --- | --- |
| **Test ID** | RET-008 |
| **Module** | Retention / legal hold |
| **Risk type** | Compliance / evidence |
| **Persona** | Admin / DevOps |
| **Preconditions** | Matter M archived; docs/SECURITY.md retention notes |
| **Steps** | CSV export + backup retention periods noted for firm |
| **Expected result** | Export files and dumps have defined destroy date |
| **What failure would look like** | Indefinite uncontrolled copies |
| **Priority** | P1 |
| **Suggested automated test type** | manual |


## P0 Must-Pass Tests Before Production

**142 P0 cases** — minimum gate:

- AUTH-001 — Login lockout works
- AUTH-002 — Inactive user cannot login
- AUTH-007 — No SQL injection via login email
- AUTH-010/011 — Role/deactivation does not allow unauthorized mutation (document JWT gap)
- RBAC-001/002/003 — Non-admin cannot access unassigned matter/client; Viewer cannot mutate
- RBAC-009/017/018 — No firm-wide activity or search/dashboard leakage
- RBAC-019 — Server actions enforce RBAC
- CLI-002/006/007 — Hidden clients not in search or direct URL
- DOC-008/009/019/025 — URL validation, permission confirm, no server fetch
- DOC-016/017/018 — No XSS in document fields
- SRCH-007/009 — No injection; no hidden matter search hits
- ACT-006/010/011/012/013 — Safe auth logs; admin-only export; immutable ActivityLog
- ARCH-010 / RET-002 — Archived records hidden from ordinary workflows
- RET-001/003/004 — Archived data preserved; activity log intact; no hard delete in UI
- CSV-001/006/010 — Admin export; no secrets; CSV formula injection prevented
- META-001/002/005/006/008 — Metadata does not leak via titles, activity summaries, search, or CSV
- EXT-006/008 — Permission confirmation required; external ACL limitation clearly stated
- BKP-001/002/003/004/010 — Backups work, access-restricted, restore tested, not in GitHub
- ADMIN-001/002/005/009/010 — Group/role changes logged (ACT-007); permission confirm on; no shared/default admin creds
- ACT-007 — Admin role/group changes appear in activity log
- I18N-007/008/011 — Thai store/display/search
- AI-001/009/015 — AI off; no external API; no doc fetch
- DEP-013/014 — Seed password changed; no .env, exports, backups, screenshots, or client data in GitHub
- **Policy:** Firmedware access control is **not** a substitute for external Drive/SharePoint/OneDrive/Dropbox permissions (EXT-001–004)

### Full P0 test ID list

- `ACT-006` — Failed login
- `ACT-008` — User changes password
- `ACT-010` — Lawyer GET /api/activity/export firm-wide
- `ACT-011` — Prisma activityLog.update via script
- `ACT-012` — Prisma activityLog.delete
- `ACT-013` — SQL UPDATE ActivityLog
- `ACT-015` — Large note in metadata
- `ADMIN-001` — Add lawyer to Litigation group also assigned to all open matters
- `ADMIN-002` — Promote VIEWER to LAWYER by mistake; viewer refreshes session
- `ADMIN-003` — Departed employee: admin forgets deactivate for 30 days
- `ADMIN-005` — Disable requireDocumentPermissionConfirm in Admin → Security
- `ADMIN-009` — Two lawyers share admin password (process)
- `ADMIN-010` — Production login still uses changeme (DEP-013)
- `AI-001` — AI connector DISABLED (default)
- `AI-002` — Public research mode with client PII prompt
- `AI-003` — Privileged matter prompt
- `AI-004` — External doc link in prompt
- `AI-005` — userConfirmation=false
- `AI-006` — Missing provider
- `AI-007` — Invalid provider enum
- `AI-009` — Network capture on AI UI action
- `AI-011` — Privileged prompt logging
- `AI-012` — AI cannot CREATE matter
- `AI-013` — AI cannot DELETE
- `AI-014` — AI cannot export CSV
- `AI-015` — AI cannot fetch Drive link
- `ARCH-002` — Archive matter with open tasks
- `ARCH-003` — Archive matter with documents
- `ARCH-004` — Archive document link
- `ARCH-006` — Deactivate group with matter assignments
- `ARCH-009` — Attempt hard delete via tampered action
- `ARCH-010` — Lists/search/dashboard exclude archived
- `ARCH-012` — Archive matter; FK integrity
- `AUTH-001` — Fail login until threshold exceeded; retry with correct password during lockout;…
- `AUTH-002` — Login as user with active=false
- `AUTH-007` — Email `admin' OR '1'='1`
- `AUTH-010` — Lawyer session; admin changes role to VIEWER; submit edit
- `AUTH-011` — Lawyer session; admin deactivates user; continue browsing
- `AUTH-012` — Expired/invalid session cookie; POST server action
- `AUTH-013` — Start app with missing/invalid AUTH_SECRET
- `AUTH-014` — Run seed when User table non-empty
- `AUTH-015` — First boot seed with empty SEED_ADMIN_PASSWORD
- `BILL-002` — Billing on archived matter
- `BILL-003` — amount -100
- `BILL-011` — Viewer edits payment status
- `BILL-012` — Lawyer billing on inaccessible matter
- `BILL-013` — externalInvoiceLink javascript:
- `BKP-001` — Run `pg_dump` against production DB container
- `BKP-002` — Store dump on encrypted volume or restricted share; verify permissions
- `BKP-003` — Restore dump to fresh DB; run smoke test login + matter list
- `BKP-004` — `git status` after backup job; confirm dumps in .gitignore
- `BKP-005` — Inspect backup file for `.env`, connection strings, or seed passwords
- `BKP-006` — Restore production dump to developer laptop by mistake
- `BKP-008` — Simulate missing scheduled backup (monitoring alert)
- `BKP-010` — Non-admin user attempts read backup share
- `CLI-002` — C1 only archived matters
- `CLI-003` — C2 one visible + one hidden matter
- `CLI-004` — C3 matter only via inactive group
- `CLI-006` — Search hidden client displayName
- `CLI-007` — Direct /clients/{hiddenId}
- `CLI-008` — Admin archives all matters on C5
- `CSV-001` — Admin export /api/activity/export
- `CSV-002` — Lawyer firm-wide export
- `CSV-004` — Metadata with commas quotes newlines
- `CSV-006` — Inspect CSV content
- `CSV-007` — Lawyer scoped entity export
- `CSV-010` — Cell `=cmd|'/c calc'!A0`
- `DB-001` — Create matter without clientId
- `DB-002` — DocumentLink without clientId
- `DB-003` — Duplicate MatterAssignment
- `DB-004` — Duplicate MatterGroupAssignment
- `DB-005` — Duplicate user email
- `DB-007` — Two default workflow statuses
- `DB-009` — ActivityLog UPDATE
- `DB-012` — Run seed twice
- `DEP-001` — DATABASE_URL missing
- `DEP-003` — AUTH_SECRET missing
- `DEP-004` — AUTH_SECRET short guessable
- `DEP-008` — Migrations not applied
- `DEP-013` — Production still uses changeme seed password
- `DEP-014` — .env in git status
- `DOC-008` — URL `not a url`
- `DOC-009` — URL `javascript:alert(1)`
- `DOC-010` — URL `data:text/html,<script>`
- `DOC-013` — URL with `?token=secret`
- `DOC-016` — providerLabel `<img onerror=alert(1)>`
- `DOC-017` — title `<script>alert(1)</script>`
- `DOC-018` — notes XSS payload
- `DOC-019` — Submit create without permissionConfirmed checkbox
- `DOC-020` — Open /documents/{id} for inaccessible matter
- `DOC-022` — Document on archived matter
- `DOC-024` — Click open document
- `DOC-025` — tcpdump during create/view doc
- `EXT-001` — Save Google Drive link known to be “Anyone with the link”; open in incognito wit…
- `EXT-006` — Tamper form: omit permissionConfirmed while setting true in FirmSettings
- `EXT-008` — Read Admin → Security + document form helper text
- `FIRM-008` — Lawyer update firm settings action
- `I18N-007` — Thai client displayName
- `I18N-008` — Thai matter title search
- `I18N-011` — Thai search query
- `META-001` — Create matter title with client name + claim strategy; lawyer without matter acc…
- `META-002` — Document title `Settlement offer 12M THB draft.pdf` on assigned matter; export a…
- `META-003` — Task description with privileged communication summary
- `META-005` — Update matter with long confidential note; view activity timeline
- `META-006` — Search partial matter title as unassigned lawyer
- `META-008` — Admin exports activity CSV; verify matter/document titles in rows match RBAC sco…
- `RBAC-001` — Open /matters/{M2}
- `RBAC-002` — Open /clients/{hidden} direct URL
- `RBAC-003` — Viewer POST create/update/archive/export
- `RBAC-004` — Lawyer GET /admin/users
- `RBAC-005` — Lawyer GET /admin/groups
- `RBAC-006` — Lawyer GET /admin/settings
- `RBAC-007` — Lawyer GET /admin/security
- `RBAC-009` — Lawyer GET /activity firm-wide
- `RBAC-010` — Add user to G1; assign G1 to M1
- `RBAC-011` — Deactivate G1
- `RBAC-012` — Remove user from G1
- `RBAC-013` — Remove MatterGroupAssignment
- `RBAC-014` — User direct+group on M1; remove one path
- `RBAC-015` — Archive M1
- `RBAC-016` — Archive all matters under client
- `RBAC-017` — Search document on inaccessible matter
- `RBAC-018` — Dashboard tasks for inaccessible matter
- `RBAC-019` — Invoke server actions without UI (curl/form)
- `RET-001` — Archive matter; query DB directly
- `RET-002` — Archived matter absent from lawyer list/search/dashboard
- `RET-003` — Archive matter; view activity history
- `RET-004` — Attempt hard delete matter via UI/API
- `SEC-008` — Lawyer update security settings
- `SEC-010` — Failed login unknown vs known email
- `SRCH-003` — q= Thai client name
- `SRCH-004` — q= English matter title
- `SRCH-007` — q= `'; DROP TABLE--`
- `SRCH-008` — q= `<script>alert(1)</script>`
- `SRCH-009` — Lawyer searches unassigned matter title
- `SRCH-010` — Search archived matter name as admin vs lawyer
- `SRCH-011` — Search archived document title
- `TAG-009` — Lawyer opens /tags
- `TASK-003` — Task on archived matter
- `TASK-013` — Viewer changes task status
- `TASK-015` — Archive matter; check overdue counts
- `WF-002` — Set two defaults for MATTER entity type

## Suggested automated test files

Do **not** implement all tests unless requested. Recommended file boundaries:

| File | Covers |
| --- | --- |
| `tests/rbac.test.ts` | RBAC-*, CLI-*, ARCH-010, RBAC-019 |
| `tests/auth-edge-cases.test.ts` | AUTH-*, SEC-010 |
| `tests/document-references.test.ts` | LOCAL-001–012, DOC-009 (URL safety) |
| `tests/document-links.test.ts` | DOC-* (legacy filename; overlap with document-references) |
| `tests/search-permissions.test.ts` | SRCH-*, CLI-006 |
| `tests/activity-log.test.ts` | ACT-*, CSV-* (export), DB-009 |
| `tests/i18n.test.ts` | I18N-*, TH-* |
| `tests/ai-policy.test.ts` | AI-* (stubs until connector exists) |
| `tests/metadata-sensitivity.test.ts` | META-*, SRCH-009, ACT-015 |
| `tests/external-permissions.test.ts` | EXT-*, DOC-019 |
| `tests/backup-restore.test.ts` | BKP-*, DEP-014 (manual ops) |
| `tests/admin-misconfig.test.ts` | ADMIN-*, RBAC-010–014 |
| `tests/retention-legal-hold.test.ts` | RET-*, ARCH-* |

Use **Vitest** or **Jest** + Prisma test DB; E2E via Playwright for UI-*/RBAC E2E cases.
