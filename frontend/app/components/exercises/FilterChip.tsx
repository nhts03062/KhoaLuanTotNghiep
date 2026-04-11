'use client';

type FilterChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

export default function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-sm px-3 py-1.5 text-sm transition-all ${
        active
          ? 'bg-neutral-900 text-white shadow-md'
          : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900'
      }`}
    >
      {label}
    </button>
  );
}
