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

    // Normaliser (minuscules, espaces) pour la comparaison
    const trinquadeNorm = trinquade.toLowerCase().trim();

    // Vérifier si on a déjà trinqué à ça
    const alreadyTrinked = data.trinquades.some(
        (t) => t.trinquade.toLowerCase().trim() === trinquadeNorm
    );

    if (alreadyTrinked) {
        // On a déjà trinqué à ça -> Défi!
        return res.json({ success: false, message: 'Déjà trinqué à ça!' });
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
