# Smart Electricity Load Management System

A **Design and Analysis of Algorithms (DAA)** mini project that demonstrates distributing limited electricity among areas with different demands and priorities. The current application is a browser-based **VOLT / GRID** dashboard with a CSS 3D city, charts, four algorithm labs and an on-demand performance report.

The repository also contains the original Python/Tkinter desktop application. The two editions use different allocation policies and input limits; these are documented separately below.

## Live application

- **Primary Render site:** https://paramsmartelectricitysystem.onrender.com/
- **Vercel:** https://smart-electricity-three.vercel.app/
- **GitHub repository:** https://github.com/PARAMCLOUD1/Smart_electricity

The primary Render site serves the current source. Other deployments are separate publication targets and may need their own redeployment after changes. The personalized URL does not change the app's VOLT / GRID branding. No login is needed to open the published app.

## Current web dashboard

The website in `smart-electricity/` runs entirely in the browser. It uses HTML, CSS, JavaScript and locally bundled Chart.js. **No Python backend, SQLite, NoSQL database, API key or paid persistent disk is required.** Records and up to 100 historical reports are saved in localStorage for the current browser and website origin. Different devices, browsers and hosting URLs have separate records. Clearing browser storage removes them; export CSV reports to retain a copy.

### Run locally

Install Node.js 22 or later, then run:

```powershell
git clone https://github.com/PARAMCLOUD1/Smart_electricity.git
cd Smart_electricity\smart-electricity
npx --yes http-server . -p 5000
```

Open **http://localhost:5000**. The first `npx` invocation downloads a local preview tool; it is not an application dependency. If Python is installed, `python -m http.server 5000` is another static-server option. Use a server rather than opening `index.html` directly.

### Main features

1. **Overview:** eight summary cards and four charts show available supply, demand, allocation, remaining capacity, area counts and utilization. The 3D city is illustrative, not a calculated grid topology.
2. **Electricity demands:** add, edit and delete named areas with demand, priority category and area type. IDs are assigned automatically. Changing records or capacity clears the current allocation; previously saved report snapshots remain unchanged.
3. **Algorithm labs:** run Greedy allocation, 0/1 Knapsack, Merge Sort and Binary Search. Replay actual recorded steps, inspect computed output and view measured execution time.
4. **Performance:** compare selected algorithms on the same input snapshot or run the earlier repeated-run benchmark. Algorithms solve different tasks, so a smaller time is not a universal quality ranking.
5. **Algorithm Report:** run explicit benchmarks with warmups, statistical summaries, a runtime chart, source/function details, output checks, timing scopes, environment information and collection timestamps. Export CSV or JSON with raw samples. Expensive benchmarks never start automatically.
6. **Distribution reports:** inspect immutable allocation snapshots and download CSV reports.
7. **Themes:** choose four dark themes (Volt Midnight, Ocean Depths, Orbit Night, Ember Noir) or four light themes (Volt Daylight, Ocean Mist, Orbit Pearl, Ember Sand). The matching light/dark toggle and selected palette persist locally.

### Web input model and allocation policy

- Up to **100 areas**, with integer capacity **0–5,000 kW**.
- Area demand is a positive integer; an area is supplied entirely or left unallocated.
- Priority benefits: **Critical 100, High 70, Medium 40, Low 20**.
- Types: Hospital, Residential, Industrial, Commercial and Educational.
- **Greedy and Knapsack are independent allocation actions over all registered areas. The current web version does not combine them into the desktop essential-first pipeline and does not have an essential-status input.**

| Algorithm | Actual web implementation and purpose | Time / space assumptions |
|---|---|---|
| Greedy | Manual Merge Sort orders benefit descending, then ID ascending. Each whole load is accepted if it fits. | O(n log n) time and O(n) workspace with traces off. Copied selected-ID prefixes can make normal trace recording O(n²) in time and retained entries. It is a heuristic, not a guaranteed global optimum. |
| 0/1 Knapsack | Full dynamic-programming matrix maximizes summed priority benefit under integer capacity; traceback reconstructs selected areas. | O(n(C+1)) time and O((n+1)(C+1)) DP cells, plus output. Pseudo-polynomial in numeric capacity C. |
| Merge Sort | Recursively splits and merges records to rank demand. Also sorts priority for Greedy and IDs before search. | O(n log n) time and O(n) peak workspace; retained split/merge traces use O(n log n) IDs. Equal demands use ascending ID. |
| Binary Search | Searches an ID-sorted copy for the requested area. | O(log n) search core; a complete action includes fresh O(n log n) ID-sort preparation and O(n) workspace. |

Here n is area count and C is capacity in integer kW. The numeric timings use `performance.now()`; converted nanosecond fields do not imply nanosecond timer accuracy. The engine is in [`static/local-engine.js`](smart-electricity/static/local-engine.js); [`static/app.js`](smart-electricity/static/app.js) controls the UI.

