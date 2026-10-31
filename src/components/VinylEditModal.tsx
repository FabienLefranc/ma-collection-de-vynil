import React, { useState } from "react";
import { VinylRecord, VinylStatus, WishlistPriority, GoldmineGrade, GOLDMINE_GRADES, PRIORITY_CONFIG, GENRE_METAS, Genre } from "../types";
import { X, Star, Upload, DollarSign, Disc, Tag, Calendar, Sparkles, Loader2, Check, Trash2 } from "lucide-react";
import { compressAlbumCover } from "../utils/imageCompressor";

interface VinylEditModalProps {
  record: VinylRecord;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedRecord: VinylRecord) => void;
  onDeleteRecord?: (record: VinylRecord) => void;
}

export const VinylEditModal: React.FC<VinylEditModalProps> = ({
  record,
  isOpen,
  onClose,
  onSave,
  onDeleteRecord,
}) => {
  if (!isOpen) return null;

  const [status, setStatus] = useState<VinylStatus>(record.status);
  const [genre, setGenre] = useState<Genre>(record.genre || "rock");
  const [rating, setRating] = useState<number>(record.rating || 0);
  const [condition, setCondition] = useState<GoldmineGrade | undefined>(record.condition);
  const [sleeveCondition, setSleeveCondition] = useState<GoldmineGrade | undefined>(record.sleeveCondition);
  const [pricePaid, setPricePaid] = useState<string>(
    record.pricePaid !== undefined && record.pricePaid !== null ? String(record.pricePaid) : ""
  );
  const [wishlistPriority, setWishlistPriority] = useState<WishlistPriority>(
    record.wishlistPriority || "P2"
  );
  const [findingsNotes, setFindingsNotes] = useState<string>(record.findingsNotes || "");
  const [pressingInfo, setPressingInfo] = useState<string>(record.pressingInfo || "");
  const [dateAcquired, setDateAcquired] = useState<string>(
    record.dateAcquired || new Date().toISOString().split("T")[0]
  );
  const [coverUrl, setCoverUrl] = useState<string>(record.coverUrl || "");
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressedDataUrl = await compressAlbumCover(file, 400, 0.82);
      setCoverUrl(compressedDataUrl);
    } catch (err) {
      console.error("Erreur compression image", err);
      // Fallback
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setCoverUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSave = () => {
    const updated: VinylRecord = {
      ...record,
      status,
      genre,
      rating: rating > 0 ? rating : undefined,
      condition,
      sleeveCondition,
      pricePaid: pricePaid.trim() !== "" ? parseFloat(pricePaid) : undefined,
      wishlistPriority: status === "wanted" ? wishlistPriority : record.wishlistPriority,
      findingsNotes: findingsNotes.trim() || undefined,
      pressingInfo: pressingInfo.trim() || undefined,
      dateAcquired: status === "owned" ? dateAcquired : undefined,
      coverUrl: coverUrl.trim() || undefined,
    };
    onSave(updated);
    onClose();
  };

  const ratingDescriptions: Record<number, string> = {
    0: "Sans note",
    1: "Très décevant",
    2: "Médiocre",
    3: "Passable",
    4: "Moyen",
    5: "Correct",
    6: "Bon vinyle",
    7: "Très bon album",
    8: "Excellent",
    9: "Remarquable",
    10: "Chef-d'œuvre absolu",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#1E1913] border border-[#3A3226] rounded-md shadow-2xl my-6 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#14110E] p-4 sm:p-5 border-b border-[#3A3226] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 rounded font-bold"
                style={{
                  color: GENRE_METAS[genre]?.color || "#E2A53C",
                  backgroundColor: GENRE_METAS[genre]?.bgBadge || "rgba(226,165,60,0.15)",
                }}
              >
                {GENRE_METAS[genre]?.label || genre}
              </span>
              <span className="font-mono text-xs text-[#B7AD98]">{record.year}</span>
              <span className="font-mono text-xs text-[#E2A53C] bg-[#251F17] px-2 py-0.5 rounded border border-[#3A3226]">
                Cote réf : {record.indicativePrice}
              </span>
            </div>
            <h2
              className="text-2xl sm:text-3xl text-[#F1E9D8] font-bold tracking-wide leading-none"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              {record.artist}
            </h2>
            <p className="text-sm sm:text-base text-[#F1E9D8]/90 italic font-medium">
              {record.album}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-[#B7AD98] hover:text-[#F1E9D8] hover:bg-[#251F17] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Status Selection */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#B7AD98] mb-2">
              Statut de ce disque dans ma discothèque
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus("owned")}
                className={`py-2 px-3 rounded text-sm font-semibold flex items-center justify-center gap-2 border transition-all ${
                  status === "owned"
                    ? "bg-[#6E8F5C] text-[#12190D] border-[#6E8F5C] font-bold shadow"
                    : "bg-[#14110E] text-[#B7AD98] border-[#3A3226] hover:border-[#6E8F5C]/50"
                }`}
              >
                <span>📀</span>
                <span>Dans ma collection</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus("wanted")}
                className={`py-2 px-3 rounded text-sm font-semibold flex items-center justify-center gap-2 border transition-all ${
                  status === "wanted"
                    ? "bg-[#C3452F] text-[#F1E9D8] border-[#C3452F] font-bold shadow"
                    : "bg-[#14110E] text-[#B7AD98] border-[#3A3226] hover:border-[#C3452F]/50"
                }`}
              >
                <span>🎯</span>
                <span>Dans ma wishlist</span>
              </button>
            </div>
          </div>

          {/* Rating Section (Especially relevant for collection) */}
          <div className="bg-[#14110E] p-3.5 rounded border border-[#3A3226]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-[#B7AD98]">
                Ma Note personnelle (sur 10)
              </label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#E2A53C]">
                  {rating > 0 ? `${rating.toString().replace(".", ",")}/10 · ${ratingDescriptions[Math.round(rating)] || ""}` : "Non noté"}
                </span>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={rating > 0 ? rating : ""}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setRating(isNaN(v) ? 0 : Math.max(0, Math.min(10, v)));
                  }}
                  placeholder="Note /10"
                  className="w-16 px-1.5 py-0.5 text-xs text-right bg-[#1E1913] border border-[#3A3226] text-[#E2A53C] rounded font-mono focus:outline-none focus:border-[#E2A53C]"
                  title="Note personnalisée sur 10 (ex: 8.5)"
                />
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star === rating ? 0 : star)}
                  className="p-0.5 sm:p-1 hover:scale-125 transition-transform"
                  title={`Noter ${star}/10`}
                >
                  <Star
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                      rating >= star
                        ? "fill-[#E2A53C] text-[#E2A53C]"
                        : "text-[#3A3226] hover:text-[#E2A53C]/50"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <button
                  type="button"
                  onClick={() => setRating(0)}
                  className="text-xs text-[#B7AD98] hover:text-[#F1E9D8] ml-2 underline"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>

          {/* Condition Grading (Goldmine Standard) & Price Paid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vinyl Record Condition */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#B7AD98] mb-1.5">
                État du Disque (Grading Vinyle)
              </label>
              <select
                value={condition || ""}
                onChange={(e) => setCondition((e.target.value as GoldmineGrade) || undefined)}
                className="w-full bg-[#14110E] border border-[#3A3226] text-[#F1E9D8] px-3 py-2 rounded text-sm focus:outline-none focus:border-[#E2A53C]"
              >
                <option value="">Non évalué</option>
                {GOLDMINE_GRADES.map((g) => (
                  <option key={g.code} value={g.code}>
                    {g.label} — {g.desc}
                  </option>
                ))}
              </select>
            </div>

            {/* Sleeve Condition */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#B7AD98] mb-1.5">
                État de la Pochette (Sleeve)
              </label>
              <select
                value={sleeveCondition || ""}
                onChange={(e) => setSleeveCondition((e.target.value as GoldmineGrade) || undefined)}
                className="w-full bg-[#14110E] border border-[#3A3226] text-[#F1E9D8] px-3 py-2 rounded text-sm focus:outline-none focus:border-[#E2A53C]"
              >
                <option value="">Non évalué</option>
                {GOLDMINE_GRADES.map((g) => (
                  <option key={g.code} value={g.code}>
                    {g.label} — {g.desc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price Paid & Date of Acquisition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#B7AD98] mb-1.5">
                Prix payé ou budget visé (€)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={pricePaid}
                  onChange={(e) => setPricePaid(e.target.value)}
                  placeholder="Ex: 15"
                  className="w-full bg-[#14110E] border border-[#3A3226] text-[#F1E9D8] pl-8 pr-3 py-2 rounded text-sm focus:outline-none focus:border-[#E2A53C]"
                />
                <span className="absolute left-3 top-2.5 text-[#B7AD98] text-sm">€</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#B7AD98] mb-1.5">
                {status === "owned" ? "Date d'acquisition" : "Date d'ajout"}
              </label>
              <input
                type="date"
                value={dateAcquired}
                onChange={(e) => setDateAcquired(e.target.value)}
                className="w-full bg-[#14110E] border border-[#3A3226] text-[#F1E9D8] px-3 py-2 rounded text-sm focus:outline-none focus:border-[#E2A53C]"
              />
            </div>
          </div>

          {/* Style & Pressing Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#B7AD98] mb-1.5">
                Style musical
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value as Genre)}
                className="w-full bg-[#14110E] border border-[#3A3226] text-[#F1E9D8] px-3 py-2 rounded text-sm focus:outline-none focus:border-[#E2A53C]"
              >
                {(Object.keys(GENRE_METAS) as Genre[]).map((g) => (
                  <option key={g} value={g}>
                    {GENRE_METAS[g].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#B7AD98] mb-1.5">
                Détails du pressage (Label, Pays, Année, Matrice)
              </label>
              <input
                type="text"
                value={pressingInfo}
                onChange={(e) => setPressingInfo(e.target.value)}
                placeholder="Ex: Pressage original français Philips 1971, pochette ouvrante gatefold"
                className="w-full bg-[#14110E] border border-[#3A3226] text-[#F1E9D8] px-3 py-2 rounded text-sm focus:outline-none focus:border-[#E2A53C]"
              />
            </div>
          </div>

          {/* Chineur Findings Notes */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#B7AD98] mb-1.5">
              Notes de chineur & trouvailles (Lieu d'achat, état sonore, anecdotes)
            </label>
            <textarea
              rows={3}
              value={findingsNotes}
              onChange={(e) => setFindingsNotes(e.target.value)}
              placeholder="Ex: Trouvé en brocante à Rennes. Nettoyé à la brosse antistatique, aucun craquement. Son très dynamique !"
              className="w-full bg-[#14110E] border border-[#3A3226] text-[#F1E9D8] px-3 py-2 rounded text-sm focus:outline-none focus:border-[#E2A53C] resize-vertical"
            />
          </div>

          {/* Cover photo customizer */}
          <div className="bg-[#14110E] p-3.5 rounded border border-[#3A3226]">
            <label className="block text-xs font-mono uppercase tracking-wider text-[#B7AD98] mb-2">
              Photo de la pochette réelle
            </label>
            <div className="flex items-center gap-4">
              {coverUrl ? (
                <div className="relative w-16 h-16 rounded overflow-hidden border border-[#3A3226] shrink-0">
                  <img src={coverUrl} alt="Pochette" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setCoverUrl("")}
                    className="absolute top-0 right-0 bg-red-600 text-white text-[10px] px-1 py-0.5"
                    title="Supprimer la photo"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded border border-dashed border-[#3A3226] flex items-center justify-center text-xs text-[#B7AD98] shrink-0">
                  Vinyle
                </div>
              )}

              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="URL d'image de pochette (https://...)"
                  className="w-full bg-[#1E1913] border border-[#3A3226] text-[#F1E9D8] px-3 py-1.5 rounded text-xs focus:outline-none focus:border-[#E2A53C]"
                />
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#251F17] hover:bg-[#3A3226] text-[#F1E9D8] text-xs cursor-pointer border border-[#3A3226] transition-colors">
                    {isCompressing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E2A53C]" />
                        <span>Optimisation (~35 Ko)...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 text-[#E2A53C]" />
                        <span>Importer une photo de mon vinyle</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isCompressing}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-[#B7AD98] font-mono">
                    ⚡ Compressé auto (400×400 px, ~35 Ko)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#14110E] p-4 sm:p-5 border-t border-[#3A3226] flex items-center justify-between gap-3">
          <div>
            {onDeleteRecord && (
              <button
                type="button"
                onClick={() => {
                  onDeleteRecord(record);
                  onClose();
                }}
                className="px-3.5 py-2 rounded text-xs font-semibold bg-[#2D1612] hover:bg-[#3D1A14] text-[#E06C55] hover:text-[#F3826B] border border-[#5A241B] flex items-center gap-1.5 transition-colors shadow-sm"
                title="Supprimer définitivement cette fiche"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer la fiche</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-sm text-[#B7AD98] hover:text-[#F1E9D8] hover:bg-[#251F17] border border-transparent transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded text-sm font-semibold bg-[#E2A53C] hover:bg-[#E8AF4D] text-[#221A0E] font-bold shadow-md transition-colors"
            >
              Enregistrer les modifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
