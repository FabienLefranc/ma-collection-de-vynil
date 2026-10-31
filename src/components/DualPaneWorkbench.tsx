import React from "react";
import { VinylRecord } from "../types";
import { VinylCard } from "./VinylCard";
import { Disc, Target } from "lucide-react";

interface DualPaneWorkbenchProps {
  collectionRecords: VinylRecord[];
  wishlistRecords: VinylRecord[];
  onStatusChange: (recordId: string, status: "owned" | "wanted" | "catalog") => void;
  onEditDetails: (record: VinylRecord) => void;
  onSelectRecord?: (record: VinylRecord) => void;
  onDeleteRecord?: (record: VinylRecord) => void;
  onDeleteCustom?: (recordId: string) => void;
  onQuickRate?: (recordId: string, rating: number) => void;
}

export const DualPaneWorkbench: React.FC<DualPaneWorkbenchProps> = ({
  collectionRecords,
  wishlistRecords,
  onStatusChange,
  onEditDetails,
  onSelectRecord,
  onDeleteRecord,
  onDeleteCustom,
  onQuickRate,
}) => {
  // Calculate quick collection metrics
  const ratedRecords = collectionRecords.filter((r) => (r.rating || 0) > 0);
  const avgRating =
    ratedRecords.length > 0
      ? (
          ratedRecords.reduce((sum, r) => sum + (r.rating || 0), 0) / ratedRecords.length
        ).toFixed(1)
      : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
      {/* ----------------- LEFT PANE: MA COLLECTION ----------------- */}
      <section
        id="section-collection-pane"
        className="bg-[#191510] border border-[#3A3226] rounded-md p-3.5 sm:p-5 flex flex-col min-h-[500px] shadow-lg relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6E8F5C] to-[#85AA71]" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#3A3226] mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-full bg-[#6E8F5C]/20 text-[#85AA71] border border-[#6E8F5C]/40">
                <Disc className="w-5 h-5" />
              </span>
              <h2
                className="text-2xl sm:text-3xl text-[#F1E9D8] font-bold tracking-wide leading-none"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                Ma Collection
              </h2>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-[#6E8F5C] text-[#12190D]">
                {collectionRecords.length}
              </span>
            </div>
            <p className="text-xs text-[#B7AD98] mt-1">
              Tous les albums que tu possèdes dans tes étagères.
            </p>
          </div>
        </div>

        {/* Collection Quick Stats Bar */}
        {collectionRecords.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4 bg-[#14110E] p-2.5 rounded border border-[#3A3226] text-center font-mono">
            <div>
              <div className="text-[10px] uppercase text-[#B7AD98]">Disques</div>
              <div className="text-sm font-bold text-[#F1E9D8]">{collectionRecords.length}</div>
            </div>
            <div className="border-l border-[#3A3226]">
              <div className="text-[10px] uppercase text-[#B7AD98]">Moyenne Note</div>
              <div className="text-sm font-bold text-[#E2A53C]">
                {avgRating ? `⭐ ${avgRating.replace(".", ",")}/10` : "—"}
              </div>
            </div>
          </div>
        )}

        {/* Records list */}
        {collectionRecords.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#14110E]/60 rounded border border-dashed border-[#3A3226]">
            <Disc className="w-12 h-12 text-[#3A3226] mb-3 animate-pulse" />
            <h3
              className="text-xl text-[#F1E9D8] font-bold mb-1"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              Ta collection est vide
            </h3>
            <p className="text-xs text-[#B7AD98] max-w-sm">
              Bascule un album depuis ta wishlist avec le bouton « 📀 J'ai ».
            </p>
          </div>
        ) : (
          <div className="space-y-3.5 overflow-y-auto max-h-[800px] pr-1">
            {collectionRecords.map((rec) => (
              <VinylCard
                key={rec.id}
                record={rec}
                onStatusChange={onStatusChange}
                onEditDetails={onEditDetails}
                onSelectRecord={onSelectRecord}
                onDeleteRecord={onDeleteRecord}
                onDeleteCustom={onDeleteCustom}
                onQuickRate={onQuickRate}
              />
            ))}
          </div>
        )}
      </section>

      {/* ----------------- RIGHT PANE: MA WISHLIST ----------------- */}
      <section
        id="section-wishlist-pane"
        className="bg-[#191510] border border-[#3A3226] rounded-md p-3.5 sm:p-5 flex flex-col min-h-[500px] shadow-lg relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C3452F] to-[#E2A53C]" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#3A3226] mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-full bg-[#C3452F]/20 text-[#FF7A63] border border-[#C3452F]/40">
                <Target className="w-5 h-5" />
              </span>
              <h2
                className="text-2xl sm:text-3xl text-[#F1E9D8] font-bold tracking-wide leading-none"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                Ma Wishlist
              </h2>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-[#C3452F] text-white">
                {wishlistRecords.length}
              </span>
            </div>
            <p className="text-xs text-[#B7AD98] mt-1">
              Les albums que tu recherches pour compléter ta discothèque.
            </p>
          </div>
        </div>

        {/* Wishlist Records list */}
        {wishlistRecords.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#14110E]/60 rounded border border-dashed border-[#3A3226]">
            <Target className="w-12 h-12 text-[#3A3226] mb-3 animate-pulse" />
            <h3
              className="text-xl text-[#F1E9D8] font-bold mb-1"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              Aucun album dans ta wishlist
            </h3>
          </div>
        ) : (
          <div className="space-y-3.5 overflow-y-auto max-h-[800px] pr-1">
            {wishlistRecords.map((rec) => (
              <VinylCard
                key={rec.id}
                record={rec}
                onStatusChange={onStatusChange}
                onEditDetails={onEditDetails}
                onSelectRecord={onSelectRecord}
                onDeleteRecord={onDeleteRecord}
                onDeleteCustom={onDeleteCustom}
                onQuickRate={onQuickRate}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
