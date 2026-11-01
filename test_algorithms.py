import itertools
import unittest

from algorithms import Area, DEMO_AREAS, allocate, binary_search, knapsack, merge_sort


class AlgorithmTests(unittest.TestCase):
    def test_knapsack_against_exhaustive_search(self):
        areas = [Area(i + 1, str(i), demand, priority)
                 for i, (demand, priority) in enumerate([(3, 4), (4, 5), (2, 3), (6, 9), (2, 3)])]
        for capacity in range(20):
            best = max(sum(a.priority for a, include in zip(areas, mask) if include)
                       for mask in itertools.product([False, True], repeat=len(areas))
                       if sum(a.demand for a, include in zip(areas, mask) if include) <= capacity)
            result = knapsack(areas, capacity)
            self.assertEqual(sum(a.priority for a in result), best)
            self.assertLessEqual(sum(a.demand for a in result), capacity)
            self.assertEqual(len(result), len({a.id for a in result}))

    def test_demo_and_zero_capacity(self):
        self.assertEqual({a.id for a in allocate(DEMO_AREAS, 100)}, {1, 2, 3, 5})
        self.assertEqual(allocate(DEMO_AREAS, 0), [])
        self.assertEqual(allocate([], 100), [])

    def test_greedy_skips_oversized_essential(self):
        areas = [Area(1, 'Large hospital', 60, 10, True),
                 Area(2, 'Water', 20, 9, True), Area(3, 'Homes', 10, 5)]
        self.assertEqual({a.id for a in allocate(areas, 30)}, {2, 3})

    def test_sort_and_search(self):
        areas = [DEMO_AREAS[3], DEMO_AREAS[0], DEMO_AREAS[2]]
        ordered = merge_sort(areas, key=lambda a: a.id)
        self.assertEqual([a.id for a in ordered], [1, 3, 4])
        self.assertEqual(binary_search(ordered, 3), DEMO_AREAS[2])
        self.assertIsNone(binary_search(ordered, 2))
        self.assertIsNone(binary_search([], 1))
        self.assertEqual(merge_sort([(1, 'a'), (0, 'b'), (1, 'c')], key=lambda x: x[0]),
                         [(0, 'b'), (1, 'a'), (1, 'c')])

    def test_validation(self):
        for capacity in [-1, 10001, 1.5, True]:
            with self.assertRaises(ValueError):
                allocate(DEMO_AREAS, capacity)
        with self.assertRaises(ValueError):
            allocate([Area(1, 'Invalid', 0, 5)], 100)
        with self.assertRaises(ValueError):
            allocate([DEMO_AREAS[0], DEMO_AREAS[0]], 100)


if __name__ == '__main__':
    unittest.main()
