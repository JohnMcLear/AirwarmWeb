# Handover notes

The Airwarm launch website, built as a static site. This document covers what
exists, what has been deliberately left unfinished and why, and what decisions
are needed before it can go live.

Read `README.md` first if you want to edit something. Read
`TRIAGE_RULES_FOR_REVIEW.md` if you are Tom and you are looking at the
assessment logic.

---

## 1. What is built

Fifteen pages plus an error page. All of them are plain HTML with one shared
stylesheet and, on one page only, one small JavaScript file. No framework, no
build step, no package manager, no dependencies.

| Page | Address | Notes |
|---|---|---|
| Home | `/` | All thirteen blueprint sections, in order |
| Air Source Heat Pumps | `/air-source-heat-pumps/` | Service page template |
| How It Works | `/how-it-works/` | The eight-step sequence |
| Home Energy Assessment | `/home-energy-assessment/` | The four-stage form |
| Heat Pump Survey | `/heat-pump-survey/` | Service page template |
| Installation | `/heat-pump-installation/` | Service page template |
| About Airwarm | `/about/` | Thomas Robinson, Founder & Director |
| Advice | `/advice/` | Index of planned guides only |
| Contact | `/contact/` | E-mail routing, no form |
| Bradford | `/areas/bradford/` | Distinct local content |
| Leeds | `/areas/leeds/` | Distinct local content |
| Shipley | `/areas/shipley/` | Distinct local content |
| Privacy policy | `/privacy/` | Marked stub |
| Cookie policy | `/cookies/` | Marked stub |
| Terms and conditions | `/terms/` | Marked stub |
| Not found | `/404.html` | Served automatically by Pages |

The URLs come straight from the sitemap in the brand pack and have not been
changed. Each page is a folder with an `index.html` inside it, so the
trailing-slash addresses work.

Phase 2 pages from the sitemap — Servicing & Support, Property Developers,
Case Studies — have not been built. The Servicing & Support navigation link is
in the header as a commented-out line, ready to uncomment when the page exists.

### Also in the repository

- `css/airwarm.css` — the only stylesheet. Built on the supplied design
  tokens. The eight approved brand colours are the only colour values in it;
  where a translucent tint was needed it is an `rgba()` version of navy or
  white rather than a ninth colour.
- `js/assessment.js` — the only JavaScript, used on one page.
- `sitemap.xml`, `robots.txt`, `.nojekyll`, `.gitignore`.
- Per-page `<title>` and meta description, canonical link and Open Graph tags.

### What was verified, with commands rather than assumption

- All sixteen HTML pages exist at their specified addresses.
- Every internal link in every page resolves to a file that exists (16 files
  checked, no broken links).
- The sitemap lists all fifteen real pages and nothing that does not exist.
- The header block is byte-identical across all sixteen pages apart from the
  `aria-current` marker for the current page; the footer block is
  byte-identical across all sixteen with no exceptions.
- The only hex colours in the stylesheet are the eight approved brand values.
- The only external host referenced anywhere is Google Fonts. Nothing else
  loads from a third party.
- No prices, currency symbols, savings figures or grant amounts appear
  anywhere.
- No phone number appears anywhere, including in commented placeholders.
- The internal plan name appears nowhere in any file, comment, metadata,
  filename or commit message.
- `js/assessment.js` passes `node --check`, and every answer offered in the
  form maps to a scored value in the config, with no orphans in either
  direction.
- The triage logic was run against six scenarios, including the maximum score,
  a worst case, and a visitor who answers "not sure" to everything.

---

## 2. What is deliberately stubbed, and why

### The legal pages are stubs

`/privacy/`, `/cookies/` and `/terms/` say plainly that the document is being
prepared and point people at the e-mail address. No legal text has been
written. Each page carries an HTML comment listing exactly what must be
drafted. Fabricating legal wording, or copying it from another company's site,
would be worse than an honest placeholder.

### There is no cookie banner and no analytics

There is nothing to consent to. The site sets no cookies, uses no local
storage and loads no tracking of any kind. Adding either analytics or a
consent banner is a launch requirement (see decisions 3 and 7), and they have
to arrive together: the moment an analytics cookie is set, a banner and a
cookie policy become legally necessary.

### The assessment collects nothing

Stages one to three of the Home Energy Assessment run entirely in the
visitor's browser. Nothing is posted, saved or transmitted. Stage four shows
the outcome and invites an e-mail rather than asking for name, e-mail, phone
and consent as the original flow specified.

That is because there is currently nobody to be responsible for the data. The
company is not registered, no CRM has been chosen and no privacy policy
exists. The roadmap has the website live in August or September and company
registration in October, so there is a window where the site would be
collecting personal data on behalf of an organisation that does not legally
exist yet. Rather than build that and hope, the form has been built to work
without it.

