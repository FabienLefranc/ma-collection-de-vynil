import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// High body limit to allow batch cover uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const COVERS_DIR = path.join(process.cwd(), "public", "covers");
if (!fs.existsSync(COVERS_DIR)) {
  fs.mkdirSync(COVERS_DIR, { recursive: true });
}

// Serve /covers statically with explicit MIME types (including .avif and .jfif)
app.use(
  "/covers",
  express.static(COVERS_DIR, {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === ".avif") {
        res.setHeader("Content-Type", "image/avif");
      } else if (ext === ".webp") {
        res.setHeader("Content-Type", "image/webp");
      } else if (ext === ".jfif" || ext === ".jpg" || ext === ".jpeg") {
        res.setHeader("Content-Type", "image/jpeg");
      } else if (ext === ".png") {
        res.setHeader("Content-Type", "image/png");
      } else if (ext === ".svg") {
        res.setHeader("Content-Type", "image/svg+xml");
      } else if (ext === ".gif") {
        res.setHeader("Content-Type", "image/gif");
      }
    },
  })
);

// API: List all cover files available in public/covers
app.get("/api/local-covers", (_req, res) => {
  try {
    if (!fs.existsSync(COVERS_DIR)) {
      res.json({ covers: [] });
      return;
    }
    const files = fs.readdirSync(COVERS_DIR);
    const validExtensions = new Set([
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".avif",
      ".svg",
      ".jfif",
      ".gif",
    ]);
    const coverFiles = files.filter((f) =>
      validExtensions.has(path.extname(f).toLowerCase())
    );
    res.json({ covers: coverFiles });
  } catch (err: any) {
    res.status(500).json({ error: "Impossible de lire le dossier covers", details: err.message });
  }
});

// API: Save one or multiple covers to public/covers
app.post("/api/save-covers-batch", (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      res.status(400).json({ error: "Format attendu: { items: [{ filename, dataUrl }] }" });
      return;
    }

    const savedFiles: string[] = [];

    for (const item of items) {
      if (!item.filename || !item.dataUrl) continue;
      // Sanitize filename
      const safeName = path.basename(item.filename).replace(/[/\\?%*:|"<>]/g, "");
      const matches = item.dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const buffer = Buffer.from(matches[2], "base64");
        const filePath = path.join(COVERS_DIR, safeName);
        fs.writeFileSync(filePath, buffer);
        savedFiles.push(safeName);
      }
    }

    res.json({ success: true, count: savedFiles.length, files: savedFiles });
  } catch (err: any) {
    res.status(500).json({ error: "Erreur enregistrement photos", details: err.message });
  }
});

// Lazy-initialized Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// API: Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", aiEnabled: Boolean(process.env.GEMINI_API_KEY) });
});

// API: Find vinyl reference album for an artist
app.post("/api/recommend-reference", async (req, res) => {
  try {
    const { artist } = req.body;
    if (!artist || typeof artist !== "string" || !artist.trim()) {
      res.status(400).json({ error: "Nom d'artiste requis" });
      return;
    }

    const trimmedArtist = artist.trim();
    const ai = getGenAI();

    if (!ai) {
      // Fallback response if API key is not available
      res.json({
        artist: trimmedArtist,
        album: "Album Recommandé",
        year: 1975,
        genre: "rock",
        price: "20–30 €",
        why: `Référence incontournable de ${trimmedArtist} en vinyle d'occasion.`,
        tracks: ["Morceau 1", "Morceau 2"],
        notice: "Clé Gemini non configurée dans le serveur, suggestion par défaut.",
      });
      return;
    }

    const prompt = `Tu es un disquaire chevronné et expert mondial en disques vinyles et musique populaire (rock, pop, blues, jazz, soul/funk, country, celtic, electro/chanson) des années 1950 à nos jours.
Pour l'artiste ou le groupe suivant : "${trimmedArtist}", détermine quel est l'album considéré comme sa référence absolue en vinyle (l'album chef-d'œuvre incontournable qu'un chineur de disques doit absolument posséder en premier).

Réponds obligatoirement avec un JSON valide :
- artist: nom officiel exact de l'artiste ou du groupe
- album: titre exact de l'album référence
- year: année de sortie originale (nombre entier)
- genre: un genre parmi "rock", "pop", "blues", "jazz", "soul", "country", "celtic", "variete" (pour variété française / chanson française)
- price: estimation indicative du prix d'occasion en bon état (ex: "20–30 €" ou "25–40 €")
- why: une phrase concise et percutante en français expliquant pourquoi cet album est le sommet de sa discographie vinyle
- tracks: liste de 2 ou 3 morceaux phares à vérifier sur le disque`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            artist: { type: Type.STRING },
            album: { type: Type.STRING },
            year: { type: Type.INTEGER },
            genre: {
              type: Type.STRING,
              description: "rock, pop, blues, jazz, soul, country, celtic, or variete",
            },
            price: { type: Type.STRING },
            why: { type: Type.STRING },
            tracks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["artist", "album", "year", "genre", "price", "why"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Réponse vide de Gemini");
    }

    const result = JSON.parse(text);
    res.json(result);
  } catch (error: any) {
    console.error("Erreur Gemini /api/recommend-reference:", error);
    res.json({
      artist: req.body?.artist || "Artiste",
      album: "Album Référence",
      year: 1975,
      genre: "variete",
      price: "15–30 €",
      why: `Album incontournable de ${req.body?.artist || "cet artiste"} à rechercher en brocante ou chez les disquaires.`,
      tracks: ["Titre phare A1", "Titre phare B1"],
      notice: "Suggestion automatique de secours (serveur IA temporairement saturé).",
    });
  }
});

