// Cloudflare Pages Function — gère POST /api/trinquer
//
// Sur Cloudflare, ce fichier remplace l'ancienne route Express.
// "context" contient la requête (request) et les bindings (env),
// dont env.TRINQUADES qui est notre base de données KV.

// Petite fonction pour normaliser le texte (minuscules, sans espaces en trop,
// sans accents) afin que "Les Sardines " == "les sardines"
function normaliser(texte) {
    return texte
        .toLowerCase()
        .trim()
        .normalize('NFD') // sépare les accents des lettres
        .replace(/[̀-ͯ]/g, ''); // supprime les accents
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
        // Oui -> Défi !
        return Response.json({ success: false, message: 'Déjà trinqué à ça !' });
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
