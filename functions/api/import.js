// Cloudflare Pages Function — GET /api/import?code=SECRET
//
// Outil one-shot : injecte la liste des trinquades historiques dans KV.
// Chaque entrée est marquée player = "migration" (auteur inconnu).
// Idempotent : relancer ne crée pas de doublons (on saute ce qui existe déjà).

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

// La liste historique (telle que fournie).
const HISTORIQUE = [
    'Capuche', 'Leo', 'Bonnetier', 'Racisme anti blanc', 'Jus de chien',
    'Réussite du neurchi de 47', 'Au foie de Simon', 'M Martino', 'Macarena',
    "Mille couleurs de l'arc en ciel",
    "Robustesse des bouteilles en verre parce quand on trinque même super fort elles vont jamais s'exploser",
    'Cardinal de Richelieu', 'Puissance évocatrice du pan pan boumboum dans les fesses',
    'Jesus qui ne cesse de revenir', 'Y a bon banania', 'Dalmatiens', 'Dab',
    "L'abeille parachutiste", 'La tienne', 'Chateau de guedelon', 'Falbala',
    'Cette chanson', 'Vernis bleu', 'Ghoster', 'Minecraft',
    'Tête que tu as faite quand tu as vu mon père', 'Architecture', "L'Huile",
    'Balkany (cette grosse pute de)', 'Popotame', 'Putain de belle histoire',
    "Alal (ou la santé de alal) mega love de Alice Bonnetier coucou je t'aime",
    'Polenta', 'Chêne (le matériau)', 'Caribou',
    'Les ours qui ont failli nous tuer en Roumanie', 'Gentrification', 'La ouakbar',
    'Au oud', 'Nankin', 'Ganbei', 'Charlotte Pachet', 'La chatte',
    'Aux bateaux pirates', 'Sao polo', "Las novias (n'as drovias)", 'Mad Max',
    'New order', 'Green day', 'Beach boys', 'Sorcières',
    'Afrique occidentale française', 'Jagger / mick jagger', 'Vieux cheval', 'Abba',
    'La couille', 'Bashung', 'Gerald rive', 'Carte commerçant',
    'Simon Théophile Berthault', 'Murielle', 'Tom vischnevkkisskbfiy', 'La bite',
    'Miroirs', 'Yana kamura', 'Appel pour cris', 'A tous les plans a 3 avortés',
    'Anne Franck', 'Exs de Simon', 'Gros (pluriel)', 'Beppo levi',
    'Journée de la femme', 'Saumon', 'Bao', 'Pesto', 'Napoléon', 'Echecs',
    'Paralelepipedes', 'Inconnus', 'Nils fremiot', 'Avadacadavra', 'Iona',
    'Tous les Marie sauveur', 'Caries', 'Wakanda', 'Kaki', 'Zibor',
    'Confit de canard', 'Points de suture', 'Grosses couillasses', 'Melena',
    'Hitler', "Souris (l'animal)", 'Picpoul', 'Bouillon de cube',
    'Placement de produit', 'Petite garde', 'Sangrias (pluriel)',
    'Au ceinturon de Simon', 'Blague de toto', 'Gland de lait', 'Apoptose',
    'Le drone', 'Allocations', 'Aux couilles rasées du noir de ioio',
    'A ce merveilleux get together',
    'Tu vas vachement mouiller ce soir mais ca sera que des larmes',
    'Rex imperator im tempero suo', 'Digital management', 'Boite à meuh', 'Gwent',
    'Aux jaugeur', 'A la sienne', 'Palestine', 'Jacuzzi', 'Arts pré colombiens',
    'Quoi', 'Vendée', 'Pyramides', 'Semi de Alice', 'Ongles coupés trop court',
    'Haine universelle des États-Unis', 'Ti punch (prononcé ti peuncheu)',
    'Le compte fruitz de ta mère', 'Le nouveau mec de ta mère',
    'Politique insertion Chinoise', 'Noirmoutier', 'Prendre son temps',
    'Rentre chez toi pleure', 'La vieillesse', 'Sandwich', "L'odeur du pâté",
    'Satellites', 'Santé de Ioannis', 'Pasta box', 'Appart à Nice',
    'Anniversaire alice (25ans)', 'Crémaillère de Simon', "Nos 5 ans d'amitié",
];

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!env.SECRET || code !== env.SECRET) {
        return new Response('Accès refusé. Ajoute ?code=TON_SECRET à l\'URL.', {
            status: 401,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
    }

    let ajoutees = 0;
    let ignorees = 0;

    for (const trinquade of HISTORIQUE) {
        const cle = 'trinq:' + normaliser(trinquade);
        const existe = await env.TRINQUADES.get(cle);
        if (existe) {
            ignorees++;
            continue;
        }
        await env.TRINQUADES.put(cle, JSON.stringify({
            player: 'migration',
            trinquade: trinquade,
            date: null,
        }));
        ajoutees++;
    }

    const resume = `Import terminé.\n${ajoutees} trinquade(s) ajoutée(s).\n${ignorees} déjà présente(s) (ignorées).\nTotal dans la liste : ${HISTORIQUE.length}.`;
    return new Response(resume, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
}
