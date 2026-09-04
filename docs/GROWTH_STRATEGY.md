# Yoters Growth Strategy — The Token Advantage

> Zomato discounts to win a *choice*. Yoters doesn't have a choice problem — the
> customer is already eating at that cafeteria today. We have a *habit* problem:
> do they open the app, or do they just walk down and stand in the queue?
> So we don't buy the order with rupees. We buy it with minutes.

| | |
|---|---|
| What we sell | A token, not a table |
| Purchase frequency | 5× a week, same hour |
| Ticket size | ₹120 – ₹220 |
| Reward currency | Queue position |
| Discount ceiling | 6% of GMV, blended |

---

## 1. The read: copying Zomato's coupon book would quietly kill us

Zomato and Zepto discount because their customer has infinite alternatives and
orders four times a month. A ₹100-off code has to beat forty other restaurants
and the customer's own fridge. That code is an **acquisition weapon in a choice
market**, funded by venture capital and priced into a ₹450 ticket.

Yoters is the opposite business on every axis that matters. Our customer eats at
LETHAFI or Punjabi House because it's the food that's fifty metres from where
they work — the decision is already made. If we hand that person a flat ₹40 off,
we've paid ₹40 for an order we were getting anyway, out of a ₹150 ticket, on a
vendor whose kitchen margin is thin enough that they'll simply stop honouring it
by week three. Worse: on a purchase this frequent, discounts train people to
**wait for the offer**. That's fatal for a daily habit.

| Axis | Zomato / Zepto | Yoters |
|---|---|---|
| Frequency | 4–8 orders a month | 18–22 orders a month, same 60-minute window |
| Alternatives | Effectively unlimited | One or two counters within walking distance |
| Ticket | ₹400+, absorbs a ₹100 coupon | ₹150, where ₹40 off is 27% of the bill |
| What the discount buys | A choice, against competitors | Nothing — they were already buying lunch |
| The real friction | Price and delivery time | A 14-minute queue inside a 40-minute break |
| So the reward should be | Rupees off the bill | Minutes back in the break |

Every program below is built on that last row. The things we give away are things
the customer values enormously and that cost the vendor *nothing*: an earlier
token, a guaranteed pickup slot, a place at the front. Where we do spend cash, we
spend it on habit and on referral — never on shaving the bill of someone who
would have paid full price.

---

## 2. The dial: one number governs the entire program

Before a single coupon ships, agree the ceiling. **Total discount, across every
program, stays under 6% of GMV — and Yoters funds no more than a third of it.**
If a campaign can't run inside that, it doesn't run.

Every ₹100 of order value:

- **₹4 vendor-funded** — rush-hour smoothing, their own coupon desk
- **₹2 Yoters-funded** — Golden Token, streaks, referral
- **₹94 untouched** — vendor payout + platform fee

---

## 3. The programs

Ship them in this order. The first two carry the strategy; the rest compound it.
Each is tagged by who pays for it — that tag is the reason it survives contact
with a real vendor.

### Beat the Rush — *vendor-funded, the flagship*

Order before **11:15** for a 12:00–13:00 pickup and get 12% off plus a token in
the first block. The discount decays through the morning: 12% before 11:15, 8%
before 11:45, 0% after.

Vendors say yes to this without arguing, which is the whole point. Pre-committed
demand means they prep to a known number instead of guessing, waste drops, and
the 12:30 crush they can't staff for gets flattened. They're not buying a
customer — they're buying a forecast. **Zomato structurally cannot copy this**;
it only exists because we sit upstream of the kitchen.

- Cost: vendor absorbs; Yoters ₹0
- Target: 35% of daily orders placed before 11:15 by day 60
- Build: time-windowed coupon rule + queue-block assignment

### The Golden Token — *Yoters-funded, the one people talk about*

At 11:00 each day, every cafeteria's screen and every phone shows one number:
today's Golden Token. Whoever's order lands on it eats free, up to ₹200.
Announced live, revealed the moment the token is assigned.

This is the mechanic no food app in India runs, and it's cheaper than the
discount it replaces. It gives people a reason to open Yoters at 11am, it makes
the token number — our most distinctive object — the thing customers actually
care about, and every winner is a photograph sent to a group chat.

```
// per cafeteria, per day
prize cap        ₹200
orders/day       120
cost per order   ₹1.67   → 1.1% of a ₹150 ticket

// versus a blanket 10% off
blanket 10%      ₹15.00 per order
Golden Token     ₹1.67 per order    9× cheaper
```

- Cost: ≈1.1% of GMV, hard-capped daily
- Target: app opens between 10:30–11:30 up 3×
- Build: daily draw job + reveal on the live queue card

### The Lunch Streak — *Yoters-funded*

