// Cloudflare Pages Function — gère POST /api/trinquer
//
// Sur Cloudflare, ce fichier remplace l'ancienne route Express.
// "context" contient la requête (request) et les bindings (env),
// dont env.TRINQUADES qui est notre base de données KV.

// Mots vides (articles, prépositions) qu'on ignore pour la comparaison.
const MOTS_VIDES = new Set([
    'le', 'la', 'les', 'l', 'un', 'une', 'des', 'du', 'de', 'd',
    'au', 'aux', 'the', 'a', 'an', 'of', 'et', 'à',
]);

// Met un mot au singulier (enlève le "s" final des mots assez longs).
function singulier(mot) {
    if (mot.length > 3 && mot.endsWith('s')) {
        return mot.slice(0, -1);
    }
    return mot;
}

// Normalise le texte pour comparer le SENS, pas l'orthographe exacte :
// - minuscules, sans accents
// - on retire les articles (le/la/les/un/des...)
// - on met chaque mot au singulier (sardines -> sardine)
// Ainsi "Les Sardines" = "sardine" = "la sardine",
// mais "sardines d'alice" ou "sardines oranges" restent différents
// (les mots en plus comptent).
function normaliser(texte) {
    const nettoye = texte
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // accents
        .replace(/['’`]/g, ' ')          // apostrophes -> espace
        .replace(/[^a-z0-9\s]/g, ' ')    // ponctuation -> espace
        .split(/\s+/)
        .filter(Boolean)
        .filter((mot) => !MOTS_VIDES.has(mot))
        .map(singulier)
        .filter(Boolean)
        .join(' ')
        .trim();
    // Si tout a été retiré (ex: l'utilisateur n'a tapé que "les"),
    // on retombe sur une version simple pour éviter une clé vide.
    return nettoye || texte.toLowerCase().trim();
}

export async function onRequestPost(context) {
    const { request, env } = context;

    // Lire les données envoyées par le navigateur
    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Requête invalide' }, { status: 400 });
    }

    const { player, trinquade } = body;

    // Validation
    if (!player || !trinquade || !trinquade.trim()) {
        return Response.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // La clé KV : on stocke chaque trinquade sous "trinq:<version normalisée>"
    // Comme ça, vérifier si elle existe = une seule lecture, pas de doublon possible.
    const cle = 'trinq:' + normaliser(trinquade);

    // A-t-on déjà trinqué à ça ?
    const dejaExistant = await env.TRINQUADES.get(cle);

    if (dejaExistant) {
        // Oui -> Défi ! On renvoie qui avait trinqué et quand.
        let original = {};
        try {
            original = JSON.parse(dejaExistant);
        } catch {
            // Si jamais l'ancienne entrée n'est pas un JSON lisible, on ignore.
        }
        return Response.json({
            success: false,
            message: 'Déjà trinqué à ça !',
            player: original.player || null,
            date: original.date || null,
        });
    }

    // Non -> nouvelle trinquade, on l'enregistre
    const nouvelle = {
        player: player,
        trinquade: trinquade.trim(),
        date: new Date().toISOString(),
    };

    await env.TRINQUADES.put(cle, JSON.stringify(nouvelle));

    return Response.json({ success: true, message: 'Nouvelle trinquade enregistrée !' });
}
