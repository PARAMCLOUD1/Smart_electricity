"""DAA algorithms for indivisible electricity loads (integer kW)."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Area:
    id: int
    name: str
    demand: int
    priority: int
    essential: bool = False


def merge_sort(items, key):
    """Stable merge sort; ascending by the supplied key."""
    if len(items) <= 1:
        return list(items)
    middle = len(items) // 2
    left = merge_sort(items[:middle], key)
    right = merge_sort(items[middle:], key)
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if key(left[i]) <= key(right[j]):
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    return result + left[i:] + right[j:]


def binary_search(areas, area_id):
    """Input must be sorted by ascending ID. Return an Area or None."""
    low, high = 0, len(areas) - 1
    while low <= high:
        middle = (low + high) // 2
        if areas[middle].id == area_id:
            return areas[middle]
        if areas[middle].id < area_id:
            low = middle + 1
        else:
            high = middle - 1
    return None


def knapsack(areas, capacity):
    """Maximize summed priority with 0/1 DP and immutable selection masks.

    Equal scores retain the earlier solution. Each load is selected at most once.
    """
    scores = [0] * (capacity + 1)
    masks = [0] * (capacity + 1)
    for index, area in enumerate(areas):
        for remaining in range(capacity, area.demand - 1, -1):
            candidate = scores[remaining - area.demand] + area.priority
            if candidate > scores[remaining]:
                scores[remaining] = candidate
                masks[remaining] = masks[remaining - area.demand] | (1 << index)
    return [area for i, area in enumerate(areas) if masks[capacity] & (1 << i)]


def allocate(areas, capacity):
    """Greedy essential-first allocation, followed by nonessential knapsack.

    This is a policy-driven hybrid, not a globally optimal joint knapsack.
    Essential loads are considered by priority descending, demand ascending,
    then ID ascending. A load that does not fit is skipped; loads are indivisible.
    """
    if not isinstance(capacity, int) or isinstance(capacity, bool) or not 0 <= capacity <= 10000:
        raise ValueError('Capacity must be an integer from 0 to 10,000 kW.')
    if len(areas) > 100:
        raise ValueError('At most 100 areas are supported.')
    if len({a.id for a in areas}) != len(areas):
        raise ValueError('Area IDs must be unique.')
    for area in areas:
        if (not area.name.strip() or type(area.id) is not int or area.id <= 0
                or type(area.demand) is not int or area.demand <= 0
                or type(area.priority) is not int or not 1 <= area.priority <= 10):
            raise ValueError('Each area needs a positive integer ID and demand, a name, and priority 1–10.')
    essentials = merge_sort([a for a in areas if a.essential],
                            key=lambda a: (-a.priority, a.demand, a.id))
    selected = []
    remaining = capacity
    for area in essentials:
        if area.demand <= remaining:
            selected.append(area)
            remaining -= area.demand
    optional = merge_sort([a for a in areas if not a.essential], key=lambda a: a.id)
    selected.extend(knapsack(optional, remaining))
    return selected


DEMO_AREAS = [
    Area(1, 'City Hospital', 30, 10, True),
    Area(2, 'Water Pump Station', 20, 9, True),
    Area(3, 'Residential North', 25, 7),
    Area(4, 'Industrial Zone', 40, 8),
    Area(5, 'School Campus', 15, 6),
    Area(6, 'Shopping District', 20, 4),
]
