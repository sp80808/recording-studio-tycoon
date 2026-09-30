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

## Ideas for later (not built)
- Third-beat "consequence" stage for the highest-impact callbacks.
- More title-keyed callbacks (Act III titles are flags too, but the campaign ends with them).

## Checks
`tests/callback-subplots.check.ts` (run by `pnpm test`): unique ids, two stages, unique flags, gating on flags and era, every callback reachable from an existing flag.