Five weekdays ordering in a row unlocks the sixth: parcel and delivery charges
waived, plus a priority token. Miss a day and the streak resets — one freeze per
month, because we want it to sting a little.

This is the retention engine, and it costs ₹10–₹30 to fire. We're not
discounting food; we're paying a small fee to convert a person who orders twice
a week into a person who orders daily. That's a doubling of LTV for the price of
a delivery leg.

- Cost: ₹10–₹30 per 6th order
- Target: orders per active user per week 2.1 → 3.6
- Build: streak counter on profile, visible on home

### Bring a Tray — *Yoters-funded referral*

Refer a colleague and you both get a free drink — but it only unlocks when
**both of you order from the same cafeteria on the same day**. No cash, no wallet
credit, no "₹50 on signup."

The same-day condition is doing real work. Lunch is a group decision; this turns
a referral into a lunch plan, drags the referrer back into an order, and lifts
basket size on both sides. A dead signup earns nobody a drink, so we don't pay
for one.

- Cost: ₹25 × 2 → CAC ≈ ₹50
- Target: 30% of new users arrive by referral
- Build: referral codes + same-day both-ordered trigger

### Yoters Pass — *₹99/month*

Free delivery inside 3 km, a priority token every single day, and ₹15 of wallet
credit every Monday. Break-even for the member at roughly four delivery orders;
profitable for us on the dine-in-heavy majority.

This is the only line in the plan that isn't vendor commission — recurring
revenue that arrives on the 1st whether or not they order. It also makes the
priority token a purchased entitlement rather than a giveaway, which protects its
perceived value everywhere else.

- Cost: net positive from month one
- Target: 8% of monthly actives on Pass by day 120
- Build: subscription state + Razorpay recurring mandate

### Yoters Change — *costs nothing*

Round every bill up to the nearest ₹10 and drop the difference into the
customer's Yoters wallet. A ₹147 order becomes ₹150, with ₹3 banked.

It isn't a discount at all — it's a float and a switching cost, dressed as a
courtesy. Small balances accumulate into a reason not to walk downstairs, and the
money never leaves the platform. It also kills the UPI-paise friction on odd
totals.

- Cost: ₹0 — the customer's own money, held
- Target: 60% of users carrying a balance
- Build: wallet ledger, redeemable at checkout only

### The Vendor Coupon Desk — *vendor-funded, how this scales past two vendors*

Give vendors a tab in their dashboard where they write their own codes: a
slow-hour code for 15:00–17:00, a clearance code on items about to be binned, a
launch code on a new combo. They set the depth, they eat the cost, we take the
platform fee on the discounted total.

This is exactly how Zomato avoids going broke on offers, and it's the piece that
lets promotions grow with the vendor count instead of with our burn. Build it
early, even if only two vendors use it at first.

- Cost: Yoters ₹0, permanently
- Target: every vendor running ≥1 live code
- Build: coupon CRUD in vendor dashboard + mandatory caps

### And one thing that isn't a coupon at all: the Minutes Saved counter

The database already knows every order's cafeteria wait time and every collection
timestamp. Multiply and publish it. **"Yoters saved this campus 412 hours in
September."** Put it on the home screen, on the cafeteria's own screen, and in a
weekly post. It costs nothing, no competitor can claim it, and it's the single
clearest statement of what the product is for. That number is the brand.

---

## 4. Counter-programming: what we deliberately will not do

These are the obvious moves. Each one is a trap at our frequency and ticket size.

- **Flat "₹100 OFF" codes.** On a ₹150 lunch that's a 67% giveaway. It sets an
  anchor we can never walk back, and the vendor stops honouring it the moment the
  novelty wears off.
- **50% off your first order.** Buys a person who came for the discount and
  leaves with it. Bring a Tray acquires the same user for ₹25 and delivers them
  attached to a colleague who already eats there.
- **Cash or wallet-credit referrals.** Invites multi-account farming — and our
  phone and email columns are already unique, so the abuse shows up as support
  load, not revenue. Reward in food, unlocked only by a real paid order.
- **Always-on sitewide discounts.** A permanent discount is just a price cut with
  worse margins and a harder conversation with the vendor later. Every mechanic
  here has an expiry, a cap, or a condition.
- **Discounting the 12:30 peak.** That hour sells out on its own. Pushing more
  demand into the kitchen's worst moment produces long waits and a bad review of
  the one thing we promise. Discount the shoulder, never the peak.

---

## 5. What it takes to build

There is no coupon, wallet, referral, or loyalty table anywhere in the current
database. That's actually good news: we get to design the discount engine
correctly the first time instead of retrofitting it.

