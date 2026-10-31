import React from "react";
import { Genre, GENRE_METAS, WishlistPriority, PRIORITY_CONFIG } from "../types";
import { Disc3, Camera } from "lucide-react";

interface VinylCoverProps {
  artist: string;
  album: string;
  genre: Genre;
  coverUrl?: string;
  status: "owned" | "wanted" | "catalog";
  priority?: WishlistPriority;
  size?: "sm" | "md" | "lg";
  onUploadCover?: () => void;
}

export const VinylCover: React.FC<VinylCoverProps> = ({
  artist,
  album,
  genre,
  coverUrl,
  status,
  priority,
  size = "md",
  onUploadCover,
}) => {
  const genreColor = GENRE_METAS[genre]?.color || "#C3452F";

  const sizeClasses = {
    sm: "w-16 h-16 min-w-16",
    md: "w-20 h-20 min-w-20 sm:w-24 sm:h-24 sm:min-w-24",
    lg: "w-28 h-28 min-w-28 sm:w-32 sm:h-32 sm:min-w-32",
  }[size];

  return (
    <div className={`relative ${sizeClasses} rounded-sm overflow-hidden bg-[#1E1913] border border-[#3A3226] shrink-0 group select-none shadow-md`}>
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={`Pochette ${artist} - ${album}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        /* Authentic vinyl disc groove art */
        <div className="w-full h-full relative flex items-center justify-center bg-[#171310] overflow-hidden">
          {/* Vinyl grooves background */}
          <div
            className="absolute inset-0 opacity-80"
            style={{
              background: `
                radial-gradient(circle at 50% 50%, #171310 0%, #171310 24%, transparent 25%),
                repeating-radial-gradient(circle at 50% 50%, #0d0b09 0px, #1a1512 1px, #0d0b09 2px, #26201a 3px)
              `,
            }}
          />
          {/* Vinyl center label */}
          <div
            className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex flex-col items-center justify-center border-2 shadow-inner"
            style={{
              backgroundColor: genreColor,
              borderColor: "#14110E",
            }}
          >
            {/* Spindle hole */}
            <div className="w-2.5 h-2.5 rounded-full bg-[#14110E] border border-black/40 shadow-sm flex items-center justify-center">
              <div className="w-0.5 h-0.5 rounded-full bg-[#B7AD98]" />
            </div>
          </div>
          {/* Sheen effect across grooves */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 via-transparent to-white/10" />
        </div>
      )}

      {/* Owned badge */}
      {status === "owned" && (
        <div className="absolute top-1 left-1 bg-[#6E8F5C]/90 text-[#12190D] px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow flex items-center gap-0.5">
          <span>POSSÉDÉ</span>
        </div>
      )}

      {/* Upload/Change cover trigger */}
      {onUploadCover && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUploadCover();
          }}
          title="Changer la pochette"
          aria-label="Changer la pochette"
          className="absolute bottom-1 right-1 p-1 rounded-full bg-[#14110E]/80 text-[#F1E9D8] hover:text-[#E2A53C] hover:bg-[#14110E] border border-[#3A3226] opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Camera className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
