# Two-minute viva

“My system distributes limited electricity among areas. Each has a demand and priority. The backend implements four DAA algorithms in Python, Flask exposes APIs, SQLite stores records and reports, and JavaScript visualizes the results.”

1. Show 600 kW capacity and 1030 kW total demand.
2. Run **Greedy**: sort by priority then ID, take each whole load if it fits. Sample allocation is 580 kW, benefit 280.
3. Run **Knapsack**: demand=weight, priority benefit=value, supply=capacity. DP compares taking versus skipping each area, then traceback recovers the chosen subset.
4. Run **Merge Sort** ascending: show split/merge events and sorted demands 80,120,150,180,200,300.
5. Run **Binary Search** for ID 3 and then 999. Explain low, high and mid from the displayed steps.
6. Open **Performance → Compare algorithms**, select 2–4 algorithms and run the comparison. Show each task's output and real measured time, then use **Run Benchmark** to show medians across repeated runs.
7. View and download an allocation report.

## Key answers

- **Why 0/1?** Each area receives its full load or nothing.
- **Greedy optimal?** Not necessarily. It picks locally by priority; Knapsack maximizes total benefit across combinations.
- **Knapsack recurrence?** If weight fits: `DP[i,c] = max(DP[i-1,c], value + DP[i-1,c-weight])`; otherwise copy the previous row. Base row is zero.
- **Why full DP rows?** They make traceback easy to explain. Different values in adjacent rows indicate the current area was taken.
- **What do operation counts mean?** Greedy: accept/reject decisions. Knapsack: evaluated cells, n(C+1). Merge Sort: comparator calls and merges. Binary Search: inspected midpoint comparisons.
- **How are times measured?** `perf_counter_ns()` immediately before and after Python computation. No database, network, rendering or animation is timed. Normal runs include recording real steps; benchmarks disable traces consistently.
- **Why separate search preparation?** Binary Search requires ordered IDs. Preparing them with Merge Sort is O(n log n), while the search itself is O(log n).
- **Why unused electricity?** Whole loads may not fit; Knapsack optimizes benefit, not maximum kW usage.
- **Why a capacity limit?** DP uses O(nC) time and memory. Integer 1 kW units and maximum 5,000 kW bound its work.
- **Why do times change?** Computer load, interpreter behavior and scheduling affect a run. Benchmarks show medians from repeated measured executions.
- **What is stored?** Areas, available capacity, latest allocation and immutable historical reports in SQLite.

Keep the demo focused on input → computed decisions → recorded steps → output → measured time. The application is a mini project, not a physical electricity controller.
