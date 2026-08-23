"use client";

import React from 'react';

interface SeasonSelectorProps {
  value?: string;
  onChange?: (year: string) => void;
  currentSeason?: string;
  onSeasonChange?: (year: string) => void;
}

export default function SeasonSelector({ 
  value, 
  onChange, 
  currentSeason, 
  onSeasonChange 
}: SeasonSelectorProps) {
  const activeValue = value || currentSeason || "2024";
  const handleChange = (val: string) => {
    if (onChange) onChange(val);
    if (onSeasonChange) onSeasonChange(val);
  };

  return (
    <select
      value={activeValue}
      onChange={(e) => handleChange(e.target.value)}
      className="bg-zinc-950 border border-zinc-700 text-white font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-inner"
    >
      <option value="2026">2026 Season</option>
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
