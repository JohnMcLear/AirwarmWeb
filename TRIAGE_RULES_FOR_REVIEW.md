# Home Energy Assessment — triage rules for review

**For: Thomas Robinson. This needs your sign-off before the assessment form goes live.**

## Why this document exists

The Airwarm website pack specifies the Home Energy Assessment's four stages
and the three possible outcomes, word for word:

- Likely suitable
- Potentially suitable
- Not currently suitable

What it does **not** contain anywhere is a rule saying which answers lead to
which outcome. That means any working form has to make a judgement the
documentation has never made.

Rather than bury an invented ruleset inside the code, every threshold is a
named value in a single config object at the top of `js/assessment.js`, marked:

```
UNAPPROVED PLACEHOLDER LOGIC — requires Thomas Robinson's sign-off before
this form goes live.
```

This document lists every one of those values as a plain-English question.
Answer the questions, change the matching numbers in `js/assessment.js`, then
delete the warning comment block. Until you do, the form tells the visitor its
result is indicative and that a person makes the real judgement.

## How the placeholder logic currently works

It is deliberately simple, so it is easy to argue with.

1. Each answer is worth a number of points. More points means the answer
   points towards a heat pump working well. The maximum possible total is 26.
2. The total is compared against two thresholds to get an outcome.
3. A short list of specific answers can then **cap** the outcome — pull it
   down regardless of score — and each cap produces a written explanation the
   visitor sees, so the result is never a bare label.
4. "Not sure" always scores zero. Nobody is penalised for honesty.
5. Nothing produces a blunt rejection. The "not currently suitable" text
   explains the constraint and offers a route forward.

Everything below is a question about one of those numbers.

---

## Part 1 — The two thresholds

These are the most important numbers in the whole file.

1. The maximum score is 26. Placeholder says **17 or above = "Likely
   suitable"**. Is 17 about right, too generous, or too strict?
2. Placeholder says **10 to 16 = "Potentially suitable"**, and **below 10 =
   "Not currently suitable"**. Is 10 the right floor?
3. Bigger question: is a points score the right approach at all? The
   alternative is a decision tree — a series of yes/no gates in a fixed
   order. If you would rather have that, say so and it can be rebuilt; the
   scoring is not baked into anything else.
4. Should "Likely suitable" be harder to reach than "Potentially suitable" is
   to reach, i.e. should most enquiries land in amber by default?

## Part 2 — Property type (stage 1)

Placeholder points: detached 2, semi-detached 2, bungalow 2, end-terrace 1,
mid-terrace 1, back-to-back 0, flat 0.

5. Should a bungalow really score the same as a detached house?
6. Should a mid-terrace score lower than an end-terrace, given the outdoor
   unit siting problem, or is a terrace's lower heat demand a fair trade?
7. Back-to-backs score 0 rather than negative. Should a back-to-back
   effectively be capped at "Potentially suitable" because of the
   single-elevation problem, however good the rest of the answers are?
8. Flats score 0. Should a leasehold flat be capped lower, given the
   freeholder permission problem, or handled with different copy entirely?

## Part 3 — Property age (stage 1)

Placeholder points: 2003 or later 3, 1976–2002 2, 1945–1975 1, 1919–1944 1,
pre-1919 0, not sure 0.

9. Is pre-1919 at zero fair? A well-insulated stone terrace can perform
   perfectly well, and Bradford and Shipley are full of them. Should age carry
   less weight than insulation, which is currently worth the same maximum?
10. Should 1919–1944 and 1945–1975 really score the same? They are quite
    different constructions.

## Part 4 — Current heating (stage 1)

Placeholder points: oil 2, LPG 2, electric storage heaters 2, direct electric
2, mains gas 1, solid fuel 1, existing heat pump 1, no working heating 1.

11. The assumption is that homes off mains gas have the most to gain, so they
    score higher. Do you agree, and are those the right relative weights?
12. Should an **existing heat pump** be treated as a different enquiry
    altogether — a servicing or optimisation lead rather than an installation
    one — and be routed to different copy?
13. Should "no working heating at present" score higher, since it is urgent,
    or lower, since urgency and heat pump timescales sit badly together?

## Part 5 — Bedrooms (stage 1)

14. Bedrooms are asked for (the pack specifies it) but currently score
    **nothing at all**. Should the count affect the outcome, or is it purely
    context for a human reading the enquiry?

## Part 6 — Insulation, windows and radiators (stage 2)

Placeholder points — insulation: good throughout 3, partial 1, limited −1,
not sure 0. Windows: double or triple throughout 2, mixed 1, mostly single
−1, not sure 0. Radiators: modern and generous 2, standard 1, underfloor or
none 1, small or old 0, not sure 0.

15. Insulation and windows are the only two questions that can score
    **negative**. Is that right, and is −1 strong enough or too strong?
16. Is insulation the single most important answer in the whole form? At
    present it is worth the same as outdoor space and hot water. Should it be
    worth more?
17. Underfloor heating currently scores 1, the same as standard radiators.
    Should it score higher, since it is well suited to low flow temperatures?
18. Should "small or old radiators" be negative rather than zero, or is it
    fine because it is usually solvable?
19. Homeowners are not reliable judges of their own insulation. Should the
    weight of that answer be reduced because of that, or should the copy just
    warn about it more clearly?

## Part 7 — Outdoor space and hot water (stage 2)

Placeholder points — outdoor space: clear space 3, possibly tight 1, no
obvious location 0, not sure 0. Hot water: existing cylinder 3, space
available 2, no space identified 0, not sure 0.

