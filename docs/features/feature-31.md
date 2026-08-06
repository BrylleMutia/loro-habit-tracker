# Feature #31 - Landing Page / Marketing Site (P3)

> Roadmap index: [PLANS.md](../PLANS.md#feature-31)

### <a id="feature-31"></a>31. Landing Page / Marketing Site (P3)

**What:** External web page with app details, screenshots, and a waitlist/signup.

**Why:** User-requested. Needed before public launch.

**Implementation notes:**
- Separate project (not part of the Expo app)
- Could be a simple Next.js or Astro site
- Sections: hero, features, screenshots, "Join the waitlist" form
- Waitlist could feed into a Supabase table or third-party service

---

## Delivery Blueprint — Phase 4 — Identity, Social, Economy, and Launch

### <a id="blueprint-feature-31"></a>Feature #31 — Marketing Site and Waitlist

**Architecture**

- Keep the marketing site separate from the mobile runtime, preferably under a clear monorepo app such as `apps/marketing` when the team is ready to own a second deployment.
- Use a static-first web framework with excellent metadata, image optimization, accessibility, and deployment support. Choose based on hosting/team preference at implementation time; do not add a large framework to the Expo bundle.
- Reuse exported brand tokens and approved assets through a documented copy/build step rather than importing mobile implementation files directly.

**Content and UX**

- Include product value, how the habit loop works, Lory, screenshots/video, privacy summary, FAQ, waitlist CTA, support contact, and store links when available.
- Optimize screenshots/assets for responsive web delivery and provide meaningful alt text.
- Add Open Graph/Twitter metadata, sitemap, robots policy, canonical URLs, structured app data, and performance budgets.

**Waitlist and security**

- Submit through a rate-limited server/Edge Function with email validation, consent text, anti-bot protection, and idempotent normalized email handling.
- The browser must not receive read access to the waitlist table. Store consent timestamp/source and provide unsubscribe/delete handling.
- Send email through a transactional provider only after domain authentication; keep provider keys server-side.

**Verification**

- Test keyboard/screen reader, mobile/desktop breakpoints, form abuse, duplicate signup, privacy links, metadata previews, Lighthouse/Core Web Vitals, and production analytics consent.
