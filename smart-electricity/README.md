# VOLT / GRID — database-free edition

The 3D electricity simulator now runs entirely in JavaScript. No SQLite, backend, Python packages, API keys or paid disk are required. Records and up to 100 reports persist in this browser's localStorage. Each visitor and device has independent data. Clearing browser storage removes it; export CSV reports to retain copies. Existing SQLite records are not imported automatically.

Build: npm run build. Publish the dist folder. Preview it with any static file server. See [free deployment instructions](DEPLOYMENT.md).

Greedy, 0/1 Knapsack, Merge Sort and Binary Search run locally with recorded steps. Timings use performance.now(), converted to estimated nanoseconds; browser clock precision limits the measurement. The 3D topology is illustrative.

Capacity: 0–5,000 integer kW; up to 100 areas, whole loads only. Priority benefits: Critical 100 / High 70 / Medium 40 / Low 20. Greedy orders by priority then ID; Knapsack maximizes benefit; Merge Sort ranks demand; Binary Search prepares an ID-sorted copy. algorithms.py is an unused educational reference.
