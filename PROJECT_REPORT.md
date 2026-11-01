# Smart Electricity Load Management System

This document describes the original desktop implementation. For the current database-free 3D website, source inventory, version differences and measured results, see [Algorithm Performance Report](ALGORITHM_PERFORMANCE_REPORT.md).

**Subject:** Design and Analysis of Algorithms (DAA)  
**Student:** ____________________  
**Roll number:** ____________________  
**Department / semester:** ____________________

## 1. Abstract

This mini project demonstrates electricity allocation under limited capacity using four DAA algorithms. Users register areas, demands, priorities, and essential status. A greedy phase allocates essential loads, and a 0/1 Knapsack phase selects additional loads within the remaining capacity. Merge Sort ranks demands, while Binary Search retrieves an area by ID. A desktop interface displays the allocation and exports CSV distribution reports.

## 2. Problem statement and objectives

Total requested power can exceed available supply. The system must keep the total allocated demand within capacity, prioritize essential services, and choose useful additional loads. The objectives are to demonstrate algorithm selection, implement searchable area records, compare algorithm complexity, and produce an understandable allocation report.

## 3. Inputs and assumptions

Each area has a unique positive integer ID, a nonempty name, positive integer demand in kW, an integer priority from 1 to 10, and an essential flag. Capacity is an integer from 0 to 10,000 kW. Up to 100 areas are supported. Higher scores indicate higher importance. An entire load is either supplied or unserved. Priority scores are assumed to be additive for this classroom model.

## 4. System flow

```text
Add area demands and priorities
              |
Set available capacity
              |
Merge Sort essential loads by priority
              |
Greedy: accept each essential load that fits
              |
0/1 Knapsack: optimize nonessential priority with remaining capacity
              |
Display allocation, unused capacity, and unserved essential count
              |
Export distribution report

Separate actions:
Rank demands -> Merge Sort descending by demand
Search ID    -> Merge Sort ascending by ID -> Binary Search
```

## 5. Algorithm design

### Greedy essential allocation

Order essential loads by descending priority, ascending demand, then ascending ID. Consider each once. If its demand fits the remaining capacity, allocate it and subtract its demand. Otherwise skip it and consider the next load. This expresses the chosen priority policy but can leave an essential load unserved.

### 0/1 Knapsack

For each nonessential load i, weight w_i is its demand and value v_i is its priority. Choose x_i in {0,1} to maximize sum(v_i * x_i), subject to sum(w_i * x_i) <= remaining capacity.

The recurrence is:

```text
DP[i,c] = DP[i-1,c]                              if w_i > c
DP[i,c] = max(DP[i-1,c], v_i + DP[i-1,c-w_i])   otherwise
DP[0,c] = 0
```

The implementation compresses the score table to one dimension and iterates capacity downward to prevent selecting a load twice. Immutable integer bitmasks record the chosen subset for each capacity. Equal scores retain the earlier solution; there is no secondary objective to maximize electricity consumption.

### Merge Sort

Recursively split the records into halves, sort both halves, and merge them using the chosen key. Ranking uses descending demand with ascending ID as a deterministic tie-breaker. The merge implementation preserves the relative order of equal keys.

### Binary Search

Search an array sorted by ascending ID. Compare the target with the middle record and discard half the search range until a record is found or the range becomes empty. Demand-ranked records cannot be searched directly by ID; the program prepares an ID-sorted array first.

## 6. Worked example

| ID | Area | Demand (kW) | Priority | Essential | Result at 100 kW |
|---|---|---:|---:|---|---|
| 1 | City Hospital | 30 | 10 | Yes | Powered |
| 2 | Water Pump Station | 20 | 9 | Yes | Powered |
| 3 | Residential North | 25 | 7 | No | Powered |
| 4 | Industrial Zone | 40 | 8 | No | Unserved |
| 5 | School Campus | 15 | 6 | No | Powered |
| 6 | Shopping District | 20 | 4 | No | Unserved |

Essential allocation consumes 50 kW. Among optional loads, Residential North and School Campus score 13 and consume 40 kW, beating the Industrial Zone's score of 8. Final usage is 90 kW, unused capacity is 10 kW, and total priority score is 32. The descending demand order is IDs 4, 1, 3, 2, 6, 5.

## 7. Complexity analysis

Greedy essential allocation, including sorting, takes O(e log e) time. Knapsack takes O(mC) score transitions and O(C) score entries. Each selection mask can use m bits, so mask storage is O(Cm) bits; arbitrary-size integer operations add bit-level overhead. Merge Sort takes O(n log n) time and O(n) auxiliary space. Binary Search takes O(log n) time and O(1) auxiliary space after ordering; preparing the array for each search costs O(n log n).

## 8. Verification

Run `python -m unittest -v`. Automated cases cover the demo outcome, zero capacity, no areas, skipping an oversized essential load, stable sorting, successful and missing searches, duplicate IDs, and invalid inputs. Knapsack scores are compared against exhaustive enumeration for capacities 0 through 19 on a small dataset, with checks for capacity feasibility and duplicate selection.

Manual interface checks: load the demo; distribute power; change capacity and verify statuses reset; rank demands; search for ID 3 and a missing ID; add an area; remove an area; export a CSV and compare it with the table. These are a suggested manual checklist, not a claim of automated visual testing.

## 9. Limitations and future work

The hybrid is policy-driven and does not globally optimize essential and optional loads together. For example, a single high-priority large essential load may be chosen before two smaller essential loads with a greater combined score. Records are session-only. The model ignores network constraints, losses, load variation, and fairness over time. Future extensions could add persistent records, time slots, rotating service priorities, and constrained network optimization.

## 10. Conclusion

The project combines greedy decisions, dynamic programming, divide-and-conquer sorting, and logarithmic lookup in one runnable application. Its reports make capacity constraints and priority tradeoffs visible while keeping the algorithms separate and testable.

## 11. Viva questions

1. **Why 0/1 Knapsack?** Loads are indivisible; each is either supplied or excluded.
2. **Why iterate capacity backward?** Forward iteration could reuse the current load, changing the problem to unbounded knapsack.
3. **Is the hybrid globally optimal?** No. The essential-first greedy policy fixes decisions before the optional optimization.
4. **Why can electricity remain unused?** Whole loads may not fit, and the objective maximizes priority rather than utilization.
5. **What is required for Binary Search?** Records must be sorted by the searched key, here the area ID.
6. **Why is Knapsack pseudo-polynomial?** Its transition count depends on numeric capacity, not just the number of bits encoding capacity.
7. **How are equal priorities handled?** Essential loads use smaller demand then ID; knapsack retains the earlier equal-score solution.

## 12. Reference note

The project brief mentions mdpi.com without identifying a specific article. No paper-specific claims or citations are included. If academic references are required, add the exact papers or course texts used and follow the institution's citation format.
