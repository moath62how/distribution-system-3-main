import { useState, useMemo } from 'react';

/**
 * Custom hook to encapsulate tabular list filtering, searching, and sorting.
 *
 * @param {Object} params
 * @param {Array} params.data The raw array of items to filter.
 * @param {Array<string>} params.searchFields Fields to search text against.
 * @param {string} params.dateField The object property representing the date (default: 'created_at').
 * @param {string} params.initialSort The initial sort key (default: 'date-desc').
 * @param {Function} params.sortComparator Comparator function for sorting: (a, b, sortKey) => number.
 */
export function useTableFilters({
  data = [],
  searchFields = [],
  dateField = 'created_at',
  initialSort = 'date-desc',
  sortComparator
}) {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState(initialSort);

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    let result = data.filter(item => {
      // 1. Text Search matching
      const textMatch = !search || searchFields.some(field => {
        const val = item[field];
        return val !== undefined && val !== null && String(val).toLowerCase().includes(search.toLowerCase());
      });

      // 2. Date Range matching
      const rawDate = item[dateField];
      let matchFrom = true;
      let matchTo = true;

      if (rawDate) {
        const itemDate = new Date(rawDate).toISOString().split('T')[0];
        matchFrom = !dateFrom || itemDate >= dateFrom;
        matchTo = !dateTo || itemDate <= dateTo;
      } else if (dateFrom || dateTo) {
        // If there's date filters but item has no date, filter it out
        return false;
      }

      return textMatch && matchFrom && matchTo;
    });

    // 3. Sort ordering
    if (sortComparator) {
      result = [...result].sort((a, b) => sortComparator(a, b, sort));
    }

    return result;
  }, [data, search, dateFrom, dateTo, sort, searchFields, dateField, sortComparator]);

  const resetFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setSort(initialSort);
  };

  return {
    search,
    setSearch,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    sort,
    setSort,
    filteredData,
    resetFilters
  };
}
