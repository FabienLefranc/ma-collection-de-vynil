import { VinylRecord } from "../types";

export function cleanString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]/g, "") // remove non-alphanumeric
    .trim();
}

/**
 * Generates the recommended filename for a record, e.g. "The Beatles - Abbey Road.jpg"
 */
export function getRecommendedFilename(record: VinylRecord, extension = "jpg"): string {
  const safeArtist = record.artist.replace(/[/\\?%*:|"<>]/g, "");
  const safeAlbum = record.album.replace(/[/\\?%*:|"<>]/g, "");
  return `${safeArtist} - ${safeAlbum}.${extension}`;
}

export function getSlugFilename(record: VinylRecord, extension = "jpg"): string {
  const safe = `${record.artist}-${record.album}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${safe}.${extension}`;
}

export interface MatchResult {
  filename: string;
  matchedRecordId: string | null;
  score: number; // 0 to 1
  coverDataUrl?: string;
  file?: File;
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

/**
 * Finds the best matching VinylRecord for a given filename
 */
export function matchFilenameToRecord(
  filename: string,
  records: VinylRecord[]
): { record: VinylRecord | null; score: number } {
  // Strip extension and optional duplicate suffix like -1 or (1)
  const nameWithoutExt = filename
    .replace(/\.[^/.]+$/, "")
    .replace(/(?:-\d+|\s*\(\d+\))$/, "");
  const cleanName = cleanString(nameWithoutExt);

  if (!cleanName) {
    return { record: null, score: 0 };
  }

  let bestMatch: VinylRecord | null = null;
  let bestScore = 0;

  for (const record of records) {
    const cleanArtist = cleanString(record.artist);
    const cleanAlbum = cleanString(record.album);
    const combined1 = cleanArtist + cleanAlbum;
    const combined2 = cleanAlbum + cleanArtist;

    // 1. Exact match on combined (Artist + Album or Album + Artist)
    if (cleanName === combined1 || cleanName === combined2) {
      return { record, score: 1.0 };
    }

    // 2. Contains both artist and album
    if (cleanArtist.length >= 2 && cleanAlbum.length >= 2 && cleanName.includes(cleanArtist) && cleanName.includes(cleanAlbum)) {
      if (0.96 > bestScore) {
        bestScore = 0.96;
        bestMatch = record;
      }
    }

    // 3. Exact match on album title alone
    if (cleanName === cleanAlbum && cleanAlbum.length >= 3) {
      if (0.92 > bestScore) {
        bestScore = 0.92;
        bestMatch = record;
      }
    }

    // 4. Exact match on artist name alone (e.g. "amy winehouse.avif", "bb king.avif")
    if (cleanName === cleanArtist && cleanArtist.length >= 2) {
      if (0.88 > bestScore) {
        bestScore = 0.88;
        bestMatch = record;
      }
    }

    // 5. High fuzzy similarity on combined (handles typos like "adel 21.avif" or "toys in the altic")
    const simCombined1 = similarity(cleanName, combined1);
    const simCombined2 = similarity(cleanName, combined2);
    const maxSimCombined = Math.max(simCombined1, simCombined2);
    if (maxSimCombined >= 0.82) {
      const score = 0.82 + (maxSimCombined - 0.82) * 0.8;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = record;
      }
    }

    // 6. High fuzzy similarity on artist name alone
    if (cleanArtist.length >= 4) {
      const simArtist = similarity(cleanName, cleanArtist);
      if (simArtist >= 0.84) {
        const score = 0.8;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = record;
        }
      }
    }

    // 7. Contains album title
    if (cleanAlbum.length >= 4 && cleanName.includes(cleanAlbum)) {
      const score = 0.76;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = record;
      }
    }

    // 8. Contains artist name + album keywords or partial match
    if (cleanArtist.length >= 3 && cleanName.includes(cleanArtist)) {
      const albumWords = record.album
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length >= 2);
      
      const matchedWords = albumWords.filter((w) => cleanName.includes(w));
      if (albumWords.length > 0 && matchedWords.length > 0) {
        const ratio = matchedWords.length / albumWords.length;
        const score = 0.78 + ratio * 0.17; // 0.78 to 0.95
        if (score > bestScore) {
          bestScore = score;
          bestMatch = record;
        }
      } else {
        const score = 0.72;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = record;
        }
      }
    }
  }

  return {
    record: bestScore >= 0.7 ? bestMatch : null,
    score: bestScore,
  };
}
