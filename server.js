import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Fichier secret avec l'historique (pas accesible au navigateur)
// Sur Fly.io, DATA_DIR pointe vers le volume persistant /data
const DATA_DIR = process.env.DATA_DIR || __dirname;
const TRINQUADES_FILE = path.join(DATA_DIR, 'trinquades.json');

// --- Normalisation (identique à functions/api/trinquer.js) ---
const MOTS_VIDES = new Set([
    'le', 'la', 'les', 'l', 'un', 'une', 'des', 'du', 'de', 'd',
    'au', 'aux', 'the', 'a', 'an', 'of', 'et', 'à',
]);

function singulier(mot) {
    if (mot.length > 3 && mot.endsWith('s')) {
        return mot.slice(0, -1);
    }
    return mot;
}

// Compare le sens, pas l'orthographe : minuscules, sans accents,
// sans articles, au singulier. "Les Sardines" = "sardine",
// mais "sardines d'alice" reste différent.
function normaliser(texte) {
    const nettoye = texte
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/['’`]/g, ' ')
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
        .filter((mot) => !MOTS_VIDES.has(mot))
        .map(singulier)
        .filter(Boolean)
        .join(' ')
        .trim();
    return nettoye || texte.toLowerCase().trim();
}

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname)); // Sert les fichiers HTML/CSS/JS

// Charger l'historique des trinquades
function loadTrinquades() {
    try {
        if (fs.existsSync(TRINQUADES_FILE)) {
            const data = fs.readFileSync(TRINQUADES_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Erreur en chargeant trinquades.json:', error);
    }
    return {
        trinquades: [],
        createdAt: new Date().toISOString(),
    };
}

// Sauvegarder l'historique
function saveTrinquades(data) {
    try {
        fs.writeFileSync(TRINQUADES_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Erreur en sauvegardant trinquades.json:', error);
    }
}

// API: Vérifier et enregistrer une trinquade
app.post('/api/trinquer', (req, res) => {
    const { player, trinquade } = req.body;

    // Validation basique
    if (!player || !trinquade) {
        return res.status(400).json({ error: 'Données manquantes' });
    }

    // Charger l'historique
    const data = loadTrinquades();

    // Normaliser pour comparer le sens (voir fonction normaliser plus bas)
    const trinquadeNorm = normaliser(trinquade);

    // Vérifier si on a déjà trinqué à ça
    const original = data.trinquades.find(
        (t) => normaliser(t.trinquade) === trinquadeNorm
    );

    if (original) {
        // On a déjà trinqué à ça -> Défi! On renvoie par qui et quand.
        return res.json({
            success: false,
            message: 'Déjà trinqué à ça!',
            player: original.player || null,
            date: original.date || null,
        });
    }

    // Nouvelle trinquade! -> Enregistrer
    data.trinquades.push({
        player: player,
        trinquade: trinquade,
        date: new Date().toISOString(),
    });

    saveTrinquades(data);

    return res.json({ success: true, message: 'Nouvelle trinquade enregistrée!' });
});

// API: défi en cours (miroir local de functions/api/defi.js)
const DEFI_DEFAUT =
    "Tu paies le verre à l'autre et tu le finis en moins de 20 secondes, " +
    "sinon tu paies le prochain.\n\n" +
    "Et si on oublie de trinquer 3 fois d'affilée : une bouteille d'1L de " +
    "vodka Sobieski à partager dans la soirée.";

app.get('/api/defi', (req, res) => {
    const data = loadTrinquades();
    res.json({ defi: data.defi || DEFI_DEFAUT });
});

app.post('/api/defi', (req, res) => {
    const defi = (req.body.defi || '').trim();
    if (!defi) return res.status(400).json({ error: 'Défi vide' });
    const data = loadTrinquades();
    data.defi = defi;
    saveTrinquades(data);
    res.json({ success: true, defi });
});

// API: Récupérer les stats (optionnel, pour plus tard)
app.get('/api/stats', (req, res) => {
    const data = loadTrinquades();
    res.json({
        totalTrinquades: data.trinquades.length,
        players: [...new Set(data.trinquades.map((t) => t.player))],
    });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🍻 Serveur À La Tienne lancé sur http://localhost:${PORT}`);
    console.log(`Les trinquades sont sauvegardées dans: ${TRINQUADES_FILE}`);
});
