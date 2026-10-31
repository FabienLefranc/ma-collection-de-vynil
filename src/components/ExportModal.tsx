import React from "react";
import { VinylRecord } from "../types";
import { exportVinylsToCSV } from "../utils/csvExport";
import { X, FileSpreadsheet, Download, Upload, CheckCircle } from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allRecords: VinylRecord[];
  ownedRecords: VinylRecord[];
  wantedRecords: VinylRecord[];
  onImportJSON: (importedData: any) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  allRecords,
  ownedRecords,
  wantedRecords,
  onImportJSON,
}) => {
  if (!isOpen) return null;

  const handleExportFullCSV = () => {
    exportVinylsToCSV(allRecords, "ma_discotheque_vinyles_complete.csv");
  };

  const handleExportCollectionCSV = () => {
    exportVinylsToCSV(ownedRecords, "ma_collection_vinyles.csv");
  };

  const handleExportWishlistCSV = () => {
    exportVinylsToCSV(wantedRecords, "ma_liste_recherche_prioritaire_vinyles.csv");
  };

  const handleBackupJSON = () => {
    const backupData = {
      version: 1,
      date: new Date().toISOString(),
      records: allRecords,
    };
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", jsonStr);
    dlAnchor.setAttribute("download", `discotheque_vinyle_sauvegarde_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  const handleFileUploadJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onImportJSON(parsed);
        alert("Sauvegarde restaurée avec succès !");
        onClose();
      } catch (err) {
        alert("Fichier de sauvegarde invalide.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#1E1913] border border-[#3A3226] rounded-md shadow-2xl overflow-hidden my-6">
        <div className="bg-[#14110E] p-4 sm:p-5 border-b border-[#3A3226] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#E2A53C]" />
            <h2
              className="text-2xl text-[#F1E9D8] font-bold tracking-wide"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              Exportation & Sauvegarde Personnelle
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

        <div className="p-4 sm:p-6 space-y-5">
          {/* CSV Export Options */}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-[#E2A53C] font-bold mb-2">
              Export CSV (Excel, Numbers, LibreOffice)
            </h3>
            <p className="text-xs text-[#B7AD98] mb-3">
              Fichier CSV encodé en UTF-8 avec séparateur point-virgule, prêt à l'ouverture immédiate sans conversion pour vos archives personnelles.
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleExportFullCSV}
                className="w-full p-3 rounded bg-[#14110E] hover:bg-[#251F17] border border-[#3A3226] text-left flex items-center justify-between transition-colors group"
              >
                <div>
                  <div className="font-semibold text-sm text-[#F1E9D8] group-hover:text-[#E2A53C]">
                    Exporter toute la discothèque ({allRecords.length} disques)
                  </div>
                  <div className="text-xs text-[#B7AD98]">
                    Inclut tous les disques de votre collection et de votre wishlist.
                  </div>
                </div>
                <Download className="w-4 h-4 text-[#B7AD98] group-hover:text-[#E2A53C] shrink-0 ml-2" />
              </button>

              <button
                type="button"
                onClick={handleExportCollectionCSV}
                className="w-full p-3 rounded bg-[#14110E] hover:bg-[#251F17] border border-[#3A3226] text-left flex items-center justify-between transition-colors group"
              >
                <div>
                  <div className="font-semibold text-sm text-[#6E8F5C] group-hover:text-[#85AA71]">
                    Exporter ma collection uniquement ({ownedRecords.length} disques)
                  </div>
                  <div className="text-xs text-[#B7AD98]">
                    Idéal pour vos assurances, inventaire physique ou archivage de vos trouvailles.
                  </div>
                </div>
                <Download className="w-4 h-4 text-[#6E8F5C] shrink-0 ml-2" />
              </button>

              <button
                type="button"
                onClick={handleExportWishlistCSV}
                className="w-full p-3 rounded bg-[#14110E] hover:bg-[#251F17] border border-[#3A3226] text-left flex items-center justify-between transition-colors group"
              >
                <div>
                  <div className="font-semibold text-sm text-[#FF7A63] group-hover:text-[#FFA08F]">
                    Exporter ma wishlist ({wantedRecords.length} disques)
                  </div>
                  <div className="text-xs text-[#B7AD98]">
                    Pratique à imprimer ou garder sur son smartphone pour les virées en brocante !
                  </div>
                </div>
                <Download className="w-4 h-4 text-[#FF7A63] shrink-0 ml-2" />
              </button>
            </div>
          </div>

          {/* JSON Backup & Restore */}
          <div className="pt-4 border-t border-[#3A3226]">
            <h3 className="font-mono text-xs uppercase tracking-wider text-[#B7AD98] font-bold mb-2">
              Sauvegarde intégrale & Restauration (Format JSON)
            </h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleBackupJSON}
                className="flex-1 py-2 px-3 rounded bg-[#251F17] hover:bg-[#3A3226] text-[#F1E9D8] text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#3A3226] transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#E2A53C]" />
                <span>Télécharger sauvegarde JSON</span>
              </button>

              <label className="flex-1 py-2 px-3 rounded bg-[#251F17] hover:bg-[#3A3226] text-[#F1E9D8] text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#3A3226] cursor-pointer transition-colors text-center">
                <Upload className="w-3.5 h-3.5 text-[#6E8F5C]" />
                <span>Restaurer un fichier JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUploadJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="bg-[#14110E] p-3.5 border-t border-[#3A3226] text-right">
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
