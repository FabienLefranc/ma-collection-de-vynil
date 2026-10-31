import React from "react";
import { X, CheckCircle2, AlertTriangle, HelpCircle, Eye, Disc } from "lucide-react";
import { GOLDMINE_GRADES } from "../types";

interface CrateDiggingCheatsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CrateDiggingCheatsheetModal: React.FC<CrateDiggingCheatsheetModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#1E1913] border border-[#3A3226] rounded-md shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-[#14110E] p-4 sm:p-5 border-b border-[#3A3226] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Disc className="w-5 h-5 text-[#E2A53C]" />
            <h2
              className="text-2xl text-[#F1E9D8] font-bold tracking-wide"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              Guide du Chineur de Vinyles d'Occasion
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

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5 text-sm text-[#F1E9D8] max-h-[75vh] overflow-y-auto">
          {/* Quick Checklist in front of crate */}
          <div className="bg-[#14110E] p-4 rounded border border-[#3A3226]">
            <h3 className="font-mono text-xs uppercase tracking-wider text-[#E2A53C] font-bold mb-2 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>Les 5 Réflexes devant un bac de vinyles</span>
            </h3>
            <ul className="space-y-2 text-xs text-[#B7AD98]">
              <li className="flex items-start gap-2">
                <span className="text-[#6E8F5C] font-bold">1.</span>
                <span>
                  <strong>Sortir le disque de sa pochette :</strong> Ne jamais acheter sans regarder le disque lui-même. Vérifier la correspondance de l'étiquette centrale avec la pochette.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#6E8F5C] font-bold">2.</span>
                <span>
                  <strong>Incliner le vinyle sous une lumière rasante :</strong> Détecter les rayures circulaires (profondes) et les cheveux de surface (souvent inaudibles). Si l'ongle accroche, le disque sautera ou cliquera.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#6E8F5C] font-bold">3.</span>
                <span>
                  <strong>Vérifier le voilage (platitude) :</strong> Regarder la tranche du disque à l'horizontale. Un disque voilé en "vague" perturbera le bras de lecture.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#6E8F5C] font-bold">4.</span>
                <span>
                  <strong>Inspecter le centre (Spindle marks) :</strong> De nombreuses rayures autour du trou central indiquent un disque énormément joué sans précaution.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#6E8F5C] font-bold">5.</span>
                <span>
                  <strong>Examiner la matrice dans le sillon de sortie (Deadwax) :</strong> La gravure entre la fin de la musique et l'étiquette indique souvent le pays et le premier pressage (ex: A1/B1).
                </span>
              </li>
            </ul>
          </div>

          {/* Goldmine grading chart */}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-[#B7AD98] font-bold mb-2">
              Grading Collector (Norme Goldmine)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {GOLDMINE_GRADES.map((g) => (
                <div key={g.code} className="bg-[#14110E] p-2.5 rounded border border-[#3A3226]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-[#E2A53C]">
                      {g.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#B7AD98] leading-tight">
                    {g.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#14110E] p-3.5 border-t border-[#3A3226] text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#251F17] hover:bg-[#3A3226] text-[#F1E9D8] text-xs font-semibold"
          >
            Fermer le guide
          </button>
        </div>
      </div>
    </div>
  );
};
