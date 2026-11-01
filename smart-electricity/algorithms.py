"""Four independent algorithms. No database or HTTP work belongs here."""
from time import perf_counter_ns

BENEFITS = {'Critical': 100, 'High': 70, 'Medium': 40, 'Low': 20}


def measured(function, *args, **kwargs):
    start = perf_counter_ns()
    result = function(*args, **kwargs)
    result['time_ns'] = perf_counter_ns() - start
    return result


def merge_sort(records, key='demand', descending=False, trace=True):
    steps, comparisons, merges = [], 0, 0

    def precedes(a, b):
        if a[key] == b[key]:
            return a['id'] <= b['id']
        return a[key] > b[key] if descending else a[key] < b[key]

    def visit(items, depth=0):
        nonlocal comparisons, merges
        if len(items) < 2:
            return list(items)
        mid = len(items) // 2
        if trace:
            steps.append({'kind': 'split', 'ids': [a['id'] for a in items],
                          'left': [a['id'] for a in items[:mid]], 'right': [a['id'] for a in items[mid:]], 'depth': depth})
        left, right = visit(items[:mid], depth+1), visit(items[mid:], depth+1)
        out, i, j = [], 0, 0
        while i < len(left) and j < len(right):
            comparisons += 1
            if precedes(left[i], right[j]):
                out.append(left[i]); i += 1
            else:
                out.append(right[j]); j += 1
        out.extend(left[i:]); out.extend(right[j:]); merges += 1
        if trace:
            steps.append({'kind': 'merge', 'ids': [a['id'] for a in out], 'depth': depth})
        return out

    ordered = visit(records)
    return {'records': ordered, 'original': [a['id'] for a in records], 'steps': steps,
            'operations': comparisons, 'comparisons': comparisons, 'merges': merges}


def allocation_output(records, selected, capacity):
    ids = {a['id'] for a in selected}
    used = sum(a['demand'] for a in selected)
    return {'selected': selected, 'rejected': [a for a in records if a['id'] not in ids],
            'allocated': used, 'remaining': capacity-used,
            'benefit': sum(BENEFITS[a['priority']] for a in selected),
            'utilization': used/capacity*100 if capacity else 0}


def greedy(records, capacity, trace=True):
    # Manual Merge Sort supplies deterministic priority / ID ordering.
    decorated = [dict(a, benefit=BENEFITS[a['priority']]) for a in records]
    ordered = merge_sort(decorated, 'benefit', True, False)
    remaining, selected, steps = capacity, [], []
    for a in ordered['records']:
        accepted = a['demand'] <= remaining
        if accepted:
            selected.append(a); remaining -= a['demand']
        if trace:
            steps.append({'kind': 'accept' if accepted else 'reject', 'id': a['id'],
                          'remaining': remaining, 'selected': [x['id'] for x in selected]})
    return dict(allocation_output(records, selected, capacity), steps=steps,
                operations=len(records), decisions=len(records), sort_comparisons=ordered['comparisons'])


def knapsack(records, capacity, trace=True):
    # Full DP rows permit straightforward, beginner-friendly traceback.
    n = len(records)
    dp = [[0]*(capacity+1) for _ in range(n+1)]
    states, steps = 0, []
    for i, a in enumerate(records, 1):
        weight, value = a['demand'], BENEFITS[a['priority']]
        updates = 0
        for c in range(capacity+1):
            states += 1
            dp[i][c] = dp[i-1][c]
            if weight <= c and dp[i-1][c-weight]+value > dp[i][c]:
                dp[i][c] = dp[i-1][c-weight]+value
                updates += 1
        if trace:
            steps.append({'kind': 'dp-row', 'id': a['id'], 'row': i, 'updates': updates,
                          'best_benefit': dp[i][capacity], 'states': i*(capacity+1)})
    selected, c = [], capacity
    for i in range(n, 0, -1):
        take = dp[i][c] != dp[i-1][c]
        if take:
            selected.append(records[i-1]); c -= records[i-1]['demand']
        if trace:
            steps.append({'kind': 'traceback', 'id': records[i-1]['id'], 'take': take, 'remaining': c})
    selected.reverse()
    return dict(allocation_output(records, selected, capacity), steps=steps, operations=states,
                dp_states=states, table=dp if trace and n <= 10 and capacity <= 30 else None,
                table_note='Full table shown only for ≤10 areas and ≤30 kW. Each column is 1 kW.')


def binary_search(records, target, trace=True):
    low, high, comparisons, steps, found = 0, len(records)-1, 0, [], None
    while low <= high:
        mid = (low+high)//2
        comparisons += 1  # One three-way key comparison per inspected midpoint.
        a = records[mid]
        relation = 'equal' if a['id'] == target else 'lower' if a['id'] < target else 'higher'
        if trace:
            steps.append({'kind': 'inspect', 'low': low, 'high': high, 'mid': mid,
                          'id': a['id'], 'relation': relation})
        if relation == 'equal':
            found = a; break
        if relation == 'lower':
            low = mid+1
        else:
            high = mid-1
    return {'found': found, 'steps': steps, 'operations': comparisons,
            'comparisons': comparisons, 'iterations': comparisons, 'target': target,
            'records': records}


def execute(name, records, capacity, target=1, descending=False, trace=True):
    if name == 'greedy':
        return measured(greedy, records, capacity, trace)
    if name == 'knapsack':
        return measured(knapsack, records, capacity, trace)
    if name == 'merge':
        return measured(merge_sort, records, 'demand', descending, trace)
    if name == 'binary':
        prepared = measured(merge_sort, records, 'id', False, False)
        result = measured(binary_search, prepared['records'], target, trace)
        result['preparation_ns'] = prepared['time_ns']
        return result
    raise ValueError('Unknown algorithm.')
