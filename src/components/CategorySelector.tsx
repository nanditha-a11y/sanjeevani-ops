interface CategoryOption<Value extends string> {
  value: Value;
  label: string;
}

interface CategorySelectorProps<Value extends string> {
  label: string;
  options: readonly CategoryOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
}

export function CategorySelector<Value extends string>({
  label,
  options,
  value,
  onChange,
}: CategorySelectorProps<Value>) {
  return (
    <nav aria-label={label} className="flex gap-2 overflow-x-auto pb-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
            value === option.value
              ? 'border-teal-200 bg-teal-50 text-teal-800 shadow-sm'
              : 'border-slate-200 bg-white/80 text-slate-600 hover:border-teal-200 hover:bg-teal-50/60'
          }`}
        >
          {option.label}
        </button>
      ))}
    </nav>
  );
}
