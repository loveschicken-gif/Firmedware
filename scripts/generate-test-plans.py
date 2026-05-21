#!/usr/bin/env python3
"""Generate Firmedware test plan markdown (run from repo root)."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"


def case(
    tid: str,
    module: str,
    risk: str,
    persona: str,
    pre: str,
    steps: str,
    expected: str,
    failure: str,
    priority: str,
    auto: str,
) -> dict:
    return dict(
        id=tid,
        module=module,
        risk=risk,
        persona=persona,
        pre=pre,
        steps=steps,
        expected=expected,
        failure=failure,
        priority=priority,
        auto=auto,
    )


def bulk(module: str, risk: str, persona: str, pre: str, rows: list[tuple]) -> list[dict]:
    out = []
    for r in rows:
        tid, steps, expected, failure, priority, auto = r
        out.append(case(tid, module, risk, persona, pre, steps, expected, failure, priority, auto))
    return out


def all_cases() -> list[dict]:
    c: list[dict] = []
    pre_auth = "Docker or local dev DB; FirmSettings defaults; seed admin exists"
    c += bulk(
        "Authentication",
        "Auth / session",
        "Anonymous / DevOps / Lawyer",
        pre_auth,
        [
            ("AUTH-001", "Fail login until threshold exceeded; retry with correct password during lockout; retry after lockout window", "Generic invalid-credentials only; lockout enforced; counter resets on success", "Unlimited attempts; lockout bypass; user enumeration via different errors", "P0", "integration"),
            ("AUTH-002", "Login as user with active=false", "Rejected; AUTH activity logged; no JWT", "Inactive user session created", "P0", "integration"),
            ("AUTH-003", "Login user only deactivated (no hard delete)", "Same as AUTH-002", "Deleted user still authenticates", "P1", "integration"),
            ("AUTH-004", "Login with email differing only by case from stored email", "Consistent behavior (match or safe fail with generic error)", "Wrong account match or duplicate sessions", "P1", "unit"),
            ("AUTH-005", "Login with padded spaces in email field", "Trim/reject; no crash", "Accidental account creation or wrong binding", "P1", "unit"),
            ("AUTH-006", "Login with 500+ char email", "Safe validation rejection", "500/DB error", "P2", "manual"),
            ("AUTH-007", "Email `admin' OR '1'='1`", "Safe failure; no SQL leak in response", "SQLi or auth bypass", "P0", "integration"),
            ("AUTH-008", "Email with emoji / non-Latin local-part", "Reject or no match safely", "Crash or unexpected match", "P2", "manual"),
            ("AUTH-009", "Two sessions; change password in A; submit in B", "B invalidated or must re-auth; no silent continue", "Stale password session indefinitely", "P1", "E2E"),
            ("AUTH-010", "Lawyer session; admin changes role to VIEWER; submit edit", "Server rejects mutation", "Stale JWT retains LAWYER writes", "P0", "integration"),
            ("AUTH-011", "Lawyer session; admin deactivates user; continue browsing", "Document known JWT gap; ideally block on next server action", "Deactivated user mutates records", "P0", "integration"),
            ("AUTH-012", "Expired/invalid session cookie; POST server action", "Redirect login; no mutation", "Unauthenticated write succeeds", "P0", "integration"),
            ("AUTH-013", "Start app with missing/invalid AUTH_SECRET", "Fail fast; no insecure sessions", "Weak/forged tokens accepted", "P0", "manual"),
            ("AUTH-014", "Run seed when User table non-empty", "No admin overwrite", "Second admin or password reset", "P0", "integration"),
            ("AUTH-015", "First boot seed with empty SEED_ADMIN_PASSWORD", "Reject or force change before prod (default changeme documented)", "Blank-password admin in production", "P0", "manual"),
        ],
    )

    pre_rbac = "Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3"
    c += bulk(
        "RBAC",
        "Permission leakage",
        "Lawyer / Staff / Viewer / Admin",
        pre_rbac,
        [
            ("RBAC-001", "Open /matters/{M2}", "404/redirect; no data", "Matter body or metadata exposed", "P0", "integration"),
            ("RBAC-002", "Open /clients/{hidden} direct URL", "Blocked for non-admin", "Client PII visible", "P0", "integration"),
            ("RBAC-003", "Viewer POST create/update/archive/export", "All rejected server-side", "Viewer mutates data", "P0", "integration"),
            ("RBAC-004", "Lawyer GET /admin/users", "Redirect/403", "User admin reachable", "P0", "E2E"),
            ("RBAC-005", "Lawyer GET /admin/groups", "Blocked", "Group admin exposed", "P0", "E2E"),
            ("RBAC-006", "Lawyer GET /admin/settings", "Blocked", "Settings changed", "P0", "E2E"),
            ("RBAC-007", "Lawyer GET /admin/security", "Blocked", "Security settings changed", "P0", "E2E"),
            ("RBAC-008", "Lawyer GET /admin/workflow-statuses", "Blocked", "Workflow CRUD exposed", "P1", "E2E"),
            ("RBAC-009", "Lawyer GET /activity firm-wide", "Blocked", "Firm audit visible", "P0", "E2E"),
            ("RBAC-010", "Add user to G1; assign G1 to M1", "User gains M1 access", "Group assignment ignored", "P0", "integration"),
            ("RBAC-011", "Deactivate G1", "Group path access removed", "Inactive group still grants access", "P0", "integration"),
            ("RBAC-012", "Remove user from G1", "Group-based access removed if no direct assign", "Access persists incorrectly", "P0", "integration"),
            ("RBAC-013", "Remove MatterGroupAssignment", "Members lose group path access", "Access persists", "P0", "integration"),
            ("RBAC-014", "User direct+group on M1; remove one path", "Access remains via remaining path", "Premature loss or excess retention", "P0", "integration"),
            ("RBAC-015", "Archive M1", "Hidden from non-admin lists/search", "Archived matter visible", "P0", "integration"),
            ("RBAC-016", "Archive all matters under client", "Non-admin loses client", "Client still visible", "P0", "integration"),
            ("RBAC-017", "Search document on inaccessible matter", "No hit", "URL/title leaked in search", "P0", "integration"),
            ("RBAC-018", "Dashboard tasks for inaccessible matter", "Excluded", "Task counts leak", "P0", "integration"),
            ("RBAC-019", "Invoke server actions without UI (curl/form)", "RBAC enforced same as UI", "Direct action bypass", "P0", "integration"),
        ],
    )

    pre_cli = "Clients C0–C9 seeded per scenario in steps"
    cli_rows = [
        ("CLI-001", "C0 has no matters: list/detail/search as lawyer vs admin", "Admin sees; non-admin typically hidden", "Unexpected client exposure", "P1", "integration"),
        ("CLI-002", "C1 only archived matters", "Non-admin cannot see C1", "Client visible", "P0", "integration"),
        ("CLI-003", "C2 one visible + one hidden matter", "Client visible; only M-visible listed", "Hidden matter listed", "P0", "integration"),
        ("CLI-004", "C3 matter only via inactive group", "No access", "Access via dead group", "P0", "integration"),
        ("CLI-005", "C4 matter assigned to inactive user", "That user cannot access", "Inactive assignee retains access", "P1", "integration"),
        ("CLI-006", "Search hidden client displayName", "Zero results for lawyer", "Name appears in search", "P0", "integration"),
        ("CLI-007", "Direct /clients/{hiddenId}", "Blocked", "200 with PII", "P0", "integration"),
        ("CLI-008", "Admin archives all matters on C5", "Lawyer loses C5 visibility", "Client still visible", "P0", "integration"),
        ("CLI-009", "Document on C6 client-only link", "Visible only if client has accessible matter per documentWhereForUser", "Doc visible without matter access", "P1", "integration"),
        ("CLI-010", "Task on C7 without visible matter", "Task hidden from lawyer lists", "Task leaked on dashboard", "P1", "integration"),
    ]
    c += bulk("Client visibility", "Visibility", "Lawyer / Admin", pre_cli, cli_rows)

    wf_rows = [
        ("WF-001", "Deactivate current default MATTER status", "Another default promoted or create blocked with message", "Matters without status / crash", "P1", "integration"),
        ("WF-002", "Set two defaults for MATTER entity type", "Second default rejected or first unset", "Two defaults active", "P0", "integration"),
        ("WF-003", "Create status name duplicate slug", "Validation error", "Duplicate rows", "P1", "integration"),
        ("WF-004", "Empty labelTh/labelEn", "Validation error", "Blank labels in UI", "P1", "integration"),
        ("WF-005", "Label >2000 chars", "Reject or truncate safely", "UI/DB break", "P2", "manual"),
        ("WF-006", "Emoji in labels", "Render stored UTF-8", "Mojibake/crash", "P2", "manual"),
        ("WF-007", "Mark status final; lawyer edits matter in that status", "Consistent firm policy (allow read-only or block)", "Closed matter silently reopened", "P1", "integration"),
        ("WF-008", "Matter uses inactive statusId", "Badge fallback label", "Broken select", "P1", "integration"),
        ("WF-009", "Deactivate all defaults; create matter", "Clear error or auto-pick", "Uncaught exception", "P1", "integration"),
        ("WF-010", "Two statuses same sortOrder", "Stable ordering", "Unstable admin list", "P2", "manual"),
        ("WF-011", "Switch UI to en with only th label populated", "Fallback en/th via i18n", "Raw key shown", "P1", "integration"),
        ("WF-012", "CONTRACT workflow rows exist", "No broken /contracts routes in nav", "404 loops in admin", "P2", "manual"),
    ]
    c += bulk("Workflow status", "Data integrity", "Admin / Lawyer", "Admin session; seeded workflow statuses", wf_rows)

    doc_rows = [
        ("DOC-001", "Create link `drive.google.com/...` without scheme", "Stored as https://…", "Invalid stored URL", "P1", "unit"),
        ("DOC-002", "Create `www.example.com/doc`", "https prefix added", "Rejected incorrectly", "P2", "unit"),
        ("DOC-003", "Google Drive URL + GOOGLE_DRIVE provider", "Saved; external open only", "Server fetch", "P1", "manual"),
        ("DOC-004", "OneDrive URL", "Saved metadata", "Fetch/proxy", "P2", "manual"),
        ("DOC-005", "SharePoint URL", "Saved metadata", "Fetch/proxy", "P2", "manual"),
        ("DOC-006", "Dropbox URL", "Saved metadata", "Fetch/proxy", "P2", "manual"),
        ("DOC-007", "LOCAL_FOLDER path `\\\\server\\share\\file`", "Accepted as metadata string", "Path traversal server-side N/A", "P1", "manual"),
        ("DOC-008", "URL `not a url`", "validation.urlInvalid", "500 error", "P0", "unit"),
        ("DOC-009", "URL `javascript:alert(1)`", "Rejected (verify URL scheme policy)", "XSS via href", "P0", "unit"),
        ("DOC-010", "URL `data:text/html,<script>`", "Rejected", "Inline content execution", "P0", "unit"),
        ("DOC-011", "URL `file:///etc/passwd`", "Rejected or blocked open", "Local file read UX", "P1", "unit"),
        ("DOC-012", "URL length >8KB", "Rejected", "DB error", "P2", "unit"),
        ("DOC-013", "URL with `?token=secret`", "Stored; no server outbound call", "Token logged in server fetch", "P0", "integration"),
        ("DOC-014", "Duplicate title+URL on same matter", "Allowed duplicate or clear UX", "Silent overwrite", "P2", "manual"),
        ("DOC-015", "provider OTHER, empty providerLabel", "providerNameRequired", "Saved incomplete", "P1", "unit"),
        ("DOC-016", "providerLabel `<img onerror=alert(1)>`", "Escaped text in HTML", "Stored XSS", "P0", "integration"),
        ("DOC-017", "title `<script>alert(1)</script>`", "Escaped", "XSS", "P0", "integration"),
        ("DOC-018", "notes XSS payload", "Escaped", "XSS", "P0", "integration"),
        ("DOC-019", "Submit create without permissionConfirmed checkbox", "permissionConfirmRequired when setting true", "Link saved without confirm", "P0", "integration"),
        ("DOC-020", "Open /documents/{id} for inaccessible matter", "Blocked", "Metadata visible", "P0", "integration"),
        ("DOC-021", "Document matterId null, clientId set", "RBAC via client matters", "Leak to unassigned lawyer", "P1", "integration"),
        ("DOC-022", "Document on archived matter", "Hidden from lawyer", "Still listed", "P0", "integration"),
        ("DOC-023", "POST sensitivity INVALID", "Zod reject", "Wrong enum in DB", "P1", "unit"),
        ("DOC-024", "Click open document", "target=_blank external; no iframe embed", "Proxied content in app", "P0", "manual"),
        ("DOC-025", "tcpdump during create/view doc", "No HTTP to drive/sharepoint host from server", "SSRF/fetch", "P0", "integration"),
    ]
    c += bulk("Document links", "XSS / SSRF / RBAC", "Lawyer", "requireDocumentPermissionConfirm=true unless noted", doc_rows)

    srch_rows = [
        ("SRCH-001", "GET /search?q= empty", "Empty state; no error", "Crash", "P2", "integration"),
        ("SRCH-002", "q= 5000 chars", "Safe truncate/reject", "Timeout/500", "P2", "manual"),
        ("SRCH-003", "q= Thai client name", "Matching client if RBAC allows", "No Thai match", "P0", "integration"),
        ("SRCH-004", "q= English matter title", "Match within RBAC", "Leak hidden matter", "P0", "integration"),
        ("SRCH-005", "q= mixed Thai+English", "Reasonable contains match", "Encoding failure", "P1", "integration"),
        ("SRCH-006", "q= case number with / and -", "Match matter fields", "Regex blow-up", "P1", "integration"),
        ("SRCH-007", "q= `'; DROP TABLE--`", "No SQL error", "Injection", "P0", "integration"),
        ("SRCH-008", "q= `<script>alert(1)</script>`", "No reflection XSS", "XSS", "P0", "integration"),
        ("SRCH-009", "Lawyer searches unassigned matter title", "No results", "Title hit", "P0", "integration"),
        ("SRCH-010", "Search archived matter name as admin vs lawyer", "Admin may see; lawyer not", "Lawyer sees archived", "P0", "integration"),
        ("SRCH-011", "Search archived document title", "Excluded for non-admin", "Leak", "P0", "integration"),
        ("SRCH-012", "enableEntityNotes=false; search note text", "Notes may still match in DB—document behavior", "Unexpected note leak in UI", "P1", "integration"),
        ("SRCH-013", "Search tag name attached to entity", "Match via relation", "Standalone tag search missing is OK", "P2", "manual"),
        ("SRCH-014", "Search highly confidential doc title", "RBAC before sensitivity display", "Leak", "P1", "integration"),
        ("SRCH-015", "If pagination exists, page 2", "RBAC consistent", "Page 2 bypass", "P2", "manual"),
        ("SRCH-016", "10k records seed; search common term", "Completes <5s dev baseline", "Timeout", "P2", "manual"),
    ]
    c += bulk("Search", "Injection / RBAC", "Lawyer / Admin", "globalSearch limit 20/section", srch_rows)

    task_rows = [
        ("TASK-001", "Create task matterId empty clientId set", "Allowed if validation permits", "Orphan task", "P1", "integration"),
        ("TASK-002", "Task clientId only", "Visible per task filters", "Hidden task wrong", "P1", "integration"),
        ("TASK-003", "Task on archived matter", "Hidden", "Shown overdue", "P0", "integration"),
        ("TASK-004", "Assignee inactive user", "Policy: reject or keep historical", "Active assignment to inactive", "P1", "integration"),
        ("TASK-005", "dueDate yesterday", "Appears in overdue filter", "Missing from overdue", "P1", "integration"),
        ("TASK-006", "dueDate year 2099", "Accepted", "DB error", "P2", "manual"),
        ("TASK-007", "dueDate UTC boundary Asia/Bangkok", "Correct calendar day in firm TZ", "Off-by-one day", "P1", "integration"),
        ("TASK-008", "dueDate midnight local", "Stable grouping", "Duplicate overdue", "P2", "manual"),
        ("TASK-009", "Firm timezone Asia/Bangkok default", "Week filter uses firm TZ", "UTC-only drift", "P1", "unit"),
        ("TASK-010", "Set sprintWeekStart manually valid ISO date", "Stored; week bucket correct", "Invalid bucket", "P1", "unit"),
        ("TASK-011", "sprintWeekStart garbage string", "Validation error", "Crash", "P1", "unit"),
        ("TASK-012", "status INVALID enum via tampered form", "Rejected", "Bad enum in DB", "P1", "unit"),
        ("TASK-013", "Viewer changes task status", "Rejected", "Status changed", "P0", "integration"),
        ("TASK-014", "Staff assigns task to user without matter access", "Rejected or warning", "Assignee sees inaccessible task", "P1", "integration"),
        ("TASK-015", "Archive matter; check overdue counts", "Counts decrease", "Stale overdue", "P0", "integration"),
        ("TASK-016", "deadlineType 500 chars", "Accept or reject per schema", "Truncation corruption", "P2", "manual"),
        ("TASK-017", "deadlineType Thai text", "Stored UTF-8", "Mojibake", "P1", "manual"),
    ]
    c += bulk("Tasks", "RBAC / timezone", "Lawyer / Staff / Viewer", "Firm timezone Asia/Bangkok", task_rows)

    tag_rows = [
        ("TAG-001", "Create tag name Urgent twice", "Unique constraint error UX", "Duplicate silent", "P1", "integration"),
        ("TAG-002", "Create tags `urgent` and `Urgent`", "Case sensitivity per DB collation", "Unintended duplicate", "P2", "integration"),
        ("TAG-003", "Thai tag name", "Stored/displayed", "Encoding issue", "P1", "manual"),
        ("TAG-004", "Emoji tag name", "Stored or rejected", "Crash", "P2", "manual"),
        ("TAG-005", "Tag name 256+ chars", "Validation", "DB error", "P2", "manual"),
        ("TAG-006", "color `#ZZZZZZ`", "Reject invalid", "Broken CSS", "P1", "unit"),
        ("TAG-007", "Tag on archived matter", "Still on record; matter hidden", "Tag admin breaks", "P2", "manual"),
        ("TAG-008", "Archive tag in use", "No UI delete—document gap; records keep tagId", "Orphan UI", "P2", "manual"),
        ("TAG-009", "Lawyer opens /tags", "Blocked (admin-only page)", "Tag CRUD for lawyer", "P0", "E2E"),
        ("TAG-010", "Search by archived tag name", "No spurious hits", "Leak", "P2", "manual"),
    ]
    c += bulk("Tags", "Data integrity", "Admin / Lawyer", "Admin /tags route", tag_rows)

    arch_rows = [
        ("ARCH-001", "Archive client with active matters", "Soft delete client; matters policy consistent", "FK violation", "P1", "integration"),
        ("ARCH-002", "Archive matter with open tasks", "Tasks hidden/archived cascade per rules", "Orphan visible tasks", "P0", "integration"),
        ("ARCH-003", "Archive matter with documents", "Docs hidden from lawyer", "Docs visible", "P0", "integration"),
        ("ARCH-004", "Archive document link", "Excluded from lists", "Still searchable", "P0", "integration"),
        ("ARCH-005", "Archive tag (if implemented)", "Records retain relation", "Crash", "P2", "manual"),
        ("ARCH-006", "Deactivate group with matter assignments", "Access revoked", "Stale access", "P0", "integration"),
        ("ARCH-007", "Deactivate workflow status in use", "Matters keep statusId; badge works", "Create matter fails globally", "P1", "integration"),
        ("ARCH-008", "Restore archived record if supported", "N/A v1.2—verify no restore button leaks", "Accidental restore", "P2", "manual"),
        ("ARCH-009", "Attempt hard delete via tampered action", "Rejected", "Row gone", "P0", "integration"),
        ("ARCH-010", "Lists/search/dashboard exclude archived", "Consistent filters notDeleted", "Ghost records", "P0", "integration"),
        ("ARCH-011", "Archive client; activity log entry", "DELETE/archived summary append-only", "No log", "P1", "integration"),
        ("ARCH-012", "Archive matter; FK integrity", "No orphan violations", "DB constraint error", "P0", "integration"),
    ]
    c += bulk("Archive / soft delete", "Data integrity", "Admin / Lawyer", "deletedAt soft delete pattern", arch_rows)

    act_rows = [
        ("ACT-001", "Create client", "CREATE DATA log", "Missing log", "P1", "integration"),
        ("ACT-002", "Update matter", "UPDATE log with diff metadata", "Missing log", "P1", "integration"),
        ("ACT-003", "Archive matter", "DELETE/archived log", "Wrong action", "P1", "integration"),
        ("ACT-004", "Open document external link", "DOCUMENT log if implemented", "Missing security trail", "P2", "integration"),
        ("ACT-005", "Successful login", "AUTH log", "Missing", "P1", "integration"),
        ("ACT-006", "Failed login", "AUTH log without password", "Password in metadata", "P0", "integration"),
        ("ACT-007", "Admin changes user role", "ADMIN log", "Missing", "P1", "integration"),
        ("ACT-008", "User changes password", "SECURITY/AUTH log", "Cleartext password logged", "P0", "integration"),
        ("ACT-009", "Admin CSV export", "Export action logged", "No log", "P1", "integration"),
        ("ACT-010", "Lawyer GET /api/activity/export firm-wide", "403", "Full firm CSV", "P0", "integration"),
        ("ACT-011", "Prisma activityLog.update via script", "App path N/A; DB trigger blocks", "Row changed", "P0", "integration"),
        ("ACT-012", "Prisma activityLog.delete", "Trigger exception", "Row deleted", "P0", "integration"),
        ("ACT-013", "SQL UPDATE ActivityLog", "Trigger raises", "Immutable broken", "P0", "integration"),
        ("ACT-014", "Deactivate user; old logs", "actorName/actorEmail snapshot preserved", "Logs blanked", "P1", "integration"),
        ("ACT-015", "Large note in metadata", "Truncated/summary only", "Full privileged text stored", "P0", "integration"),
        ("ACT-016", "Log entity deleted", "Graceful display", "Crash", "P2", "integration"),
        ("ACT-017", "Log entity archived", "Still readable", "500 on timeline", "P2", "integration"),
        ("ACT-018", "Export 10000 rows", "Completes; CSV valid", "OOM/timeout", "P2", "manual"),
    ]
    c += bulk("Activity log", "Audit / immutability", "Admin / Lawyer / DevOps", "Migration 20260522100000_immutable_activity_log", act_rows)

    i18n_rows = [
        ("I18N-001", "Switch EN→TH via header", "UI Thai", "Mixed stale", "P1", "E2E"),
        ("I18N-002", "Switch TH→EN", "UI English", "Missing keys", "P1", "E2E"),
        ("I18N-003", "Remove key from th json temporarily", "Fallback en", "Raw key", "P2", "unit"),
        ("I18N-004", "Status missing labelTh", "Shows labelEn or fallback", "Blank badge", "P1", "integration"),
        ("I18N-005", "Status missing labelEn", "Shows labelTh", "Blank", "P1", "integration"),
        ("I18N-006", "Long Thai workflow label", "Layout ok", "Overflow break nav", "P2", "manual"),
        ("I18N-007", "Thai client displayName", "Correct UTF-8", "???", "P0", "integration"),
        ("I18N-008", "Thai matter title search", "Finds record", "No match", "P0", "integration"),
        ("I18N-009", "Thai document title", "Detail page ok", "Corrupt", "P1", "manual"),
        ("I18N-010", "Thai task description", "Stored/rendered", "Corrupt", "P1", "manual"),
        ("I18N-011", "Thai search query", "SRCH-003 overlap", "No results", "P0", "integration"),
        ("I18N-012", "User pref en, firm default th, no cookie", "User pref wins", "Wrong locale", "P1", "integration"),
        ("I18N-013", "Refresh after locale change", "Cookie persists", "Reset to default", "P1", "E2E"),
        ("I18N-014", "Validation error in th locale", "Translated message", "English only leak", "P2", "integration"),
        ("I18N-015", "Sidebar with long Thai labels", "No horizontal scroll break", "Layout break", "P2", "manual"),
    ]
    c += bulk("i18n", "Localization", "All personas", "locales th/en", i18n_rows)

    firm_rows = [
        ("FIRM-001", "firmName empty string", "validation error", "Saved blank", "P1", "unit"),
        ("FIRM-002", "firmName 121 chars", "max 120 reject", "Truncated silently", "P2", "unit"),
        ("FIRM-003", "firmName Thai", "Saved UTF-8", "Corrupt", "P1", "integration"),
        ("FIRM-004", "timezone Invalid/Zone", "Reject", "Bad TZ crashes dates", "P1", "unit"),
        ("FIRM-005", "defaultLanguage `fr`", "Reject th|en only", "Saved invalid", "P1", "unit"),
        ("FIRM-006", "enableEntityNotes=false", "Notes fields hidden; search behavior documented", "Notes shown", "P1", "integration"),
        ("FIRM-007", "enableComments toggle", "Placeholder only; no crash", "Broken route", "P2", "manual"),
        ("FIRM-008", "Lawyer update firm settings action", "Rejected", "Settings changed", "P0", "integration"),
        ("FIRM-009", "Admin update firm name", "ADMIN/DATA activity logged", "No audit", "P2", "integration"),
        ("FIRM-010", "Two admins rapid double submit", "Last write wins; no corrupt row", "Corrupt FirmSettings", "P2", "manual"),
    ]
    c += bulk("Firm settings", "Validation / authz", "Admin / Lawyer", "FirmSettings singleton", firm_rows)

    sec_rows = [
        ("SEC-001", "failedLoginLockoutThreshold=1", "Lock after 1 fail", "Too aggressive UX only", "P2", "integration"),
        ("SEC-002", "threshold=50", "Accepted bound", "Rejected valid", "P2", "unit"),
        ("SEC-003", "session timeout field if present—else document N/A", "N/A or validate", "—", "P2", "manual"),
        ("SEC-004", "password min length invalid negative", "Reject", "Saved", "P2", "manual"),
        ("SEC-005", "Change min length after users exist", "Existing users not forced until change password", "Mass lockout", "P2", "manual"),
        ("SEC-006", "allowed email domains empty", "All domains allowed", "Unexpected lockout", "P2", "manual"),
        ("SEC-007", "allowed email domains malformed", "Validation error", "Saved bad pattern", "P2", "manual"),
        ("SEC-008", "Lawyer update security settings", "Blocked", "Lockout disabled", "P0", "integration"),
        ("SEC-009", "Admin update lockout", "SECURITY/ADMIN log", "No audit", "P2", "integration"),
        ("SEC-010", "Failed login unknown vs known email", "Same generic UI message", "User enumeration", "P0", "integration"),
    ]
    c += bulk("Security settings", "Auth policy", "Admin / Anonymous", "FirmSettings security fields", sec_rows)

    csv_rows = [
        ("CSV-001", "Admin export /api/activity/export", "200 CSV", "403", "P0", "integration"),
        ("CSV-002", "Lawyer firm-wide export", "403", "Full dump", "P0", "integration"),
        ("CSV-003", "Rows with Thai characters", "UTF-8 BOM optional; readable", "Mojibake", "P1", "integration"),
        ("CSV-004", "Metadata with commas quotes newlines", "RFC4180 escaping", "Broken columns", "P0", "unit"),
        ("CSV-005", "Export 10k rows", "Completes", "Timeout", "P2", "manual"),
        ("CSV-006", "Inspect CSV content", "No passwordHash AUTH_SECRET", "Secret leak", "P0", "integration"),
        ("CSV-007", "Lawyer scoped entity export", "Only assigned matter scope", "Extra rows", "P0", "integration"),
        ("CSV-008", "Export triggers activity log", "Logged", "No trail", "P1", "integration"),
        ("CSV-009", "Content-Disposition filename", "Safe alphanumeric name", "Path injection", "P1", "integration"),
        ("CSV-010", "Cell `=cmd|'/c calc'!A0`", "Escaped prefix tab or quote", "Formula injection", "P0", "unit"),
    ]
    c += bulk("CSV export", "Data exfiltration / injection", "Admin / Lawyer", "activity-export.ts", csv_rows)

    ai_rows = [
        ("AI-001", "AI connector DISABLED (default)", "No AI routes/responses", "Endpoint exists", "P0", "integration"),
        ("AI-002", "Public research mode with client PII prompt", "Blocked by policy (future)", "PII sent", "P0", "manual"),
        ("AI-003", "Privileged matter prompt", "Blocked default", "Leak", "P0", "manual"),
        ("AI-004", "External doc link in prompt", "Blocked default", "Fetch", "P0", "manual"),
        ("AI-005", "userConfirmation=false", "Blocked", "Runs anyway", "P0", "manual"),
        ("AI-006", "Missing provider", "Blocked", "Call made", "P0", "manual"),
        ("AI-007", "Invalid provider enum", "Blocked", "Call made", "P0", "manual"),
        ("AI-008", "No OPENAI_API_KEY in env required", "App starts without AI keys", "Startup fail", "P1", "manual"),
        ("AI-009", "Network capture on AI UI action", "No third-party HTTPS", "Outbound API", "P0", "manual"),
        ("AI-010", "Blocked request audit", "Metadata-only log if implemented", "Full prompt stored", "P1", "manual"),
        ("AI-011", "Privileged prompt logging", "Not stored", "Log leak", "P0", "manual"),
        ("AI-012", "AI cannot CREATE matter", "No mutation API", "Record created", "P0", "manual"),
        ("AI-013", "AI cannot DELETE", "No delete", "Archive via AI", "P0", "manual"),
        ("AI-014", "AI cannot export CSV", "No export path", "CSV download", "P0", "manual"),
        ("AI-015", "AI cannot fetch Drive link", "No SSRF", "Server fetch", "P0", "manual"),
    ]
    c += bulk("AI connector (future)", "Data exfiltration", "Admin", "v1.2: no src AI—test docs/future stubs", ai_rows)

    bill_rows = [
        ("BILL-001", "Invoice clientId only matter null", "Allowed when billing on", "Validation fail", "P1", "integration"),
        ("BILL-002", "Billing on archived matter", "Hidden", "Visible", "P0", "integration"),
        ("BILL-003", "amount -100", "Rejected", "Negative stored", "P0", "unit"),
        ("BILL-004", "amount 0", "Rejected positive constraint", "Zero stored", "P1", "unit"),
        ("BILL-005", "amount 1e12", "Reject or decimal limit", "Overflow", "P2", "unit"),
        ("BILL-006", "currency INVALID", "Reject", "Bad currency", "P2", "unit"),
        ("BILL-007", "currency THB default display", "Shows ฿ or THB label", "Wrong default", "P2", "manual"),
        ("BILL-008", "paidAt before issueDate", "Validation warning/error", "Accepted illogical", "P1", "unit"),
        ("BILL-009", "dueDate before issueDate", "Validation", "Accepted", "P1", "unit"),
        ("BILL-010", "status OVERDUE past due", "Dashboard overdue count", "Wrong count", "P1", "integration"),
        ("BILL-011", "Viewer edits payment status", "Blocked", "Status changed", "P0", "integration"),
        ("BILL-012", "Lawyer billing on inaccessible matter", "Blocked", "Record visible", "P0", "integration"),
        ("BILL-013", "externalInvoiceLink javascript:", "URL validation rejects", "XSS", "P0", "unit"),
        ("BILL-014", "Billing CSV export", "Admin-only if exists", "Lawyer export", "P1", "manual"),
        ("BILL-015", "Billing disclaimer visible", "Metadata only; no tax advice", "Misleading claims", "P2", "manual"),
    ]
    c += bulk("Billing", "RBAC / validation", "Lawyer / Viewer", "enableBilling=true", bill_rows)

    dep_rows = [
        ("DEP-001", "DATABASE_URL missing", "Startup error clear", "Silent sqlite fallback", "P0", "manual"),
        ("DEP-002", "DATABASE_URL wrong host", "Connection error", "Hang forever", "P1", "manual"),
        ("DEP-003", "AUTH_SECRET missing", "Auth failure", "Insecure default", "P0", "manual"),
        ("DEP-004", "AUTH_SECRET short guessable", "Document rotate; sessions weak", "Forge tokens", "P0", "manual"),
        ("DEP-005", "AUTH_URL missing", "Auth callback issues", "OAuth loop", "P1", "manual"),
        ("DEP-006", "AUTH_URL mismatch deployment", "Login redirect wrong host", "Open redirect", "P1", "manual"),
        ("DEP-007", "Postgres stopped", "500 with safe message", "Stack trace to user", "P1", "manual"),
        ("DEP-008", "Migrations not applied", "Prisma error on query", "Partial schema", "P0", "manual"),
        ("DEP-009", "Stale Prisma client", "Type/runtime errors after pull", "Silent wrong queries", "P2", "manual"),
        ("DEP-010", "Docker volume removed", "Empty DB on restart", "Data loss without warning", "P1", "manual"),
        ("DEP-011", "pg_dump fails (disk full)", "Non-zero exit", "False success backup", "P2", "manual"),
        ("DEP-012", "Restore dump to fresh DB", "App works; seed idempotent", "Constraint errors", "P1", "manual"),
        ("DEP-013", "Production still uses changeme seed password", "Manual checklist fail", "Compromise", "P0", "manual"),
        ("DEP-014", ".env in git status", "Docs warn; gitignore blocks", "Secret in repo", "P0", "manual"),
        ("DEP-015", "Two laptops local install", "Separate DBs; no sync", "Users expect merge", "P1", "manual"),
    ]
    c += bulk("Deployment", "Availability / secrets", "DevOps", "Docker compose docs", dep_rows)

    ui_rows = [
        ("UI-001", "Refresh after POST create client", "No duplicate client", "Double record", "P1", "E2E"),
        ("UI-002", "Double-click submit", "Single record", "Duplicates", "P1", "E2E"),
        ("UI-003", "Back after archive", "Not found or list without record", "Resubmit archive", "P2", "E2E"),
        ("UI-004", "Two tabs edit same matter", "Last write wins or conflict message", "Corrupt merge", "P2", "E2E"),
        ("UI-005", "Throttle network slow 3G", "Loading states; no partial secret leak", "Broken UI", "P2", "manual"),
        ("UI-006", "Invalid form fields", "Inline validation", "500", "P1", "E2E"),
        ("UI-007", "Mobile width 375px", "Nav usable", "Overflow hidden actions", "P2", "manual"),
        ("UI-008", "Table 50+ columns/long text", "Truncate/wrap", "Layout break", "P2", "manual"),
        ("UI-009", "Empty client list lawyer", "Empty state copy", "Blank crash", "P2", "E2E"),
        ("UI-010", "Loading skeleton/spinner", "Shows during fetch", "Flash of wrong content", "P2", "manual"),
        ("UI-011", "Throw error in server component", "Error boundary", "White screen", "P2", "manual"),
        ("UI-012", "Hidden matter URL vs random UUID", "Same 404/redirect (no existence leak)", "403 vs 404 reveals ID valid", "P1", "integration"),
    ]
    c += bulk("Browser / UI", "UX / info disclosure", "Lawyer", "Playwright optional", ui_rows)

    db_rows = [
        ("DB-001", "Create matter without clientId", "DB/Prisma reject", "Orphan matter", "P0", "integration"),
        ("DB-002", "DocumentLink without clientId", "Reject", "Orphan doc", "P0", "integration"),
        ("DB-003", "Duplicate MatterAssignment", "Unique violation", "Duplicate row", "P0", "integration"),
        ("DB-004", "Duplicate MatterGroupAssignment", "Unique violation", "Duplicate", "P0", "integration"),
        ("DB-005", "Duplicate user email", "Unique violation", "Two users", "P0", "integration"),
        ("DB-006", "Duplicate tag name", "Unique violation", "Duplicates", "P1", "integration"),
        ("DB-007", "Two default workflow statuses", "App enforces single default", "Two defaults", "P0", "integration"),
        ("DB-008", "Delete client with matters", "Restrict or soft cascade per schema", "FK error uncaught", "P1", "integration"),
        ("DB-009", "ActivityLog UPDATE", "Trigger block", "Mutable log", "P0", "integration"),
        ("DB-010", "Billing amount decimal precision", "Correct scale 2", "Rounding bug", "P2", "unit"),
        ("DB-011", "Dates stored UTC display Bangkok", "Consistent", "Off-by-one", "P1", "integration"),
        ("DB-012", "Run seed twice", "Idempotent tags/settings", "Duplicate admins", "P0", "integration"),
    ]
    c += bulk("Database integrity", "Constraints", "DevOps", "prisma/schema.prisma", db_rows)

    th_rows = [
        ("TH-001", "Client INDIVIDUAL long Thai name", "UTF-8 OK", "Truncation", "P1", "manual"),
        ("TH-002", "Client COMPANY with บจก./หจก.", "Displayed", "Garbled", "P1", "manual"),
        ("TH-003", "Matter title with ศาล/สำนักงาน", "Searchable", "No match", "P1", "integration"),
        ("TH-004", "Thai document title", "Detail OK", "Corrupt", "P1", "manual"),
        ("TH-005", "Thai tags", "TAG-003", "—", "P1", "manual"),
        ("TH-006", "Thai deadlineType on task", "Stored", "—", "P1", "manual"),
        ("TH-007", "Thai workflow status seed labels", "Badge bilingual", "—", "P1", "integration"),
        ("TH-008", "Login confidentiality notice Thai", "Shown when enabled", "English only", "P2", "manual"),
        ("TH-009", "PDPA warning copy Thai", "Docs/template only", "—", "P2", "manual"),
        ("TH-010", "Mixed TH title EN notes", "Both render", "—", "P1", "manual"),
    ]
    c += bulk("Thai workflow", "Localization", "Lawyer", "Thailand pack templates", th_rows)

    pre_meta = "Firm training: treat all metadata as confidential; RBAC seeded"
    meta_rows = [
        ("META-001", "Create matter title with client name + claim strategy; lawyer without matter access searches", "No search/list/detail leak of title", "Hidden matter title visible in search or URL", "P0", "integration"),
        ("META-002", "Document title `Settlement offer 12M THB draft.pdf` on assigned matter; export activity CSV", "Title visible only to authorized users; CSV scoped", "Revealing title in export to wrong role", "P0", "integration"),
        ("META-003", "Task description with privileged communication summary", "Visible only via matter RBAC; not in global activity for non-admin", "Task note in firm-wide feed", "P0", "integration"),
        ("META-004", "Task deadlineType `ศาลนัดสืบพยาน 15 ส.ค.` visible on task list", "Same RBAC as task; no extra leak on dashboard", "Deadline text exposes case to unassigned user", "P1", "integration"),
        ("META-005", "Update matter with long confidential note; view activity timeline", "Summary redacted/truncated; no full privileged text in ActivityLog metadata", "Full note text in activity JSON/CSV", "P0", "integration"),
        ("META-006", "Search partial matter title as unassigned lawyer", "No snippet/hit (SRCH-009 alignment)", "Search result shows revealing substring", "P0", "integration"),
        ("META-007", "Inspect browser history, referrer, and exported CSV for raw `/matters/{uuid}` paths without context", "Paths alone do not expose titles; pairing with other leaks documented", "UUID + title in query string or CSV column combo enables inference", "P1", "manual"),
        ("META-008", "Admin exports activity CSV; verify matter/document titles in rows match RBAC scope", "No titles for matters user could not access in scoped export", "CSV rows include confidential titles from inaccessible matters", "P0", "integration"),
    ]
    c += bulk("Metadata sensitivity", "Confidentiality (metadata-only)", "Lawyer / Admin", pre_meta, meta_rows)

    pre_ext = "requireDocumentPermissionConfirm=true; docs/SETUP_PLAYBOOK §4"
    ext_rows = [
        ("EXT-001", "Save Google Drive link known to be “Anyone with the link”; open in incognito without firm login", "Firmedware stores metadata only; file may still be public—document in test report", "Firm assumes Firmedware access = file security", "P0", "manual"),
        ("EXT-002", "Save SharePoint link with broad org sharing; viewer without SP license opens link", "Link may open for org users even when Firmedware RBAC blocks", "Over-shared SP link undetected", "P1", "manual"),
        ("EXT-003", "Save Dropbox public link; verify opens without Dropbox firm account", "External public access despite internal restriction", "Same as EXT-001", "P1", "manual"),
        ("EXT-004", "LOCAL_FOLDER path to `\\\\fileserver\\matter\\doc` from lawyer laptop without VPN", "Link saved; open fails or wrong share—user understands limit", "False confidence in access", "P1", "manual"),
        ("EXT-005", "Assigned lawyer copies external URL; paste to personal email (process review)", "Firm policy violation outside app scope; activity may log open not copy", "No technical block—training required", "P2", "manual"),
        ("EXT-006", "Tamper form: omit permissionConfirmed while setting true in FirmSettings", "Server rejects create/update (DOC-019)", "Link saved without confirmation", "P0", "integration"),
        ("EXT-007", "Review firm playbook: quarterly external link permission audit checklist exists", "Checklist documented in SETUP_PLAYBOOK or internal wiki", "No periodic review process", "P1", "manual"),
        ("EXT-008", "Read Admin → Security + document form helper text", "Clear warning: Firmedware does not enforce Drive/SP/OneDrive/Dropbox ACLs", "UI implies app controls external file permissions", "P0", "manual"),
    ]
    c += bulk("External storage permissions", "Third-party ACL mismatch", "Lawyer / Admin", pre_ext, ext_rows)

    pre_bkp = "Production-like Postgres; firm backup policy documented"
    bkp_rows = [
        ("BKP-001", "Run `pg_dump` against production DB container", "Non-zero success; file size >0", "Backup script fails silently", "P0", "manual"),
        ("BKP-002", "Store dump on encrypted volume or restricted share; verify permissions", "Only admin/IT OS accounts can read", "World-readable backup file", "P0", "manual"),
        ("BKP-003", "Restore dump to fresh DB; run smoke test login + matter list", "App functional; row counts match", "Restore never tested; corruption found in crisis", "P0", "manual"),
        ("BKP-004", "`git status` after backup job; confirm dumps in .gitignore", "No `.sql`/dump staged", "Backup committed to GitHub", "P0", "manual"),
        ("BKP-005", "Inspect backup file for `.env`, connection strings, or seed passwords", "Only DB content; secrets not embedded in dump path readme", "AUTH_SECRET pasted into backup folder README", "P0", "manual"),
        ("BKP-006", "Restore production dump to developer laptop by mistake", "Procedure prevents or scrubs after test", "Prod client data on unsecured laptop", "P0", "manual"),
        ("BKP-007", "Attempt restore from 90-day-old backup after migration", "Document stale schema risk; test or reject", "Wrong schema/data loss", "P1", "manual"),
        ("BKP-008", "Simulate missing scheduled backup (monitoring alert)", "Alert fires; runbook exists", "Silent no-backup", "P0", "manual"),
        ("BKP-009", "Truncate/corrupt dump file; run restore", "Restore fails cleanly with error", "Partial corrupt DB accepted", "P1", "manual"),
        ("BKP-010", "Non-admin user attempts read backup share", "OS/filesystem denies", "Lawyer downloads full firm dump", "P0", "manual"),
    ]
    c += bulk("Backup / restore", "Availability / confidentiality", "DevOps / Admin", pre_bkp, bkp_rows)

    pre_admin = "Admin account; sample users/groups"
    admin_rows = [
        ("ADMIN-001", "Add lawyer to Litigation group also assigned to all open matters", "Review matter list—only intended matters visible", "User sees entire firm caseload", "P0", "manual"),
        ("ADMIN-002", "Promote VIEWER to LAWYER by mistake; viewer refreshes session", "Writes blocked until re-login; activity logs role change", "Viewer edits after role change without audit", "P0", "integration"),
        ("ADMIN-003", "Departed employee: admin forgets deactivate for 30 days", "Account still logs in (AUTH-002 if deactivated); process audit", "Stale active account", "P0", "manual"),
        ("ADMIN-004", "Set minimal lockout/password guidance; weak user passwords allowed", "Document firm policy; optional future min length enforcement", "Trivial passwords firm-wide", "P1", "manual"),
        ("ADMIN-005", "Disable requireDocumentPermissionConfirm in Admin → Security", "Allowed only with conscious admin action; EXT-008 warning still visible", "Links saved without user acknowledgment", "P0", "integration"),
        ("ADMIN-006", "Bulk deactivate wrong workflow status used by open matters", "Matters retain statusId; badge fallback; no data loss", "Open matters untrackable", "P1", "integration"),
        ("ADMIN-007", "Export activity CSV; save to personal Downloads without encryption", "Process review—export logged (CSV-008); firm policy on storage", "CSV on unsecured personal device", "P1", "manual"),
        ("ADMIN-008", "SEED_ADMIN_EMAIL=gmail personal on production", "Document risk; use firm-owned mailbox", "Account recovery/lost employee risk", "P1", "manual"),
        ("ADMIN-009", "Two lawyers share admin password (process)", "Discouraged in docs; per-user accounts", "No attribution in logs", "P0", "manual"),
        ("ADMIN-010", "Production login still uses changeme (DEP-013)", "Block go-live until changed", "Trivial admin compromise", "P0", "manual"),
    ]
    c += bulk("Admin misconfiguration", "Operational error", "Admin", pre_admin, admin_rows)

    pre_ret = "Matter M archived; docs/SECURITY.md retention notes"
    ret_rows = [
        ("RET-001", "Archive matter; query DB directly", "Row remains with deletedAt set", "Hard delete removed evidence", "P0", "integration"),
        ("RET-002", "Archived matter absent from lawyer list/search/dashboard", "Hidden per ARCH-010", "Still in active lists", "P0", "integration"),
        ("RET-003", "Archive matter; view activity history", "Prior ActivityLog rows unchanged (immutable)", "Logs deleted with archive", "P0", "integration"),
        ("RET-004", "Attempt hard delete matter via UI/API", "Only soft delete available", "Purge button removes row", "P0", "integration"),
        ("RET-005", "pg_dump after archive", "Backup still contains archived rows", "Firm understands backups retain archived data", "P1", "manual"),
        ("RET-006", "Firm retention period documented in playbook/internal policy", "Written retention for metadata + backups", "No documented retention", "P1", "manual"),
        ("RET-007", "Litigation hold: docs warn Firmedware has no legal-hold automation", "SECURITY.md / playbook explicit", "Firm assumes hold flag exists", "P1", "manual"),
        ("RET-008", "CSV export + backup retention periods noted for firm", "Export files and dumps have defined destroy date", "Indefinite uncontrolled copies", "P1", "manual"),
    ]
    c += bulk("Retention / legal hold", "Compliance / evidence", "Admin / DevOps", pre_ret, ret_rows)

    return c


def render_case(c: dict) -> str:
    return (
        f"#### {c['id']}\n\n"
        "| Field | Detail |\n| --- | --- |\n"
        f"| **Test ID** | {c['id']} |\n"
        f"| **Module** | {c['module']} |\n"
        f"| **Risk type** | {c['risk']} |\n"
        f"| **Persona** | {c['persona']} |\n"
        f"| **Preconditions** | {c['pre']} |\n"
        f"| **Steps** | {c['steps']} |\n"
        f"| **Expected result** | {c['expected']} |\n"
        f"| **What failure would look like** | {c['failure']} |\n"
        f"| **Priority** | {c['priority']} |\n"
        f"| **Suggested automated test type** | {c['auto']} |\n\n"
    )


SECTIONS = [
    ("A", "Authentication edge cases", "AUTH"),
    ("B", "RBAC and permission leakage", "RBAC"),
    ("C", "Client visibility", "CLI"),
    ("D", "Matter workflow status", "WF"),
    ("E", "Document link", "DOC"),
    ("F", "Search", "SRCH"),
    ("G", "Tasks and deadlines", "TASK"),
    ("H", "Tags", "TAG"),
    ("I", "Soft delete / archive", "ARCH"),
    ("J", "Activity log", "ACT"),
    ("K", "i18n Thai–English", "I18N"),
    ("L", "Firm settings", "FIRM"),
    ("M", "Security settings", "SEC"),
    ("N", "CSV export", "CSV"),
    ("O", "AI connector disabled by default", "AI"),
    ("P", "Billing (when enabled)", "BILL"),
    ("Q", "Deployment and environment", "DEP"),
    ("R", "Browser / UI", "UI"),
    ("S", "Database / data integrity", "DB"),
    ("T", "Thai-law workflow", "TH"),
    ("U", "Metadata sensitivity (legal operations)", "META"),
    ("V", "External storage permission mismatch", "EXT"),
    ("W", "Backup and restore", "BKP"),
    ("X", "Admin misconfiguration", "ADMIN"),
    ("Y", "Retention and legal hold", "RET"),
]


def write_edge_plan(cases: list[dict]) -> None:
    by_prefix: dict[str, list[dict]] = {}
    for c in cases:
        prefix = c["id"].split("-")[0]
        by_prefix.setdefault(prefix, []).append(c)

    lines = [
        "# Firmedware edge-case test plan\n",
        "> **Version:** 1.2 · **Scope:** single-tenant metadata + external document links · **Status:** test design (not all automated yet)\n",
        "\nRigorous edge-case catalog for bugs, permission leaks, validation gaps, data corruption, UI failures, and security weaknesses—including **legal-operations risks** for metadata-only law firm software (confidential titles/notes, external DMS permission mismatch, backups, admin errors, retention). Aligns with codebase modules under `src/lib/` and operational docs. Firmedware does **not** certify compliance; tests support firm operational discipline.\n",
        "\n## How to use this document\n",
        "\n1. Run **P0 Must-Pass** before production (see end of doc).\n",
        "2. Map failures to [FAILURE_MODE_MATRIX.md](./FAILURE_MODE_MATRIX.md).\n",
        "3. Security-focused subset: [SECURITY_EDGE_CASES.md](./SECURITY_EDGE_CASES.md).\n",
        "4. Suggested automation stubs: `tests/*.test.ts` (listed at end; implement when requested).\n",
        "\n### Test case fields\n",
        "Each case includes: Test ID, Module, Risk type, Persona, Preconditions, Steps, Expected result, Failure symptom, Priority (P0/P1/P2), Suggested automated test type.\n",
        "\n### Known implementation notes (v1.2)\n",
        "- JWT may not re-check `user.active` on every request (test AUTH-011).\n",
        "- `LAWYER` and `STAFF` share identical permissions in code.\n",
        "- `defaultMatterVisibility` in schema is unused.\n",
        "- URL validator uses `URL()` — verify `javascript:` / `data:` blocking (DOC-009/010).\n",
        "- Search may include notes when `enableEntityNotes=false` (SRCH-012).\n",
        "- No AI connector in `src/` (section O = future / policy docs).\n",
        "- **Metadata is confidential:** titles, notes, and URLs can reveal facts without storing files (sections U–Y).\n",
        "- Firmedware **cannot enforce** Google Drive / SharePoint / OneDrive / Dropbox ACLs (section V).\n",
        "\n---\n",
    ]

    prefix_map = {
        "AUTH": "A",
        "RBAC": "B",
        "CLI": "C",
        "WF": "D",
        "DOC": "E",
        "SRCH": "F",
        "TASK": "G",
        "TAG": "H",
        "ARCH": "I",
        "ACT": "J",
        "I18N": "K",
        "FIRM": "L",
        "SEC": "M",
        "CSV": "N",
        "AI": "O",
        "BILL": "P",
        "DEP": "Q",
        "UI": "R",
        "DB": "S",
        "TH": "T",
        "META": "U",
        "EXT": "V",
        "BKP": "W",
        "ADMIN": "X",
        "RET": "Y",
    }

    for letter, title, pfx in SECTIONS:
        lines.append(f"\n## {letter}. {title}\n\n")
        section_cases = [c for c in cases if c["id"].startswith(pfx + "-")]
        lines.append(f"*{len(section_cases)} test cases*\n\n")
        for c in section_cases:
            lines.append(render_case(c))

    lines.append("\n## P0 Must-Pass Tests Before Production\n\n")
    p0 = [c for c in cases if c["priority"] == "P0"]
    lines.append(f"**{len(p0)} P0 cases** — minimum gate:\n\n")
    p0_gate = [
        "AUTH-001 — Login lockout works",
        "AUTH-002 — Inactive user cannot login",
        "AUTH-007 — No SQL injection via login email",
        "AUTH-010/011 — Role/deactivation does not allow unauthorized mutation (document JWT gap)",
        "RBAC-001/002/003 — Non-admin cannot access unassigned matter/client; Viewer cannot mutate",
        "RBAC-009/017/018 — No firm-wide activity or search/dashboard leakage",
        "RBAC-019 — Server actions enforce RBAC",
        "CLI-002/006/007 — Hidden clients not in search or direct URL",
        "DOC-008/009/019/025 — URL validation, permission confirm, no server fetch",
        "DOC-016/017/018 — No XSS in document fields",
        "SRCH-007/009 — No injection; no hidden matter search hits",
        "ACT-006/010/011/012/013 — Safe auth logs; admin-only export; immutable ActivityLog",
        "ARCH-010 / RET-002 — Archived records hidden from ordinary workflows",
        "RET-001/003/004 — Archived data preserved; activity log intact; no hard delete in UI",
        "CSV-001/006/010 — Admin export; no secrets; CSV formula injection prevented",
        "META-001/002/005/006/008 — Metadata does not leak via titles, activity summaries, search, or CSV",
        "EXT-006/008 — Permission confirmation required; external ACL limitation clearly stated",
        "BKP-001/002/003/004/010 — Backups work, access-restricted, restore tested, not in GitHub",
        "ADMIN-001/002/005/009/010 — Group/role changes logged (ACT-007); permission confirm on; no shared/default admin creds",
        "ACT-007 — Admin role/group changes appear in activity log",
        "I18N-007/008/011 — Thai store/display/search",
        "AI-001/009/015 — AI off; no external API; no doc fetch",
        "DEP-013/014 — Seed password changed; no .env, exports, backups, screenshots, or client data in GitHub",
        "**Policy:** Firmedware access control is **not** a substitute for external Drive/SharePoint/OneDrive/Dropbox permissions (EXT-001–004)",
    ]
    for item in p0_gate:
        lines.append(f"- {item}\n")

    lines.append("\n### Full P0 test ID list\n\n")
    for c in sorted(p0, key=lambda x: x["id"]):
        lines.append(f"- `{c['id']}` — {c['steps'][:80]}{'…' if len(c['steps']) > 80 else ''}\n")

    lines.append("\n## Suggested automated test files\n\n")
    lines.append(
        "Do **not** implement all tests unless requested. Recommended file boundaries:\n\n"
        "| File | Covers |\n| --- | --- |\n"
        "| `tests/rbac.test.ts` | RBAC-*, CLI-*, ARCH-010, RBAC-019 |\n"
        "| `tests/auth-edge-cases.test.ts` | AUTH-*, SEC-010 |\n"
        "| `tests/document-links.test.ts` | DOC-*, BILL-013 |\n"
        "| `tests/search-permissions.test.ts` | SRCH-*, CLI-006 |\n"
        "| `tests/activity-log.test.ts` | ACT-*, CSV-* (export), DB-009 |\n"
        "| `tests/i18n.test.ts` | I18N-*, TH-* |\n"
        "| `tests/ai-policy.test.ts` | AI-* (stubs until connector exists) |\n"
        "| `tests/metadata-sensitivity.test.ts` | META-*, SRCH-009, ACT-015 |\n"
        "| `tests/external-permissions.test.ts` | EXT-*, DOC-019 |\n"
        "| `tests/backup-restore.test.ts` | BKP-*, DEP-014 (manual ops) |\n"
        "| `tests/admin-misconfig.test.ts` | ADMIN-*, RBAC-010–014 |\n"
        "| `tests/retention-legal-hold.test.ts` | RET-*, ARCH-* |\n\n"
        "Use **Vitest** or **Jest** + Prisma test DB; E2E via Playwright for UI-*/RBAC E2E cases.\n"
    )

    (DOCS / "EDGE_CASE_TEST_PLAN.md").write_text("".join(lines), encoding="utf-8")


def write_failure_matrix(cases: list[dict]) -> None:
    rows = [
        ("Authentication", "Brute force, session fixation, user enumeration", "AUTH-001, AUTH-007, AUTH-010, AUTH-011, SEC-010", "Account takeover", "Lockout + generic errors + JWT refresh policy"),
        ("RBAC", "Horizontal privilege escalation", "RBAC-001–019, CLI-006/007", "Unauthorized matter/client/doc access", "Server-side filters in rbac.ts on every action"),
        ("Document links", "XSS, SSRF, open redirect", "DOC-009–011, DOC-016–018, DOC-025", "Malware/phishing via link or server fetch", "Scheme allowlist; escape output; no fetch"),
        ("Search", "Injection, data leak", "SRCH-007–011", "Hidden matter names in results", "Prisma parameterized queries + RBAC where"),
        ("Activity log", "Tampering, secret leak", "ACT-006, ACT-011–013, CSV-006", "Audit trail untrusted", "DB triggers + export redaction"),
        ("Archive", "Stale visibility", "ARCH-010, RBAC-015/016", "Archived data in dashboards", "notDeleted filters everywhere"),
        ("i18n", "Encoding, locale bypass", "I18N-007/011, TH-*", "Thai data corrupt or unsearchable", "UTF-8 DB + fallback messages"),
        ("Deployment", "Secret exposure, split brain DB", "DEP-001–015", "Firm data on wrong host or GitHub", "Shared deployment docs + gitignore"),
        ("AI (future)", "Confidentiality breach", "AI-001–015", "Client data to third party", "Disabled by default; policy gates"),
        ("Billing", "Financial metadata leak", "BILL-011/012", "Billing on wrong matters", "canAccessBillingRecord mirrors documents"),
        ("Metadata sensitivity", "Matter titles, document titles, task notes, or URLs reveal confidential facts", "META-001–008", "Confidentiality breach even without file storage", "Treat metadata as confidential; RBAC on all metadata; avoid over-descriptive titles"),
        ("External storage permissions", "Drive/SharePoint/OneDrive file is public even though Firmedware access is restricted", "EXT-001–008", "Unauthorized access outside Firmedware", "Permission confirmation; external permission review checklist; periodic link audit"),
        ("Backup / restore", "Backup missing, corrupted, unencrypted, or restored to wrong environment", "BKP-001–010", "Data loss or confidentiality breach", "Encrypted pg_dump; restore testing; backup access control"),
        ("Admin misconfiguration", "Admin accidentally grants broad access, weak settings, or wrong default workflow", "ADMIN-001–010", "Firm-wide exposure or workflow failure", "Admin review checklist; activity logs; least-privilege defaults"),
        ("Legal hold / retention", "Archived/deleted data conflicts with retention, litigation hold, or firm policy", "RET-001–008", "Evidence loss, compliance issue, client dispute", "Retention playbook; no hard delete by default; admin-only archive review"),
    ]
    lines = [
        "# Firmedware failure mode matrix\n",
        "\nMaps **failure modes** → **test IDs** → **mitigations**. Companion to [EDGE_CASE_TEST_PLAN.md](./EDGE_CASE_TEST_PLAN.md).\n",
        "\n## Matrix\n\n",
        "| Module | Failure mode | Primary test IDs | User/business impact | Detection / mitigation |\n",
        "| --- | --- | --- | --- | --- |\n",
    ]
    for r in rows:
        lines.append(f"| {' | '.join(r)} |\n")

    lines.append("\n## Severity × priority\n\n")
    lines.append("| Priority | Meaning | Example failure modes |\n")
    lines.append("| --- | --- | --- |\n")
    lines.append("| **P0** | Block production | RBAC leak, XSS, immutable log broken, lockout bypass |\n")
    lines.append("| **P1** | Fix before go-live scale | Timezone bugs, workflow default broken, Thai search gaps |\n")
    lines.append("| **P2** | Schedule / manual | Layout overflow, perf at 10k rows, emoji tags |\n")

    lines.append("\n## Failure symptom catalog\n\n")
    symptoms = [
        ("Permission leak", "Non-admin sees record ID in list, search, API JSON, or different 403 vs 404", "RBAC-*, CLI-*, SRCH-009"),
        ("Silent data loss", "Archive removes FK children incorrectly", "ARCH-012, DB-008"),
        ("Audit failure", "ActivityLog row changed/deleted", "ACT-011–013"),
        ("Credential leak", "passwordHash or AUTH_SECRET in CSV/UI/error", "CSV-006, AUTH-013"),
        ("SSRF / document fetch", "Server HTTP to Drive/SharePoint on doc create", "DOC-025"),
        ("CSV formula injection", "Excel executes formula from activity export", "CSV-010"),
        ("Stale JWT", "Deactivated user still mutates", "AUTH-011"),
        ("Split deployment", "Two locals think they share data", "DEP-015"),
        ("Metadata breach", "User cannot open file but can see revealing document title, matter title, or task note", "META-001, SRCH-009, DOC-020"),
        ("External permission mismatch", "Firmedware blocks user, but Google Drive/SharePoint link opens publicly", "EXT-001–004"),
        ("Backup confidentiality leak", "pg_dump, CSV export, or screenshots committed to GitHub or stored unencrypted", "BKP-003, DEP-014"),
        ("Admin over-permissioning", "New user added to wrong group and gets too many matters", "ADMIN-001, RBAC-010–014"),
        ("Retention conflict", "Matter archived but backup/export still contains sensitive data without documented retention policy", "RET-001–008"),
    ]
    lines.append("| Symptom | What to look for | Test IDs |\n| --- | --- | --- |\n")
    for s in symptoms:
        lines.append(f"| {s[0]} | {s[1]} | {s[2]} |\n")

    p0 = len([c for c in cases if c["priority"] == "P0"])
    lines.append(f"\n## Coverage summary\n\n- Total edge cases: **{len(cases)}**\n- P0 cases: **{p0}**\n")
    (DOCS / "FAILURE_MODE_MATRIX.md").write_text("".join(lines), encoding="utf-8")


def write_security_cases(cases: list[dict]) -> None:
    sec_ids = {
        "AUTH",
        "RBAC",
        "CLI",
        "DOC",
        "SRCH",
        "ACT",
        "CSV",
        "SEC",
        "AI",
        "DEP",
        "ARCH",
        "DB",
        "META",
        "EXT",
        "BKP",
        "ADMIN",
        "RET",
    }
    sec_cases = [c for c in cases if c["id"].split("-")[0] in sec_ids]

    lines = [
        "# Firmedware security edge cases\n",
        "\nSecurity-focused extract from the full [EDGE_CASE_TEST_PLAN.md](./EDGE_CASE_TEST_PLAN.md). Use for threat modeling and pre-production review.\n",
        "\n## Threat model summary (v1.2)\n",
        "\n| Asset | Threat | Controls to verify |\n",
        "| --- | --- | --- |\n",
        "| PostgreSQL metadata | Unauthorized read/write | Matter-level RBAC, server actions |\n",
        "| Credentials | Brute force, weak seed | Lockout, bcrypt, change default password |\n",
        "| Sessions (JWT) | Stale role / deactivated user | AUTH-010/011; consider session revocation |\n",
        "| Document URLs | XSS, javascript: links | DOC-009/016; escape UI |\n",
        "| External documents | SSRF/proxy (out of scope) | DOC-025 — server must not fetch |\n",
        "| Activity logs | Tampering, exfiltration | Triggers ACT-013; CSV-006/010 |\n",
        "| GitHub repo | Secret commit | DEP-014; docs/SECURITY.md |\n",
        "| Future AI | Confidentiality breach | AI-* — disabled, no outbound calls |\n",
        "| Metadata fields | Confidential facts without files | META-* — titles, notes, search, CSV |\n",
        "| External DMS ACLs | Public link while app RBAC OK | EXT-* — not enforced by Firmedware |\n",
        "| Backups | Dump leak or failed restore | BKP-* — encrypted, access-controlled |\n",
        "\n## Security owner and review cadence\n",
        "\nEach firm should name one **admin or IT maintainer** (not a shared login) responsible for:\n",
        "\n- User onboarding and offboarding\n",
        "- User role review\n",
        "- Group and matter assignment review\n",
        "- Backup confirmation and restore testing\n",
        "- Activity log review (unusual exports, failed logins, role changes)\n",
        "- External document permission review (Drive, OneDrive, SharePoint, Dropbox, local shares)\n",
        "- Security settings review (lockout, permission confirmation, notices)\n",
        "- Incident response coordination\n",
        "\nSuggested cadence for a small firm (adjust to risk and staffing):\n",
        "\n| Review item | Suggested cadence |\n",
        "| --- | --- |\n",
        "| Active users (still employed, correct role) | Monthly |\n",
        "| Admin accounts (who has ADMIN, shared creds?) | Monthly |\n",
        "| Matter and group assignments | Monthly, or after staffing / matter changes |\n",
        "| External document permissions | Monthly, or when closing a matter |\n",
        "| Activity logs (AUTH, SECURITY, exports, admin changes) | Weekly for small firms; more often for sensitive matters |\n",
        "| Backups (job succeeded, file reachable) | Weekly confirmation |\n",
        "| Backup restore test | Periodic (e.g. quarterly) |\n",
        "| Security settings (lockout, permission confirm, notices) | Quarterly |\n",
        "\nFirmedware does not automate these reviews. The firm defines who performs them and records outcomes internally.\n",
        "\n## Incident response mini-playbook\n",
        "\nWhen a suspected account compromise, metadata leak, or unauthorized access occurs:\n",
        "\n1. **Disable** the affected user account (Admin → Users → deactivate).\n",
        "2. **Change passwords** for affected accounts and any shared admin credentials that may be exposed.\n",
        "3. **Review** recent `ActivityLog` entries for that user (logins, exports, creates, updates, archives, document opens).\n",
        "4. **Review** document links added or opened by the affected account in Firmedware.\n",
        "5. **Review** external storage permissions in Google Drive, OneDrive, SharePoint, Dropbox, or local folders—Firmedware cannot fix provider ACLs from inside the app.\n",
        "6. **Revoke or rotate** over-shared external document links where needed.\n",
        "7. **Export** relevant activity logs for internal review (admin-only CSV; store securely, not in email or GitHub).\n",
        "8. **Check** database and deployment access (who can reach PostgreSQL, server, backups, `.env`).\n",
        "9. **Decide** whether client, court, regulator, insurer, or internal notifications are required—**the firm** makes legal, ethical, contractual, and regulatory decisions.\n",
        "10. **Document** the incident, timeline, and remediation steps for internal records.\n",
        "\n**Disclaimer:** Firmedware can support investigation through metadata and activity logs. It does not provide legal advice, breach notification, or regulator reporting. The firm remains responsible for response decisions.\n",
        "\n## Metadata breach examples\n",
        "\nFirmedware does not store legal document **files** by default, but **metadata can still be confidential**. A user blocked from a file may still see sensitive facts in the application.\n",
        "\nExamples of sensitive metadata:\n",
        "\n- Client names and contact fields\n",
        "- Matter titles (parties, claims, forum, strategy hints)\n",
        "- Document link **titles** (e.g. settlement drafts, privileged labels)\n",
        "- Task descriptions and **deadline descriptions** (hearing dates, court steps)\n",
        "- External URLs (hostnames, folder paths, tokens in query strings)\n",
        "- Activity log summaries and export rows\n",
        "- Folder paths for `LOCAL_FOLDER` links\n",
        "- Document link tokens embedded in shared URLs\n",
        "\n**Warning:** Treat metadata as confidential. Use matter-level RBAC, avoid unnecessary detail in titles and task text, and train staff not to paste privileged content into notes or activity-visible fields. See test IDs **META-001–008** and [FAILURE_MODE_MATRIX.md](./FAILURE_MODE_MATRIX.md).\n",
        "\n## Security acceptance gates\n",
        "\nDo **not** use Firmedware with real client or matter information until these gates pass:\n",
        "\n- [ ] **AUTH** P0 tests pass (lockout, inactive user, safe login errors)\n",
        "- [ ] **RBAC** P0 tests pass (unassigned matters, viewer read-only, server-side checks)\n",
        "- [ ] **Document link** P0 tests pass (URL validation, permission confirmation, no server fetch)\n",
        "- [ ] **Search leakage** P0 tests pass (hidden matters/clients/documents)\n",
        "- [ ] **Activity log** immutability P0 tests pass (DB trigger blocks update/delete)\n",
        "- [ ] **CSV export** P0 tests pass (no secrets, formula injection escaped)\n",
        "- [ ] **Deployment** secret checks pass (`AUTH_SECRET`, no `.env` in repo)\n",
        "- [ ] **Backups** configured, access-restricted, and **restore-tested** (BKP-001–003)\n",
        "- [ ] **Default seed admin password** changed (DEP-013, ADMIN-010)\n",
        "- [ ] **External document permission policy** adopted (confirmation + periodic link review; EXT-007/008)\n",
        "- [ ] **AI connector** remains disabled unless a **written firm policy** explicitly approves a future fork (AI-001)\n",
        "\nPassing tests supports operational readiness; it does **not** mean SOC 2, ISO 27001, PDPA, or lawyer conduct compliance.\n",
        "\n## Abuse cases to test\n",
        "\n| Abuse case | Expected protection |\n",
        "| --- | --- |\n",
        "| User guesses another matter URL | Matter-level RBAC blocks access (RBAC-001) |\n",
        "| Viewer submits hidden edit form | Server-side authorization blocks mutation (RBAC-003) |\n",
        "| Departed staff keeps old session | Deactivation blocks login; review stale JWT on next action (AUTH-002, AUTH-011) |\n",
        "| User adds `javascript:` link | URL scheme validation blocks or neutralizes (DOC-009) |\n",
        "| User adds public Google Drive link | Permission confirmation and warning appear (DOC-019, EXT-001, EXT-008) |\n",
        "| Admin exports CSV with spreadsheet formula payload | CSV injection protection escapes dangerous values (CSV-010) |\n",
        "| Developer commits `.env` or database backup | `.gitignore` and documentation warn; never commit (DEP-014, BKP-004) |\n",
        "| AI connector tries to process matter notes | Disabled-by-default; no endpoint (AI-001) |\n",
        "\n## Security tests to automate first\n",
        "\nRanked starting set for CI or pre-release smoke (see [EDGE_CASE_TEST_PLAN.md](./EDGE_CASE_TEST_PLAN.md) for steps):\n",
        "\n1. `AUTH-001` — brute-force lockout\n",
        "2. `AUTH-002` — inactive user cannot login\n",
        "3. `AUTH-010` — role change blocks stale write permission\n",
        "4. `AUTH-011` — deactivated user cannot continue mutating records\n",
        "5. `RBAC-001` — unassigned matter URL blocked\n",
        "6. `RBAC-003` — viewer cannot mutate data\n",
        "7. `RBAC-017` — hidden document does not appear in search\n",
        "8. `DOC-009` — `javascript:` URL blocked\n",
        "9. `DOC-019` — permission confirmation required\n",
        "10. `DOC-025` — server does not fetch external document URLs\n",
        "11. `SRCH-009` — hidden matter title does not appear in search\n",
        "12. `ACT-013` — ActivityLog update blocked by DB trigger\n",
        "13. `CSV-006` — CSV does not contain secrets\n",
        "14. `CSV-010` — CSV formula injection escaped\n",
        "15. `AI-001` — no AI endpoint enabled by default\n",
        "\nSuggested files: `tests/auth-edge-cases.test.ts`, `tests/rbac.test.ts`, `tests/document-links.test.ts`, `tests/search-permissions.test.ts`, `tests/activity-log.test.ts`, `tests/ai-policy.test.ts`.\n",
        "\n## Security test cases (detailed)\n",
        "\nP0 and P1 cases from the full plan:\n\n",
    ]
    for c in sec_cases:
        if c["priority"] in ("P0", "P1"):
            lines.append(render_case(c))

    lines.append("\n## Repository & deployment safety\n\n")
    lines.append(
        "Manual checks (no Test ID):\n"
        "- Confirm `.gitignore` excludes `.env`, `*.sql`, dumps, exports.\n"
        "- Confirm production uses one shared PostgreSQL (see README).\n"
        "- Confirm `AUTH_SECRET` rotated from dev default.\n"
        "- Review [SECURITY.md](./SECURITY.md) Repository Safety section.\n"
    )
    lines.append("\n## P0 security gate (minimum)\n\n")
    for tid in [
        "AUTH-001",
        "AUTH-002",
        "AUTH-007",
        "AUTH-011",
        "RBAC-001",
        "RBAC-003",
        "RBAC-019",
        "DOC-009",
        "DOC-019",
        "DOC-025",
        "SRCH-007",
        "SRCH-009",
        "ACT-006",
        "ACT-010",
        "ACT-013",
        "CSV-006",
        "CSV-010",
        "SEC-010",
        "AI-001",
        "AI-009",
        "DEP-013",
        "DEP-014",
        "META-001",
        "META-005",
        "META-008",
        "EXT-006",
        "EXT-008",
        "BKP-001",
        "BKP-002",
        "BKP-003",
        "BKP-004",
        "ADMIN-002",
        "ADMIN-005",
        "ADMIN-010",
        "RET-001",
        "RET-002",
        "RET-004",
    ]:
        lines.append(f"- [ ] `{tid}`\n")

    (DOCS / "SECURITY_EDGE_CASES.md").write_text("".join(lines), encoding="utf-8")


def main() -> None:
    cases = all_cases()
    write_edge_plan(cases)
    write_failure_matrix(cases)
    write_security_cases(cases)
    print(f"Generated {len(cases)} test cases")
    print(f"  {DOCS / 'EDGE_CASE_TEST_PLAN.md'}")
    print(f"  {DOCS / 'FAILURE_MODE_MATRIX.md'}")
    print(f"  {DOCS / 'SECURITY_EDGE_CASES.md'}")


if __name__ == "__main__":
    main()