| Piece | Status | What it needs |
|---|---|---|
| `coupons` | To build | Code, type (percent / flat / free-item / charge-waiver), depth, cap per redemption, total budget, valid window in **IST**, cafeteria scope, funder (vendor or platform). |
| `coupon_redemptions` | To build | Unique index on `(coupon_id, user)` for single-use codes. Row-level lock when decrementing a budget — two phones hitting the last redemption at 11:14:59 is a certainty, not an edge case. |
| `wallet_ledger` | To build | Append-only credits and debits. Never a mutable balance column. Balance is a sum, so it can always be audited against payouts. |
| `referrals` / `streaks` | To build | Referral pairs with a same-day-both-ordered unlock; streak counter derived from *collected* orders, not created ones, so a cancelled order can't farm a streak. |
| Discount computation | Half there | `app/api/razorpay/create-order/route.ts` already refuses the client's amount and trusts the stored `total_amount` — exactly right. Extend that: the discount is computed **server-side at order insert** and re-derived before the Razorpay order is created. The client never sends a discounted figure, only a code. |
| Vendor coupon UI | To build | CRUD in the vendor dashboard with a mandatory budget cap and an auto-expiry, so nobody can leave a 50% code live over a weekend. |

### Where a coupon engine gets attacked

- **Race on the last redemption.** Concurrent requests both read `budget > 0` and
  both redeem. Fix: `SELECT … FOR UPDATE` on the coupon row inside the insert
  transaction, plus a unique constraint as the backstop.
- **Negative or zero totals.** A flat ₹100 code on a ₹60 order. Clamp the payable
  floor at ₹1 before it ever reaches Razorpay, and validate again in
  `create-order`.
- **Stacking.** Streak waiver plus Pass free delivery plus a vendor code on one
  bill. Declare an explicit precedence order and allow exactly one bill-value
  discount per order.
- **Expiry off-by-one.** Windows stored in UTC and compared against IST give away
  an extra 5½ hours of a campaign. Store the timezone with the window.
- **Code enumeration.** Short guessable codes plus an unthrottled validate
  endpoint equals a free lunch for whoever writes the loop first. Rate-limit per
  phone and per IP, and don't reveal whether a code exists or is merely expired.
- **Cancel-and-refarm.** Order, redeem, cancel, repeat. Attach redemption to the
  *collected* state, and reverse the redemption on refund.

---

## 6. Rollout — four phases, each with a gate

Don't ship the whole book. Each phase has to clear its gate before the next one
is funded — that's what keeps discount spend inside the 6% ceiling when things
get exciting.

**Phase 1 — Days 1–14 — Zero-code moves.**
Nothing shipped, nothing spent. Put a printed table tent with the QR and live
token board in both cafeterias. Start publishing the Minutes Saved number
manually from a weekly query. Sign both vendors to the Beat the Rush terms on
paper before building anything for it.
*Gate: both vendors signed + a baseline order curve by hour.*

**Phase 2 — Days 15–45 — The coupon engine and Beat the Rush.**
Build the coupon tables, the server-side discount path, and the redemption locks.
Ship exactly one campaign on top of it: the time-decaying morning discount. One
campaign is enough to prove the engine and it's the one that pays for itself.
*Gate: 20% of orders before 11:15, zero discount defects.*

**Phase 3 — Days 46–90 — Golden Token, streaks, referral.**
The habit and word-of-mouth layer, all three on the engine that's already
load-tested. Golden Token goes live with a daily cap and a visible reveal;
streaks and Bring a Tray follow a fortnight later so their effects can be read
separately.
*Gate: orders per active user per week above 3.0.*

**Phase 4 — Days 91–150 — Pass, wallet, and the vendor desk.**
Monetise the habit. Yoters Pass on a recurring UPI mandate, Yoters Change on top
of the wallet ledger, and the vendor coupon desk that lets promotions scale with
vendor count rather than with our spend. This is the phase that makes the next
twenty cafeterias cheap to launch.
*Gate: Pass revenue > total platform discount spend.*

---

## 7. The scoreboard — six numbers, reviewed weekly

If a campaign doesn't move one of these, it gets switched off. Note what's
missing from this list: order count and GMV on their own, which any discount can
inflate and which tell you nothing about whether the business works.

| Metric | Target | Why |
|---|---|---|
| Orders per active user, per week | 3.6 | The habit metric. Everything else is downstream of this one. |
| Share of orders before 11:15 | 35% | Proves the vendor is getting the forecast they paid for. |
| Discount as share of GMV | <6% | Blended across every program. Yoters' own portion under 2%. |
| Referral share of new users | 30% | The cheap channel. If it stalls, the reward isn't worth claiming. |
| D30 repeat rate | 55% | Of everyone who ordered once, who is still ordering a month later. |
| Minutes saved per week | 4,800 | The public number. Also the honest measure of whether we're useful. |
