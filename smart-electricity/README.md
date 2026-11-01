# VOLT / GRID — database-free edition

For the complete current project description, setup guide, live URLs, web-versus-desktop differences and limitations, see the [main README](../README.md). A narrated walkthrough and its source are documented in [project-video](../project-video/README.md).

The 3D electricity simulator now runs entirely in JavaScript. No SQLite, backend, Python packages, API keys or paid disk are required. Records and up to 100 reports persist in this browser's localStorage. Each visitor and device has independent data. Clearing browser storage removes it; export CSV reports to retain copies. Existing SQLite records are not imported automatically.

Build: npm run build. Publish the dist folder. Preview it with any static file server. See [free deployment instructions](DEPLOYMENT.md).

Greedy, 0/1 Knapsack, Merge Sort and Binary Search run locally with recorded steps. Timings use performance.now(), converted to estimated nanoseconds; browser clock precision limits the measurement. The 3D topology is illustrative.

See the [complete algorithm inventory and performance report](../ALGORITHM_PERFORMANCE_REPORT.md). Run `npm run report:performance` to regenerate [measured results](performance-results/RESULTS.md) and raw samples without reading browser data or requiring a backend.

Open **Algorithm Report** in the sidebar (or `/#algorithm-report`). Choose current inputs, representative cases or both, the measured-run/warmup counts and trace setting, then click **Run benchmarks**. Results include a comparison table, median/P95 chart, environment, collection time, source functions, output checks and all five timing statistics. Switch between core, ID preparation and complete compute-call time. Export CSV for analysis or JSON for raw samples and snapshots. Benchmarks run only on request; Cancel retains previous results. No heap memory or predictive accuracy is measured.

The header Theme selector includes four dark themes (Volt Midnight, Ocean Depths, Orbit Night, Ember Noir) and four light themes (Volt Daylight, Ocean Mist, Orbit Pearl, Ember Sand). The light/dark button switches within the selected palette. The preference persists locally, and charts, reports and 3D accents update together.

Verification: `node scripts/build_frontend.cjs` then `node --test test_static.cjs test_benchmark.cjs`. Optional real-browser checks: serve the app on port 5000, launch isolated Chrome with remote debugging on 9224, then run `node scripts/check_report_browser.cjs`. The script saves screenshots and CSV/JSON exports in a temporary folder.

Capacity: 0–5,000 integer kW; up to 100 areas, whole loads only. Priority benefits: Critical 100 / High 70 / Medium 40 / Low 20. Greedy orders by priority then ID; Knapsack maximizes benefit; Merge Sort ranks demand; Binary Search prepares an ID-sorted copy. algorithms.py is an unused educational reference.
