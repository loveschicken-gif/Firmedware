# Firmedware Properties

**Version:** 1.2.0

## Overview

Firmedware is a lightweight law firm tracker for **mini teams (1–4)** and **small firms (5–15)**. It stores metadata and document references (external URLs, local paths, manual references) only—no PDF uploads, no AI execution by default (optional gateway stubs), no document proxying. **16+ users / enterprise:** fork and develop; v1.2 core is not targeted at larger firms as shipped.

## Storage model

- **Code:** GitHub repository and deployed application server
- **Application records:** PostgreSQL database
- **Legal documents:** External storage provider selected by the firm
- **Backups:** Firm-controlled database backups

Firmedware is single-tenant. One firm deployment should connect to one PostgreSQL database. Multiple users share firm data by logging into the same deployed instance, not by cloning separate repositories.

Full explanation: [README — Code vs Data vs Documents](README.md#code-vs-data-vs-documents).

## Internationalization (i18n)

| Setting | Value |
|---------|--------|
| Supported locales | `th` (Thai), `en` (English) |
| Default locale | `th` |
| Fallback locale | `en` (missing Thai keys fall back to English) |
| Locale files | `locales/{th,en}/{common,dashboard,clients,matters,documents,tasks,billing,admin,account}.json` |

UI labels, navigation, buttons, helper text, status display labels, and validation messages are translated. Database enum values, IDs, URLs, and internal constants remain in English.

### Language resolution order

1. `locale` cookie (set by language switcher)
2. User `preferredLanguage`
3. Firm `defaultLanguage` (FirmSettings)
4. Default: `th`

### FirmSettings language

| Field | Type | Default |
|-------|------|---------|
| `defaultLanguage` | String | `"th"` |

Editable by Admin at `/admin/settings`.

### User language

| Field | Type | Default |
|-------|------|---------|
| `preferredLanguage` | String | `"th"` |

Updated via the header language switcher (and optionally user admin form).

### Jurisdiction packs

Operational templates (not legal advice) for locale-specific practice: [docs/jurisdictions/thailand/](../docs/jurisdictions/thailand/README.md) (matter statuses, document taxonomy, PDPA checklist, AI policy, closing checklist).

### Operational documentation (bilingual)

All markdown under [docs/](../docs/) is **English first, then Thai** (`ภาษาไทย`) in the same file. Index and [source/citation policy](../docs/README.md#source-and-citation-policy): [docs/README.md](../docs/README.md). Application UI remains in `locales/th/` and `locales/en/`. Legal/regulatory citations use official sources or neutral guidance only—not law firm or vendor marketing blogs.

## Data models

### FirmSettings (singleton)

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `id` | String | `"default"` | Single-row primary key |
| `firmName` | String | `"Firmedware"` | Displayed in app shell/sidebar |
| `timezone` | String | `"Asia/Bangkok"` | IANA timezone |
| `defaultLanguage` | String | `"th"` | Firm-wide default locale |
| `defaultMatterVisibility` | MatterVisibility | `ASSIGNED_ONLY` | Reserved for future use |
| `enableEntityNotes` | Boolean | `true` | Notes on clients, matters, documents |
| `enableComments` | Boolean | `false` | Matter comments placeholder (extension) |
| `enableBilling` | Boolean | `false` | Invoice metadata & payment status tracking |
| `enableAIConnectors` | Boolean | `false` | AI Connector Gateway — off by default; setup: [docs/AI_CONNECTOR_SETUP.md](docs/AI_CONNECTOR_SETUP.md) |
| `aiConnectorMode` | String | `"DISABLED"` | Policy mode (see `src/lib/ai/types.ts`) |
| `aiConnectorProvider` | String? | null | Preferred provider label/metadata only — **not** API keys |
| `createdAt` | DateTime | now | |
| `updatedAt` | DateTime | auto | |

Provider API keys must be stored server-side via environment variables or a secret manager if a fork implements real connectors — never in the database. See [docs/AI_CONNECTOR_SETUP.md](docs/AI_CONNECTOR_SETUP.md) for admin setup, `POST /api/ai/policy-check`, and fork integration.

### User

| Field | Type | Notes |
|-------|------|-------|
| `active` | Boolean | Deactivation mechanism; inactive users cannot log in |
| `preferredLanguage` | String | UI locale preference (`th` or `en`) |
| — | — | Users are **not** hard-deleted from the UI |

### BillingRecord (optional module)

Enabled via `FirmSettings.enableBilling`. Tracks invoice metadata and payment status only — not accounting software.

| Field | Type | Notes |
|-------|------|-------|
| `clientId` | String | Required |
| `matterId` | String? | Optional; visibility follows matter access |
| `invoiceNumber` | String? | |
| `title` | String | Required |
| `amount` | Decimal | Required |
| `currency` | String | Default `THB` |
| `status` | String | `DRAFT`, `SENT`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `CANCELLED`, `WRITTEN_OFF` |
| `externalLink` | String? | URL to invoice in external system |
| `issueDate`, `dueDate`, `paidAt` | DateTime? | |

Soft-delete: only **Admin** may archive billing records.

### DocumentLink (document reference)

| Field | Type | Notes |
|-------|------|-------|
| `title` | String | Display name |
| `url` | String | Reference value (URL, path, or manual text); not renamed in DB for compatibility |
| `referenceType` | DocumentReferenceType | `EXTERNAL_URL` (default), `LOCAL_PATH`, `MANUAL_REFERENCE` |
| `provider` | DocumentProvider | Drive/OneDrive/etc. for URLs; `LOCAL_FOLDER` for paths |
| `providerLabel` | String? | Required when `provider` is `OTHER` (external URLs only) |
| `sensitivity` | DocumentSensitivity | Confidentiality label |
| `clientId`, `matterId` | FK | RBAC scope |

Firmedware does not fetch URLs, read local paths, or validate path existence.

### Soft-deletable entities

Client, Matter, DocumentLink, Task, UserGroup, Tag, BillingRecord — see v1.1.1 for `deletedAt`, `deletedById`, `createdById`, `updatedById`.

## Visibility rules

Unchanged from v1.1.1 (admin sees all non-deleted clients; non-admins via matter access).

## Activity log

Soft-delete summaries are localized at write time using the acting user's locale.

## Version history

| Version | Highlights |
|---------|------------|
| **1.2.1** | Optional billing module (`enableBilling`, `BillingRecord`, `/billing` routes) |
| **1.2.0** | Security settings, login lockout, activity categories, workflow statuses, document sensitivity, confidentiality notice, permission confirm on document links |
| **1.1.2** | Thai/English bilingual UI, locale files, FirmSettings.defaultLanguage, User.preferredLanguage, header language switcher |
| **1.1.1** | FirmSettings, soft delete, audit fields, client visibility refinements |
| **1.1** | User groups, matter group assignments, sprint week on tasks |
| **1.0** | Initial release |
