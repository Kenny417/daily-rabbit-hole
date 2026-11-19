# Run log — 2026-11-18

## Archive check
- `posts/` and `state/` existed but were empty. There was no `publications.json` and no prior articles, so nothing had been published today and no topics needed deduplicating.

## Candidates considered
1. **Tide-predicting machines and the D-Day tide forecasts** (technology/history, UK and US). Highly unexpected, with strong institutional and peer-reviewed sources and a clear causal story. **Selected.**
2. **The accidental discovery of Prussian blue, Berlin c. 1706** (art/chemistry, Germany). Good human interest, but sources say the accident story is partly legendary and priority claims are disputed (Diesbach, Dippel, Frisch). Held for a possible future article that treats the legend critically.
3. **Pheasant Island, the Franco-Spanish condominium that changes administration every six months** (geography). Rejected as fairly widely circulated trivia with less explanatory depth.

## Research performed
- Web searches on Old Brass Brains, the Doodson/Liverpool D-Day work, Prussian blue, the Woodworth (2020) paper, Parker (2011), and Kelvin's 1872 machine.
- Pages read in full through the web-fetch tool:
  - Parker, "The tide predictions for D-Day," *Physics Today* (2011), full text.
  - Woodworth, "Tide prediction machines at the Liverpool Tidal Institute," *HGSS* (2020). Main text read on the HTML page. The footnotes were only summarised by the fetch tool, and no footnote-only claim was used.
  - Science Museum Group object record co53901 (Thomson's 1872 machine).
  - NOAA Tides & Currents, "Tide Predicting Machines."
  - NOAA Ocean Service, "150 Years of NOAA Tide Tables."
  - tide-and-time.uk/node/11 (D-Day predictions) and node/12 ("Military importance"). node/12 was read but not cited.

## Verification problems and how they were handled
- **Date of the Bidston Kelvin machine:** Parker's figure caption says 1872 (overhauled 1942), tide-and-time node/11 says 1924, and Woodworth says it was bought in 1925 from Kelvin, Bottomley and Baird. The article follows Woodworth and states the discrepancy openly.
- **Completion date of Old Brass Brains:** NOAA says 1910 and Parker says 1912. Both are given in the article.
- **Doodson guessing Normandy:** Supported by Parker and tide-and-time (which draws on Parker). Woodworth does not mention it. The article attributes it to Parker, and no direct Doodson quotation is used.
- **Farquharson's quoted letter text:** Appears in both Parker and tide-and-time, so it is quoted.
- **Claims removed during the audit:** a vague comparison with hand computation, an invented "half an hour error" example, an unread "1860s" date, and a speculative explanation of Rommel's reasoning.
- **Not used:** NOAA's "125 people" comparison (it comes from a video page that wasn't read) and the Olson/Doescher figure of 1.5 m per hour (the letter wasn't read).

## Result
- Published: `posts/2026/11/2026-11-18-position-z-d-day-tide-machines.md`
- Length is roughly 1,250–1,300 words of body text, slightly above the 800–1,200 target. It was kept at that length so the sourcing caveats could stay in.

## Outstanding uncertainties
- How Farquharson derived his constants is not known; the article presents Parker's view as probable, not established.
- Parker describes Rommel's obstacles as both "thousands" and "millions", so the article gives no count.

## Tooling notes
- A Python edit script was denied (no approval surface), so edits were made with the file-edit tool instead.
- No cost or usage statistics are recorded.
- **The commit could not be made.** `git add`/`git commit` needed approval, and this unattended session had no way to grant it. The article, state file and this log are saved but not committed.
