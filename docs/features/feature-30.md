# Feature #30 - Friend / Social Features (P3)

> Roadmap index: [PLANS.md](../PLANS.md#feature-30)

### <a id="feature-30"></a>30. Friend / Social Features (P3)

**What:** Compare streaks, send encouragement, or see friends' adventure progress.

**Why:** User-requested. Social accountability is a powerful habit motivator.

**Considerations:**
- This is a major feature requiring backend work (Supabase friendships table, activity feeds)
- Start minimal: friend codes, see each other's streaks and current chapter
- Avoid competitive leaderboards initially — keep it supportive
- Requires careful privacy design (opt-in sharing)

---

## Delivery Blueprint — Phase 4 — Identity, Social, Economy, and Launch

### <a id="blueprint-feature-30"></a>Feature #30 — Supportive Friend Features

**MVP scope and privacy**

- Start with friend code, request/accept/decline/remove/block, and an opt-in summary showing display name/avatar, current daily streak, and high-level chapter progress.
- Do not expose email, exact habit names, notes, raw activity, local times, inventory, AI messages, or completion timestamps by default.
- Avoid global leaderboards and competitive ranking in v1. Add lightweight encouragement only after blocking/report controls exist.

**Data model**

- Add `social_profiles` with user ID, public display fields, sharing toggles, and a random non-sequential friend code.
- Add `friend_requests` and/or canonical `friendships` with constrained state. Enforce one relationship per unordered user pair and prohibit self-friending.
- Add `user_blocks`; every social read/RPC checks both directions of blocking.
- Build a privacy-filtered `get_friend_summaries` RPC/read model rather than granting friends direct access to game tables.
- Add indexes for friend code, requester/addressee status, and canonical pair. RLS permits only participants to read relationship rows and only through deliberate state transitions.

**Client**

- Add a Friends destination inside Profile or More, not a new bottom tab.
- Separate Pending, Friends, and Add Friend states; include loading/empty/error/offline variants and optimistic UI only where rollback is unambiguous.
- Poll on screen focus for MVP. Realtime is optional later and should not precede correct privacy/RLS behavior.

**Safety and verification**

- Add block/report before encouragement messaging, rate-limit friend-code lookup/request spam, and log moderation actions without exposing private game data.
- Test BOLA/IDOR attempts, self/duplicate/crossed requests, block precedence, private fields, removal/re-request, pagination, deleted accounts, and disabled sharing.
