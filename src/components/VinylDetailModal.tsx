import React from "react";
import { VinylRecord, GENRE_METAS } from "../types";
import { VinylCover } from "./VinylCover";
import {
  X,
  Star,
  Sparkles,
  ExternalLink,
  Music,
  History,
  Radio,
  Lightbulb,
  CheckCircle2,
  BookmarkPlus,
  ShoppingBag,
  Tag,
  Mic2,
} from "lucide-react";

interface VinylDetailModalProps {
  record: VinylRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (recordId: string, status: "owned" | "wanted" | "catalog") => void;
  onEditDetails?: (record: VinylRecord) => void;
  onDeleteRecord?: (record: VinylRecord) => void;
  onQuickRate?: (recordId: string, rating: number) => void;
}

/**
 * Renders stars for ratings on a 10-point scale (each star = 2 points, supporting fractional fill)
 */
const StarRatingDisplay: React.FC<{
  rating?: number;
  ratingComment?: string;
  onRate?: (newRating: number) => void;
}> = ({ rating = 0, ratingComment, onRate }) => {
  const formattedRating =
    rating > 0 ? rating.toString().replace(".", ",") : "—";
  return (
    <div className="flex flex-col gap-1.5 bg-[#191510] border border-[#3A3226] px-3.5 py-2.5 rounded-md text-left">
      <div className="inline-flex items-center gap-3 flex-wrap">
        <span className="font-mono text-xs uppercase tracking-wider text-[#B7AD98]">
          Note :
        </span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((starIndex) => {
            const fillLevel = Math.max(0, Math.min(1, (rating / 2) - (starIndex - 1)));
            return (
              <button
                key={starIndex}
                type="button"
                onClick={() => onRate && onRate(rating === starIndex * 2 ? 0 : starIndex * 2)}
                className={`relative p-0.5 transition-transform ${
                  onRate ? "hover:scale-110 cursor-pointer" : "cursor-default"
                }`}
                title={`Note : ${starIndex * 2}/10`}
              >
                {/* Empty background star */}
                <Star className="w-5 h-5 text-[#3A3226]" />
                {/* Filled foreground star (supports fractional fill like 9.4/10 -> 4.7 stars) */}
                {fillLevel > 0 && (
                  <div
                    className="absolute inset-0 p-0.5 overflow-hidden pointer-events-none"
                    style={{ width: `${fillLevel * 100}%` }}
                  >
                    <Star className="w-5 h-5 fill-[#E2A53C] text-[#E2A53C]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <span className="font-mono text-xs font-bold text-[#E2A53C] pl-2 border-l border-[#3A3226]">
          { `${formattedRating} / 10` }
        </span>
      </div>
      {ratingComment && ratingComment.trim() !== "" && (
        <p className="text-xs text-[#B7AD98] leading-snug">
          {ratingComment}
        </p>
      )}
    </div>
  );
};

export const VinylDetailModal: React.FC<VinylDetailModalProps> = ({
  record,
  isOpen,
  onClose,
  onStatusChange,
  onQuickRate,
}) => {
  if (!isOpen || !record) return null;

  const meta = GENRE_METAS[record.genre] || GENRE_METAS.rock;
  const isOwned = record.status === "owned";
  const isWanted = record.status === "wanted";

  // External reference links
  const discogsQueryUrl = `https://www.discogs.com/search/?q=${encodeURIComponent(
    `${record.artist} ${record.album}`
  )}&type=release&format_exact=Vinyl`;

  const youtubeQueryUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${record.artist} ${record.album} full album vinyl`
  )}`;

  const hasIconicTracks =
    Array.isArray(record.iconicTracks) &&
    record.iconicTracks.some((t) => t && t.trim() !== "");

  return (
    <div
      id="modal-album-fullscreen"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-hidden animate-fadeIn"
    >
      {/* Uniform Sheet Container */}
      <div className="w-full h-full max-w-5xl mx-auto flex flex-col bg-[#14110E] border border-[#3A3226] rounded-md text-[#F1E9D8] shadow-2xl overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="h-14 sm:h-16 px-4 sm:px-6 bg-[#1A1511] border-b border-[#3A3226] flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: meta.color }}
            />
            <div className="truncate">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#B7AD98] block">
                Fiche descriptive de l'album · {meta.label}
              </span>
              <h1 className="text-base sm:text-lg font-bold truncate text-[#F1E9D8] leading-tight">
                {record.artist} — <span className="italic text-[#E2A53C]">{record.album}</span>
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded bg-[#251F17] hover:bg-[#3A3226] text-[#B7AD98] hover:text-[#F1E9D8] transition-colors shrink-0"
            title="Fermer la fiche"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Sheet Content */}
        <div className="flex-1 overflow-y-auto">
          {/* 1. HERO SECTION : Cover, Catégorie, Date, Artiste, Album, Note /5, Pourquoi incontournable, 4 Boutons */}
          <div className="bg-gradient-to-b from-[#231C15] via-[#1A1511] to-[#14110E] p-5 sm:p-8 border-b border-[#3A3226]">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 max-w-4xl mx-auto">
              {/* Photo de la cover */}
              <div className="shrink-0">
                <VinylCover
                  artist={record.artist}
                  album={record.album}
                  genre={record.genre}
                  coverUrl={record.coverUrl}
                  status={record.status}
                  priority={record.wishlistPriority}
                  size="lg"
                />
              </div>

              {/* Infos principales de l'album */}
              <div className="flex-1 min-w-0 space-y-4 text-center md:text-left">
                {/* Catégorie de l'album & Date de sortie */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <span
                    className="font-mono text-xs px-3 py-1 rounded font-bold"
                    style={{
                      color: meta.color,
                      backgroundColor: meta.bgBadge,
                      border: `1px solid ${meta.borderBadge}`,
                    }}
                  >
                    Catégorie : {record.categoryLabel && record.categoryLabel.trim() !== "" ? record.categoryLabel : meta.label}
                  </span>

                  <span className="font-mono text-xs text-[#F1E9D8] bg-[#251F17] border border-[#3A3226] px-3 py-1 rounded">
                    Date de sortie :{" "}
                    <strong>
                      {record.releaseDetails && record.releaseDetails.trim() !== ""
                        ? record.releaseDetails
                        : record.year}
                    </strong>
                  </span>
                </div>

                {/* Nom de l'artiste ou du groupe & Nom de l'album */}
                <div>
                  <h2
                    className="text-4xl sm:text-5xl text-[#F1E9D8] font-black tracking-wide leading-none"
                    style={{ fontFamily: '"Bebas Neue", "IBM Plex Sans", sans-serif' }}
                  >
                    {record.artist}
                  </h2>
                  <p className="text-2xl sm:text-3xl text-[#E2A53C] font-serif italic mt-1 leading-tight">
                    {record.album}
                  </p>
                </div>

                {/* Note sur 5 avec étoiles */}
                <div className="flex justify-center md:justify-start">
                  <StarRatingDisplay
                    rating={record.rating}
                    ratingComment={record.ratingComment}
                    onRate={
                      onQuickRate
                        ? (newRating) => onQuickRate(record.id, newRating)
                        : undefined
                    }
                  />
                </div>

                {/* Pourquoi cet album est incontournable ? */}
                <div className="p-4 rounded-md bg-[#191510] border border-[#3A3226] text-sm text-[#F1E9D8]/90 leading-relaxed text-left">
                  <span className="font-mono text-xs text-[#E2A53C] uppercase tracking-wider block font-bold mb-1.5">
                    🎯 Pourquoi cet album est incontournable ?
                  </span>
                  {record.why && record.why.trim() !== "" ? (
                    <p className="text-[#F1E9D8]/95">{record.why}</p>
                  ) : (
                    <p className="text-[#B7AD98]/60 italic">À renseigner</p>
                  )}
                </div>

                {/* 4 Boutons d'action : Dans ma collection, Ajouter à ma wishlist, Explorer sur Discogs, Écouter le vinyle */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onStatusChange(record.id, "owned")}
                    className={`px-4 py-2 rounded text-xs font-bold transition-colors flex items-center gap-1.5 shadow ${
                      isOwned
                        ? "bg-[#6E8F5C] text-[#12190D]"
                        : "bg-[#251F17] hover:bg-[#3A3226] text-[#F1E9D8] border border-[#3A3226]"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isOwned ? "✓ Dans ma collection" : "Dans ma collection"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onStatusChange(record.id, "wanted")}
                    className={`px-4 py-2 rounded text-xs font-bold transition-colors flex items-center gap-1.5 shadow ${
                      isWanted
                        ? "bg-[#C3452F] text-white"
                        : "bg-[#251F17] hover:bg-[#3A3226] text-[#F1E9D8] border border-[#3A3226]"
                    }`}
                  >
                    <BookmarkPlus className="w-4 h-4" />
                    <span>{isWanted ? "🎯 Dans ma wishlist" : "Ajouter à ma wishlist"}</span>
                  </button>

                  <a
                    href={discogsQueryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded bg-[#191510] hover:bg-[#251F17] text-[#B7AD98] hover:text-[#F1E9D8] border border-[#3A3226] text-xs font-mono flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Explorer sur Discogs</span>
                  </a>

                  <a
                    href={youtubeQueryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded bg-[#191510] hover:bg-[#251F17] text-[#B7AD98] hover:text-[#F1E9D8] border border-[#3A3226] text-xs font-mono flex items-center gap-1.5 transition-colors"
                  >
                    <Radio className="w-3.5 h-3.5 text-[#C3452F]" />
                    <span>Écouter le vinyle</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 2. CORPS DE LA FICHE DESCRIPTIVE UNIFORME */}
          <div className="max-w-4xl mx-auto p-5 sm:p-8 space-y-6">
            {/* BLOC PRIX : Neuf vs Occasion (Mint ou VG+) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Prix moyen d'un album neuf */}
              <div className="bg-[#191510] border border-[#3A3226] rounded-md p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#3A3226]">
                  <ShoppingBag className="w-4 h-4 text-[#6E8F5C] shrink-0" />
                  <h3 className="font-mono text-xs uppercase tracking-wider text-[#6E8F5C] font-bold">
                    Prix moyen d'un album neuf
                  </h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[#B7AD98] text-xs font-mono">Prix moyen neuf :</span>
                    {record.newPrice && record.newPrice.trim() !== "" ? (
                      <span className="font-mono font-bold text-base text-[#F1E9D8]">
                        {record.newPrice}
                      </span>
                    ) : (
                      <span className="text-[#B7AD98]/60 italic text-xs">À renseigner</span>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[#B7AD98] text-xs font-mono">
                      Où le trouver (Amazon, etc.) :
                    </span>
                    {record.newPriceSource && record.newPriceSource.trim() !== "" ? (
                      <span className="font-medium text-[#E2A53C]">{record.newPriceSource}</span>
                    ) : (
                      <span className="text-[#B7AD98]/60 italic text-xs">À renseigner</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Prix le moins cher d'occasion (Mint ou VG+) */}
              <div className="bg-[#191510] border border-[#3A3226] rounded-md p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#3A3226]">
                  <Tag className="w-4 h-4 text-[#E2A53C] shrink-0" />
                  <h3 className="font-mono text-xs uppercase tracking-wider text-[#E2A53C] font-bold">
                    Prix le moins cher d'occasion (Mint ou VG+)
                  </h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[#B7AD98] text-xs font-mono">
                      Prix d'occasion (Mint / VG+) :
                    </span>
                    {record.usedPrice && record.usedPrice.trim() !== "" ? (
                      <span className="font-mono font-bold text-base text-[#F1E9D8]">
                        {record.usedPrice}
                      </span>
                    ) : (
                      <span className="text-[#B7AD98]/60 italic text-xs">À renseigner</span>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[#B7AD98] text-xs font-mono">
                      Où le trouver (Vinted, eBay, etc.) :
                    </span>
                    {record.usedPriceSource && record.usedPriceSource.trim() !== "" ? (
                      <span className="font-medium text-[#E2A53C]">{record.usedPriceSource}</span>
                    ) : (
                      <span className="text-[#B7AD98]/60 italic text-xs">À renseigner</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* BLOC TITRES EMBLÉMATIQUES (1 ou 2 titres) */}
            <div className="bg-[#191510] border border-[#3A3226] rounded-md p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#3A3226]">
                <Music className="w-4 h-4 text-[#E2A53C] shrink-0" />
                <h3 className="font-mono text-xs uppercase tracking-wider text-[#E2A53C] font-bold">
                  Titres les plus emblématiques de cet album
                </h3>
              </div>

              {hasIconicTracks ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {record.iconicTracks!
                    .filter((t) => t && t.trim() !== "")
                    .map((track, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 bg-[#14110E] border border-[#3A3226] px-3.5 py-2.5 rounded"
                      >
                        <span className="font-mono text-xs font-bold text-[#E2A53C] bg-[#251F17] px-2 py-0.5 rounded border border-[#3A3226]">
                          #{idx + 1}
                        </span>
                        <span className="font-medium text-sm text-[#F1E9D8]">{track}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center gap-3 bg-[#14110E] border border-dashed border-[#3A3226] px-3.5 py-2.5 rounded">
                    <span className="font-mono text-xs font-bold text-[#B7AD98]">#1</span>
                    <span className="text-xs text-[#B7AD98]/60 italic">
                      Titre emblématique 1 — À renseigner
                    </span>
                  </div>
                  <div className="flex items-center gap-3 bg-[#14110E] border border-dashed border-[#3A3226] px-3.5 py-2.5 rounded">
                    <span className="font-mono text-xs font-bold text-[#B7AD98]">#2</span>
                    <span className="text-xs text-[#B7AD98]/60 italic">
                      Titre emblématique 2 — À renseigner
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* BLOC GENÈSE ET CONTEXTE DE L'ENREGISTREMENT */}
            <div className="bg-[#191510] border border-[#3A3226] rounded-md p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#3A3226]">
                <History className="w-4 h-4 text-[#E2A53C] shrink-0" />
                <h3 className="font-mono text-xs uppercase tracking-wider text-[#E2A53C] font-bold">
                  Genèse et contexte de l'enregistrement de cet album
                </h3>
              </div>
              {record.genesis && record.genesis.trim() !== "" ? (
                <p className="whitespace-pre-line text-sm sm:text-base text-[#F1E9D8]/90 leading-relaxed">
                  {record.genesis}
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-[#B7AD98]/60 italic py-2">
                  À renseigner
                </p>
              )}
            </div>

            {/* BLOC ANECDOTES : Anecdote sur l'album & Anecdote sur le groupe / chanteur */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Anecdote sur cet album */}
              <div className="bg-[#191510] border border-[#3A3226] rounded-md p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#3A3226]">
                  <Lightbulb className="w-4 h-4 text-[#E2A53C] shrink-0" />
                  <h3 className="font-mono text-xs uppercase tracking-wider text-[#E2A53C] font-bold">
                    Anecdote sur cet album
                  </h3>
                </div>
                {record.albumAnecdote && record.albumAnecdote.trim() !== "" ? (
                  <p className="whitespace-pre-line text-sm text-[#F1E9D8]/90 leading-relaxed">
                    {record.albumAnecdote}
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm text-[#B7AD98]/60 italic py-2">
                    À renseigner
                  </p>
                )}
              </div>

              {/* Anecdote sur le groupe ou le chanteur */}
              <div className="bg-[#191510] border border-[#3A3226] rounded-md p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#3A3226]">
                  <Mic2 className="w-4 h-4 text-[#C3452F] shrink-0" />
                  <h3 className="font-mono text-xs uppercase tracking-wider text-[#FF7A63] font-bold">
                    Anecdote sur le groupe ou le chanteur
                  </h3>
                </div>
                {record.artistAnecdote && record.artistAnecdote.trim() !== "" ? (
                  <p className="whitespace-pre-line text-sm text-[#F1E9D8]/90 leading-relaxed">
                    {record.artistAnecdote}
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm text-[#B7AD98]/60 italic py-2">
                    À renseigner
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <footer className="p-3.5 bg-[#14110E] border-t border-[#3A3226] flex items-center justify-between text-xs text-[#B7AD98] shrink-0">
          <span className="font-mono text-[11px]">
            Fiche stockée localement · Aucune recherche externe
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#251F17] hover:bg-[#3A3226] text-[#F1E9D8] font-semibold transition-colors"
          >
            Fermer la fiche
          </button>
        </footer>
      </div>
    </div>
  );
};
