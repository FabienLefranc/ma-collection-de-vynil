import React from "react";
import { Genre, GENRE_METAS } from "../types";
import { Search, X, SlidersHorizontal, ArrowUpDown, Image as ImageIcon } from "lucide-react";

export type SortOption = "artist_asc" | "artist_desc" | "year_asc" | "year_desc" | "rating_desc" | "priority_first" | "price_asc";

interface SearchBarAndFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedGenre: string;
  onGenreChange: (g: string) => void;
  selectedDecade: string;
  onDecadeChange: (d: string) => void;
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
  minRating: number;
  onMinRatingChange: (r: number) => void;
  onlyWithCover: boolean;
  onOnlyWithCoverChange: (v: boolean) => void;
  availableDecades: number[];
  totalMatches: number;
  totalWithCoverCount: number;
  onResetFilters: () => void;
}

export const SearchBarAndFilters: React.FC<SearchBarAndFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  selectedDecade,
  onDecadeChange,
  sortBy,
  onSortChange,
  minRating,
  onMinRatingChange,
  onlyWithCover,
  onOnlyWithCoverChange,
  availableDecades,
  totalMatches,
  totalWithCoverCount,
  onResetFilters,
}) => {
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedGenre !== "all" ||
    selectedDecade !== "all" ||
    minRating > 0 ||
    onlyWithCover;

  const showAdvancedFilters = hasActiveFilters;

  return (
    <div className="bg-[#1E1913] border border-[#3A3226] rounded-md p-2.5 sm:p-3 space-y-2.5 shadow-md transition-all">
      {/* Search Input Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#B7AD98]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Recherche rapide (artiste, album, année)..."
            className="w-full bg-[#14110E] border border-[#3A3226] text-[#F1E9D8] pl-9 pr-8 py-2 rounded text-sm placeholder-[#B7AD98]/60 focus:outline-none focus:border-[#E2A53C] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-2 p-0.5 rounded-full text-[#B7AD98] hover:text-[#F1E9D8]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Matches counter */}
        <div className="font-mono text-xs text-[#B7AD98] bg-[#14110E] border border-[#3A3226] px-2.5 py-2 rounded whitespace-nowrap shrink-0">
          <strong className="text-[#E2A53C]">{totalMatches}</strong> disque{totalMatches > 1 ? "s" : ""}
        </div>
      </div>

      {/* Expanded Filters (only visible when typing in the search input or when a filter is active) */}
      {showAdvancedFilters && (
        <div className="space-y-2.5 pt-2 border-t border-[#3A3226]/60">
          {/* Filter Chips: Genres */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#B7AD98] mr-1">
              Genre :
            </span>

            <button
              type="button"
              onClick={() => onGenreChange("all")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                selectedGenre === "all"
                  ? "bg-[#E2A53C] text-[#221A0E] font-bold shadow"
                  : "bg-[#14110E] text-[#B7AD98] hover:text-[#F1E9D8] border border-[#3A3226]"
              }`}
            >
              Tous les genres
            </button>

            {(Object.keys(GENRE_METAS) as Genre[]).map((key) => {
              const meta = GENRE_METAS[key];
              const isSelected = selectedGenre === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onGenreChange(key)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all border ${
                    isSelected
                      ? "shadow font-bold"
                      : "bg-[#14110E] text-[#B7AD98] hover:text-[#F1E9D8] border-[#3A3226]"
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: meta.color,
                          borderColor: meta.color,
                          color: "#FFFFFF",
                        }
                      : {}
                  }
                >
                  {meta.label}
                </button>
              );
            })}
          </div>

          {/* Secondary Row: Decades, Rating, Sort */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#3A3226]/40">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Decade Select */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#B7AD98]">
                  Décennie :
                </span>
                <select
                  value={selectedDecade}
                  onChange={(e) => onDecadeChange(e.target.value)}
                  className="bg-[#14110E] border border-[#3A3226] text-[#F1E9D8] text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-[#E2A53C]"
                >
                  <option value="all">Toutes les décennies</option>
                  {availableDecades.map((d) => (
                    <option key={d} value={d}>
                      Années {d}s
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#B7AD98]">
                  Note :
                </span>
                <select
                  value={minRating}
                  onChange={(e) => onMinRatingChange(Number(e.target.value))}
                  className="bg-[#14110E] border border-[#3A3226] text-[#F1E9D8] text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-[#E2A53C]"
                >
                  <option value={0}>Toutes les notes</option>
                  <option value={9}>⭐ 9+/10 (Chefs-d'œuvre)</option>
                  <option value={8}>⭐ 8+/10 (Excellents)</option>
                  <option value={7}>⭐ 7+/10 (Très bons)</option>
                  <option value={6}>⭐ 6+/10 (Bons)</option>
                </select>
              </div>

              {/* Toggle: Uniquement avec photo de pochette */}
              <button
                type="button"
                onClick={() => onOnlyWithCoverChange(!onlyWithCover)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border transition-all font-semibold ${
                  onlyWithCover
                    ? "bg-[#E2A53C] text-[#221A0E] border-[#E2A53C] shadow-sm font-bold"
                    : "bg-[#14110E] text-[#B7AD98] hover:text-[#F1E9D8] border-[#3A3226]"
                }`}
                title="Afficher uniquement les disques ayant une photo de pochette associée"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Avec pochette ({totalWithCoverCount})</span>
              </button>
            </div>

            {/* Sort Select & Reset */}
            <div className="flex items-center gap-2 ml-auto">
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#B7AD98]" />
                <select
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value as SortOption)}
                  className="bg-[#14110E] border border-[#3A3226] text-[#F1E9D8] text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-[#E2A53C]"
                >
                  <option value="artist_asc">Artiste (A → Z)</option>
                  <option value="artist_desc">Artiste (Z → A)</option>
                  <option value="year_asc">Année (Ancien → Récent)</option>
                  <option value="year_desc">Année (Récent → Ancien)</option>
                  <option value="rating_desc">Meilleures notes d'abord</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="text-xs text-[#E2A53C] hover:underline font-mono px-2 py-1"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
