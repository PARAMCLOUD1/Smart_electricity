# Live website demonstration

## Open the live website

This is the actual Smart Electricity website running on Render. I will use its controls and show what changes on screen. The app runs in the browser, and its records are separate for each browser.

## Explore the dashboard

The dashboard shows supply, demand, allocation, area counts, and utilization. Scrolling reveals the charts. At the beginning, the six demo areas are waiting for an allocation.

## Add a new area

I open Electricity demands and add a Community Clinic. Its demand is sixty kilowatts, its priority is Critical, and its type is Hospital. Saving creates a new record with an automatically assigned identifier.

## Edit the area

Now I edit the clinic. I change its demand to fifty kilowatts and priority to High. The updated values appear in the registry after saving.

## Remove the demonstration area

The Delete button removes the demonstration clinic. The original six sample areas remain. Changing area records also clears any current allocation.

## Change available capacity

I return to the overview and change the supply to four hundred and fifty kilowatts. Updating capacity resets the live allocation. Areas receive either their whole demand or no allocation.

## Run Greedy allocation

I run Greedy allocation. Watch the recorded decisions and remaining capacity change. The algorithm considers priority benefit first and accepts a whole load only when it fits. This is a heuristic, not a guaranteed global optimum.

## Run Knapsack optimization

Next I run zero one Knapsack on the same records and capacity. Its dynamic programming steps and traceback are shown here. It maximizes summed priority benefit under the model's capacity constraint.

## Rank demand with Merge Sort

In Merge Sort, I choose descending demand and run the algorithm. The visualization shows splitting and merging. The output lists the demand ranked identifiers, with identifier order used to break ties.

## Find an area by ID

In Binary Search, I enter identifier three and run the search. The result identifies the Industrial Zone. The app shows midpoint inspections and reports identifier sort preparation separately from the search core.

## Run the Algorithm Report

I open Algorithm Report and select the current grid. I use seven measured runs and two warmups, then click Run benchmarks. These are actual measurements collected now, with output checks. The report does not run expensive benchmarks automatically.

## Inspect results and export

The report shows minimum, average, median, maximum, and ninety fifth percentile runtime. The chart compares the selected timing scope. I export both CSV and JSON. Different algorithms solve different tasks, so timing alone is not an overall quality ranking.

## Open an allocation report

Distribution reports preserve earlier allocation snapshots. I open the latest result and download its CSV. Editing current records does not rewrite these historical reports. Export reports you want to keep before clearing browser storage.

## Switch dark and light themes

Finally, I switch between dark and light color themes. The charts, panels, and controls update together. There are four dark and four light choices, and the browser remembers the selected theme.

## Review the working result

Back on the overview, the allocation and charts reflect the completed run. This demonstration used the real working website. It is an educational simulator, not a real power controller or a demand prediction system.
