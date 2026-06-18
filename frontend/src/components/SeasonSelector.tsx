"use client";

import { useState } from "react";

export default function SeasonSelector() {
  const [seasonYear, setSeasonYear] = useState("2024");

  return (
    <select
      value={seasonYear}
      onChange={(e) => setSeasonYear(e.target.value)}
      className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 px-3 py-1.5"
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
