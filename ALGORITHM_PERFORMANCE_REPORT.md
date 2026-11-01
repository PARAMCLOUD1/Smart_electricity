# Smart Electricity: algorithm inventory and performance report

## 1. Scope and evidence

This report describes the code present in this workspace, rather than proposed electricity-management features. The active application is the database-free 3D site in `smart-electricity/`. Its `index.html` loads `static/local-engine.js` and `static/app.js`; `api()` in the latter directly calls `LocalGrid.request()`. The `/api/...` names are local dispatch labels, not HTTP requests to a Python server.

Three implementations must be distinguished:

| Version | Implementation | Runtime and policy |
|---|---|---|
| Current 3D app | [local-engine.js](smart-electricity/static/local-engine.js), [UI](smart-electricity/static/app.js) | JavaScript in the browser; Greedy and Knapsack are independently selectable allocations over all areas. Priorities map to benefits 100/70/40/20. |
| Desktop app | [algorithms.py](algorithms.py), [app.py](app.py) | Python/Tkinter; essential-first Greedy followed by Knapsack over nonessential records. Numeric priority 1–10. |
| Earlier browser app | [algorithms.js](voltgrid-web/dist/algorithms.js), [app.js](voltgrid-web/dist/app.js) | JavaScript; same essential-first hybrid, with timings, ranking, search and CSV/print reports. Numeric priority 1–10. |
| Retained reference module | [smart-electricity/algorithms.py](smart-electricity/algorithms.py) | Standalone Python implementation of the current app's four tasks; not imported or executed by the current website. |

The existing `PROJECT_REPORT.md` describes the desktop hybrid. Its essential flags, 10,000 kW capacity and one-dimensional Knapsack do not describe the current app, which allows 5,000 kW and uses a full DP matrix.

## 2. Algorithms actually implemented

### 2.1 Priority-based Greedy allocation

**Current implementation:** `LocalGrid.execute('greedy', ...)` in `smart-electricity/static/local-engine.js`. `runAlgorithm()` in `static/app.js` dispatches `/api/run/greedy`; the dashboard quick action also invokes it. Compare and Benchmark can run it without changing the saved allocation.

Each area is decorated with its priority benefit. The manual Merge Sort orders benefits descending, breaking ties by ascending ID. A single pass accepts an entire load if its demand fits the remaining capacity; otherwise it skips that load and continues. There is no partial allocation, benefit/demand-ratio sorting or essential flag in the current model. Accepted records and rejected records form the allocation report.

This is a priority policy, not a guarantee of maximum total benefit or maximum utilization. At capacity 2, a Critical demand-2 load scores 100; two High demand-1 loads score 140 together. Greedy takes the Critical load, while Knapsack can choose the two High loads.

**Other implementations:** root `algorithms.py::allocate()` and `voltgrid-web/dist/algorithms.js::allocate()` apply Greedy only to essential areas, ordered by descending numeric priority, ascending demand, then ID. Remaining capacity is subsequently passed to nonessential Knapsack. The reference Python module's `greedy()` uses the current app's all-area policy.

### 2.2 0/1 Knapsack dynamic programming and traceback

**Current implementation:** the `name === 'knapsack'` branch in `LocalGrid.execute()`, used by `/api/run/knapsack`, Compare and Benchmark. Weight is demand in integer kW; value is the priority benefit. Each area is either entirely selected or omitted.

For area i with demand w and benefit v:

```text
DP[0,c] = 0
DP[i,c] = DP[i-1,c]                              if w > c
DP[i,c] = max(DP[i-1,c], DP[i-1,c-w] + v)         otherwise
```

The code allocates n+1 `Uint32Array` rows, each with C+1 entries, and visits every capacity from 0 through C for every area. It reconstructs selection by walking backward: a different value from the previous row means the area was taken. Equal scores retain the previous row's solution; there is no secondary utilization objective. The maximum configured benefit is 100 × 100 = 10,000, safely within a 32-bit unsigned cell.

