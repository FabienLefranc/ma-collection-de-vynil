import React, { useState, useEffect, useMemo } from "react";
import {
  VinylRecord,
  VinylStatus,
  Genre,
  GENRE_METAS,
  WishlistPriority,
} from "./types";
import { getMergedRecords, saveUserData, saveCustomRecords, loadUserData, loadCustomRecords, UserDataMap, deleteRecordFromStorage, restoreAllDefaultRecords, isObsoleteRecord } from "./utils/storage";
import { exportVinylsToCSV } from "./utils/csvExport";
import { VinylCard } from "./components/VinylCard";
import { VinylEditModal } from "./components/VinylEditModal";
import { VinylDetailModal } from "./components/VinylDetailModal";
import { AddAlbumModal } from "./components/AddAlbumModal";
import { SearchBarAndFilters, SortOption } from "./components/SearchBarAndFilters";
import { DualPaneWorkbench } from "./components/DualPaneWorkbench";
import { ExportModal } from "./components/ExportModal";
import { BulkCoverModal } from "./components/BulkCoverModal";
import { getAllCoversFromDb, deleteCoverFromDb } from "./utils/coverDb";
import { matchFilenameToRecord } from "./utils/coverMatcher";
import {
  Disc,
  Target,
  Columns,
  Download,
  Plus,
  FolderArchive,
  Menu,
  X,
} from "lucide-react";

export type ViewTab = "workbench" | "collection" | "wishlist";

