import { INITIAL_RECORDS } from "../data/baseRecords";
import { ALBUM_SHEETS } from "../data/albumSheets";
import { VinylRecord, VinylStatus, WishlistPriority, GoldmineGrade } from "../types";

const LS_KEY_CUSTOM = "discotheque_vinylo_custom_records";
const LS_KEY_USER_DATA = "discotheque_vinylo_user_data";
const LS_KEY_DELETED = "discotheque_vinylo_deleted_records";

export function loadDeletedRecordIds(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY_DELETED);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Erreur lecture deleted ids", e);
    return [];
  }
}

export function saveDeletedRecordIds(ids: string[]): void {
  try {
    localStorage.setItem(LS_KEY_DELETED, JSON.stringify(ids));
  } catch (e) {
    console.error("Erreur sauvegarde deleted ids", e);
  }
}

export function deleteRecordFromStorage(recordId: string): void {
  // 1. Add to deleted IDs set
  const deleted = loadDeletedRecordIds();
  if (!deleted.includes(recordId)) {
    deleted.push(recordId);
    saveDeletedRecordIds(deleted);
  }

  // 2. Remove from custom records if present
  const custom = loadCustomRecords().filter((r) => r.id !== recordId);
  saveCustomRecords(custom);

  // 3. Remove from user data
  const userData = loadUserData();
  if (userData[recordId]) {
    delete userData[recordId];
    saveUserData(userData);
  }
}

export function restoreAllDefaultRecords(): void {
  try {
    localStorage.removeItem(LS_KEY_DELETED);
  } catch (e) {
    console.error("Erreur restauration records par défaut", e);
  }
}

export interface UserRecordData {
  status?: VinylStatus;
  userModifiedStatus?: boolean;
  rating?: number;
  sheetRating?: number;
  condition?: GoldmineGrade;
  sleeveCondition?: GoldmineGrade;
  pricePaid?: number;
  wishlistPriority?: WishlistPriority;
  findingsNotes?: string;
  pressingInfo?: string;
  coverUrl?: string;
  dateAcquired?: string;
  dateAdded?: string;
  categoryLabel?: string;
  releaseDetails?: string;
  ratingComment?: string;
  why?: string;
  newPrice?: string;
  newPriceSource?: string;
  usedPrice?: string;
  usedPriceSource?: string;
  genesis?: string;
  albumAnecdote?: string;
  artistAnecdote?: string;
  iconicTracks?: string[];
}

export type UserDataMap = Record<string, UserRecordData>;

const DEMO_SAMPLE_NOTES = new Set([
  "Déniché chez un disquaire indépendant. Pressage français 1969 Apple Records, son chaleureux !",
  "Édition avec les deux posters et stickers intacts. Absolument magique sur platine vinyle.",
  "Graal absolu de ma wishlist jazz. Chercher un pressage Columbia 6-eye ou réédition analogique propre.",
  "À repérer en priorité en brocante si moins de 30 €.",
  "L'énergie du blues live électrique à avoir absolument !",
  "Si trouvaille propre en VG+ ou NM à prix raisonnable.",
]);

export function loadUserData(): UserDataMap {
  try {
    const raw = localStorage.getItem(LS_KEY_USER_DATA);
    if (!raw) {
      return {};
    }
    const parsed: UserDataMap = JSON.parse(raw);
    let cleaned = false;
    for (const [key, val] of Object.entries(parsed)) {
      if (val?.findingsNotes && DEMO_SAMPLE_NOTES.has(val.findingsNotes)) {
        delete parsed[key];
        cleaned = true;
      }
      if (OBSOLETE_ALBUM_KEYS.has(key)) {
        delete parsed[key];
        cleaned = true;
      }
      // Migrate legacy 5-star ratings to 10-point scale
      if (val?.rating !== undefined && val.rating > 0 && val.rating <= 5.0) {
        val.rating = Math.round(val.rating * 2 * 10) / 10;
        cleaned = true;
      }
    }
    if (cleaned) {
      saveUserData(parsed);
    }
    return parsed;
  } catch (e) {
    console.error("Erreur lecture user data", e);
    return {};
  }
}

export function saveUserData(data: UserDataMap): void {
  try {
    localStorage.setItem(LS_KEY_USER_DATA, JSON.stringify(data));
  } catch (e) {
    console.error("Erreur sauvegarde user data", e);
  }
}

export function loadCustomRecords(): VinylRecord[] {
  try {
    const raw = localStorage.getItem(LS_KEY_CUSTOM);
    const list: VinylRecord[] = raw ? JSON.parse(raw) : [];
    let customCleaned = false;
    for (const rec of list) {
      if (rec.rating !== undefined && rec.rating > 0 && rec.rating <= 5.0) {
        rec.rating = Math.round(rec.rating * 2 * 10) / 10;
        customCleaned = true;
      }
    }
    if (customCleaned) {
      saveCustomRecords(list);
    }
    return list;
  } catch (e) {
    console.error("Erreur lecture custom records", e);
    return [];
  }
}

export function saveCustomRecords(records: VinylRecord[]): void {
  try {
    localStorage.setItem(LS_KEY_CUSTOM, JSON.stringify(records));
  } catch (e) {
    console.error("Erreur sauvegarde custom records", e);
  }
}

const REMOVED_ARTISTS = new Set([
  "alain souchon",
  "edith piaf",
  "alain bashung",
  "barbara",
  "charles aznavour",
  "christophe",
  "capercaillie",
  "daniel balavoine",
  "francis cabrel",
  "jean-jacques goldman",
  "veronique sanson",
]);