It maximizes total benefit over all current areas subject to capacity. It does not optimize transmission losses, tariff costs, network flows or fairness over time. It is pseudo-polynomial because runtime depends on numeric capacity C, not the bit length of C.

**Other implementations:** root `algorithms.py::knapsack()` and earlier browser `knapsack()` compress values to one capacity array and iterate capacity downward. They store an immutable subset bitmask per capacity (Python integers or JavaScript BigInt). They operate on optional loads after Greedy. The retained reference Python module uses full rows and traceback, like the current app.

### 2.3 Manual Merge Sort

**Current implementation:** internal `merge()` and recursive `visit()` in `local-engine.js`. It splits arrays, recursively sorts each half, and merges the halves with two indices. Equal primary values use ascending ID. With valid unique IDs, ordering is deterministic; it does not promise to preserve the original order of equal-demand records whose IDs differ.

It has three production roles: standalone ascending/descending demand ranking (`execute('merge')`); descending benefit ordering before Greedy; and ascending ID preparation before Binary Search. `comparisons` counts merge key decisions and `merges` counts completed merge operations. Trace mode records split and merge ID arrays for replay.

Root `merge_sort()` and earlier browser `mergeSort()` instead accept caller-defined keys/comparators and preserve input order for exactly equal keys. They also sort essential priorities, optional IDs, ranked demands and CSV records. The reference module exposes `merge_sort()` with current-style ID ties.

### 2.4 Iterative Binary Search

**Current implementation:** `execute('binary')` first calls Merge Sort on IDs, measuring `preparation_ns`. It then repeatedly compares the midpoint ID with the target, retaining the left or right half until found or exhausted. The returned `found` record can be null. The search target comes from the Binary Search lab or comparison controls.

The search core has logarithmic worst-case comparisons, but each action prepares a fresh sorted copy. Therefore a complete lookup action is O(n log n), not O(log n). No ID index or cached sorted array is retained between searches. IDs in a demand-ranked array cannot be binary-searched directly.

Root `app.py::search()` likewise sorts by ID before calling `binary_search()`. Earlier browser `analyze()` sorts by ID and then calls `binarySearch()`, and the interactive search action does the same. The retained reference module's `execute('binary')` also separates preparation and search timing.

### 2.5 Essential-first hybrid allocation pipeline

This pipeline exists in the desktop and earlier browser versions only. `allocate()` validates records, sorts and greedily serves essential loads, sorts optional loads by ID, then runs Knapsack on the residual capacity. Desktop `distribute()` uses it; earlier browser `run()` calls `analyze()`, which wraps it with demand ranking and ID lookup.

The optional subset is optimal for the capacity left by Greedy. The combined essential/optional result is not a globally optimal joint subset. Do not describe the current app's separate Greedy and Knapsack buttons as this hybrid.

### 2.6 Data processing and supporting procedures

