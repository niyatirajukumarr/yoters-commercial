# Yoters Commercial — Session Progress

**Session Date:** 2026-07-30  
**Working Directory:** yoters-commercial  
**Status:** Active Development

---

## What We Accomplished

### 1. Authentication Flow Restructuring
- **Removed sign-in gate from browsing**: Landing page, `/browse`, menu pages now open to guests
- **Moved auth to first action**: Sign-in requested only when user clicks "add to cart" or "favourite an item"
- **Post-login redirect**: Users return to the exact menu they were reading (via `?next=` parameter)
- **Verified:** Anonymous server renders, RLS policy checks, path matcher logic all tested

### 2. Landing Page & Navigation Cleanup
- **Removed:** "Log in / Sign up" buttons from nav (browsing is open, auth happens at action)
- **Removed:** "NOW ACCEPTING EARLY ACCESS" badge (if present)
- **Removed:** "How It Works" stats strip section
- **Removed:** Empty `#about` anchor placeholder
- **Renamed:** "How" nav link → "About" (links to Meet the Team section)
- **Renamed:** "Contact" nav link → footer contact details (email/location)
- **Simplified:** Hero button text from "Learn How" to "Learn More"

### 3. Team Showcase Section
- **Positioned members:** Gowtham (col 1), Niyati (col 2), Rahul & Shreyas (col 3, stacked)
- **Swapped twice:** Rahul now above Shreyas in the right column
- **Zoomed Gowtham:** 1.15x scale inside card to match face prominence with others
- **Locked photos:** No save/copy/drag options; long-press and right-click menus disabled
- **Added hint text:** "Click on each photo to know more." below heading
- **Implemented interactivity:** Hover/tap highlights name and applies color gradient; no image context menus
- **New photo for Shreyas:** Swapped in fresh image (103KB vs old 313KB)

### 4. Auth Page Redesign
- **Removed feature chips:** "Real-time queue", "Pay online", "Get notified" deleted
- **Enlarged penguin:** Scaled from 64px to 104px
- **Increased spacing:** Heading now 22px from top instead of crowding penguin
- **Cleaned CSS:** Removed .feature-chip styles

### 5. Browse & Menu Pages
- **Restaurant images clickable:** Clicking LETHAFI (or any restaurant) image opens menu (same as "See Full Menu" button)
- **Image wrapped in link:** Only the image is interactive, not the whole card (preserves map toggle & description)
- **Favourite button gated:** Heart icon now checks auth; guests redirected to `/auth?mode=login&next=<menu-url>`
- **Removed "LIVE QUEUE VISIBILITY" badge:** Pulsing pill above browse page hero deleted

---

## Current State

### Live on Production
- **Commit:** `c677d97` (badge removal, still deploying)
- **Previous deployed:** `89ede29` (favourite auth gate)
- **Previous deployed:** `8d5ab77` (clickable restaurant image)

### Key URLs & Features
- **Landing:** `https://www.yoters.site/` — open to all
- **Browse:** `https://www.yoters.site/browse` — open to all, no queue visibility badge
- **Menu:** `https://www.yoters.site/mobile/order/lethafi` — open to all
- **Add to Cart:** Requires auth → `/auth?mode=login&next=/mobile/order/lethafi`
- **Favourite:** Requires auth → `/auth?mode=login&next=/mobile/order/lethafi`
- **Auth:** `/auth` → redirects to `/browse` if already signed in (or to `?next=` destination)

### Known Issues
- **Webhook reliability:** 6 dropped webhooks this session (empty commits nudge builds)
  - Pattern: commit reaches GitHub, Vercel webhook fails, no deployment object created
  - Workaround: Push empty commit to trigger fresh webhook
  - **Recommendation:** Reconnect repo under Vercel → Settings → Git when convenient

### Not Yet Completed
- **LinkedIn profile URLs:** Placeholders in team-showcase.tsx; social icons appear on hover once added
- **#about section:** Empty placeholder; awaiting content strategy
- **Vercel webhook stability:** Investigate persistent drops (may indicate rate limiting or integration issue)

---

## Next Steps

### Immediate (High Priority)
1. **LinkedIn URLs for team members**
   - Add social.linkedin property to each member in `components/ui/team-showcase.tsx`
   - Icons (LI/X/IG) already wired; will appear on hover once URLs present

