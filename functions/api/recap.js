// Cloudflare Pages Function — gère GET /api/recap?code=MOT_DE_PASSE
//
// Cette page affiche l'historique COMPLET des trinquades.
// Elle est protégée par un mot de passe secret (env.SECRET) que tu
// définis dans les réglages Cloudflare. Sans le bon code, accès refusé.
// Comme ça, l'historique n'est jamais visible sur le site du jeu.

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    // Vérifier le mot de passe
    if (!env.SECRET || code !== env.SECRET) {
        return new Response('Accès refusé. Ajoute ?code=TON_SECRET à l\'URL.', {
            status: 401,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
    }

    // Récupérer toutes les clés "trinq:*" depuis KV
    const liste = await env.TRINQUADES.list({ prefix: 'trinq:' });

    // Lire chaque trinquade
    const trinquades = [];
    for (const cle of liste.keys) {
        const valeur = await env.TRINQUADES.get(cle.name);
        if (valeur) {
            trinquades.push(JSON.parse(valeur));
        }
    }

    // Trier par date (plus récent en premier)
    trinquades.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Si on demande le format JSON brut (?format=json), on le renvoie
    if (url.searchParams.get('format') === 'json') {
        return Response.json({ total: trinquades.length, trinquades });
    }

    // Sinon, une jolie page HTML récap
    const lignes = trinquades
        .map(
            (t, i) => `
        <tr>
            <td>${trinquades.length - i}</td>
            <td>${echapper(t.trinquade)}</td>
            <td>${echapper(t.player)}</td>
            <td>${new Date(t.date).toLocaleString('fr-FR')}</td>
        </tr>`
        )
        .join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Récap des trinquades 🍻</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f5f5f5; padding: 20px; }
        h1 { text-align: center; color: #333; }
        .total { text-align: center; color: #666; margin-bottom: 20px; }
        table { width: 100%; max-width: 800px; margin: 0 auto; border-collapse: collapse; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #667eea; color: white; }
        tr:hover { background: #f9f9f9; }
    </style>
</head>
<body>
    <h1>🍻 Récap des trinquades</h1>
    <p class="total">${trinquades.length} trinquade(s) au total</p>
    <table>
        <thead>
            <tr><th>#</th><th>Trinquade</th><th>Qui</th><th>Quand</th></tr>
        </thead>
        <tbody>${lignes || '<tr><td colspan="4">Aucune trinquade pour l\'instant</td></tr>'}</tbody>
    </table>
</body>
</html>`;

    return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
}

// Évite l'injection de HTML dans la page récap
function echapper(texte) {
    return String(texte)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