| Procedure | Code and use | Cost and qualification |
|---|---|---|
| Linear ID/name lookup and duplicate detection | Current `request()` uses `findIndex()` for edits/deletes and `some()` for case-insensitive duplicate names; UI `openArea()` and `showReport()` use `find()`. Earlier browser status checks use `some()`. | O(n) record scans; these are separate from the Binary Search demo. String normalization/comparison also depends on name length. |
| Totals and priority grouping | Engine `snapshot()` and allocation output; UI `renderState()` uses `reduce()`/`filter()` for demand, allocated power and four fixed priority categories. | O(n) passes for a fixed four categories. Utilization is allocated/capacity × 100, with a zero-capacity guard. Descriptive arithmetic, not forecasting. |
| Set membership and selected/rejected partition | `new Set(selected IDs)` in engine and UI; `filter()` labels rejected or supplied records. | Expected O(n) construction/partition with expected constant-time membership; no graph connectivity is computed. |
| Validation and monotonic IDs | `integer()`, area checks and `nextId++` / `nextReport++` in `request()`. | Constant-time numeric checks plus linear duplicate scans. IDs are counters, not random or database-assigned. |
| Seeded linear congruential generator | Benchmark `random()`: state = (1664525 × state + 1013904223) mod 2^32; division by 2^32 produces the sample fraction. | O(1) per draw and O(n) dataset construction; used for reproducible artificial demands/priorities only. No predictions or security use. |
| Timing order statistics | Existing Performance-page `median()` copies numeric samples and chooses index floor(r/2). New Algorithm Report `AlgorithmBenchmark.stats()` computes min/mean/median/max and nearest-rank P95 after numeric built-in sorting. | The older page uses the upper middle value for even counts. The new report averages the middle pair for even counts and uses index ceil(0.95r)−1 for P95. Built-in sort's particular algorithm/complexity is runtime-dependent. |
| Snapshot serialization and bounded history | `copy()` JSON round-trip; `save()` serializes state to localStorage; reports retain the latest 100 entries with `slice(-100)`. | O(B) serialization for B bytes of stored data, not O(1). Saving one report rewrites the entire persisted state. No database query algorithm is used. |
| CSV encoding and escaping | Engine `csv()` scans a report, escapes quotes and prefixes formula-like fields. | O(output characters), plus expected-linear selected-ID membership work. It is report formatting, not load optimization. |
| Trace replay and UI timing | `runAlgorithm()` uses a 600 ms `setInterval`; toast and download cleanup use `setTimeout`; benchmark yields between generated sizes. | Event-loop scheduling for presentation, not an electricity scheduling algorithm. Replay is outside measured execution. |
| Pointer-to-perspective mapping | `static/dimensional.js` normalizes pointer position into CSS rotations. | O(1) arithmetic per pointer event. The city and routes are illustrative, with no topology or power-flow solution. |

Chart.js is a bundled third-party rendering library. Its internal drawing, animation and scale routines are not project-authored electricity algorithms. The report does not count them as additional forecasting or optimization implementations. Exhaustive subset enumeration in test files is a correctness oracle, not a production allocator.

The new report harness in `static/algorithm-benchmark.js` also uses deterministic Fisher–Yates shuffling to vary generated input order, a numeric comparator sort as an independent ordering check, and linear lookup to verify Binary Search. These are benchmark generation/verification procedures outside the timed algorithm calls, not additional electricity optimizers.

### 2.7 Features not implemented

There is no consumption forecasting, regression, moving-average prediction, neural network, model training, anomaly detection, tariff optimization, time-slot assignment, round-robin load shedding, deadline scheduling, Dijkstra/BFS/DFS routing, maximum flow, genetic algorithm or particle swarm optimization in the application code. There is no training dataset or historical time-series input. The UI's static network drawing and timed animations do not establish any of these features.

## 3. Complexity of the current implementation

Let n be the number of areas, C integer capacity, k the accepted areas, and r benchmark repeats. Space below includes algorithm outputs/traces where explicitly stated, but excludes existing records and UI rendering.

| Task | Trace disabled | Additional cost in normal trace-enabled runs |
|---|---|---|
| Greedy including benefit sort | O(n log n) time, O(n) peak auxiliary/output storage | Each decision copies the accepted-ID prefix. Worst-case O(n²) time and retained trace entries, even though there are only n decision steps. |
| Knapsack | O(n(C+1)) time, O((n+1)(C+1)) DP cells plus O(n) output | At most 2n step objects. A display-table copy is returned only when n≤10 and C≤30. The full DP matrix is still allocated for larger cases. |
| Merge Sort | O(n log n) time, O(n) peak workspace, O(log n) call depth | Split/merge traces retain O(n log n) ID entries. Runtime remains O(n log n). |
| Binary Search core | O(log n) worst-case time, O(1) auxiliary storage beyond prepared array/result | O(log n) retained midpoint steps. Best case is one comparison for a midpoint hit. |
| Binary Search with preparation | O(n log n) time, O(n) workspace/output | Search trace adds O(log n); preparation is always trace-disabled. |

