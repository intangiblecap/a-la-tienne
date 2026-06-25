// Cloudflare Pages Function — gère le défi en cours.
//   GET  /api/defi        -> renvoie le défi actuel
//   POST /api/defi {defi} -> change le défi (partagé entre les 2 joueurs)
//
// Le défi est stocké dans KV sous la clé "defi". Si rien n'est défini,
// on renvoie le défi par défaut ci-dessous.

const DEFI_DEFAUT =
    "Tu paies le verre à l'autre et tu le finis en moins de 20 secondes, " +
    "sinon tu paies le prochain.\n\n" +
    "Et si on oublie de trinquer 3 fois d'affilée : une bouteille d'1L de " +
    "vodka Sobieski à partager dans la soirée.";

export async function onRequestGet(context) {
    const { env } = context;
    const defi = (await env.TRINQUADES.get('defi')) || DEFI_DEFAUT;
    return Response.json({ defi });
}

export async function onRequestPost(context) {
    const { request, env } = context;

    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Requête invalide' }, { status: 400 });
    }

    const defi = (body.defi || '').trim();
    if (!defi) {
        return Response.json({ error: 'Défi vide' }, { status: 400 });
    }

    await env.TRINQUADES.put('defi', defi);
    return Response.json({ success: true, defi });
}
