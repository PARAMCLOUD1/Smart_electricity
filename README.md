# Web dashboard

The current 3D web interface is in `smart-electricity/`. It runs entirely in the browser without SQLite or a backend. Run `npm run build` in that directory and publish `dist` to static hosting. See [free deployment instructions](smart-electricity/DEPLOYMENT.md).

See the [algorithm inventory and performance report](ALGORITHM_PERFORMANCE_REPORT.md) for implementation locations, version differences, complexity, measurement methods and reproducible results.

The independent browser-only version remains in `voltgrid-web/`. The original desktop application is documented below.

# Smart Electricity Load Management System

A Design and Analysis of Algorithms (DAA) mini project built with Python and Tkinter. It simulates distributing a limited electricity supply among areas with different demands and priorities.

## Run

Requires Python 3.10 or later with Tkinter (included in standard Windows Python installations). No pip packages are needed.

```powershell
python app.py
```

1. Click **Load demo**, or enter area names, integer demands in kW, priorities from 1 to 10, and essential status.
2. Set available capacity and click **Distribute power**.
3. Use **Rank by demand** to show the highest demands first.
4. Enter an area ID and click **Binary search** to find its record.
5. Export a CSV report using **Export report (CSV)**.

Select a table row and click **Remove selected** to delete it. Editing the capacity or changing area records invalidates the previous allocation. Data is stored in memory for the current session; CSV exports are reports and cannot be imported.

## Algorithms

| Algorithm | Role | Time | Auxiliary space |
|---|---|---|---|
| Greedy | Consider essential loads by descending priority, then ascending demand and ID; accept each if it fits | O(e log e), including ordering | O(e) |
| 0/1 Knapsack | Select remaining nonessential loads to maximize summed priority | O(mC) DP transitions | O(C) DP entries, with selection bitmasks |
| Merge Sort | Rank areas by descending demand; also order IDs for search | O(n log n) | O(n) |
| Binary Search | Find a record by ID in an ascending-ID array | O(log n) | O(1) |

Here n is total areas, e is essential areas, m is nonessential areas, and C is remaining integer capacity. DP is pseudo-polynomial in capacity. Selection bitmasks contain up to m bits, so their storage uses O(Cm) bits and mask operations are not constant-time for arbitrarily large m. The app limits inputs to 100 areas and 10,000 kW. Search prepares its sorted array each time, so the complete search action takes O(n log n), although binary search itself takes O(log n).

## Demo result

At 100 kW, City Hospital (30) and Water Pump Station (20) receive power first. Knapsack selects Residential North (25, priority 7) and School Campus (15, priority 6).

- Allocated: **90 kW**; remaining: **10 kW**.
- Powered areas: **4 of 6**.
- Total priority score: **32**.
- Unserved: Industrial Zone and Shopping District.

The objective is priority, so filling every available kW is not required. Essential loads may remain unserved when capacity is insufficient. No area receives partial power. This hybrid implements an essential-first policy; it does not claim a globally optimal allocation across all loads.

## Files and verification

- `app.py`: desktop interface and CSV export.
- `algorithms.py`: data model, four algorithms, sample records.
- `test_algorithms.py`: correctness and edge-case checks, including comparison with exhaustive subset enumeration.
- `PROJECT_REPORT.md`: report suitable for adapting for submission and viva preparation.

```powershell
python -m unittest -v
```

This is an educational simulator. It does not model grid topology, voltage, losses, time-varying consumption, or physical switching equipment.