2. **Fill the #about section**
   - Decide content strategy (company story, mission, values, etc.)
   - Implement as full section in `app/page.tsx` or keep as anchor-only placeholder

3. **Monitor Vercel webhooks**
   - Reconnect repository in Vercel settings if drops continue
   - Or escalate to Vercel support if pattern persists after reconnect

### Later (Medium Priority)
4. **User feedback integration**
   - Profile completeness on auth (name, phone stored in local storage; session-based)
   - Favourite persistence testing across sessions
   - Guest → signed-in flow UX polish

5. **Payment & checkout flow**
   - Currently UPI/Razorpay gated behind user auth (session required after add-to-cart)
   - Verify checkout → payment → order confirmation flow works end-to-end

6. **Order tracking & history**
   - `/mobile/orders` (tab navigation) still requires auth
   - `/mobile/track/<orderId>` still requires auth
   - Profile pages (favs, settings, help, refunds) still require auth
   - ✅ (Correct — these should stay gated to logged-in users)

### Technical Debt
- **Unlayered CSS reset bug:** `* { margin: 0; padding: 0 }` in globals.css:99 beats Tailwind @layer utilities
  - Workaround: Direct CSS in `<style>` tags or class-level rules
  - Consider moving reset inside @layer or removing it if upgrade allows

- **RLS permissions:** Verify anon can read cafeterias & menus but not profiles/orders
  - ✅ Tested and confirmed working

---

## File Changes This Session

### Modified
- `app/page.tsx` — nav buttons removed, About/Contact links retargeted, hero flow simplified
- `app/auth/page.tsx` — penguin 104px, feature chips removed, safeNext() redirect logic
- `app/browse/page.tsx` — profile icon auth-gated for guests, LIVE QUEUE badge removed, restaurant image clickable
- `app/mobile/order/[cafeteriaId]/page.tsx` — add-to-cart auth check, favourite auth check
- `components/ui/team-showcase.tsx` — row/column positioning refactored, Gowtham zoom added, image lock CSS, new Shreyas photo

### Created
- (None — all changes were edits or deletions)

### Deployment History (This Session)
1. `e0487904` — Simplified auth page hero
2. `c5d360b9` — Stopped photos offering themselves, swapped Rahul/Shreyas
3. `d2c67ba` — Zoomed Gowtham
4. `a785869` — Swapped team positions
5. `5359f49` — Pointed nav at real destinations (dropped webhook, ~5min to build)
6. `61d9eb9` — Nudge for above
7. `bec257c` — Public browsing, auth at first action
8. `8d5ab77` — Restaurant image clickable
9. `8e68e56` — Nudge for above (now live)
10. `89ede29` — Favourite button auth-gated (now live)
11. `65eda46` — Nudge for above (now live)
12. `c677d97` — Removed LIVE QUEUE VISIBILITY badge (currently building)

---

## Testing Checklist

### Public Access (No Auth Required)
- ✅ Landing page loads, all sections render
- ✅ Browse page loads, restaurants listed
- ✅ Restaurant menu loads, items visible, images appear
- ✅ Team photos display, hover effect works, no save/copy/drag options
- ✅ Footer contact details reachable via Contact nav link

### Auth Gating
- ✅ Clicking "Add +" redirects guest to `/auth?mode=login&next=/mobile/order/<restaurant>`
- ✅ Clicking heart icon redirects guest to `/auth?mode=login&next=/mobile/order/<restaurant>`
- ✅ After sign-in, user returns to menu (next= redirect works)
- ✅ Signed-in users see their initial in nav avatar (not 👤)

### Interaction
- ✅ Restaurant image clickable → opens menu
- ✅ "See Full Menu" button works
- ✅ Team photo hover highlights name with gradient
- ✅ Team photo long-press on mobile doesn't trigger OS context menu

---

## Notes for Future Sessions

- **Webhook monitoring:** Watch GitHub → Vercel webhook delivery in Vercel dashboard
- **Team photos:** Shreyas's new photo is much taller (738×1600) than others; crop/reframe if swapped again
- **Auth flow:** Current pattern (browse open, auth at action) is live and working; no changes needed unless product pivots
- **Navigation consistency:** 3 nav locations (desktop, mobile, footer) all point to same anchors; keep in sync if editing

---

**Last Updated:** 2026-07-30 @ 16:38 UTC  
**Next Review:** Once LIVE QUEUE badge deployment completes and LinkedIn URLs are added
