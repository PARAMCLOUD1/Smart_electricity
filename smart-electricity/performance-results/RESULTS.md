# Measured algorithm performance

Collected UTC: 2026-11-01T19:50:25.029Z. Runtime: v26.13.0; win32 x64; Intel(R) Core(TM) i5-6300U CPU @ 2.40GHz.

31 measured runs and 10 warmups per task. Seed 42. Engine SHA-256: `85f4b71685dfe8f309a5cb08bb140dd6360c071e184750f4434f2fe9c070029d`; harness SHA-256: `89c9cc6cd8781902c02ae8ce9ea7dc0e0d931b1bc91f3adfed06110e9e1a0dc2`.

These are Node.js measurements of the production JavaScript engine, not browser UI latency. Core measurements exclude Binary Search ID preparation. Complete compute calls include it. No storage, network, file access, validation or rendering occurs inside timed intervals. Units are milliseconds. P95 uses nearest rank. Trace is off in the main table.

| Dataset | Algorithm | n / C | Runs | Min ms | Average ms | Median ms | Max ms | P95 ms | Preparation median ms | Complete call median ms | Operations |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Six-area demo | Greedy allocation | 6 / 600 | 31 | 0.020300 | 0.410800 | 0.029900 | 11.647700 | 0.095300 | 0.000000 | 0.036600 | 6 |
| Six-area demo | 0/1 Knapsack | 6 / 600 | 31 | 0.238400 | 0.531610 | 0.310600 | 6.936400 | 0.460800 | 0.000000 | 0.315100 | 3606 |
| Six-area demo | Merge Sort | 6 / 600 | 31 | 0.012800 | 0.020939 | 0.016400 | 0.048100 | 0.043000 | 0.000000 | 0.019100 | 8 |
| Six-area demo | Binary Search | 6 / 600 | 31 | 0.001000 | 0.001735 | 0.001300 | 0.004200 | 0.003600 | 0.015500 | 0.019700 | 1 |
| Empty grid | Greedy allocation | 0 / 0 | 31 | 0.003500 | 0.010132 | 0.005100 | 0.040700 | 0.031400 | 0.000000 | 0.007300 | 0 |
| Empty grid | 0/1 Knapsack | 0 / 0 | 31 | 0.004300 | 0.018655 | 0.008900 | 0.109200 | 0.084800 | 0.000000 | 0.011900 | 0 |
| Empty grid | Merge Sort | 0 / 0 | 31 | 0.001200 | 0.005300 | 0.002400 | 0.019500 | 0.015400 | 0.000000 | 0.004300 | 0 |
| Empty grid | Binary Search | 0 / 0 | 31 | 0.000800 | 0.002013 | 0.001200 | 0.008400 | 0.005900 | 0.002100 | 0.007700 | 0 |
| Generated n=8, C=250 | Greedy allocation | 8 / 250 | 31 | 0.024000 | 0.060903 | 0.046900 | 0.176700 | 0.137000 | 0.000000 | 0.049600 | 8 |
| Generated n=8, C=250 | 0/1 Knapsack | 8 / 250 | 31 | 0.158700 | 0.226119 | 0.198500 | 0.578800 | 0.343700 | 0.000000 | 0.204900 | 2008 |
| Generated n=8, C=250 | Merge Sort | 8 / 250 | 31 | 0.008200 | 0.125061 | 0.012300 | 3.435000 | 0.033500 | 0.000000 | 0.014900 | 13 |
| Generated n=8, C=250 | Binary Search | 8 / 250 | 31 | 0.001200 | 0.002226 | 0.001700 | 0.005800 | 0.004800 | 0.012200 | 0.016700 | 1 |
| Generated n=32, C=250 | Greedy allocation | 32 / 250 | 31 | 0.046300 | 0.093874 | 0.075300 | 0.266500 | 0.188300 | 0.000000 | 0.077600 | 32 |
| Generated n=32, C=250 | 0/1 Knapsack | 32 / 250 | 31 | 0.597100 | 2.251181 | 1.036200 | 19.976400 | 7.221400 | 0.000000 | 1.040100 | 8032 |
| Generated n=32, C=250 | Merge Sort | 32 / 250 | 31 | 0.044800 | 0.091110 | 0.062800 | 0.453800 | 0.299900 | 0.000000 | 0.065500 | 122 |
| Generated n=32, C=250 | Binary Search | 32 / 250 | 31 | 0.000400 | 0.000684 | 0.000700 | 0.001200 | 0.001100 | 0.061800 | 0.064700 | 1 |
| Generated n=64, C=250 | Greedy allocation | 64 / 250 | 31 | 0.105600 | 2.865587 | 0.223500 | 62.805900 | 14.277700 | 0.000000 | 0.229100 | 64 |
| Generated n=64, C=250 | 0/1 Knapsack | 64 / 250 | 31 | 1.187300 | 3.549719 | 1.587500 | 29.644300 | 24.364800 | 0.000000 | 1.593100 | 16064 |
| Generated n=64, C=250 | Merge Sort | 64 / 250 | 31 | 0.118000 | 0.437245 | 0.242700 | 2.992200 | 1.001500 | 0.000000 | 0.248400 | 301 |
| Generated n=64, C=250 | Binary Search | 64 / 250 | 31 | 0.000400 | 0.000745 | 0.000700 | 0.001400 | 0.001400 | 0.133900 | 0.136900 | 1 |
| Generated n=100, C=250 | Greedy allocation | 100 / 250 | 31 | 0.159200 | 0.213129 | 0.198200 | 0.340700 | 0.339400 | 0.000000 | 0.200200 | 100 |
| Generated n=100, C=250 | 0/1 Knapsack | 100 / 250 | 31 | 1.713800 | 3.131323 | 2.243700 | 11.284000 | 9.472100 | 0.000000 | 2.276700 | 25100 |
| Generated n=100, C=250 | Merge Sort | 100 / 250 | 31 | 0.160200 | 0.347316 | 0.199400 | 2.333500 | 1.842800 | 0.000000 | 0.201700 | 547 |
| Generated n=100, C=250 | Binary Search | 100 / 250 | 31 | 0.000400 | 0.000645 | 0.000600 | 0.001700 | 0.001200 | 0.194900 | 0.198300 | 1 |
| Generated n=100, C=1000 | Greedy allocation | 100 / 1000 | 31 | 0.189400 | 0.625503 | 0.392500 | 2.790400 | 2.396300 | 0.000000 | 0.394700 | 100 |
| Generated n=100, C=1000 | 0/1 Knapsack | 100 / 1000 | 31 | 7.093600 | 11.255010 | 9.485900 | 43.435400 | 19.683100 | 0.000000 | 9.489700 | 100100 |
| Generated n=100, C=1000 | Merge Sort | 100 / 1000 | 31 | 0.173800 | 0.197545 | 0.194000 | 0.242400 | 0.234200 | 0.000000 | 0.197300 | 539 |
| Generated n=100, C=1000 | Binary Search | 100 / 1000 | 31 | 0.000300 | 0.000603 | 0.000500 | 0.002300 | 0.001100 | 0.179300 | 0.181900 | 1 |
| Generated n=100, C=5000 | Greedy allocation | 100 / 5000 | 31 | 0.202200 | 0.604145 | 0.251300 | 5.742400 | 2.401600 | 0.000000 | 0.253500 | 100 |
| Generated n=100, C=5000 | 0/1 Knapsack | 100 / 5000 | 31 | 49.030500 | 77.059284 | 68.620400 | 184.513000 | 145.132700 | 0.000000 | 68.624500 | 500100 |
| Generated n=100, C=5000 | Merge Sort | 100 / 5000 | 31 | 0.159600 | 0.280961 | 0.199300 | 1.092100 | 0.862300 | 0.000000 | 0.201100 | 536 |
| Generated n=100, C=5000 | Binary Search | 100 / 5000 | 31 | 0.000400 | 0.001039 | 0.000800 | 0.006800 | 0.002600 | 0.211500 | 0.217100 | 1 |
| Oversized loads / missing ID | Greedy allocation | 2 / 10 | 31 | 0.008500 | 0.044926 | 0.014000 | 0.404400 | 0.322700 | 0.000000 | 0.017100 | 2 |
| Oversized loads / missing ID | 0/1 Knapsack | 2 / 10 | 31 | 0.008200 | 0.050758 | 0.015700 | 0.429900 | 0.247500 | 0.000000 | 0.018300 | 22 |
| Oversized loads / missing ID | Merge Sort | 2 / 10 | 31 | 0.003400 | 0.042429 | 0.005600 | 0.753300 | 0.223600 | 0.000000 | 0.008400 | 1 |
| Oversized loads / missing ID | Binary Search | 2 / 10 | 31 | 0.001500 | 0.023677 | 0.002100 | 0.645800 | 0.006700 | 0.005600 | 0.010900 | 2 |

