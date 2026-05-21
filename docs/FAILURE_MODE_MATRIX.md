# Firmedware failure mode matrix

Maps **failure modes** → **test IDs** → **mitigations**. Companion to [EDGE_CASE_TEST_PLAN.md](./EDGE_CASE_TEST_PLAN.md).

## Matrix

| Module | Failure mode | Primary test IDs | User/business impact | Detection / mitigation |
| --- | --- | --- | --- | --- |
| Authentication | Brute force, session fixation, user enumeration | AUTH-001, AUTH-007, AUTH-010, AUTH-011, SEC-010 | Account takeover | Lockout + generic errors + JWT refresh policy |
| RBAC | Horizontal privilege escalation | RBAC-001–019, CLI-006/007 | Unauthorized matter/client/doc access | Server-side filters in rbac.ts on every action |
| Document links | XSS, SSRF, open redirect | DOC-009–011, DOC-016–018, DOC-025 | Malware/phishing via link or server fetch | Scheme allowlist; escape output; no fetch |
| Search | Injection, data leak | SRCH-007–011 | Hidden matter names in results | Prisma parameterized queries + RBAC where |
| Activity log | Tampering, secret leak | ACT-006, ACT-011–013, CSV-006 | Audit trail untrusted | DB triggers + export redaction |
| Archive | Stale visibility | ARCH-010, RBAC-015/016 | Archived data in dashboards | notDeleted filters everywhere |
| i18n | Encoding, locale bypass | I18N-007/011, TH-* | Thai data corrupt or unsearchable | UTF-8 DB + fallback messages |
| Deployment | Secret exposure, split brain DB | DEP-001–015 | Firm data on wrong host or GitHub | Shared deployment docs + gitignore |
| AI (future) | Confidentiality breach | AI-001–015 | Client data to third party | Disabled by default; policy gates |
| Billing | Financial metadata leak | BILL-011/012 | Billing on wrong matters | canAccessBillingRecord mirrors documents |
| Metadata sensitivity | Matter titles, document titles, task notes, or URLs reveal confidential facts | META-001–008 | Confidentiality breach even without file storage | Treat metadata as confidential; RBAC on all metadata; avoid over-descriptive titles |
| External storage permissions | Drive/SharePoint/OneDrive file is public even though Firmedware access is restricted | EXT-001–008 | Unauthorized access outside Firmedware | Permission confirmation; external permission review checklist; periodic link audit |
| Backup / restore | Backup missing, corrupted, unencrypted, or restored to wrong environment | BKP-001–010 | Data loss or confidentiality breach | Encrypted pg_dump; restore testing; backup access control |
| Admin misconfiguration | Admin accidentally grants broad access, weak settings, or wrong default workflow | ADMIN-001–010 | Firm-wide exposure or workflow failure | Admin review checklist; activity logs; least-privilege defaults |
| Legal hold / retention | Archived/deleted data conflicts with retention, litigation hold, or firm policy | RET-001–008 | Evidence loss, compliance issue, client dispute | Retention playbook; no hard delete by default; admin-only archive review |

## Severity × priority

| Priority | Meaning | Example failure modes |
| --- | --- | --- |
| **P0** | Block production | RBAC leak, XSS, immutable log broken, lockout bypass |
| **P1** | Fix before go-live scale | Timezone bugs, workflow default broken, Thai search gaps |
| **P2** | Schedule / manual | Layout overflow, perf at 10k rows, emoji tags |

## Failure symptom catalog

| Symptom | What to look for | Test IDs |
| --- | --- | --- |
| Permission leak | Non-admin sees record ID in list, search, API JSON, or different 403 vs 404 | RBAC-*, CLI-*, SRCH-009 |
| Silent data loss | Archive removes FK children incorrectly | ARCH-012, DB-008 |
| Audit failure | ActivityLog row changed/deleted | ACT-011–013 |
| Credential leak | passwordHash or AUTH_SECRET in CSV/UI/error | CSV-006, AUTH-013 |
| SSRF / document fetch | Server HTTP to Drive/SharePoint on doc create | DOC-025 |
| CSV formula injection | Excel executes formula from activity export | CSV-010 |
| Stale JWT | Deactivated user still mutates | AUTH-011 |
| Split deployment | Two locals think they share data | DEP-015 |
| Metadata breach | User cannot open file but can see revealing document title, matter title, or task note | META-001, SRCH-009, DOC-020 |
| External permission mismatch | Firmedware blocks user, but Google Drive/SharePoint link opens publicly | EXT-001–004 |
| Backup confidentiality leak | pg_dump, CSV export, or screenshots committed to GitHub or stored unencrypted | BKP-003, DEP-014 |
| Admin over-permissioning | New user added to wrong group and gets too many matters | ADMIN-001, RBAC-010–014 |
| Retention conflict | Matter archived but backup/export still contains sensitive data without documented retention policy | RET-001–008 |

## Coverage summary

- Total edge cases: **322**
- P0 cases: **142**
