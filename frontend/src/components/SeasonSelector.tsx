"use client";

interface SeasonSelectorProps {
  value: string;
  onChange: (year: string) => void;
}

export default function SeasonSelector({ value, onChange }: SeasonSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 px-3 py-1.5"
    >
      <option value="2026">2026 (Live Current)</option>
      <option value="2025">2025 Season</option>
      <option value="2024">2024 Season</option>
      <option value="2023">2023 Season</option>
      <option value="2022">2022 Season</option>
      <option value="2021">2021 Season</option>
      <option value="2020">2020 Season</option>
      <option value="All">Combined All Time</option>
    </select>
  );
}