There is one commented wire-up point in `js/assessment.js` for the real
endpoint. Nothing else needs to change when the decision is made.

### The triage logic is placeholder

The pack specifies three outcomes and their exact copy but contains no rule
mapping answers to an outcome. Every threshold is a named value in one config
object at the top of `js/assessment.js`, under a comment block marking it as
unapproved. `TRIAGE_RULES_FOR_REVIEW.md` restates all 38 of those decisions as
plain-English questions. Nothing about the logic is hidden in the code.

### There are no images at all

No photography, no logo file, no favicon, no share image. The pack contains no
image assets, and the brief was explicit that stock photography must not be
used and that the circular emblem must not be redrawn or approximated. So the
site uses navy panels, generous type and simple hand-drawn inline SVG line
icons. Every place a real photograph belongs is marked with a comment.

The identity in the header and footer is a text wordmark: AIRWARM in white on
navy with the tagline in the fixed colour order. Both instances are marked
`LOGO SWAP POINT` with instructions.

### There are no trust signals beyond what is true

No reviews, testimonials, star ratings, accreditation badges, MCS or Which?
Trusted Trader marks, customer counts or years in business. The company has
not started trading, so none of it can be stated honestly.

The homepage trust section instead uses the three things that are true today:
the documented process, the suitability-first approach and the aftercare
commitment. Two visible slots explain that reviews and photographs will appear
when they are real, and five further evidence slots are marked in comments.

### The advice page has no articles

Eleven planned guides are listed as clearly-labelled "planned" entries, taken
from the content strategy in the manual. None is written, none is linked, and
no technical guidance has been fabricated to fill the page out.

### One thing worth flagging that was not in the brief

The primary button is orange with dark text rather than blue with white text.
The brand rules allow either, and ask for one consistent choice. White on the
brand blue reaches only 3.9:1 contrast, which fails the accessibility
threshold for normal-size text; dark text on the brand orange reaches 7.5:1.
The reasoning is written into the stylesheet at section 05 so nobody
"corrects" it later.

---

## 3. Decisions still needed before this can go live

Numbered so they can be referred to in conversation. Roughly in order of how
much else depends on them.

### 1. Who is the data controller?

Nothing else about forms can be resolved until this is. The company is not
registered, and the roadmap puts registration after the website goes live. So
either the website launches collecting nothing (as it does now), or an
identified legal person or entity takes responsibility for enquiry data in the
interim. This needs a decision, not a default.

### 2. Which CRM or form endpoint?

No CRM has been chosen, so the assessment and the contact page have nowhere to
send anything. Once chosen, there is a single commented wire-up point in
`js/assessment.js` and a marked location on `/contact/`. Both need spam
protection that does not depend on a third-party tracker.

### 3. Privacy policy text

Must exist and be published at `/privacy/` **before** any form on this site
collects anything. The stub page lists what it has to cover: named controller,
what is collected and when, lawful basis, retention, who it is shared with,
data subject rights, complaints route including the ICO, ICO registration, and
the Google Fonts request every page makes.

### 4. Cookie policy text and, if needed, a consent banner

Nothing is required today because nothing is set. This becomes urgent the
moment analytics, advertising or any non-essential cookie is added. Do not add
one without the other.

### 5. Terms and conditions text

Website terms, consumer contract terms for surveys and installations,
cancellation rights and cooling-off period, payment and deposit terms,
warranty scope and exclusions, and the complaints procedure. Partly gated on
decision 10, because the certification route determines the consumer-code
obligations and therefore some of the wording.

### 6. Triage sign-off

`TRIAGE_RULES_FOR_REVIEW.md`, 38 questions, for Thomas Robinson. Two of the
rules are worth looking at first: "no obvious outdoor location" and "I would
rather keep the radiators as they are" both currently pull the result down to
"Not currently suitable" regardless of everything else, and both are arguable.
The form should not go live until these are reviewed.

### 7. Analytics and Search Console

The launch checklist requires both. Neither is installed, because installing
analytics without a privacy policy and a cookie policy is not defensible.
Sequence: decisions 3 and 4, then analytics, then submit the sitemap to Search
Console.

### 8. GitHub Pages on a private repository — a plan question

Enabling Pages was attempted and refused. The exact error was:

```
$ gh api -X POST repos/JohnMcLear/airwarm-website/pages \
    -f 'source[branch]=main' -f 'source[path]=/'

{
  "message": "Your current plan does not support GitHub Pages for this repository.",
  "documentation_url": "https://docs.github.com/rest/pages/pages#create-a-apiname-pages-site",
  "status": "422"
}
gh: Your current plan does not support GitHub Pages for this repository. (HTTP 422)
```

