# Loro Development History

> **Purpose:** Preserve factual implementation and roadmap decisions in monthly archives without continually expanding the main roadmap.
>
> **Roadmap:** [`../PLANS.md`](../PLANS.md)  
> **Product contract:** [`../PRODUCT.md`](../PRODUCT.md)  
> **Engineering architecture:** [`../ARCHITECTURE.md`](../ARCHITECTURE.md)

## Monthly Archives

| Month | Archive | Coverage |
|-------|---------|----------|
| August 2026 | [`2026-08.md`](./2026-08.md) | Google OAuth SSO implementation and provider setup documentation |
| July 2026 | [`2026-07.md`](./2026-07.md) | Initial roadmap audit through the documentation/history restructure |

## Maintenance Rules

- Use one file per calendar month named `YYYY-MM.md`.
- Keep entries in reverse chronological order so the newest work is first.
- Use the heading format `### YYYY-MM-DD — Short factual title`.
- Add an entry after a completed feature, significant change, architecture decision, roadmap review, or documentation restructure.
- Keep entries concise and developer-facing.
- Record:
  - Behavior implemented or decision made
  - Important files or systems changed
  - Key design decisions
  - Verification performed
  - Remaining limitations or follow-up work
- Update this index whenever a new monthly archive is created.
- Update feature status and implementation details in `../PLANS.md`; monthly history does not replace the live roadmap.
- Do not rewrite old entries to match later decisions. Add a newer entry explaining the correction or superseding decision.

## New-Month Template

```md
# Loro Development History — Month YYYY

> **Coverage:** YYYY-MM-DD onward  
> **Roadmap:** [`../PLANS.md`](../PLANS.md)  
> **History index:** [`README.md`](./README.md)

Entries are ordered newest first.

### YYYY-MM-DD — Change Title

- Behavior implemented or decision made.
- Files or systems changed.
- Key design decision.
- Verification performed.
- Remaining limitation or follow-up.
```