export default function App() {
  const [records, setRecords] = useState<VinylRecord[]>([]);
  const [activeTab, setActiveTab] = useState<ViewTab>("workbench");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedDecade, setSelectedDecade] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("artist_asc");
  const [minRating, setMinRating] = useState<number>(0);
  const [onlyWithCover, setOnlyWithCover] = useState<boolean>(false);

  // Modals state
  const [editingRecord, setEditingRecord] = useState<VinylRecord | null>(null);
  const [selectedDetailRecord, setSelectedDetailRecord] = useState<VinylRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isBulkCoverModalOpen, setIsBulkCoverModalOpen] = useState(false);

  // Load merged records & covers on mount
  useEffect(() => {
    async function initData() {
      const loaded = getMergedRecords();

      // Load IndexedDB covers cache
      let dbCovers: Record<string, string> = {};
      try {
        dbCovers = await getAllCoversFromDb();
      } catch (err) {
        console.warn("Could not read covers from db:", err);
      }

      // Check server local covers folder (/public/covers)
      let serverFiles: string[] = [];
      try {
        const res = await fetch("/api/local-covers");
        if (res.ok) {
          const data = await res.json();
          serverFiles = data.covers || [];
        }
      } catch (err) {
        console.warn("Could not check local server covers:", err);
      }

      // Track cover files already explicitly assigned to records
      const usedCoverFiles = new Set<string>([
        "ac-dc-back in black-1.webp",
        "aerosmith-toys in the altic.webp",
        "aerosmith toys in the attic.avif",
        "aerosmith-toys in the attic.webp",
        "black sabbath-paranoid-1.webp",
      ]);
      for (const rec of loaded) {
        if (rec.coverUrl && rec.coverUrl.startsWith("/covers/")) {
          try {
            usedCoverFiles.add(decodeURIComponent(rec.coverUrl.replace(/^\/covers\//, "")));
          } catch {
            usedCoverFiles.add(rec.coverUrl.replace(/^\/covers\//, ""));
          }
        }
      }

      // Build best cover match for records without cover, and auto-create collection records for brand new cover files
      const serverCoverMap: Record<string, { url: string; score: number }> = {};
      const autoDiscoveredRecords: VinylRecord[] = [];
      const currentUserData = loadUserData();

      if (serverFiles.length > 0) {
        for (const fname of serverFiles) {
          if (usedCoverFiles.has(fname)) continue;

          const { record, score } = matchFilenameToRecord(fname, loaded);
          if (record && !record.coverUrl && score >= 0.88) {
            const existing = serverCoverMap[record.id];
            const isAvifOrWebp = /\.(avif|webp)$/i.test(fname);
            const existingIsAvifOrWebp = existing ? /\.(avif|webp)$/i.test(existing.url) : false;
            if (
              !existing ||
              score > existing.score ||
              (score === existing.score && isAvifOrWebp && !existingIsAvifOrWebp)
            ) {
              serverCoverMap[record.id] = {
                url: `/covers/${encodeURIComponent(fname)}`,
                score,
              };
            }
          } else if (!record || score < 0.88) {
            // Brand new cover file added to public/covers -> automatically add album to "Ma Collection"
            const nameNoExt = fname.replace(/\.[^/.]+$/, "").trim();
            let artist = "Artiste";
            let album = nameNoExt;
            const sepMatch = nameNoExt.split(/\s*[–—-]\s*/);
            if (sepMatch.length >= 2) {
              artist = sepMatch[0].trim();
              album = sepMatch.slice(1).join(" - ").trim();
            }
            const id = `${artist.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()}|${album.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()}`;
            if (!isObsoleteRecord({ artist, album, id }) && !loaded.some((r) => r.id === id) && !autoDiscoveredRecords.some((r) => r.id === id)) {
              const savedUser = currentUserData[id];
              const status: VinylStatus =
                savedUser?.userModifiedStatus && savedUser.status
                  ? savedUser.status
                  : "owned";
              autoDiscoveredRecords.push({
                id,
                artist,
                album,
                year: 1975,
                genre: "rock",
                why: "Album de ma collection — fiche descriptive à compléter.",
                indicativePrice: "15–25 €",
                status,
                coverUrl: `/covers/${encodeURIComponent(fname)}`,
                rating: savedUser?.rating,
              });
            }
          }
        }
      }

      // Merge covers into records
      const enhanced = [
        ...loaded.map((rec) => {
          // Priority 1: Already has explicit coverUrl
          if (rec.coverUrl) return rec;

          // Priority 2: Direct file match in server public/covers
          if (serverCoverMap[rec.id]) {
            return { ...rec, coverUrl: serverCoverMap[rec.id].url };
          }

          // Priority 3: IndexedDB covers cache
          if (dbCovers[rec.id]) {
            return { ...rec, coverUrl: dbCovers[rec.id] };
          }

          return rec;
        }),
        ...autoDiscoveredRecords,
      ];

      setRecords(enhanced);
    }

    initData();
  }, []);

  const handleCoversUpdated = (updates: Record<string, string>) => {
    setRecords((prev) =>
      prev.map((rec) => {
        if (updates[rec.id]) {
          return { ...rec, coverUrl: updates[rec.id] };
        }
        return rec;
      })
    );

    const currentUserData = loadUserData();
    Object.entries(updates).forEach(([recId, url]) => {
      currentUserData[recId] = {
        ...(currentUserData[recId] || {}),
        coverUrl: url,
      };
    });
    saveUserData(currentUserData);
  };

  // Synchronize status changes to localStorage
  const handleStatusChange = (recordId: string, newStatus: VinylStatus) => {
    const normalized: VinylStatus = newStatus === "owned" ? "owned" : "wanted";
    setRecords((prev) =>
      prev.map((rec) => {
        if (rec.id === recordId) {
          return {
            ...rec,
            status: normalized,
          };
        }
        return rec;
      })
    );
    setSelectedDetailRecord((prev) =>
      prev && prev.id === recordId ? { ...prev, status: normalized } : prev
    );

    const currentUserData = loadUserData();
    currentUserData[recordId] = {
      ...(currentUserData[recordId] || {}),
      status: normalized,
      userModifiedStatus: true,
    };
    saveUserData(currentUserData);
  };

  // Quick star rate
  const handleQuickRate = (recordId: string, rating: number) => {
    const cleanRating = rating > 0 ? rating : undefined;
    setRecords((prev) =>
      prev.map((rec) => {
        if (rec.id === recordId) {
          return { ...rec, rating: cleanRating };
        }
        return rec;
      })
    );
    setSelectedDetailRecord((prev) =>
      prev && prev.id === recordId ? { ...prev, rating: cleanRating } : prev
    );

    const currentUserData = loadUserData();
    currentUserData[recordId] = {
      ...(currentUserData[recordId] || {}),
      rating: cleanRating,
      sheetRating: cleanRating,
    };
    saveUserData(currentUserData);
  };

  // Save changes from Edit Modal (findings, notes, condition, price, etc.)
  const handleSaveDetails = (updated: VinylRecord) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );

    const currentUserData = loadUserData();
    currentUserData[updated.id] = {
      ...(currentUserData[updated.id] || {}),
      status: updated.status,
      rating: updated.rating,
      condition: updated.condition,
      sleeveCondition: updated.sleeveCondition,
      pricePaid: updated.pricePaid,
      wishlistPriority: updated.wishlistPriority,
      findingsNotes: updated.findingsNotes,
      pressingInfo: updated.pressingInfo,
      coverUrl: updated.coverUrl,
      dateAcquired: updated.dateAcquired,
    };
    saveUserData(currentUserData);
  };

  // Add newly discovered or manual record
  const handleAddRecord = (newRec: VinylRecord) => {
    setRecords((prev) => [newRec, ...prev]);

    const custom = loadCustomRecords();
    saveCustomRecords([newRec, ...custom]);

    const currentUserData = loadUserData();
    currentUserData[newRec.id] = {
      status: newRec.status,
      wishlistPriority: newRec.wishlistPriority,
      dateAdded: newRec.dateAdded,
    };
    saveUserData(currentUserData);
  };

  // Delete any record (reference or custom)
  const handleDeleteRecord = async (record: VinylRecord) => {
    const isConfirmed = window.confirm(
      `Voulez-vous vraiment supprimer définitivement la fiche "${record.artist} - ${record.album}" ?`
    );
    if (!isConfirmed) return;

    // Close open modals if pointing to this record
    if (selectedDetailRecord?.id === record.id) {
      setSelectedDetailRecord(null);
    }
    if (editingRecord?.id === record.id) {
      setEditingRecord(null);
    }

    // Remove from state immediately
    setRecords((prev) => prev.filter((r) => r.id !== record.id));

    // Persist deletion
    deleteRecordFromStorage(record.id);

    // Clean up IndexedDB cover if any
    try {
      await deleteCoverFromDb(record.id);
    } catch (e) {
      console.warn("Erreur suppression cover DB:", e);
    }
  };

  // Delete custom added record (legacy helper)
  const handleDeleteCustom = (recordId: string) => {
    const rec = records.find((r) => r.id === recordId);
    if (rec) {
      handleDeleteRecord(rec);
    } else {
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
      deleteRecordFromStorage(recordId);
    }
  };

  // Restore or import backup
  const handleImportJSON = (importedData: any) => {
    if (importedData && Array.isArray(importedData.records)) {
      const customList = importedData.records.filter((r: any) => r.isCustom);
      saveCustomRecords(customList);

      const newUserData: UserDataMap = {};
      importedData.records.forEach((r: any) => {
        newUserData[r.id] = {
          status: r.status,
          rating: r.rating,
          condition: r.condition,
          sleeveCondition: r.sleeveCondition,
          pricePaid: r.pricePaid,
          wishlistPriority: r.wishlistPriority,
          findingsNotes: r.findingsNotes,
          pressingInfo: r.pressingInfo,
          coverUrl: r.coverUrl,
          dateAcquired: r.dateAcquired,
        };
      });
      saveUserData(newUserData);
      setRecords(getMergedRecords());
    }
  };

  // Available decades
  const availableDecades = useMemo(() => {
    const set = new Set<number>();
    records.forEach((r) => {
      if (r.year) set.add(Math.floor(r.year / 10) * 10);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [records]);

  // Set of existing record IDs for duplicate check
  const existingKeys = useMemo(() => new Set(records.map((r) => r.id)), [records]);

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    const q = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    return records.filter((rec) => {
      // Query filter
      if (q) {
        const normArtist = rec.artist.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const normAlbum = rec.album.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const normWhy = (rec.why || "").toLowerCase();
        const normNotes = (rec.findingsNotes || "").toLowerCase();
        const normPressing = (rec.pressingInfo || "").toLowerCase();
        const matchQuery =
          normArtist.includes(q) ||
          normAlbum.includes(q) ||
          normWhy.includes(q) ||
          normNotes.includes(q) ||
          normPressing.includes(q) ||
          String(rec.year).includes(q);
        if (!matchQuery) return false;
      }

      // Genre filter
      if (selectedGenre !== "all" && rec.genre !== selectedGenre) {
        return false;
      }

      // Decade filter
      if (selectedDecade !== "all") {
        const dec = Math.floor(rec.year / 10) * 10;
        if (dec !== Number(selectedDecade)) return false;
      }

      // Min rating
      if (minRating > 0 && (rec.rating || 0) < minRating) {
        return false;
      }

      // Photos filter (only with cover)
      if (onlyWithCover && (!rec.coverUrl || rec.coverUrl.trim() === "")) {
        return false;
      }

      return true;
    });
  }, [records, searchQuery, selectedGenre, selectedDecade, minRating, onlyWithCover]);

  // Sort function
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      if (sortBy === "artist_asc") return a.artist.localeCompare(b.artist, "fr");
      if (sortBy === "artist_desc") return b.artist.localeCompare(a.artist, "fr");
      if (sortBy === "year_asc") return a.year - b.year;
      if (sortBy === "year_desc") return b.year - a.year;
      if (sortBy === "rating_desc") return (b.rating || 0) - (a.rating || 0);
      return 0;
    });
  }, [filteredRecords, sortBy]);

  // Collection records and wishlist records derived from filtered & sorted records
  const collectionRecords = useMemo(
    () => sortedRecords.filter((r) => r.status === "owned"),
    [sortedRecords]
  );

  const wishlistRecords = useMemo(
    () => sortedRecords.filter((r) => r.status === "wanted"),
    [sortedRecords]
  );

  // General counts
  const totalOwnedCount = records.filter((r) => r.status === "owned").length;
  const totalWantedCount = records.filter((r) => r.status === "wanted").length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F1E6] text-[#F1E9D8] selection:bg-[#E2A53C] selection:text-[#14110E]">
      {/* ----------------- TOP HEADER & NAV ----------------- */}
      <header className="sticky top-0 z-40 bg-[#1E1913] border-b border-[#3A3226] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            {/* Logo & Subtitle */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Turntable with target slipmat logo */}
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#1E1913] border-2 border-[#E2A53C] overflow-hidden shadow-lg group shrink-0">
                <img
                  src="/logo.jpg"
                  alt="Platine vinyle cible"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <h1
                    className="text-xl sm:text-3xl font-bold tracking-wider text-[#F1E9D8] leading-none truncate"
                    style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                  >
                    La Discothèque Vinyle<span className="text-[#E2A53C]">.</span>
                  </h1>
                </div>
                <p className="text-xs text-[#B7AD98] mt-0.5 max-w-lg hidden sm:block">
                  Ma Collection & Ma Wishlist de vinyles
                </p>
                {/* Current view label on mobile */}
                <p className="text-[11px] text-[#E2A53C] font-medium sm:hidden truncate mt-0.5">
                  {activeTab === "workbench" && "Double Bac : Collection & Wishlist"}
                  {activeTab === "collection" && `Ma Collection (${totalOwnedCount})`}
                  {activeTab === "wishlist" && `Ma Wishlist (${totalWantedCount})`}
                </p>
              </div>
            </div>

            {/* Mobile Burger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Menu de navigation"
              aria-expanded={isMobileMenuOpen}
              className="sm:hidden flex items-center justify-center w-11 h-11 rounded-md bg-[#14110E] border border-[#3A3226] text-[#F1E9D8] hover:border-[#E2A53C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E2A53C] transition-colors shrink-0"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-[#E2A53C]" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Burger Dropdown Menu */}
          {isMobileMenuOpen && (
            <nav className="sm:hidden mt-2.5 pt-2.5 border-t border-[#3A3226] flex flex-col gap-1.5 pb-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("workbench");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 rounded font-semibold flex items-center justify-between text-xs transition-all ${
                  activeTab === "workbench"
                    ? "bg-[#E2A53C] text-[#221A0E] font-bold shadow"
                    : "bg-[#14110E] text-[#B7AD98] hover:text-[#F1E9D8] border border-[#3A3226]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Columns className="w-4 h-4" />
                  <span>Double Bac : Collection & Wishlist</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("collection");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 rounded font-semibold flex items-center justify-between text-xs transition-all ${
                  activeTab === "collection"
                    ? "bg-[#6E8F5C] text-[#12190D] font-bold shadow"
                    : "bg-[#14110E] text-[#B7AD98] hover:text-[#F1E9D8] border border-[#3A3226]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Disc className="w-4 h-4" />
                  <span>Ma Collection</span>
                </span>
                <span className="font-mono text-[11px] opacity-90">{totalOwnedCount}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("wishlist");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 rounded font-semibold flex items-center justify-between text-xs transition-all ${
                  activeTab === "wishlist"
                    ? "bg-[#C3452F] text-white font-bold shadow"
                    : "bg-[#14110E] text-[#B7AD98] hover:text-[#F1E9D8] border border-[#3A3226]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span>Ma Wishlist</span>
                </span>
                <span className="font-mono text-[11px] opacity-90">{totalWantedCount}</span>
              </button>
            </nav>
          )}

          {/* Desktop View Tab Switcher (Collection & Wishlist) */}
          <div className="hidden sm:flex items-center gap-1.5 mt-3 pt-2.5 border-t border-[#3A3226]/50 overflow-x-auto pb-1 text-xs">
            {/* Split View Button */}
            <button
              type="button"
              onClick={() => setActiveTab("workbench")}
              className={`px-3 py-1.5 rounded font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === "workbench"
                  ? "bg-[#E2A53C] text-[#221A0E] font-bold shadow"
                  : "bg-[#14110E] text-[#B7AD98] hover:text-[#F1E9D8] border border-[#3A3226]"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Double Bac : Collection & Wishlist</span>
            </button>

            {/* Collection Only Tab */}
            <button
              type="button"
              onClick={() => setActiveTab("collection")}
              className={`px-3 py-1.5 rounded font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === "collection"
                  ? "bg-[#6E8F5C] text-[#12190D] font-bold shadow"
                  : "bg-[#14110E] text-[#B7AD98] hover:text-[#F1E9D8] border border-[#3A3226]"
              }`}
            >
              <Disc className="w-3.5 h-3.5" />
              <span>Ma Collection ({totalOwnedCount})</span>
            </button>

            {/* Wishlist Only Tab */}
            <button
              type="button"
              onClick={() => setActiveTab("wishlist")}
              className={`px-3 py-1.5 rounded font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === "wishlist"
                  ? "bg-[#C3452F] text-white font-bold shadow"
                  : "bg-[#14110E] text-[#B7AD98] hover:text-[#F1E9D8] border border-[#3A3226]"
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Ma Wishlist ({totalWantedCount})</span>
            </button>
          </div>
        </div>
      </header>

      {/* ----------------- MAIN WORKSPACE ----------------- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-6">
        {/* Search Bar & Filtering Controls */}
        <SearchBarAndFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedGenre={selectedGenre}
          onGenreChange={setSelectedGenre}
          selectedDecade={selectedDecade}
          onDecadeChange={setSelectedDecade}
          sortBy={sortBy}
          onSortChange={setSortBy}
          minRating={minRating}
          onMinRatingChange={setMinRating}
          onlyWithCover={onlyWithCover}
          onOnlyWithCoverChange={setOnlyWithCover}
          availableDecades={availableDecades}
          totalMatches={sortedRecords.length}
          totalWithCoverCount={records.filter((r) => !!r.coverUrl && r.coverUrl.trim() !== "").length}
          onResetFilters={() => {
            setSearchQuery("");
            setSelectedGenre("all");
            setSelectedDecade("all");
            setMinRating(0);
            setOnlyWithCover(false);
            setSortBy("artist_asc");
          }}
        />

        {/* VIEW 1: Dual Pane Workbench (Side by Side: Collection vs Wishlist) */}
        {activeTab === "workbench" && (
          <DualPaneWorkbench
            collectionRecords={collectionRecords}
            wishlistRecords={wishlistRecords}
            onStatusChange={handleStatusChange}
            onEditDetails={setEditingRecord}
            onSelectRecord={setSelectedDetailRecord}
            onDeleteRecord={handleDeleteRecord}
            onDeleteCustom={handleDeleteCustom}
            onQuickRate={handleQuickRate}
          />
        )}

        {/* VIEW 2: Collection Focused */}
        {activeTab === "collection" && (
          <section className="bg-[#191510] border border-[#3A3226] rounded-md p-3.5 sm:p-5 space-y-4 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6E8F5C] to-[#85AA71]" />
            <div className="flex items-center justify-between pb-2 border-b border-[#3A3226]">
              <div>
                <h2
                  className="text-2xl sm:text-3xl text-[#F1E9D8] font-bold"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  Ma Collection de Vinyles
                </h2>
                <p className="text-xs text-[#B7AD98]">
                  {collectionRecords.length} album{collectionRecords.length > 1 ? "s" : ""} dans vos étagères
                </p>
              </div>
            </div>

            {collectionRecords.length === 0 ? (
              <div className="text-center py-16 px-4 bg-[#14110E]/60 rounded border border-dashed border-[#3A3226]">
                <Disc className="w-12 h-12 text-[#3A3226] mx-auto mb-3" />
                <h3
                  className="text-xl text-[#F1E9D8] font-bold mb-1"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  Aucun album dans la collection
                </h3>
                <p className="text-xs text-[#B7AD98] max-w-md mx-auto mb-4">
                  Basculez sur votre Wishlist pour marquer les albums que vous possédez.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("wishlist")}
                  className="px-4 py-2 rounded bg-[#6E8F5C] text-[#12190D] font-bold text-xs"
                >
                  Voir ma wishlist
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {collectionRecords.map((rec) => (
                  <VinylCard
                    key={rec.id}
                    record={rec}
                    onStatusChange={handleStatusChange}
                    onEditDetails={setEditingRecord}
                    onSelectRecord={setSelectedDetailRecord}
                    onDeleteRecord={handleDeleteRecord}
                    onDeleteCustom={handleDeleteCustom}
                    onQuickRate={handleQuickRate}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* VIEW 3: Wishlist Focused */}
        {activeTab === "wishlist" && (
          <section className="bg-[#191510] border border-[#3A3226] rounded-md p-3.5 sm:p-5 space-y-4 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C3452F] to-[#E2A53C]" />
            <div className="flex items-center justify-between pb-2 border-b border-[#3A3226]">
              <div>
                <h2
                  className="text-2xl sm:text-3xl text-[#FF7A63] font-bold"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  Ma Wishlist
                </h2>
                <p className="text-xs text-[#B7AD98]">
                  {wishlistRecords.length} album{wishlistRecords.length > 1 ? "s" : ""} dans votre liste d'envies
                </p>
              </div>
            </div>

            {wishlistRecords.length === 0 ? (
              <div className="text-center py-16 px-4 bg-[#14110E]/60 rounded border border-dashed border-[#3A3226]">
                <Target className="w-12 h-12 text-[#3A3226] mx-auto mb-3" />
                <h3
                  className="text-xl text-[#F1E9D8] font-bold mb-1"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  Aucun album dans la wishlist
                </h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlistRecords.map((rec) => (
                  <VinylCard
                    key={rec.id}
                    record={rec}
                    onStatusChange={handleStatusChange}
                    onEditDetails={setEditingRecord}
                    onSelectRecord={setSelectedDetailRecord}
                    onDeleteRecord={handleDeleteRecord}
                    onDeleteCustom={handleDeleteCustom}
                    onQuickRate={handleQuickRate}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* ----------------- FOOTER ----------------- */}
      <footer className="bg-[#1E1913] border-t border-[#3A3226] py-8 text-center text-xs text-[#B7AD98] mt-12">
        <div className="max-w-3xl mx-auto px-4 space-y-3">
          <div className="flex items-center justify-center gap-2.5 font-mono text-[#E2A53C]">
            <img
              src="/logo.jpg"
              alt="Logo"
              className="w-5 h-5 rounded object-cover border border-[#E2A53C]/50"
              referrerPolicy="no-referrer"
            />
            <span className="font-bold">La Discothèque Vinyle</span>
            <span>·</span>
            <span>Ma Collection & Ma Wishlist</span>
          </div>
          <p className="leading-relaxed">
            Les cotes affichées sont des prix indicatifs d'occasion pour des rééditions ou pressages courants en bon état (VG+/NM).
            Vos notes personnelles, annotations de pressage, cotations et photos restent enregistrées localement dans votre navigateur.
          </p>
        </div>
      </footer>

      {/* ----------------- MODALS ----------------- */}
      {selectedDetailRecord && (
        <VinylDetailModal
          record={selectedDetailRecord}
          isOpen={Boolean(selectedDetailRecord)}
          onClose={() => setSelectedDetailRecord(null)}
          onStatusChange={handleStatusChange}
          onEditDetails={setEditingRecord}
          onDeleteRecord={handleDeleteRecord}
          onQuickRate={handleQuickRate}
        />
      )}

      {editingRecord && (
        <VinylEditModal
          record={editingRecord}
          isOpen={Boolean(editingRecord)}
          onClose={() => setEditingRecord(null)}
          onSave={handleSaveDetails}
          onDeleteRecord={handleDeleteRecord}
        />
      )}

      {isAddModalOpen && (
        <AddAlbumModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddRecord={handleAddRecord}
          existingRecordKeys={existingKeys}
        />
      )}

      {isExportModalOpen && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          allRecords={records}
          ownedRecords={records.filter((r) => r.status === "owned")}
          wantedRecords={records.filter((r) => r.status === "wanted")}
          onImportJSON={handleImportJSON}
        />
      )}

      {isBulkCoverModalOpen && (
        <BulkCoverModal
          isOpen={isBulkCoverModalOpen}
          onClose={() => setIsBulkCoverModalOpen(false)}
          records={records}
          onCoversUpdated={handleCoversUpdated}
        />
      )}
    </div>
  );
}
