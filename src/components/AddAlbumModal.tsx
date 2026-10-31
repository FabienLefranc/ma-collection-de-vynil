import React, { useState } from "react";
import { VinylRecord, Genre, GENRE_METAS, VinylStatus, WishlistPriority } from "../types";
import { normalizeRecordKey } from "../data/baseRecords";
import { X, Sparkles, Loader2, Plus, Disc, HelpCircle } from "lucide-react";

interface AddAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRecord: (newRecord: VinylRecord) => void;
  existingRecordKeys: Set<string>;
}

export const AddAlbumModal: React.FC<AddAlbumModalProps> = ({
  isOpen,
  onClose,
  onAddRecord,
  existingRecordKeys,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<"ai" | "manual">("ai");
  const [artistInput, setArtistInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{
    artist: string;
    album: string;
    year: number;
    genre: Genre;
    price: string;
    why: string;
    tracks?: string[];
  } | null>(null);

  // Manual Form State
  const [mArtist, setMArtist] = useState("");
  const [mAlbum, setMAlbum] = useState("");
  const [mYear, setMYear] = useState<string>(String(new Date().getFullYear()));
  const [mGenre, setMGenre] = useState<Genre>("rock");
  const [mPrice, setMPrice] = useState("20–30 €");
  const [mWhy, setMWhy] = useState("");
  const [mStatus, setMStatus] = useState<VinylStatus>("wanted");
  const [mPriority, setMPriority] = useState<WishlistPriority>("P2");

  const handleAskAI = async () => {
    const trimmed = artistInput.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setAiError(null);
    setAiResult(null);

    try {
      const res = await fetch("/api/recommend-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artist: trimmed }),
      });

      if (!res.ok) {
        throw new Error("Impossible de joindre le disquaire virtuel.");
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setAiResult({
        artist: data.artist || trimmed,
        album: data.album || "Album Référence",
        year: Number(data.year) || 1975,
        genre: (data.genre as Genre) || "rock",
        price: data.price || "20–30 €",
        why: data.why || "Référence majeure de cet artiste en vinyle.",
        tracks: data.tracks || [],
      });
    } catch (err: any) {
      setAiError(err.message || "Erreur lors de la recherche.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAddAI = (status: VinylStatus) => {
    if (!aiResult) return;
    const key = normalizeRecordKey(aiResult.artist, aiResult.album);
    if (existingRecordKeys.has(key)) {
      alert(`"${aiResult.artist} - ${aiResult.album}" est déjà présent dans votre discothèque.`);
      return;
    }

    const newRec: VinylRecord = {
      id: key,
      artist: aiResult.artist,
      album: aiResult.album,
      year: aiResult.year,
      genre: aiResult.genre,
      why: aiResult.why,
      indicativePrice: aiResult.price,
      status,
      wishlistPriority: status === "wanted" ? "P1" : undefined,
      isCustom: true,
      dateAdded: new Date().toISOString().split("T")[0],
      highlightTracks: aiResult.tracks,
    };

    onAddRecord(newRec);
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const artist = mArtist.trim();
    const album = mAlbum.trim();
    if (!artist || !album) {
      alert("Veuillez renseigner au moins le nom de l'artiste et de l'album.");
      return;
    }

    const key = normalizeRecordKey(artist, album);
    if (existingRecordKeys.has(key)) {
      alert(`"${artist} - ${album}" est déjà dans votre discothèque.`);
      return;
    }

    const newRec: VinylRecord = {
      id: key,
      artist,
      album,
      year: parseInt(mYear, 10) || new Date().getFullYear(),
      genre: mGenre,
      indicativePrice: mPrice.trim() || "20–30 €",
      why: mWhy.trim() || "Ajouté manuellement à ma discothèque.",
      status: mStatus,
      wishlistPriority: mStatus === "wanted" ? mPriority : undefined,
      isCustom: true,
      dateAdded: new Date().toISOString().split("T")[0],
    };

    onAddRecord(newRec);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#1E1913] border border-[#3A3226] rounded-md shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-[#14110E] p-4 sm:p-5 border-b border-[#3A3226] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Disc className="w-6 h-6 text-[#E2A53C]" />
            <h2
              className="text-2xl text-[#F1E9D8] font-bold tracking-wide"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              Ajouter un album à la discothèque
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-[#B7AD98] hover:text-[#F1E9D8] hover:bg-[#251F17]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#3A3226] bg-[#171310]">
          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className={`flex-1 py-2.5 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === "ai"
                ? "border-[#E2A53C] text-[#E2A53C] bg-[#1E1913]"
                : "border-transparent text-[#B7AD98] hover:text-[#F1E9D8]"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Disquaire IA (Recherche de référence)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-2.5 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === "manual"
                ? "border-[#E2A53C] text-[#E2A53C] bg-[#1E1913]"
                : "border-transparent text-[#B7AD98] hover:text-[#F1E9D8]"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Saisie Manuelle</span>
          </button>
        </div>

        {/* Tab 1: AI Assistant */}
        {activeTab === "ai" && (
          <div className="p-4 sm:p-6 space-y-4">
            <p className="text-xs sm:text-sm text-[#B7AD98] leading-relaxed">
              Tape le nom d’un groupe ou d’un artiste. Le disquaire virtuel identifie l’album
              de référence absolue en vinyle, son année, sa cote d'occasion et la raison de son statut incontournable.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={artistInput}
                onChange={(e) => setArtistInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAskAI();
                  }
                }}
                placeholder="Ex : Black Sabbath, Serge Gainsbourg, King Crimson..."
                className="flex-1 bg-[#14110E] border border-[#3A3226] text-[#F1E9D8] px-3.5 py-2.5 rounded text-sm focus:outline-none focus:border-[#E2A53C]"
              />
              <button
                type="button"
                disabled={isLoading || !artistInput.trim()}
                onClick={handleAskAI}
                className="px-4 py-2.5 rounded bg-[#E2A53C] hover:bg-[#E8AF4D] disabled:opacity-50 text-[#221A0E] font-bold text-sm flex items-center gap-1.5 transition-colors shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Recherche...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Trouver</span>
                  </>
                )}
              </button>
            </div>

            {aiError && (
              <div className="p-3 bg-red-900/30 border border-red-700/50 rounded text-red-200 text-xs">
                {aiError}
              </div>
            )}

            {/* AI Result Card */}
            {aiResult && (
              <div className="p-4 rounded bg-[#14110E] border border-[#E2A53C]/40 space-y-3 shadow-inner">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold"
                    style={{
                      color: GENRE_METAS[aiResult.genre]?.color || "#E2A53C",
                      backgroundColor: GENRE_METAS[aiResult.genre]?.bgBadge || "rgba(226,165,60,0.15)",
                    }}
                  >
                    {GENRE_METAS[aiResult.genre]?.label || aiResult.genre} · {aiResult.year}
                  </span>
                  <span className="font-mono text-xs text-[#E2A53C] font-semibold">
                    Cote : {aiResult.price}
                  </span>
                </div>

                <div>
                  <h4
                    className="text-2xl text-[#F1E9D8] font-bold leading-none"
                    style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                  >
                    {aiResult.artist}
                  </h4>
                  <p className="text-base text-[#F1E9D8]/90 italic font-medium">
                    {aiResult.album}
                  </p>
                  <p className="text-xs text-[#B7AD98] mt-1.5 leading-relaxed">
                    {aiResult.why}
                  </p>
                  {aiResult.tracks && aiResult.tracks.length > 0 && (
                    <p className="text-[11px] font-mono text-[#E2A53C]/90 mt-1">
                      Pistes clés : {aiResult.tracks.join(" · ")}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-[#3A3226] flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleConfirmAddAI("wanted")}
                    className="flex-1 py-2 px-3 rounded bg-[#C3452F] hover:bg-[#D44E37] text-white text-xs font-bold transition-colors shadow flex items-center justify-center gap-1"
                  >
                    <span>🎯 Ajouter à ma wishlist</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmAddAI("owned")}
                    className="flex-1 py-2 px-3 rounded bg-[#6E8F5C] hover:bg-[#7CA06A] text-[#12190D] text-xs font-bold transition-colors shadow flex items-center justify-center gap-1"
                  >
                    <span>📀 Ajouter à ma collection</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Manual Entry Form */}
        {activeTab === "manual" && (
          <form onSubmit={handleManualSubmit} className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#B7AD98] mb-1">
                  Artiste / Groupe *
                </label>
                <input
                  type="text"
                  required
                  value={mArtist}
                  onChange={(e) => setMArtist(e.target.value)}
                  placeholder="Ex : Pink Floyd"
                  className="w-full bg-[#14110E] border border-[#3A3226] text-[#F1E9D8] px-3 py-2 rounded text-sm focus:outline-none focus:border-[#E2A53C]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#B7AD98] mb-1">
                  Titre de l'album *
                </label>
                <input
                  type="text"
                  required
                  value={mAlbum}
                  onChange={(e) => setMAlbum(e.target.value)}
                  placeholder="Ex : Wish You Were Here"
                  className="w-full bg-[#14110E] border border-[#3A3226] text-[#F1E9D8] px-3 py-2 rounded text-sm focus:outline-none focus:border-[#E2A53C]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#B7AD98] mb-1">
                  Année de sortie
                </label>
                <input
                  type="number"
                  value={mYear}
                  onChange={(e) => setMYear(e.target.value)}
                  className="w-full bg-[#14110E] border border-[#3A3226] text-[#F1E9D8] px-3 py-2 rounded text-sm focus:outline-none focus:border-[#E2A53C]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#B7AD98] mb-1">
                  Genre
                </label>
                <select
                  value={mGenre}
                  onChange={(e) => setMGenre(e.target.value as Genre)}
                  className="w-full bg-[#14110E] border border-[#3A3226] text-[#F1E9D8] px-3 py-2 rounded text-sm focus:outline-none focus:border-[#E2A53C]"
                >
                  <option value="rock">Rock</option>
                  <option value="pop">Pop</option>
                  <option value="variete">Variété Française</option>
                  <option value="blues">Blues</option>
                  <option value="jazz">Jazz</option>
                  <option value="soul">Soul / Funk</option>
                  <option value="country">Country</option>
                  <option value="celtic">Celtique</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#B7AD98] mb-1">
                  Cote indicative
                </label>
                <input
                  type="text"
                  value={mPrice}
                  onChange={(e) => setMPrice(e.target.value)}
                  placeholder="20–30 €"
                  className="w-full bg-[#14110E] border border-[#3A3226] text-[#F1E9D8] px-3 py-2 rounded text-sm focus:outline-none focus:border-[#E2A53C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#B7AD98] mb-1">
                Pourquoi cet album est-il une référence ?
              </label>
              <textarea
                rows={2}
                value={mWhy}
                onChange={(e) => setMWhy(e.target.value)}
                placeholder="Ex : Sommet créatif du groupe, production magistrale et face B légendaire."
                className="w-full bg-[#14110E] border border-[#3A3226] text-[#F1E9D8] px-3 py-2 rounded text-sm focus:outline-none focus:border-[#E2A53C] resize-vertical"
              />
            </div>

            <div className="bg-[#14110E] p-3 rounded border border-[#3A3226]">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#B7AD98] mb-2">
                Où classer cet album dès l'ajout ?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMStatus("wanted")}
                  className={`py-2 px-3 rounded text-xs font-semibold border ${
                    mStatus === "wanted"
                      ? "bg-[#C3452F] text-white border-[#C3452F]"
                      : "bg-[#1E1913] text-[#B7AD98] border-[#3A3226]"
                  }`}
                >
                  🎯 Ma Wishlist
                </button>
                <button
                  type="button"
                  onClick={() => setMStatus("owned")}
                  className={`py-2 px-3 rounded text-xs font-semibold border ${
                    mStatus === "owned"
                      ? "bg-[#6E8F5C] text-[#12190D] border-[#6E8F5C]"
                      : "bg-[#1E1913] text-[#B7AD98] border-[#3A3226]"
                  }`}
                >
                  📀 Ma Collection
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded text-sm text-[#B7AD98] hover:text-[#F1E9D8]"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded bg-[#E2A53C] hover:bg-[#E8AF4D] text-[#221A0E] font-bold text-sm shadow transition-colors"
              >
                Ajouter à la discothèque
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
