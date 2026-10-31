import React, { useState, useEffect } from "react";
import { VinylRecord } from "../types";
import { matchFilenameToRecord, getRecommendedFilename, getSlugFilename } from "../utils/coverMatcher";
import { compressAlbumCover } from "../utils/imageCompressor";
import { saveCoverToDb } from "../utils/coverDb";
import {
  X,
  FolderArchive,
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  HardDrive,
  Download,
  FileImage,
} from "lucide-react";

interface BulkCoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: VinylRecord[];
  onCoversUpdated: (updates: Record<string, string>) => void;
}

interface ProcessedFileItem {
  file: File;
  previewUrl: string;
  matchedRecord: VinylRecord | null;
  score: number;
  status: "pending" | "ready" | "saved" | "error";
  errorMsg?: string;
}

export const BulkCoverModal: React.FC<BulkCoverModalProps> = ({
  isOpen,
  onClose,
  records,
  onCoversUpdated,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<"import_folder" | "guide_directory" | "backup_pack">("import_folder");

  // File import state
  const [processedItems, setProcessedItems] = useState<ProcessedFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Server directory covers
  const [serverCovers, setServerCovers] = useState<string[]>([]);
  const [isLoadingServerCovers, setIsLoadingServerCovers] = useState(false);

  // Load server covers on tab activation
  useEffect(() => {
    if (activeTab === "guide_directory") {
      fetchServerCovers();
    }
  }, [activeTab]);

  const fetchServerCovers = async () => {
    setIsLoadingServerCovers(true);
    try {
      const res = await fetch("/api/local-covers");
      if (res.ok) {
        const data = await res.json();
        setServerCovers(data.covers || []);
      }
    } catch (e) {
      console.warn("Erreur lecture dossier covers:", e);
    } finally {
      setIsLoadingServerCovers(false);
    }
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgressMsg(`Traitement et reconnaissance de ${files.length} image(s)...`);

    const results: ProcessedFileItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;

      const { record, score } = matchFilenameToRecord(file.name, records);

      try {
        const previewUrl = await compressAlbumCover(file, 400, 0.82);
        results.push({
          file,
          previewUrl,
          matchedRecord: record,
          score,
          status: "ready",
        });
      } catch (err: any) {
        results.push({
          file,
          previewUrl: "",
          matchedRecord: null,
          score: 0,
          status: "error",
          errorMsg: err.message || "Erreur de compression",
        });
      }
    }

    setProcessedItems(results);
    setIsProcessing(false);
    setProgressMsg("");
  };

  const handleApplyAll = async () => {
    setIsProcessing(true);
    setProgressMsg("Enregistrement des pochettes en cours...");

    const updates: Record<string, string> = {};
    const serverBatch: { filename: string; dataUrl: string }[] = [];

    for (const item of processedItems) {
      if (item.matchedRecord && item.previewUrl && item.status !== "error") {
        const recId = item.matchedRecord.id;
        updates[recId] = item.previewUrl;

        // Save to IndexedDB
        await saveCoverToDb(recId, item.previewUrl);

        // Prepare server batch
        const recFilename = getRecommendedFilename(item.matchedRecord, "jpg");
        serverBatch.push({
          filename: recFilename,
          dataUrl: item.previewUrl,
        });
      }
    }

    // Try saving to server public/covers/ directory as well
    if (serverBatch.length > 0) {
      try {
        await fetch("/api/save-covers-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: serverBatch }),
        });
      } catch (err) {
        console.warn("Échec sauvegarde serveur:", err);
      }
    }

    onCoversUpdated(updates);
    setIsProcessing(false);
    alert(`${Object.keys(updates).length} pochette(s) associée(s) et enregistrées avec succès !`);
    onClose();
  };

  const handleLinkServerCovers = () => {
    if (serverCovers.length === 0) {
      alert("Aucune image trouvée pour le moment dans le dossier public/covers/.");
      return;
    }

    const updates: Record<string, string> = {};
    let count = 0;

    for (const filename of serverCovers) {
      const { record } = matchFilenameToRecord(filename, records);
      if (record) {
        const coverPath = `/covers/${encodeURIComponent(filename)}`;
        updates[record.id] = coverPath;
        count++;
      }
    }

    if (count > 0) {
      onCoversUpdated(updates);
      alert(`${count} pochette(s) du dossier public/covers/ ont été liées automatiquement à vos disques !`);
      onClose();
    } else {
      alert("Aucune correspondance trouvée entre les fichiers du dossier et les albums répertoriés. Vérifiez les noms de fichiers (ex: The Beatles - Abbey Road.jpg).");
    }
  };

  const handleCopyFilename = (rec: VinylRecord) => {
    const filename = getRecommendedFilename(rec);
    navigator.clipboard.writeText(filename);
    setCopiedId(rec.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Export all current covers to a single package file
  const handleExportCoverPack = () => {
    const pack: Record<string, string> = {};
    records.forEach((r) => {
      if (r.coverUrl && r.coverUrl.startsWith("data:")) {
        pack[r.id] = r.coverUrl;
      }
    });

    if (Object.keys(pack).length === 0) {
      alert("Vous n'avez pas encore de photos locales enregistrées.");
      return;
    }

    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pack, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", jsonStr);
    dlAnchor.setAttribute("download", `pack_pochettes_vinyles_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  // Import a cover package file
  const handleImportCoverPack = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (typeof parsed === "object" && parsed !== null) {
          onCoversUpdated(parsed);
          for (const [recId, dataUrl] of Object.entries(parsed)) {
            if (typeof dataUrl === "string") {
              await saveCoverToDb(recId, dataUrl);
            }
          }
          alert(`${Object.keys(parsed).length} photos restaurées avec succès !`);
          onClose();
        }
      } catch (err) {
        alert("Fichier d'archive invalide.");
      }
    };
    reader.readAsText(file);
  };

  const matchedCount = processedItems.filter((i) => i.matchedRecord).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#1E1913] border border-[#3A3226] rounded-md shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#14110E] p-4 sm:p-5 border-b border-[#3A3226] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FolderArchive className="w-6 h-6 text-[#E2A53C]" />
            <div>
              <h2
                className="text-2xl text-[#F1E9D8] font-bold tracking-wide leading-none"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                Gestionnaire de Pochettes par Fichiers
              </h2>
              <p className="text-xs text-[#B7AD98] mt-0.5">
                Importez toutes vos photos d'un coup dans un fichier ou un dossier, sans URL !
              </p>
            </div>
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
        <div className="flex border-b border-[#3A3226] bg-[#171310] shrink-0 text-xs sm:text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("import_folder")}
            className={`flex-1 py-3 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "import_folder"
                ? "border-[#E2A53C] text-[#E2A53C] bg-[#1E1913]"
                : "border-transparent text-[#B7AD98] hover:text-[#F1E9D8]"
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Sélectionner un lot d'images</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("guide_directory")}
            className={`flex-1 py-3 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "guide_directory"
                ? "border-[#E2A53C] text-[#E2A53C] bg-[#1E1913]"
                : "border-transparent text-[#B7AD98] hover:text-[#F1E9D8]"
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Dossier local /public/covers/</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("backup_pack")}
            className={`flex-1 py-3 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "backup_pack"
                ? "border-[#E2A53C] text-[#E2A53C] bg-[#1E1913]"
                : "border-transparent text-[#B7AD98] hover:text-[#F1E9D8]"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Archive unique (Pack JSON)</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-sm text-[#F1E9D8]">
          {/* TAB 1: Multiple Files / Folder Picker */}
          {activeTab === "import_folder" && (
            <div className="space-y-4">
              <div className="p-4 bg-[#14110E] border border-dashed border-[#3A3226] rounded-md text-center space-y-3">
                <FileImage className="w-10 h-10 text-[#E2A53C] mx-auto animate-bounce" />
                <div>
                  <h3 className="text-base font-bold text-[#F1E9D8]">
                    Déposez toutes vos photos ou sélectionnez votre dossier
                  </h3>
                  <p className="text-xs text-[#B7AD98] max-w-lg mx-auto mt-1">
                    Sélectionnez 10, 50 ou 100 photos d’un seul coup. L'application lit les noms de vos fichiers
                    (ex : <em>The Beatles - Abbey Road.jpg</em>, <em>Kind of Blue.jpg</em>) et les associe automatiquement au bon vinyle !
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {/* Select multiple files */}
                  <label className="px-4 py-2.5 rounded bg-[#E2A53C] hover:bg-[#E8AF4D] text-[#221A0E] text-xs font-bold cursor-pointer transition-colors shadow flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>Choisir plusieurs photos (AVIF, WebP, JPG, PNG)</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.avif,.webp,.jfif"
                      onChange={handleFilesSelected}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {isProcessing && (
                <div className="p-3 bg-[#251F17] rounded border border-[#3A3226] flex items-center justify-center gap-2 text-xs text-[#E2A53C]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{progressMsg}</span>
                </div>
              )}

              {/* Table of matches */}
              {processedItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-mono text-[#B7AD98]">
                      <strong className="text-[#6E8F5C]">{matchedCount}</strong> album(s) identifié(s) sur{" "}
                      {processedItems.length} image(s)
                    </div>

                    <button
                      type="button"
                      disabled={matchedCount === 0 || isProcessing}
                      onClick={handleApplyAll}
                      className="px-4 py-2 rounded bg-[#6E8F5C] hover:bg-[#7DA369] disabled:opacity-50 text-[#12190D] text-xs font-bold transition-colors shadow flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Appliquer ces {matchedCount} pochettes</span>
                    </button>
                  </div>

                  <div className="border border-[#3A3226] rounded overflow-hidden max-h-[360px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#14110E] text-[#B7AD98] font-mono uppercase tracking-wider sticky top-0 border-b border-[#3A3226]">
                        <tr>
                          <th className="p-2.5">Aperçu</th>
                          <th className="p-2.5">Fichier image</th>
                          <th className="p-2.5">Album attribué</th>
                          <th className="p-2.5">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#3A3226] bg-[#191510]">
                        {processedItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[#251F17]">
                            <td className="p-2 w-12">
                              {item.previewUrl ? (
                                <img
                                  src={item.previewUrl}
                                  alt="preview"
                                  className="w-10 h-10 rounded object-cover border border-[#3A3226]"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded bg-[#14110E] flex items-center justify-center text-red-400">
                                  <AlertCircle className="w-4 h-4" />
                                </div>
                              )}
                            </td>
                            <td className="p-2 font-mono text-[11px] text-[#F1E9D8] max-w-[180px] truncate" title={item.file.name}>
                              {item.file.name}
                            </td>
                            <td className="p-2">
                              {item.matchedRecord ? (
                                <div className="space-y-0.5">
                                  <div className="font-bold text-[#F1E9D8]">
                                    {item.matchedRecord.artist} - {item.matchedRecord.album}
                                  </div>
                                  <div className="text-[10px] text-[#6E8F5C] font-mono">
                                    ✓ Correspondance ({Math.round(item.score * 100)}%)
                                  </div>
                                </div>
                              ) : (
                                <span className="text-amber-400 text-[11px]">
                                  Non reconnu automatiquement
                                </span>
                              )}
                            </td>
                            <td className="p-2">
                              {/* Option to change matching record manually */}
                              <select
                                value={item.matchedRecord?.id || ""}
                                onChange={(e) => {
                                  const selectedRec = records.find((r) => r.id === e.target.value) || null;
                                  setProcessedItems((prev) =>
                                    prev.map((it, i) =>
                                      i === idx
                                        ? { ...it, matchedRecord: selectedRec, score: selectedRec ? 1 : 0 }
                                        : it
                                    )
                                  );
                                }}
                                className="bg-[#14110E] border border-[#3A3226] text-[#F1E9D8] text-[11px] px-2 py-1 rounded max-w-[200px]"
                              >
                                <option value="">-- Choisir l'album --</option>
                                {records.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.artist} - {r.album}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Guide for Project /public/covers/ directory */}
          {activeTab === "guide_directory" && (
            <div className="space-y-4">
              <div className="p-4 bg-[#14110E] border border-[#3A3226] rounded-md space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#E2A53C] flex items-center gap-2">
                    <HardDrive className="w-4 h-4" />
                    <span>Dossier physique du projet : /public/covers/</span>
                  </h3>
                  <button
                    type="button"
                    onClick={fetchServerCovers}
                    className="p-1 rounded bg-[#251F17] hover:bg-[#3A3226] text-[#B7AD98] hover:text-[#F1E9D8] text-xs flex items-center gap-1 font-mono"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingServerCovers ? "animate-spin" : ""}`} />
                    <span>Actualiser</span>
                  </button>
                </div>
                <p className="text-xs text-[#B7AD98] leading-relaxed">
                  Dans l'explorateur de fichiers de votre projet, vous pouvez directement glisser-déposer vos images dans le dossier{" "}
                  <code className="text-[#E2A53C] bg-black/40 px-1 py-0.5 rounded font-mono">/public/covers/</code>.
                  Nommez-les simplement avec le nom de l'artiste et de l'album !
                </p>
              </div>

              {/* Status of server directory */}
              <div className="flex items-center justify-between p-3 bg-[#191510] border border-[#3A3226] rounded">
                <div className="text-xs text-[#B7AD98]">
                  <strong>{serverCovers.length}</strong> fichier(s) image détecté(s) actuellement dans{" "}
                  <span className="text-[#E2A53C]">/public/covers/</span>
                </div>
                {serverCovers.length > 0 && (
                  <button
                    type="button"
                    onClick={handleLinkServerCovers}
                    className="px-3 py-1.5 rounded bg-[#E2A53C] hover:bg-[#E8AF4D] text-[#221A0E] text-xs font-bold transition-colors shadow flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Lier automatiquement aux vinyles</span>
                  </button>
                )}
              </div>

              {/* Quick copy table for exact names */}
              <div className="space-y-2">
                <h4 className="font-mono text-xs uppercase tracking-wider text-[#B7AD98]">
                  Noms de fichiers recommandés pour vos vinyles (cliquez pour copier) :
                </h4>
                <div className="border border-[#3A3226] rounded max-h-[300px] overflow-y-auto divide-y divide-[#3A3226] bg-[#14110E]">
                  {records.map((r) => {
                    const fname = getRecommendedFilename(r);
                    const isCopied = copiedId === r.id;
                    return (
                      <div
                        key={r.id}
                        className="p-2.5 flex items-center justify-between hover:bg-[#1E1913] text-xs gap-3"
                      >
                        <div className="truncate">
                          <span className="font-bold text-[#F1E9D8]">{r.artist}</span>
                          <span className="text-[#B7AD98]"> — {r.album}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyFilename(r)}
                          className="px-2.5 py-1 rounded bg-[#251F17] hover:bg-[#3A3226] text-[#E2A53C] font-mono text-[11px] flex items-center gap-1 shrink-0 transition-colors"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-[#6E8F5C]" />
                              <span className="text-[#6E8F5C]">Copié !</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>{fname}</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Backup / Pack JSON */}
          {activeTab === "backup_pack" && (
            <div className="space-y-4">
              <p className="text-xs text-[#B7AD98] leading-relaxed">
                Vous pouvez exporter toutes vos photos d'albums sous la forme d'un <strong>pack unique de pochettes</strong> (.json).
                Ce fichier conserve toutes vos images en haute qualité et peut être restauré sur n'importe quel autre ordinateur ou navigateur en 1 seconde !
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#14110E] border border-[#3A3226] rounded space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#F1E9D8] flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-[#E2A53C]" />
                      <span>Exporter le Pack de Pochettes</span>
                    </h4>
                    <p className="text-xs text-[#B7AD98] mt-1">
                      Télécharge un fichier contenant toutes les photos associées à vos disques.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportCoverPack}
                    className="w-full py-2.5 rounded bg-[#251F17] hover:bg-[#3A3226] text-[#E2A53C] border border-[#3A3226] text-xs font-bold transition-colors"
                  >
                    Télécharger le pack (.json)
                  </button>
                </div>

                <div className="p-4 bg-[#14110E] border border-[#3A3226] rounded space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#F1E9D8] flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-[#6E8F5C]" />
                      <span>Restaurer un Pack de Pochettes</span>
                    </h4>
                    <p className="text-xs text-[#B7AD98] mt-1">
                      Sélectionnez un pack .json précédemment exporté pour recharger toutes vos pochettes instantanément.
                    </p>
                  </div>
                  <label className="w-full py-2.5 rounded bg-[#251F17] hover:bg-[#3A3226] text-[#6E8F5C] border border-[#3A3226] text-xs font-bold text-center cursor-pointer transition-colors block">
                    <span>Sélectionner le pack .json</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportCoverPack}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#14110E] p-3.5 border-t border-[#3A3226] flex items-center justify-between shrink-0">
          <span className="text-xs text-[#B7AD98]">
            Format carré 400×400 px automatique · Stocké dans le dossier ou en base locale
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#251F17] hover:bg-[#3A3226] text-[#F1E9D8] text-xs font-semibold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