20. **"No obvious outdoor location" currently caps the result at "Not
    currently suitable".** That is the harshest rule in the file. Is it
    right? The counter-argument is that homeowners often cannot see a
    position that an engineer would find immediately.
21. **"I cannot see where a cylinder would go" currently caps the result at
    "Potentially suitable".** Is that the correct severity — is it a smaller
    obstacle than outdoor space?
22. Should "not sure" on outdoor space be treated more cautiously than it is,
    given how decisive that answer turns out to be?

## Part 8 — Listed, conservation area or leasehold (stage 2)

Placeholder: answering "yes" caps the result at "Potentially suitable" and
adds an explanation. It carries no points either way.

23. Is capping at amber right, or should this only add a note without
    affecting the outcome? The three situations are lumped together at the
    moment.
24. Should they be split into three separate questions? A listed building, a
    conservation area and a leasehold flat are genuinely different problems,
    and Saltaire alone probably justifies separating listed status out.

## Part 9 — Plans, timescale and willingness (stage 3)

Placeholder points — renovation: major 2, some work 1, none 0. Timescale:
within six months 1, six to twelve months 1, over a year 0, just researching
0. Emitter willingness: yes if needed 3, possibly 1, would rather not 0.

25. **"I would rather keep the radiators as they are" currently caps the
    result at "Not currently suitable".** This is the second harshest rule.
    Is refusing emitter changes really that decisive, or should it cap at
    amber with copy that explains the trade-off and invites a conversation?
26. Should timescale affect **suitability** at all? A researcher in two
    years' time may be a perfectly suitable property. Arguably timescale is a
    sales-priority question, not a technical one — it could be removed from
    the scoring and used only to sort the enquiry.
27. Is "major renovation" worth 2 points? The case for it is that fabric and
    emitter work can be absorbed into a larger project.
28. Reason for enquiry and interest in solar or battery currently score
    **nothing**. Should either affect the outcome, or are they context only?

## Part 10 — The capping rules as a set

The five rules currently in `constraintsThatCapTheOutcome`:

| Rule | Trigger | Caps at |
|---|---|---|
| No outdoor location | No obvious outdoor position | Not currently suitable |
| No hot water space | Cannot see where a cylinder would go | Potentially suitable |
| Emitters not negotiable | Would rather keep radiators as they are | Not currently suitable |
| Poor fabric, no plan | Very little insulation **and** no work planned | Potentially suitable |
| Restricted property | Listed, conservation area or leasehold | Potentially suitable |

29. The Airwarm manual's rejection principles (section 6.4) also list
    **unrealistic budget or timescale** and **technical risks that cannot be
    responsibly resolved**. Neither is asked about, because the form collects
    no budget question and asking one would change the tone of the first
    interaction. Should a budget question exist at all?
30. "Poor fabric, no plan" only triggers when the visitor says insulation is
    limited **and** no work is planned. Is that combination the right test?
31. Are there constraints missing from this list that you meet in practice?
32. Can any answer or combination make the outcome **better** than the score
    suggests? Currently nothing can; caps only ever pull a result down.

## Part 11 — Service area

Placeholder: outward postcode prefixes `BD`, `LS`, `HD`, `HX`, `WF` are
treated as in-area. An unrecognised prefix does **not** change the outcome; it
only adds a line saying we may be outside the area and inviting an e-mail.

33. Is that the right prefix list at launch? It is wider than Bradford, Leeds
    and Shipley, and covers Huddersfield, Halifax and Wakefield, which the
    pack says are a later tier.
34. Should being out of area affect the outcome at all, or is a note the right
    treatment?

## Part 12 — The wording

The three outcome labels and their explanatory paragraphs come from
`Result_Copy.md` and are approved, so they have not been changed.

35. The "not currently suitable" heading has been written as *"A heat pump may
    not be the best next step for your home today"*, so no visitor ever sees a
    bare "Not currently suitable" as a headline. Is that the right tone?
36. When a cap fires, the visitor is shown a written explanation of the
    specific constraint. Please read those five explanations in
    `js/assessment.js` and correct the technical wording — that is the copy
    customers will actually judge us on.
37. Should the result mention what a survey would cost, or resolve, once
    pricing is settled? It deliberately says nothing about money at the moment.
38. A visitor who answers "not sure" to most questions currently scores very
    low and lands on "Not currently suitable" with no specific obstacle to
    point at. Rather than leave them with a bare label, the result explains
    that the answer is being held back by missing information rather than by
    their property, and invites a conversation. Is that the right handling, or
    should a high number of "not sure" answers produce a fourth response
    altogether — something like "we need a bit more information"? The count of
    "not sure" answers is available in the code but deliberately does not
    affect the outcome at present.

---

## What to do with this

1. Work through the 38 questions above. Short answers are fine.
2. Change the matching values in `AIRWARM_TRIAGE_CONFIG` in
   `js/assessment.js`. Every question maps to a named value in that object.
3. Test the form: answer as a well-insulated modern detached house, as a
   solid-wall terrace with no outdoor space, and as a middling semi, and check
   the three results read the way you would say them out loud.
4. Delete the `UNAPPROVED PLACEHOLDER LOGIC` comment block once you are happy.
5. Note the separate issue: the form currently collects **no** contact details
   at all, because there is no CRM, no privacy policy and no registered data
   controller. See `HANDOVER.md`. The triage sign-off and the data question
   are independent — both need resolving before this form goes live.
