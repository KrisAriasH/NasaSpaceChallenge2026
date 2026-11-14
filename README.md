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

## Code map

| Path | What it does |
| --- | --- |
| `src/engine/privacy.ts` | **The** privacy policy. Every screen asks `canSee()` before showing data |
| `src/engine/rules.ts` | Rules per system and all thresholds (`T`) |
| `src/engine/forecast.ts` | Early warning: 7-day trend vs. personal normal |
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