## Same-input trace study

n=100, C=5,000. Both modes have 31 measured runs and 10 warmups. Separate sequential batches are vulnerable to JIT/GC/order effects; timing ratios are descriptive, not causal.

| Algorithm | Trace-off median ms | Trace-on median ms | Trace-on P95 ms |
|---|---:|---:|---:|
| Greedy allocation | 0.251300 | 0.543400 | 1.669000 |
| 0/1 Knapsack | 68.620400 | 58.481800 | 92.073800 |
| Merge Sort | 0.199300 | 0.365000 | 0.487500 |
| Binary Search | 0.000800 | 0.003200 | 0.009900 |

## Output checks for the six-area demo at 600 kW

- Greedy allocation: Feasible; benefit 280; 580/600 kW; 4/6 areas. Priority heuristic; optimality not guaranteed.
- 0/1 Knapsack: Feasible; benefit 280; 580/600 kW; 4/6 areas. DP optimum for the stated model; independent oracle tests cover small cases.
- Merge Sort: 6 records match independent demand/ID order. Exact order checked against numeric comparator.
- Binary Search: ID 3: found, matches linear lookup. Exact hit/miss checked against linear scan.

## Interpretation

The largest measured core median is 0/1 Knapsack, Generated n=100, C=5000: 68.620400 ms. This is a statement about these sampled tasks and inputs, not an interchangeable-algorithm speed ranking.

Knapsack visits n(C+1) states; raising capacity increases its transition count and matrix size. Binary Search core is logarithmic but every call includes a fresh O(n log n) ID sort outside the core timer. Reusing ID order could remove repeated preparation. Trace-enabled Greedy repeatedly copies selected-ID prefixes and can require quadratic time/storage. Those structural costs support investigating cached search preparation and compact delta traces; this experiment does not measure the performance of either proposed optimization.

Allocation benefit, feasibility and ordering/lookup checks are recorded per row in the raw report. There is no predictive accuracy measure because no prediction model exists. No heap/process memory was measured. Timing minima and maxima reflect possible timer quantization, CPU contention, JIT and garbage collection. Browser results can differ.

Full report: [inventory, complexity, scope and limitations](../../ALGORITHM_PERFORMANCE_REPORT.md). [Raw samples, input snapshots, statistics and environment](results.json). [CSV with all timing scopes, source functions, quality and complexity](results.csv).
