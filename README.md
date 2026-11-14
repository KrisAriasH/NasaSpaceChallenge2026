# Asclepio

**The STEAMers · NASA Space Apps Challenge 2026**
Challenge: *Create Health Monitoring Software for Astronauts on Space Missions*

Asclepio is a desktop app for the **Crew Medical Officer (CMO)**, the astronaut in charge of medical
care on board. It **gathers** each crew member's indicators (smart-shirt vitals, a daily finger-prick
blood panel, a reaction test, a 30-second check-in and habitat sensors), **evaluates** them against
each person's own normal, warns early when a measure is heading out of range, and helps the CMO and
each astronaut **act**.

Each crew member stays in control of their mental health data: the CMO sees the mental health
**status** (green / yellow / red), but check-in answers only if the person shares them, and the
private journal never.

> Demo with simulated data for a fictional crew. Not a medical device.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # privacy policy and demo-story tests
npm run build
```

Use **Viewing as** (top left) to switch between the CMO (Ana), the backup medical officer (Ben) and
crew members (Chen, Diego). Use the **mission day** slider (bottom left) to move through the story.

## Demo story

| Day | What happens |
| --- | --- |
| 12 | Solar particle event: radiation alert, everyone to the storm shelter |
| 17+ | Diego skips exercise; vitamin D and iron drift down (early warning before it happens) |
| 18+ | Chen sleeps less, reaction test slows, cortisol rises; her check-in answers are private |
| 21+ | Cabin CO2 rises above the 3 mmHg NASA limit |
| 24–28 | Ana (the CMO) has leukocytes up, lymphocytes down and a fever; Ben reviews her |
| 25+ | Chen's mental health red 3 days in a row: the CMO is told to have a private conversation, without seeing her answers |

## How the alerts work

Rule-based and explainable, following the SATS approach (no machine learning as the decision maker):

1. **Personal baseline**: mean and SD of each measure over the first 7 days.
2. **Threshold rules**: reference limits (NASA radiation and CO2 limits; blood reference ranges pending physician review).
3. **Trend rules**: 3-day average 2 SD (observation) or 3 SD (alert) away from the personal normal.
4. **Combined early-illness rule**: resting heart rate, HRV, skin temperature, leukocytes, lymphocytes and sleep each 1 SD
   off in the worse direction; 3 or more at once on 2 consecutive days → "Early signs of possible illness".
   In the demo it warns Ana on day 23, before any single measure alerts and 2 days before her fever.
5. **Critical rules** (urgent): solar particle event, very low SpO2, fever with shortness of breath. Never hidden.
6. **Mental health status**: count of signals; red 3 days in a row → private conversation suggested.
7. **Forecast**: 7-day linear trend per measure, warns when it will leave the normal range.

Levels: no signal (not the same as healthy), observation, alert, urgent. The CMO can acknowledge an
alert; it stays quiet unless it gets worse. Each alert shows the rule that fired, the data behind it,
the ruleset version and its clinical review status.

**Alert performance** (in the app): measured against the problems injected in the simulation, the rules
detect 11 of 11 events with 2 false-alarm days out of 373 healthy days (99.5%), on average 2.3 days
after a change starts. These numbers describe the demo scenario only, not real-world accuracy.

## Code map

| Path | What it does |
| --- | --- |
| `src/engine/privacy.ts` | **The** privacy policy. Every screen asks `canSee()` before showing data |
| `src/engine/rules.ts` | Rules per system and all thresholds (`T`) |
| `src/engine/forecast.ts` | Early warning: 7-day trend vs. personal normal |
| `src/engine/evaluation.ts` | Detection rate, false alarms and lead time on the simulated scenario |
| `src/engine/baseline.ts` | Personal normal from the first 7 days |
| `src/engine/guidance.ts` | Suggested actions per finding, sex-specific notes |
| `src/data/simulate.ts` | Simulated crew, blood panel and habitat |
| `src/store.tsx` | App state; what people type is saved in the browser |
| `src/screens/*` | CMO: overview, alerts, member detail, follow-ups. Crew: my status, check-in + reaction test, privacy, journal. Environment |

## Data sources

- Career radiation limit 600 mSv, solar particle events and storm shelter — [NASA OCHMO Radiation Protection technical brief](https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf)
- Cabin CO2 limit 3 mmHg and symptoms by level — [NASA OCHMO Carbon Dioxide technical brief](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf)
- ~1.8 mSv/day in deep-space cruise, Curiosity RAD — [Astronomy](https://www.astronomy.com/space-exploration/radiation-measured-by-curiosity-on-voyage-to-mars-has-implications-for-future-human-missions/)
- Smart-shirt vitals used on the ISS — [CSA Bio-Monitor](https://asc-csa.gc.ca/eng/sciences/astroskin.asp)
- Psychomotor Vigilance Test, part of NASA's Cognition battery — [UPenn](https://www.med.upenn.edu/uep/cognition.html)
- Sex differences in adaptation to spaceflight (NASA/NSBRI, 2014) — [summary](https://gizmodo.com/life-in-space-affects-mens-and-womens-health-very-diffe-1660122716)
- Crew Medical Officer role — [JAXA](https://humans-in-space.jaxa.jp/en/biz-lab/med-in-space/healthcare/medops/system)
- Blood panel and lab schedule: defined with the team's consulting physician
- TODO: NASA OSDR datasets used to calibrate the simulation

## License

MIT
