import { VinylRecord, GENRE_METAS, PRIORITY_CONFIG } from "../types";

export function exportVinylsToCSV(records: VinylRecord[], filename = "ma_discotheque_vinyles.csv"): void {
  const headers = [
    "Statut",
    "Artiste",
    "Album",
    "Année",
    "Genre",
    "Note (sur 5)",
    "État Disque",
    "État Pochette",
    "Prix Indicatif",
    "Prix Payé (€)",
    "Pressage / Édition",
    "Notes Personnelles",
    "Pourquoi cet album",
    "Date Acquisition",
  ];

  const statusLabel = (s: string) => {
    if (s === "owned") return "Ma Collection";
    return "Ma Wishlist";
  };

  const escapeCSV = (val: any): string => {
    if (val === undefined || val === null) return "";
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = records.map((r) => {
    const genreLabel = GENRE_METAS[r.genre]?.label || r.genre;
    const ratingStr = r.rating ? `${r.rating}/5` : "";
    const pricePaidStr = r.pricePaid !== undefined && r.pricePaid !== null ? `${r.pricePaid} €` : "";

    return [
      escapeCSV(statusLabel(r.status)),
      escapeCSV(r.artist),
      escapeCSV(r.album),
      escapeCSV(r.year),
      escapeCSV(genreLabel),
      escapeCSV(ratingStr),
      escapeCSV(r.condition || ""),
      escapeCSV(r.sleeveCondition || ""),
      escapeCSV(r.indicativePrice || ""),
      escapeCSV(pricePaidStr),
      escapeCSV(r.pressingInfo || ""),
      escapeCSV(r.findingsNotes || ""),
      escapeCSV(r.why || ""),
      escapeCSV(r.dateAcquired || r.dateAdded || ""),
    ].join(";");
  });

  // UTF-8 BOM for French Excel compatibility
  const csvContent = "\uFEFF" + headers.map(escapeCSV).join(";") + "\n" + rows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
