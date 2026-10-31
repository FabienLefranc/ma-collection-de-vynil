export type Genre =
  | 'rock'
  | 'pop'
  | 'blues'
  | 'jazz'
  | 'soul'
  | 'country'
  | 'celtic'
  | 'variete'
  | 'other';

export type VinylStatus = 'owned' | 'wanted' | 'catalog';

export type WishlistPriority = 'P1' | 'P2' | 'P3';

export type GoldmineGrade = 'M' | 'NM' | 'VG+' | 'VG' | 'G' | 'P';

export interface VinylRecord {
  id: string; // key: normalize(artist)|normalize(album)
  artist: string;
  album: string;
  year: number;
  genre: Genre;
  why: string;
  indicativePrice: string;
  coverUrl?: string;
  isCustom?: boolean;
  
  // Status & User Collection Data
  status: VinylStatus;
  rating?: number; // 1 to 10
  condition?: GoldmineGrade; // Disque
  sleeveCondition?: GoldmineGrade; // Pochette
  pricePaid?: number; // Prix payé en brocante / disquaire
  wishlistPriority?: WishlistPriority; // P1 Graal, P2 Important, P3 Occasion
  findingsNotes?: string; // Notes personnelles, anecdotes de chine, craquements, état des sillons
  pressingInfo?: string; // Pressage (original, réédition 180g, pays, label)
  dateAdded?: string;
  dateAcquired?: string;
  highlightTracks?: string[];

  // Uniform Descriptive Sheet Fields (Fiche descriptive)
  categoryLabel?: string; // Catégorie détaillée (ex: Rock alternatif / Art rock)
  releaseDetails?: string; // Année de sortie + détails réédition
  ratingComment?: string; // Précision sur la note moyenne des avis
  newPrice?: string; // Prix moyen d'un album neuf
  newPriceSource?: string; // Où le trouver neuf (Amazon, Fnac, etc.)
  usedPrice?: string; // Prix le moins cher d'un album d'occasion (Mint ou VG+)
  usedPriceSource?: string; // Où le trouver d'occasion (Vinted, eBay, etc.)
  genesis?: string; // Genèse et contexte de l'enregistrement de cet album
  albumAnecdote?: string; // Anecdote sur cet album
  artistAnecdote?: string; // Anecdote sur le groupe ou le chanteur
  iconicTracks?: string[]; // Un ou deux titres les plus emblématiques de cet album
}

export interface GenreMeta {
  label: string;
  color: string;
  bgBadge: string;
  borderBadge: string;
}

export const GENRE_METAS: Record<Genre, GenreMeta> = {
  rock: {
    label: "Rock",
    color: "#C3452F",
    bgBadge: "rgba(195, 69, 47, 0.15)",
    borderBadge: "rgba(195, 69, 47, 0.4)",
  },
  pop: {
    label: "Pop",
    color: "#B45E72",
    bgBadge: "rgba(180, 94, 114, 0.15)",
    borderBadge: "rgba(180, 94, 114, 0.4)",
  },
  blues: {
    label: "Blues",
    color: "#4A5F82",
    bgBadge: "rgba(74, 95, 130, 0.15)",
    borderBadge: "rgba(74, 95, 130, 0.4)",
  },
  jazz: {
    label: "Jazz",
    color: "#9C8544",
    bgBadge: "rgba(156, 133, 68, 0.15)",
    borderBadge: "rgba(156, 133, 68, 0.4)",
  },
  soul: {
    label: "Soul / Funk",
    color: "#5E7A4F",
    bgBadge: "rgba(94, 122, 79, 0.15)",
    borderBadge: "rgba(94, 122, 79, 0.4)",
  },
  country: {
    label: "Country",
    color: "#B0752E",
    bgBadge: "rgba(176, 117, 46, 0.15)",
    borderBadge: "rgba(176, 117, 46, 0.4)",
  },
  celtic: {
    label: "Celtique",
    color: "#2F7A63",
    bgBadge: "rgba(47, 122, 99, 0.15)",
    borderBadge: "rgba(47, 122, 99, 0.4)",
  },
  variete: {
    label: "Variété Française",
    color: "#D1495B",
    bgBadge: "rgba(209, 73, 91, 0.15)",
    borderBadge: "rgba(209, 73, 91, 0.4)",
  },
  other: {
    label: "Autre",
    color: "#E2A53C",
    bgBadge: "rgba(226, 165, 60, 0.15)",
    borderBadge: "rgba(226, 165, 60, 0.4)",
  },
};

export const GOLDMINE_GRADES: { code: GoldmineGrade; label: string; desc: string }[] = [
  { code: 'M', label: 'Mint (M)', desc: 'Neuf scellé, aucun défaut' },
  { code: 'NM', label: 'Near Mint (NM)', desc: 'Comme neuf, joué très rarement' },
  { code: 'VG+', label: 'Very Good+ (VG+)', desc: 'Excellente écoute, minimes traces de surface' },
  { code: 'VG', label: 'Very Good (VG)', desc: 'Traces d\'usage visibles, légers craquements sans sauts' },
  { code: 'G', label: 'Good (G/G+)', desc: 'Très joué, bruits de surface audibles réguliers' },
  { code: 'P', label: 'Poor (P)', desc: 'Rayé ou abîmé, disque de collectionneur de secours' },
];

export const PRIORITY_CONFIG: Record<WishlistPriority, { label: string; badge: string; color: string; desc: string }> = {
  P1: {
    label: 'P1 · Graal Absolu',
    badge: 'bg-[#C3452F]/20 text-[#FF7A63] border-[#C3452F]/60',
    color: '#FF7A63',
    desc: 'À acheter dès que repéré en bac !',
  },
  P2: {
    label: 'P2 · Haute Priorité',
    badge: 'bg-[#E2A53C]/20 text-[#F6C667] border-[#E2A53C]/60',
    color: '#F6C667',
    desc: 'Recherche active, bon pressage visé',
  },
  P3: {
    label: 'P3 · Belle Occasion',
    badge: 'bg-[#4A5F82]/20 text-[#8DA6CE] border-[#4A5F82]/60',
    color: '#8DA6CE',
    desc: 'Si bon prix ou belle trouvaille',
  },
};