const OBSOLETE_ALBUM_KEYS = new Set([
  "maxime le forestier|maxime le forestier(3)",
  "maxime le forestier|maxime le forestier (3)",
  "maxime le forestier|maxime le forestier(4)",
  "maxime le forestier|maxime le forestier (4)",
  "maxime le forestier|maxime le forestier",
  "maxime le forestier|maxime le forestier (mon frere)",
  "michel polnareff|michel polnareff",
]);

export function isObsoleteRecord(rec: { artist: string; album: string; id?: string }): boolean {
  if (isRemovedArtist(rec.artist)) return true;
  const normArtist = rec.artist
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  const normAlbum = rec.album
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  const key = `${normArtist}|${normAlbum}`;
  if (OBSOLETE_ALBUM_KEYS.has(key)) return true;
  if (rec.id && OBSOLETE_ALBUM_KEYS.has(rec.id)) return true;
  return false;
}

function isRemovedArtist(artist: string): boolean {
  const norm = artist
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  return REMOVED_ARTISTS.has(norm);
}

export function getMergedRecords(): VinylRecord[] {
  const rawCustom = loadCustomRecords();
  const custom = rawCustom.filter((rec) => !isObsoleteRecord(rec));
  if (custom.length !== rawCustom.length) {
    saveCustomRecords(custom);
  }

  const userData = loadUserData();
  const deletedIds = new Set(loadDeletedRecordIds());

  // Combine initial records + custom records, avoiding duplicate keys & deleted items
  const map = new Map<string, VinylRecord>();

  INITIAL_RECORDS.forEach((rec) => {
    if (!deletedIds.has(rec.id) && !isObsoleteRecord(rec)) {
      map.set(rec.id, { ...rec, status: rec.status === "owned" ? "owned" : "wanted" });
    }
  });

  custom.forEach((rec) => {
    if (!deletedIds.has(rec.id) && !isObsoleteRecord(rec)) {
      map.set(rec.id, {
        ...rec,
        status: rec.status === "owned" ? "owned" : "wanted",
        isCustom: true,
      });
    }
  });

  // Apply user data (status, notes, rating, etc.) + ALBUM_SHEETS
  const result: VinylRecord[] = [];
  map.forEach((rec, key) => {
    const u = userData[key];
    const sheet = ALBUM_SHEETS[key];
    if (u) {
      let normalizedStatus: VinylStatus = rec.status === "owned" ? "owned" : "wanted";
      if ((sheet?.defaultStatus === "owned" || rec.status === "owned") && !u.userModifiedStatus) {
        normalizedStatus = "owned";
      } else if (u.status) {
        normalizedStatus = u.status === "owned" ? "owned" : "wanted";
      }

      result.push({
        ...rec,
        status: normalizedStatus,
        categoryLabel: (sheet?.categoryLabel && sheet.categoryLabel.trim() !== "") ? sheet.categoryLabel : (u.categoryLabel || rec.categoryLabel),
        releaseDetails: (sheet?.releaseDetails && sheet.releaseDetails.trim() !== "") ? sheet.releaseDetails : (u.releaseDetails || rec.releaseDetails),
        why: (sheet?.why && sheet.why.trim() !== "") ? sheet.why : (u.why || rec.why),
        rating: sheet?.rating !== undefined ? sheet.rating : (u.sheetRating !== undefined ? u.sheetRating : rec.rating),
        ratingComment: (sheet?.ratingComment && sheet.ratingComment.trim() !== "") ? sheet.ratingComment : (u.ratingComment || rec.ratingComment),
        condition: undefined,
        sleeveCondition: undefined,
        pricePaid: undefined,
        findingsNotes: undefined,
        pressingInfo: undefined,
        coverUrl: rec.coverUrl || u.coverUrl,
        dateAcquired: u.dateAcquired || rec.dateAcquired,
        dateAdded: u.dateAdded || rec.dateAdded,
        newPrice: (sheet?.newPrice && sheet.newPrice.trim() !== "") ? sheet.newPrice : (u.newPrice || rec.newPrice),
        newPriceSource: (sheet?.newPriceSource && sheet.newPriceSource.trim() !== "") ? sheet.newPriceSource : (u.newPriceSource || rec.newPriceSource),
        usedPrice: (sheet?.usedPrice && sheet.usedPrice.trim() !== "") ? sheet.usedPrice : (u.usedPrice || rec.usedPrice),
        usedPriceSource: (sheet?.usedPriceSource && sheet.usedPriceSource.trim() !== "") ? sheet.usedPriceSource : (u.usedPriceSource || rec.usedPriceSource),
        genesis: (sheet?.genesis && sheet.genesis.trim() !== "") ? sheet.genesis : (u.genesis || rec.genesis),
        albumAnecdote: (sheet?.albumAnecdote && sheet.albumAnecdote.trim() !== "") ? sheet.albumAnecdote : (u.albumAnecdote || rec.albumAnecdote),
        artistAnecdote: (sheet?.artistAnecdote && sheet.artistAnecdote.trim() !== "") ? sheet.artistAnecdote : (u.artistAnecdote || rec.artistAnecdote),
        iconicTracks: (sheet?.iconicTracks && sheet.iconicTracks.length > 0) ? sheet.iconicTracks : (u.iconicTracks && u.iconicTracks.length > 0 ? u.iconicTracks : rec.iconicTracks),
      });
    } else {
      result.push(rec);
    }
  });

  return result;
}
