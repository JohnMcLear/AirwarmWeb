# /card/ — Airwarm contact card (NFC endpoint)

## The rule this directory exists to protect

**`https://airwarm.co.uk/card/airwarm.vcf` is written into physical NFC cards.**

Once a card is programmed and handed to somebody, its destination can never be
changed. Renaming this directory, moving `airwarm.vcf`, or deleting either one
silently breaks every card already in circulation — the person taps it and gets
a 404, and there is no way to reach them to apologise.

If the site is restructured later, **keep these two URLs working**:

- `/card/` — the human-readable landing page
- `/card/airwarm.vcf` — the contact file itself

Redirect them to wherever things move. Do not delete them.

## What to programme into the NFC cards

    https://airwarm.co.uk/card/airwarm.vcf

That points straight at the contact file, so a tap goes directly to "Add
contact" on both iPhone and Android without an intermediate page.

Use `https://airwarm.co.uk/card/` instead if you would rather people land on a
page that explains what they are saving before they save it. Both work; the
first is one tap shorter.

## Regenerating airwarm.vcf

The file is **generated, not hand-edited**. It carries the Hero Mark as an
embedded base64 PNG, which is why it is 120 KB of mostly unreadable text.

To change the details or the photo, edit `make-vcard.py` and re-run it:

    python3 card/make-vcard.py

It needs `cairosvg` to rasterise the mark. With `uv` installed:

    uv run --with cairosvg python3 card/make-vcard.py

### Why the photo is embedded rather than linked

A vCard can reference a photo by URL, but contacts apps fetch it inconsistently
and iOS frequently ignores it. Embedding means the mark is saved into the
contact at the moment it is added, and keeps working offline afterwards.

### Why PNG rather than the SVG

Contacts apps on iOS and Android do not render SVG. The mark is rasterised from
`assets/brand/hero-mark.svg` — which stays the source of truth — at 400×400,
which is enough for a retina contact photo without making the file huge.

## Format notes

vCard 3.0, not 4.0. 3.0 is what Apple Contacts, Google Contacts and Outlook all
import without complaint; 4.0 support is still patchy.

The file uses CRLF line endings and folds long lines at 75 octets with a leading
space on continuations, both of which RFC 2426 requires. Some parsers are strict
about it. If you edit the file by hand you will almost certainly break the
folding — use the script.
