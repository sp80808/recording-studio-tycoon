# Specialist freelancer network (#69, first slice)

Freelancers are lightweight contacts, not a second roster. Where a stage's work matches a contact's specialty, the session panel offers outside help for a fee; otherwise nothing interrupts the player. On a phone the offer is a one-line chip that opens the list.

## Rules

- 12 authored contacts in `src/rpg/freelancers.ts`: mix, master and session musician, three rate bands. Three are known from the start (one per specialty). The rest unlock through a premises tier, a Regular or Loyal client, two staff, or a referral from a contact after two good jobs together.
- Stage matching is by stage name (`specialtiesForStage`): "Mix" stages want mix engineers, "Master" stages mastering engineers, overdub and live-take stages session musicians. "Mixing & Mastering" accepts either.
- **Fee** = band base ($40, $75, $150) scaled by the stage's work units (0.6x to 1.6x). Familiarity gives a preferred rate (2 jobs, 10% off) and a regular rate (4 jobs, 18% off).
- **Quality**: the booked stage's creativity and technical gains are multiplied by 1 + uplift (band 4%, 8% or 12%, plus 3% for a genre they know, minus 3% for one they do not). It applies only to that stage, only from the day the specialist arrives, and the figure is locked when booked.
- **Availability**: lead time is the band's base (0, 1 or 2 days), plus 1 in a busy week (seeded by save seed, contact and week), plus 1 per recent booking beyond one in the last 7 days ("limited availability"), minus 1 once familiarity reaches 3. Reliability can add a day of slip, decided once at booking. Lead time never lowers quality. Arriving after the project deadline shows a warning.
- **No reroll**: offers derive from (save seed, day, contact, project); an arranged stage stores its terms on the project.
- **Margin**: arranged fees are part of the #51 quote's direct costs, so the margin falls by exactly the fee. Before booking, the quote line says outside help exists and from what price, without charging for it.
- **Internal advantage**: stages handed to a specialist do not train the crew. Staff career credit skips those stages and role XP and discipline XP scale with the crew's share of the stages. In-house work also costs nothing.
- **Delivery**: a delivery at quality 55 or better adds one point of familiarity per contact used (once per project). Familiarity buys a better rate, easier scheduling and referrals, never a quality bonus. A new contact is announced in the review.
- **Ledger**: fees book as `freelancer-fee`, idempotent per project and stage.

## Why no contact always wins

Each offer shows an expected net: payout times the stage's share times the uplift times `QUALITY_TO_PAYOUT` (2.5), less the fee. The test samples the real payout range ($527 to $2,838) and requires every contact to be worth it on some jobs and not on others (low payouts and genre mismatches lose; high payouts and genre matches win). The constant is a tuned hint, not a measured elasticity; revisit it with the Balance Lab.

## Not in this slice

Label-account and venue contact sources, a mid-session "arrives later" calendar slot (#61 integration beyond lead days), preferred-rate packages, delegation policy, a contacts screen outside the session, telemetry events.
