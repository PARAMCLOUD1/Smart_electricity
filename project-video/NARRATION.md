# Project walkthrough narration

English, generated with Microsoft David Desktop. Screen captures show the current app; the architecture and desktop comparison chapters use explanatory graphics. Caption group timings are approximate.

## 1. Smart Electricity Load Management System

Welcome to the Smart Electricity Load Management System, a Design and Analysis of Algorithms mini project. It simulates how limited electricity can be distributed among areas with different demands and priorities. This walkthrough shows the currently deployed, browser based application.

## 2. A complete browser based project

The current VOLT GRID dashboard uses HTML, CSS, JavaScript, and bundled Chart.js. Algorithms execute in your browser, without a Python backend or database. Records and reports are saved in local storage. Each browser and website address has its own data.

## 3. Understand supply, demand and allocation

The overview combines eight summary cards with four charts. You can inspect available capacity, total demand, allocated power, remaining capacity, area counts, and utilization. The charts compare supply with demand and show area demands, unused capacity, and distribution by priority.

## 4. Manage electricity demand records

The demand registry lets you add, edit, and delete areas. Each record has a unique identifier, name, demand in kilowatts, priority category, and area type. The web app supports up to one hundred areas. Priority benefits are Critical one hundred, High seventy, Medium forty, and Low twenty.

## 5. Validate inputs before allocation

Available capacity must be a whole number from zero to five thousand kilowatts. Area demand must be positive. Each load receives its full requested power or none at all. Changing records or capacity clears the current allocation, while previously saved report snapshots remain unchanged.

## 6. Greedy allocation: priority first

Greedy first uses manual Merge Sort to order areas by descending priority benefit, then ascending identifier. It accepts each whole load that fits and skips loads that do not. This is a fast priority policy, but it does not guarantee the best combined benefit. Recorded steps show every decision.

## 7. Knapsack: maximize the priority benefit

Zero one Knapsack treats demand as weight and priority benefit as value. A dynamic programming matrix evaluates capacities, and traceback reconstructs the selected areas. It maximizes total benefit under the stated capacity model. Its work and storage grow with both area count and numeric capacity. Unused power can remain.

## 8. A verified six-area example

For the current six area demo at six hundred kilowatts, both standalone allocators select the hospital, Residential Area A, Government School, and Residential Area B. They allocate five hundred and eighty kilowatts, leave twenty unused, supply four of six areas, and achieve benefit two hundred and eighty. One shared outcome does not prove Greedy is always optimal.

## 9. Merge Sort: rank demand deterministically

Merge Sort recursively splits records into halves, sorts each half, and merges them. The lab can rank demand in ascending or descending order, using the area identifier to break ties. Its conventional time complexity is n log n. It also prepares priority order for Greedy and identifier order for searching.

## 10. Binary Search: find an area by ID

Binary Search repeatedly inspects the midpoint of an identifier sorted copy and discards half the remaining range. The search core takes logarithmic time. The application measures the fresh identifier sort separately, because preparation makes a complete lookup more expensive than the search alone. Here, identifier three finds the Industrial Zone.

## 11. Compare tasks without misleading rankings

The Performance page compares selected algorithms on one input snapshot, showing operation counts, complexity, output, and timing. Sorting, searching, and allocating solve different problems. A smaller runtime therefore does not make one algorithm a better replacement for another. Allocation quality must also consider the achieved benefit and capacity feasibility.

## 12. Measure repeated runs, not one animation

The Algorithm Report runs only when you explicitly request it. Choose current or representative inputs, measured runs, warmups, seed, and trace mode. It reports minimum, average, median, maximum, and ninety fifth percentile runtime in milliseconds, together with the environment, collection time, source functions, and output checks.

## 13. Separate core time from complete compute time

The runtime chart shows median and ninety fifth percentile values. Core execution, identifier sort preparation, and complete compute call time are separate scopes. Rendering, storage, downloads, and network requests are outside the timed compute calls. Export CSV for analysis or JSON for raw samples. No actual memory usage or prediction accuracy is claimed.

## 14. Keep immutable distribution snapshots

Each allocation saves a report snapshot containing the input areas, capacity, selected and unselected loads, benefit, utilization, and timing. You can inspect historical results and download CSV. The browser retains up to one hundred reports. Export anything you need before clearing browser storage.

## 15. Eight themes and a responsive 3D interface

The header offers four dark and four light themes. Color choices update charts, forms, reports, and three dimensional accents, and the preference is remembered. The layout adapts to smaller screens. The illustrated city is decorative: it does not calculate physical electricity routes, voltage, or transmission losses.

## 16. The original desktop edition is different

The original Python and Tkinter edition is also retained in the repository. It uses integer priorities, essential flags, and capacity up to ten thousand kilowatts. Greedy serves essential loads first, then Knapsack selects optional loads. That hybrid is not globally optimal across all loads. The current web edition runs the two allocators independently.

## 17. Open the public project and explore

The project is publicly deployed on Render and Vercel, with source on GitHub. The personalized Render address is shown here. It needs no account to open and no database server. This is an educational simulation, with no demand prediction, machine learning, time slot scheduler, or physical switching. Explore the labs and run your own performance report.
