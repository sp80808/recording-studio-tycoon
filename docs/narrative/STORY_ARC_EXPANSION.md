# Story Arc Expansion: Callback Subplots

## What exists
- **Campaign spine** (`branchingStorylineEngine.ts`): 3 acts, branch dilemma between acts, four finales (`endings.ts`), each closed by a rival.
- **Playstyle arcs** (`storyArcs.ts`): one 3-chapter arc per playstyle.
- **Emergent subplots** (`subplotCatalog.ts`): two-beat dilemmas, era-gated, each leaving a story flag.

## Gap
Subplot flags only affected the ending epilogue. Choices did not change what the game offered next, so branching felt cosmetic mid-game.

## Addition: callback subplots (`callbackSubplots.ts`)
Ten two-beat subplots that spawn only after the player left a specific flag in an earlier subplot. They use the existing `EmergentSubplot` shape and are merged into `EMERGENT_SUBPLOTS`, so no engine, save or UI changes were needed.

| Callback subplot | Needs one of | Theme |
|---|---|---|
| The Union Remembers (1960s) | `signed_union_scale`, `stalled_union` | labour reputation pays off or bites |
| The Crew Gets an Offer | `gave_crew_time_off`, `pushed_the_crew`, `offered_profit_share`, `kept_status_quo` | crew loyalty earned or not |
| The Format Comes Due (60s/80s) | `went_stereo`, `defended_mono`, `went_big_eighties`, `kept_it_raw` | signature sound as brand |
| The Sample Comes Back (80s/2000s) | `settled_sample_claim`, `fought_sample_claim`, `replayed_the_sample`, `weaponised_the_lawsuit` | legal paper trail |
| The Leak Has a Legacy (2000s/2020s) | `embraced_the_leak`, `chased_the_leak`, `locked_down_studio` | fan communities, reunion |
| The Clean Record (2000s/2020s) | `declined_payola`, `refused_voice_clone`, `published_voice_policy`, `published_case_study` | integrity tested twice |
| The Favours Come Due | any compromise flag (syndicate, ghost contract, payola, voice clone, etc.) | the bill for shortcuts |
| The Star Looks Back | any hometown-hero flag, rep >= 45 | legacy, credit, the crew |

Their own flags feed the epilogue: `held_the_line`, `confessed_old_deal`, `credited_the_crew`, `vouched_for_scale`, `owned_signature_sound` and `guaranteed_clean_master` earn "remembered for" lines; `took_the_second_offer`, `stonewalled_journalist`, `skipped_union_meeting`, `skipped_team_dinner` and `took_the_spotlight` count as compromises.

## Also built
- **Chronicle link:** each callback has a `becauseOf` map; its first beat is logged as "Because you signed the union scale: …" so the player sees the cause.
- **Rival finale codas:** each rival has a few closing sentences in their own voice keyed to choices that touch their world (e.g. Silas on mono and signature sound, Chad on payola and voice clones, Roxy on leaks and credit, Dr. Thorne on voice policy and disclosure). The first matching flag wins; generic codas (`held_the_line`, `took_the_second_offer`, `confessed_old_deal`, `stonewalled_journalist`, `credited_the_crew`, `took_the_spotlight`) are the fallback.
- **Title callback:** `subplot_title_reputation` spawns once the studio has earned an Act I/II campaign title (`Studio Trailblazer`, `Tone Connoisseur`, `Commercial Machine`), tying the campaign spine to the subplot layer.

## Industry-history subplots (`industrySubplots.ts`)
Twelve two-beat subplots that dramatise real turning points in recording history. Pop culture appears only by allusion (no real names, brands or quotes; a test enforces this).

| Era | Subplot | Real-world echo |
|---|---|---|
| 1960s | The Disc Jockey's Envelope | radio payola scandals and hearings |
| 1960s | The Echo Chamber | the "wall of sound" and basement echo chambers |
| 1960s | The Record With No Singles | the studio as instrument; album-as-art-form turn |
| 1980s | The Happy Accident | gated-reverb drums from a talkback mic |
| 1980s | The Machine in the Corner | drum-machine panic among session drummers |
| 1980s | The Global Jukebox | all-star charity single and the credits row |
| 2000s | The Loudness War | brickwalled masters vs dynamics |
| 2000s | The Perfect Voice | hard pitch-correction as effect, and the live show |
| 2000s | The Talent Show Winner | televised-contest winners on a deadline |
| 2020s | The Girl Who Studies Forever | endless lo-fi study streams |
| 2020s | The Fifteen-Second Hook | short-video revival of a back-catalogue track |
| 2020s | The Pressing Plant Waiting List | vinyl revival and pressing bottlenecks |

### Design rules applied
These come from general tycoon/management-game practice, not from reviews of this specific game (none were available to me):
- every choice is a trade-off; a test rejects any pair where one option is strictly better on both money and reputation;
- costs are bounded (no option costs more than $1,500) so early-era studios are never locked out;
- humour is dry and situational, with no fourth-wall jokes;
- every option leaves a unique flag, which later callbacks and epilogues can read;
- each era has at least three, so a long campaign does not exhaust its era's pool.

## Ideas for later (not built)
- Third-beat "consequence" stage for the highest-impact callbacks.
- More title-keyed callbacks (Act III titles are flags too, but the campaign ends with them).

## Checks
`tests/industry-subplots.check.ts` covers the industry subplots; `tests/callback-subplots.check.ts` (both run by `pnpm test`): unique ids, two stages, unique flags, gating on flags and era, every callback reachable from an existing flag.