Using C+1 avoids the misleading claim that a zero-capacity run does no work. Current Knapsack counts exactly n(C+1) states, including capacity zero. Greedy `operations` counts n decisions, not sort comparisons or copied IDs; `sort_comparisons` is separate. Merge `operations` counts merge comparisons. Binary `operations` counts midpoint inspections. These units cannot be summed or compared as identical CPU instructions.

At n=100 and C=5,000, the DP matrix has 101 × 5,001 = 505,101 uint32 cells: 2,020,404 raw bytes (about 1.93 MiB), plus row objects, outputs and runtime overhead. There are 500,100 state visits. This is a structural memory estimate, not a measured process-memory figure. At C=250 the same n causes 25,100 state visits. Thus capacity growth can dominate additional areas.

The request wrapper first builds `snapshot()` for every operation, even mutations and report access. It scans areas and copies the active allocation. Allocation runs also clone a report, serialize saved history and refresh four charts and lab tables. These costs are outside the core timer and explain why a very fast core result is not a claim of equally fast UI response.

### Older one-dimensional implementations

Let e be essential count, m optional count and R residual capacity. The hybrid performs O(n + e log e + m log m + m(R+1)) conventional score-level work. Knapsack visits only capacities at least as large as each load, so a load larger than R performs no score transition. The score arrays have O(R+1) entries, while selection masks can each contain m bits. Mask storage is O((R+1)m) bits in the worst case, and arbitrary-width mask operations add bit-level work; describing total storage as simply O(R) machine words hides that distinction. Root and earlier browser Merge Sort have O(n) peak workspace; Binary Search has O(1) core workspace in Python but the earlier browser implementation also retains O(log n) textual steps.

## 4. Timing methodology and measured results

The production engine now returns unrounded `time_ms` and `preparation_ms` directly from `performance.now()`. It retains rounded `time_ns`/`preparation_ns` for existing UI compatibility. Unit conversion does not improve timer resolution. Normal runs include trace collection. Greedy includes benefit sorting. Binary's core timer begins after the separately timed ID sort. Rendering, replay, storage serialization and downloads are outside that core timer. Some dispatcher/setup overhead is included; this is not instruction-level profiling.

The existing Performance-page Benchmark is preserved: it uses 3–15 repeats, current records/current capacity, and generated sizes 8/16/32/64 at fixed C=250. It disables traces, has no explicit JIT warmup and uses the upper middle sample for even counts. The new **Algorithm Report** is a separate section with explicit run controls, 3–101 measured runs, 0–20 warmups, selectable trace mode and a conventional even-count median. Its default is 21 measured runs and 5 warmups. Neither runs expensive work automatically.

The report collects three statistical series in milliseconds for every task: internal core time; ID-sort preparation (zero/not applicable for other tasks); and external complete `execute()` call time. Every series includes minimum, arithmetic average, median, maximum and nearest-rank 95th percentile. The complete-call interval includes dispatcher overhead and preparation but excludes the input snapshot, validation, storage, progress rendering and export. It is end-to-end **compute-call** time, not full user-interaction latency. Snapshot preparation and whole-batch wall time are shown separately. The latter includes warmups, validation, progress updates and event-loop yields. A row records completed/requested runs, input n/C/target/order/trace, source/function, quality and errors. Warmup counts are configured counts; if a task fails during warmup its error is recorded and it has zero completed measured runs.

CSV contains the three statistical series, metadata, source/function, complexity, assumptions, quality and errors. JSON additionally includes actual input snapshots and raw timing samples. The browser records user agent, platform, logical processor hint, language, timer origin, isolation and whether the page went into the background. Results remain in page memory until reload or export; they do not silently track changed records. A cancelled or globally failed run retains the previous report. Individual task failures are included as failed rows without inventing timing values.