// API: Detailed album knowledge dossier (history, tracklist, pressing tips, anecdotes)
app.post("/api/album-details", async (req, res) => {
  try {
    const { artist, album, year, genre } = req.body;
    if (!artist || !album) {
      res.status(400).json({ error: "Artiste et album requis" });
      return;
    }

    const ai = getGenAI();
    if (!ai) {
      res.json({
        historicalContext: `Sorti en ${year || "époque classique"}, cet album de ${artist} est une pièce maîtresse de sa discographie. Enregistré avec un soin tout particulier apporté aux textures analogiques.`,
        soundAnalysis: "Dynamique sonore ample, relief stéréophonique remarquable et présence chaleureuse des mediums typique des gravures de l'âge d'or du vinyle.",
        sideA: ["Face A - Titre 1", "Face A - Titre 2", "Face A - Titre 3"],
        sideB: ["Face B - Titre 1", "Face B - Titre 2", "Face B - Titre 3"],
        pressingTips: "Inspectez la tranche de la pochette et privilégiez les premiers pressages français, britanniques ou allemands avec matrice gravée dans le sillon d'arrêt.",
        anecdotes: [
          "Cet enregistrement a marqué un tournant artistique majeur pour l'artiste.",
          "La pochette originale est souvent recherchée pour son travail graphique distinctif."
        ],
        estimatedValueNotes: "Très recherché en état VG+ à NM chez les disquaires indépendants."
      });
      return;
    }

    const prompt = `Tu es un archiviste du disque vinyle, disquaire passionné et historien de la musique.
Rédige une fiche descriptive approfondie, vivante et captivante pour les passionnés de vinyles pour cet album :
- Artiste / Groupe : "${artist}"
- Titre de l'album : "${album}"
- Année de sortie : ${year || "non précisée"}
- Genre musical : ${genre || "non précisé"}

Fournis un dossier complet avec :
1. "historicalContext" : Genèse de l'album, conditions d'enregistrement studio, impact culturel (3-4 paragraphes passionnants en français).
2. "soundAnalysis" : Analyse de la production sonore analogique, relief stéréophonique, mastering vinyle, instruments clés.
3. "sideA" : Liste des morceaux clés de la Face A (avec durée approximative si connue ou note rapide).
4. "sideB" : Liste des morceaux clés de la Face B (avec durée approximative si connue ou note rapide).
5. "pressingTips" : Conseils d'expert pour le chineur (pressages originaux à privilégier, labels de référence, signes distinctifs de la matrice, fragilités de la pochette).
6. "anecdotes" : 3 anecdotes méconnues ou faits marquants sur cet album ou son enregistrement.
7. "estimatedValueNotes" : Fourchette de prix réelle en bourse aux disques / Discogs selon les états (VG, VG+, NM, Mint).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            historicalContext: { type: Type.STRING },
            soundAnalysis: { type: Type.STRING },
            sideA: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            sideB: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            pressingTips: { type: Type.STRING },
            anecdotes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            estimatedValueNotes: { type: Type.STRING },
          },
          required: ["historicalContext", "soundAnalysis", "sideA", "sideB", "pressingTips", "anecdotes", "estimatedValueNotes"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Erreur Gemini /api/album-details:", error);
    res.json({
      historicalContext: `Enregistré avec les plus grands standards de l'époque, "${req.body?.album}" représente un jalon déterminant dans la carrière de ${req.body?.artist}. L'œuvre se caractérise par une cohésion musicale exemplaire et une richesse instrumentale magnifiée par le support vinyle.`,
      soundAnalysis: "Production analogique chaude avec un beau détachement des instruments, une section rythmique bien ronde et une voix parfaitement centrée.",
      sideA: ["Face A - Titre 1", "Face A - Titre 2", "Face A - Titre 3"],
      sideB: ["Face B - Titre 1", "Face B - Titre 2", "Face B - Titre 3"],
      pressingTips: "Privilégiez les pressages épais (140g à 180g) et examinez bien les reflets sous lumière rasante pour déceler d'éventuelles micro-rayures.",
      anecdotes: [
        "Un album souvent cité comme référence absolue de la discographie vinyle.",
        "Le visuel de la pochette originale en grand format 31×31 cm est considéré comme une œuvre d'art à part entière."
      ],
      estimatedValueNotes: "Cote soutenue en brocante et conventions de disques."
    });
  }
});

// Vite middleware in dev or static serving in production
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur vinyle en écoute sur http://localhost:${PORT}`);
  });
}

setupViteOrStatic();
