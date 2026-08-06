# Feature #32 - Business Model Implementation (P3)

> Roadmap index: [PLANS.md](../PLANS.md#feature-32)

### <a id="feature-32"></a>32. Business Model Implementation (P3)

**What:** Monetization strategy — subscription, one-time purchase, or free with IAP.

**Why:** User-requested. Critical for sustainability but needs careful design to not harm the core experience.

**Recommendation:** Free with optional cosmetic IAP + generous free tier.
- Free: 10 energy max, 50 inventory slots, all habits, all quests, streaks
- Loro Supporter ($2.99/mo or $19.99 lifetime): +5 energy max, 200 inventory slots, exclusive Lory cosmetics, supporter badge, priority feature requests
- Never sell: streak protection, energy refills, loot odds — these should stay earnable through gameplay
- Payment via RevenueCat or directly through App Store / Google Play IAP

**Implementation notes:**
- RevenueCat SDK for cross-platform IAP management
- Treat RevenueCat/webhook-backed entitlements as authoritative; client Context only presents the verified entitlement snapshot.
- In-game coin purchases may include earnable shields/elixirs, but real-money products remain cosmetic/supporter benefits and never directly sell streak protection, energy, or loot odds.
- This is a late-stage feature — implement after core loop is solid

---

## Delivery Blueprint — Phase 4 — Identity, Social, Economy, and Launch

### <a id="blueprint-feature-32"></a>Feature #32 — Supporter Monetization

**Product constraints**

- Core habits, quests, streaks, path progress, and earnable gameplay rewards remain free.
- Real-money products are cosmetics/supporter conveniences only. Do not directly sell shields, energy, loot odds, streak restoration, or competitive advantage.
- Define exact entitlements before implementation: cosmetic collection, supporter badge, inventory capacity if still desired, and any energy-cap benefit. Re-evaluate energy capacity because it affects gameplay pacing.

**Client**

- Install the Expo-compatible RevenueCat SDK with a development build. Keep purchase UI behind a typed `EntitlementsContext` separate from core game mutation state.
- Show localized store prices returned by the SDK, legal subscription terms, restore purchases, manage-subscription links, pending/canceled/error states, and entitlement expiry.
- Cache the last verified entitlement for offline presentation with an explicit grace policy; never unlock from a client boolean alone.

**Backend**

- Add `user_entitlements` as a read-only-to-client projection and `billing_webhook_events` with unique provider event ID.
- An Edge Function verifies RevenueCat webhook authentication/signature according to current provider docs, records the event idempotently, and updates entitlements transactionally.
- Use the authenticated Supabase user ID as the RevenueCat app user ID only with a documented account-link/logout transfer policy.
- Do not place RevenueCat secret API keys or webhook credentials in the Expo bundle.

**Verification and release**

- Test iOS/Android sandboxes, buy/cancel/refund/renew/expire, restore, account switch, webhook retries/out-of-order events, offline grace, parental/store restrictions, and app-review metadata.
- Ship behind a server-controlled feature flag and monitor entitlement mismatch/error rates.