The current six-area web demo starts at **600 kW**. Both standalone Greedy and Knapsack select City Hospital, Residential Area A, Government School and Residential Area B: **580 kW**, **20 kW remaining**, **4/6 areas**, benefit **280**. Agreement on this demo does not prove Greedy is optimal in general.

### Algorithm Report and verification

Open **Algorithm Report** in the sidebar or append `#algorithm-report` to the website URL. Choose current records, representative generated cases, or both. Set **3–101 measured runs**, **0–20 warmups**, seed and trace collection, then click **Run benchmarks**.

The report shows minimum, arithmetic average, median, maximum and nearest-rank 95th-percentile runtime in milliseconds. Switch between algorithm-core time, Binary Search ID preparation and complete compute-call time. Batch wall time includes warmups, validation and UI yields; rendering, storage, file access and network requests are outside timed compute calls. Source/function, input n/C/target, output checks, errors and assumptions are included. Memory complexity is theoretical; heap usage and predictive accuracy are not measured. Cancel preserves previous results.

```powershell
# Run from smart-electricity/
npm run build
node --test test_static.cjs test_benchmark.cjs
npm run report:performance
```

The offline runner uses the production engine with 10 warmups and 31 measurements per task. It writes Markdown, CSV and JSON into `performance-results/`, including runtime/CPU/platform metadata and source hashes. Those are **Node.js** measurements, not browser UI latency. See the [full algorithm inventory and performance analysis](ALGORITHM_PERFORMANCE_REPORT.md) and [measured tables](smart-electricity/performance-results/RESULTS.md).

### Build and deployment

`npm run build` produces `smart-electricity/dist/`. Render uses the root [`render.yaml`](render.yaml): static site, root directory `smart-electricity`, build command `npm run build`, publish directory `dist`. There is no server start command or database configuration. Vercel uses [`vercel.json`](smart-electricity/vercel.json). See [deployment details](smart-electricity/DEPLOYMENT.md). Domain registration is separate from static hosting; the provided hosting subdomains do not require buying a domain.

## Original Python/Tkinter desktop edition

The root `app.py` is the original desktop interface. It requires Python 3.10+ with Tkinter and no pip packages:

```powershell
python app.py
python -m unittest -v test_algorithms
```

Users can load demo data, add areas, assign integer priority **1–10** and **essential status**, set capacity, distribute power, rank demand, search IDs, remove selected records and export CSV. Data stays in memory for the current session. Limits are **100 areas** and **0–10,000 kW** capacity.

Its `allocate()` function in [`algorithms.py`](algorithms.py) implements:

1. Merge Sort essential loads by descending priority, ascending demand and ID.
2. Greedy acceptance of essential whole loads that fit.
3. 0/1 Knapsack over the remaining nonessential areas and residual capacity, maximizing their summed priority. This edition uses one-dimensional scores and immutable selection bitmasks.
4. Separate demand ranking with Merge Sort and ID lookup with Binary Search after ID sorting.

At **100 kW**, the desktop demo supplies City Hospital (30), Water Pump Station (20), Residential North (25) and School Campus (15): **90 kW used**, **10 kW remaining**, **4/6 areas**, total priority **32**. Industrial Zone and Shopping District are unserved. The essential-first policy does **not** guarantee a globally optimal result across all loads.

The separate `voltgrid-web/` directory is an earlier browser implementation of this hybrid policy. The Python module `smart-electricity/algorithms.py` is retained reference code, not a backend for the deployed dashboard.

## Repository map

| Path | Purpose |
|---|---|
| `smart-electricity/index.html`, `static/` | Current 3D browser app and bundled Chart.js |
| `smart-electricity/static/local-engine.js` | Production algorithms, validation, localStorage and CSV |
| `smart-electricity/static/algorithm-benchmark.js`, `algorithm-report.js` | Benchmark harness and report UI |
| `smart-electricity/scripts/` | Static build, offline performance runner and optional browser checks |
| `smart-electricity/test_static.cjs`, `test_benchmark.cjs` | Current engine, persistence, statistics and error/cancellation checks |
| `app.py`, `algorithms.py`, `test_algorithms.py` | Original desktop application and tests |
| `PROJECT_REPORT.md` | Original desktop project report |
| `ALGORITHM_PERFORMANCE_REPORT.md` | Code inventory, complexity and measurement analysis |
| `project-video/` | Walkthrough storyboard, narration transcript and video-generation source |

## Educational limitations

The project does not model voltage, network constraints, transmission losses, physical switches, changing consumption, tariff costs or fairness over time. It contains **no demand forecasting, machine-learning prediction or time-slot electricity scheduler**. A high priority score or a convincing 3D diagram is not evidence of a safe real-world grid allocation. Unused capacity can remain because loads are indivisible and priority benefit—not utilization—is the optimization objective.