This report adds a reproducible runner that imports the actual production engine:

```powershell
cd smart-electricity
node scripts/performance_report.cjs
```

It uses the same harness as the browser report, seed 42, deterministic shuffled inputs, 10 warmup calls and 31 timed calls for each of nine cases (36 task rows): the six-area demo, empty input, n=8/32/64/100 at C=250, n=100 at C=1,000/5,000, and an oversized-load/missing-search-ID case. It records every raw sample and all five statistics for the three timing scopes, plus runtime/CPU/platform and SHA-256 source hashes. A separate trace study compares modes on identical n=100/C=5,000 records; sequential batches remain subject to JIT and garbage-collection variation. No measured memory or predictive accuracy is claimed.

Results: [measured tables and demo outcomes](smart-electricity/performance-results/RESULTS.md), [raw samples, runtime and source hash](smart-electricity/performance-results/results.json). These are Node.js measurements of shared JavaScript code, not measurements of browser layout, animation, localStorage or interactive latency. The runner does not read browser/user data, create a database, install packages or require network access. Re-run on the target device/browser before making device-specific latency claims. No cross-version Python-versus-JavaScript timing claim is made.

## 5. Correctness and interpretation

`smart-electricity/test_static.cjs` checks Knapsack against all 64 subsets of a six-area test set for capacities 0–25, Greedy feasibility, sorting/search, report immutability, persistence and benchmark shape. `test_benchmark.cjs` additionally verifies statistics/P95, deterministic cases, warmup exclusion, timing scope separation, trace settings, unchanged state, task errors, cancellation, invalid inputs and output-check failures. `scripts/check_report_browser.cjs` verifies report routing, no automatic execution, loading, chart, real CSV/JSON downloads, unchanged records, eight themes/chart colors, theme persistence, mobile width, cancellation, error rows and dashboard regression against isolated headless Chrome. `voltgrid-web/test.cjs` checks the older browser app, including 121 exhaustive-capacity comparisons and timing boundaries. `test_algorithms.py` supplies desktop checks but was not executed because a working Python interpreter is unavailable. Output checks in the measurement harness run outside the timed region. Passing these does not prove unrestricted correctness or validate real grid safety.

Current demo at 600 kW: both Greedy and Knapsack select IDs 1,2,4,6 (580 kW, benefit 280). This agreement on one demo does not prove Greedy is optimal in general; the three-load counterexample above shows why. Ascending demand order is 4,1,5,6,2,3. Searching ID 3 finds the Industrial Zone. These are different from the old 100 kW essential-first demo in `PROJECT_REPORT.md`.

## 6. Findings and practical recommendations

1. Use Knapsack when maximizing the stated all-area priority benefit is the requirement; use Greedy when its priority-first acceptance policy is intended. Neither models a physical grid.
2. The dominant numeric scaling risk is n×C DP. Preserve input limits and distinguish raw matrix storage from total application memory.
3. Normal Greedy trace copying changes worst-case scaling to quadratic. Delta-based trace records could reduce that cost, but this report does not change the implementation.
4. Cache/index ID order if many lookups are needed; currently sorting makes each complete lookup O(n log n). Record management still uses linear scans.
5. Report browser timing precision honestly and account for trace mode. The new Algorithm Report adds warmups and a conventional even-sample median while preserving the earlier Performance page. Its runner uses 31 samples; the browser defaults to 21.
6. Saved reports can retain large traces; whole-history JSON serialization and storage quota can dominate core compute. Latest-100 retention limits report count, not serialized bytes.
7. No predictions or electricity scheduling performance can be reported because those features are absent. Adding them would require a separate specification, data and validation.

The current site remains fully static and database-free. This change adds the in-app Algorithm Report, shared measurement harness, documentation and offline runner without hosting services, analytics or paid dependencies.