GitHub Pages on a private repository requires a paid plan — Pro, Team or
Enterprise. The repository has deliberately **not** been made public to work
around this, and no workaround has been applied. This is a decision for John:

- upgrade the account or move the repository to a paid organisation, and keep
  it private; or
- make the repository public, accepting that the source becomes visible
  (there is nothing confidential in it, but that is a choice to make
  knowingly, not by default); or
- host the built files somewhere else entirely, which is trivial, since the
  site is static files with no build step.

Nothing in the site depends on which route is chosen.

### 9. Domain and link paths

Links are written root-relative (`/about/`, `/contact/`) because the brand pack
fixes those addresses and because it keeps the header identical on every page.
They resolve correctly at the root of a domain such as `airwarm.co.uk`. They
will **not** resolve on a `username.github.io/airwarm-website/` style preview
address, where every page sits inside a sub-folder.

So the custom domain needs pointing at whatever hosting is chosen in decision
8. Everything works once it is.

### 10. MCS or umbrella certification route

Undecided, and it gates more than it looks like it does: grant messaging,
consumer-code obligations, contract wording and the planned "Grants and
funding" guide. Three pages currently say, honestly, that the route is being
finalised and invite an e-mail. Those passages need rewriting once it is
settled.

### 11. Logo and favicon assets

No vector emblem exists in the pack, so the header and footer use a text
wordmark and there is no favicon at all. Needed: the circular emblem as SVG or
high-resolution PNG, a compact version for mobile, `favicon.ico`, an SVG
favicon and a 180px Apple touch icon. Every swap point is commented, in both
the header and footer markup and in the `<head>` of every page.

### 12. Real photography

The pack asks for tidy plant rooms, well-finished pipework, respectful work
practices, customer handovers, real West Yorkshire homes and a genuine founder
photograph. None exists. Commented placeholders mark where each belongs, and
the brief was explicit that stock photography must not be used to fill the gap
in the meantime.

### 13. Business phone number

VoIP is not provisioned, so no number appears anywhere — not in the footer,
not on the contact page, and not as an example inside a comment. Two commented
placeholders mark where it goes. Add it to the footer and the contact page at
the same time so the two never disagree.

### 14. Company registration details

The footer says registration and VAT details will appear once confirmed. Add
the registered name, company number, registered office and VAT number to the
footer when they exist — remembering that the footer is identical on all
sixteen pages.

### 15. Complaints procedure and accessibility statement

Both are named in the footer structure in the brand pack, and neither exists,
so neither is linked. The footer has a comment marking where the links go.

### 16. SEO titles for six pages

The SEO page map covers Home, Air Source Heat Pumps, Bradford, Leeds, Shipley
and Survey. Those six use the exact titles specified. The other pages — How It
Works, Home Energy Assessment, Installation, About, Advice, Contact and the
three legal stubs — have titles written in the same house pattern, and the
meta descriptions across all pages were drafted rather than taken from the
pack. Worth a read-through.

### 17. Local content review

Bradford, Leeds and Shipley are written about genuinely different housing
stock, from general, publicly checkable characteristics. Nobody with first-hand
experience of working on those properties has read them. Each page carries a
comment marked `FOR TOM: LOCAL KNOWLEDGE REVIEW NEEDED`. The practical
constraints are the parts most worth checking, because they are the parts a
customer will test.

### 18. Copy approval

The approved copy from the pack has been used verbatim where it exists: the
hero, the tagline, the suitability message, the assessment message and the
three outcome paragraphs. Everything else was written for this build in the
documented tone of voice, and has not been approved by anyone. It is worth
reading the homepage and the three service pages properly before launch.

---

## 4. Things not to do

Collected here because they are easy to undo by accident, and because a future
editor or an AI assistant will suggest most of them.

- Do not add analytics, tracking or a cookie banner before decisions 3 and 4.
- Do not add prices, "from" figures, savings claims or grant amounts.
- Do not add reviews, testimonials, star ratings, badges or accreditation
  marks until they are real and current for Airwarm itself.
- Do not add a phone number until one exists.
- Do not add stock photography, and do not load images from another website.
- Do not redraw or approximate the circular emblem.
- Do not reorder or recolour the tagline. Orange, blue, green.
- Do not introduce a ninth colour.
- Do not change the header or footer in one file only.
- Do not add a framework, a bundler, npm or a build step. The whole point is
  that this deploys as-is and can be edited without installing anything.
- Do not paste anything from the wider Airwarm business pack into this
  repository. It is confidential, and none of it is here.
