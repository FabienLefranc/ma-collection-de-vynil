import React from "react";
import { VinylRecord, GENRE_METAS } from "../types";
import { VinylCover } from "./VinylCover";
import { Star, Maximize2 } from "lucide-react";

interface VinylCardProps {
  record: VinylRecord;
  onStatusChange: (recordId: string, status: "owned" | "wanted" | "catalog") => void;
  onEditDetails: (record: VinylRecord) => void;
  onSelectRecord?: (record: VinylRecord) => void;
  onDeleteRecord?: (record: VinylRecord) => void;
  onDeleteCustom?: (recordId: string) => void;
  onQuickRate?: (recordId: string, rating: number) => void;
  compact?: boolean;
}

export const VinylCard: React.FC<VinylCardProps> = ({
  record,
  onStatusChange,
  onSelectRecord,
  onQuickRate,
  compact = false,
}) => {
  const meta = GENRE_METAS[record.genre] || GENRE_METAS.rock;
  const isOwned = record.status === "owned";
  const isWanted = record.status === "wanted";

  return (
    <article
      className={`group relative bg-[#1E1913] hover:bg-[#231E17] border border-[#3A3226] rounded-sm transition-all duration-150 flex flex-col justify-between ${
        isOwned
          ? "border-l-4 border-l-[#6E8F5C]"
          : isWanted
          ? "border-l-4 border-l-[#C3452F]"
          : "border-l-4"
      }`}
      style={{
        borderLeftColor: isOwned ? "#6E8F5C" : isWanted ? "#C3452F" : meta.color,
      }}
    >
      <div className="p-3.5 sm:p-4 flex gap-3.5">
        {/* Vinyl Cover Art / Grooves */}
        <div
          onClick={() => onSelectRecord && onSelectRecord(record)}
          className="cursor-pointer shrink-0"
          title="Cliquer pour ouvrir la fiche descriptive"
        >
          <VinylCover
            artist={record.artist}
            album={record.album}
            genre={record.genre}
            coverUrl={record.coverUrl}
            status={record.status}
            priority={record.wishlistPriority}
            size={compact ? "sm" : "md"}
          />
        </div>

        {/* Content Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Genre & Meta header */}
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="font-mono text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded font-semibold"
                  style={{
                    color: meta.color,
                    backgroundColor: meta.bgBadge,
                    border: `1px solid ${meta.borderBadge}`,
                  }}
                >
                  {meta.label}
                </span>

                <span className="font-mono text-xs text-[#B7AD98]">
                  {record.year}
                </span>

                {record.isCustom && (
                  <span className="font-mono text-[9px] uppercase px-1 py-0.5 rounded bg-[#3A3226] text-[#B7AD98]">
                    Ajout perso
                  </span>
                )}
              </div>
            </div>

            {/* Artist & Album - Clickable to open full screen detail */}
            <div
              onClick={() => onSelectRecord && onSelectRecord(record)}
              className="cursor-pointer group/title select-none"
              title="Cliquer pour afficher la fiche complète en plein écran"
            >
              <h3
                className="text-[#F1E9D8] group-hover/title:text-[#E2A53C] font-bold text-lg sm:text-xl leading-tight truncate tracking-wide transition-colors flex items-center justify-between"
                style={{ fontFamily: '"Bebas Neue", "IBM Plex Sans", sans-serif' }}
              >
                <span className="truncate">{record.artist}</span>
                <Maximize2 className="w-3.5 h-3.5 opacity-0 group-hover/title:opacity-100 text-[#E2A53C] transition-opacity shrink-0 ml-1" />
              </h3>
              <p
                className="text-[#F1E9D8]/90 group-hover/title:text-[#F1E9D8] font-medium text-sm sm:text-base italic leading-snug truncate"
              >
                {record.album}
              </p>
            </div>

            {/* Why review / highlights */}
            <p
              onClick={() => onSelectRecord && onSelectRecord(record)}
              className="text-[#B7AD98] hover:text-[#D5C9B3] text-xs leading-relaxed mt-1.5 line-clamp-2 cursor-pointer transition-colors"
              title="Cliquer pour lire toute la présentation"
            >
              {record.why}
            </p>
          </div>

          {/* Note sur 10 */}
          {(isOwned || (record.rating !== undefined && record.rating > 0)) && (
            <div className="mt-2.5 pt-2 border-t border-dashed border-[#3A3226] flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1 text-[#E2A53C]" title="Note sur 10">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((starIndex) => {
                    const ratingVal = record.rating || 0;
                    // Échelle sur 10 : chaque étoile représente 2 points
                    const fillLevel = Math.max(0, Math.min(1, (ratingVal / 2) - (starIndex - 1)));
                    return (
                      <button
                        key={starIndex}
                        type="button"
                        onClick={() =>
                          onQuickRate &&
                          onQuickRate(record.id, starIndex * 2 === record.rating ? 0 : starIndex * 2)
                        }
                        className="relative hover:scale-125 transition-transform"
                        title={`Noter ${starIndex * 2}/10`}
                      >
                        <Star className="w-3.5 h-3.5 text-[#3A3226]" />
                        {fillLevel > 0 && (
                          <div
                            className="absolute inset-0 overflow-hidden pointer-events-none"
                            style={{ width: `${fillLevel * 100}%` }}
                          >
                            <Star className="w-3.5 h-3.5 fill-[#E2A53C] text-[#E2A53C]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {record.rating !== undefined && record.rating > 0 && (
                  <span className="font-mono text-[11px] font-bold text-[#E2A53C] ml-0.5">
                    {record.rating.toString().replace(".", ",")}/10
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer Bar */}
      <div className="bg-[#171310] px-3.5 py-2 border-t border-[#3A3226] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Collection button */}
          <button
            type="button"
            onClick={() => onStatusChange(record.id, "owned")}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isOwned
                ? "bg-[#6E8F5C] text-[#12190D] shadow-sm font-bold"
                : "bg-transparent hover:bg-[#251F17] text-[#B7AD98] hover:text-[#F1E9D8] border border-[#3A3226]"
            }`}
            title="Placer dans ma collection"
          >
            <span>📀</span>
            <span>Dans ma collection</span>
          </button>

          {/* Wishlist button */}
          <button
            type="button"
            onClick={() => onStatusChange(record.id, "wanted")}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isWanted
                ? "bg-[#C3452F] text-[#F1E9D8] shadow-sm font-bold"
                : "bg-transparent hover:bg-[#251F17] text-[#B7AD98] hover:text-[#F1E9D8] border border-[#3A3226]"
            }`}
            title="Placer dans ma wishlist"
          >
            <span>🎯</span>
            <span>Dans ma wishlist</span>
          </button>
        </div>

        {/* Fullscreen detail modal button */}
        {onSelectRecord && (
          <button
            type="button"
            onClick={() => onSelectRecord(record)}
            className="p-1.5 rounded text-[#B7AD98] hover:text-[#F1E9D8] hover:bg-[#251F17] transition-colors shrink-0"
            title="Agrandir et voir la fiche descriptive complète"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </article>
  );
};
