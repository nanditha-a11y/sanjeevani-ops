import type { OperationalAlert } from '../types';

export type AlertFilter = 'all' | OperationalAlert['urgency'];
export type AlertSort = 'newest' | 'oldest' | 'priority';

const urgencyRank: Record<OperationalAlert['urgency'], number> = { high: 0, medium: 1, low: 2 };

export function sortAndFilterAlerts(alerts: OperationalAlert[], filter: AlertFilter, sort: AlertSort) {
  return alerts
    .filter((alert) => filter === 'all' || alert.urgency === filter)
    .sort((first, second) => {
      if (sort === 'newest') return Date.parse(second.createdAt) - Date.parse(first.createdAt);
      if (sort === 'oldest') return Date.parse(first.createdAt) - Date.parse(second.createdAt);
      return urgencyRank[first.urgency] - urgencyRank[second.urgency]
        || Date.parse(second.createdAt) - Date.parse(first.createdAt);
    });
}

const filters: Array<{ value: AlertFilter; label: string }> = [
  { value: 'all', label: 'All Items' },
  { value: 'high', label: 'High Priority' },
  { value: 'medium', label: 'Moderate Priority' },
  { value: 'low', label: 'Low Priority' },
];

export function ActionQueueToolbar({
  filter,
  onFilterChange,
  sort,
  onSortChange,
}: {
  filter: AlertFilter;
  onFilterChange: (filter: AlertFilter) => void;
  sort: AlertSort;
  onSortChange: (sort: AlertSort) => void;
}) {
  return (
    <div className="glass-panel flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div role="group" aria-label="Filter action items by priority" className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={filter === item.value}
            onClick={() => onFilterChange(item.value)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              filter === item.value
                ? item.value === 'high'
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : item.value === 'medium'
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : item.value === 'low'
                      ? 'border-teal-200 bg-teal-50 text-teal-800'
                      : 'border-slate-300 bg-slate-100 text-slate-800'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
        Sort
        <select
          aria-label="Sort action items"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as AlertSort)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
        >
          <option value="newest">Newest to Oldest</option>
          <option value="oldest">Oldest to Newest</option>
          <option value="priority">Priority (High to Low)</option>
        </select>
      </label>
    </div>
  );
}
