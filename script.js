// Récupérer les éléments HTML
const form = document.getElementById('trinqueForm');
const playerSelect = document.getElementById('player');
const trinquadeInput = document.getElementById('trinquade');
const responseDiv = document.getElementById('response');
const responseContent = document.getElementById('responseContent');
const photoDisplay = document.getElementById('photoDisplay');
const defiModal = document.getElementById('defiModal');
const defiInput = document.getElementById('defiInput');
const defiSave = document.getElementById('defiSave');
const defiCancel = document.getElementById('defiCancel');

// Probabilité d'obtenir le droit de changer le défi après une réussite.
// 0.15 = environ 1 fois sur 7 : rare, mais pas trop, et imprévisible.
const CHANCE_CHANGER_DEFI = 0.15;

// Le défi en cours (récupéré du serveur au chargement)
let defiActuel = '';

async function chargerDefi() {
    try {
        const r = await fetch('/api/defi');
        const data = await r.json();
        defiActuel = data.defi || '';
    } catch {
        defiActuel = '';
    }
}
chargerDefi();

// Combinaisons de tags Flickr ciblant "vieux/vieille qui boit"
const PHOTO_TAGS = [
    'oldman,beer',
    'elderly,wine',
    'grandfather,drink',
    'oldwoman,wine',
    'pensioner,pub',
    'oldman,cocktail',
    'grandmother,champagne',
    'seniors,cheers',
];

function loadPhoto() {
    photoDisplay.classList.add('loading');
    const tags = PHOTO_TAGS[Math.floor(Math.random() * PHOTO_TAGS.length)];
    const rnd = Math.floor(Math.random() * 100000);
    // LoremFlickr: vraies photos Flickr filtrées par tags. /all = doit matcher TOUS les tags.
    const url = `https://loremflickr.com/800/1000/${tags}/all?random=${rnd}`;

    const img = new Image();
    img.onload = () => {
        photoDisplay.src = url;
        photoDisplay.classList.remove('loading');
    };
    img.onerror = () => {
        // Repli: si LoremFlickr ne trouve rien, on met une photo fiable (picsum)
        const fallback = `https://picsum.photos/seed/${rnd}/800/1000`;
        photoDisplay.src = fallback;
        photoDisplay.classList.remove('loading');
    };
    img.src = url;
}

loadPhoto();

// Échappe le HTML (sécurité, évite l'injection dans la réponse)
function escapeHtml(texte) {
    return String(texte)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// --- Modal "changer le défi" ---
function ouvrirModalDefi() {
    defiInput.value = defiActuel;
    defiModal.classList.remove('hidden');
}

function fermerModalDefi() {
    defiModal.classList.add('hidden');
}

defiCancel.addEventListener('click', fermerModalDefi);

defiSave.addEventListener('click', async () => {
    const nouveau = defiInput.value.trim();
    if (!nouveau) {
        fermerModalDefi();
        return;
    }
    try {
        const r = await fetch('/api/defi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ defi: nouveau }),
        });
        const data = await r.json();
        if (data.success) {
            defiActuel = data.defi;
        }
    } catch {
        // si ça échoue, on garde l'ancien défi en local
    }
    fermerModalDefi();
});

// Convertit la valeur du menu déroulant en joli nom affichable
function formatPlayer(value) {
    const noms = {
        sisiboubou: 'Sisiboubou',
        alalboubou: 'Alalboubou',
        autre: 'un autre personnage',
    };
    return noms[value] || value || 'quelqu\'un';
}

// Met la date ISO au format français: "12 juin 2026 à 21h30"
function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const date = d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    const heure = d.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    }).replace(':', 'h');
    return `${date} à ${heure}`;
}

// Écouter la soumission du formulaire
form.addEventListener('submit', async (event) => {
    event.preventDefault(); // Empêcher le rechargement de la page

    // Récupérer les valeurs
    const player = playerSelect.value;
    const trinquade = trinquadeInput.value.trim();

    // Valider
    if (!player || !trinquade) {
        alert('Remplis tous les champs!');
        return;
    }

    // Afficher un message de chargement
    responseDiv.classList.remove('hidden', 'success', 'warning');
    responseContent.textContent = 'Vérification...';

    try {
        // Envoyer la trinquade au serveur pour vérification
        const response = await fetch('/api/trinquer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                player: player,
                trinquade: trinquade,
            }),
        });

        const result = await response.json();

        // Afficher le résultat
        if (result.success) {
            // Nouvelle trinquade!
            responseDiv.classList.add('success');
            responseContent.textContent = `"${trinquade}" a été enregistrée.`;

            // Chance rare et imprévisible de pouvoir changer le défi
            if (Math.random() < CHANCE_CHANGER_DEFI) {
                ouvrirModalDefi();
            }
        } else {
            // On a déjà trinqué à ça -> on affiche par qui, quand, et LE DÉFI
            responseDiv.classList.add('warning');
            let texte = `Vous avez déjà trinqué à "${trinquade}".`;
            if (result.player === 'migration') {
                // Trinquades importées avant la migration (auteur inconnu)
                texte += `<br><span class="detail">Trinqué avant la migration (on ne sait plus par qui).</span>`;
            } else if (result.player || result.date) {
                const qui = formatPlayer(result.player);
                const quand = formatDate(result.date);
                texte += `<br><span class="detail">Trinqué par ${qui}${quand ? ` le ${quand}` : ''}.</span>`;
            }
            // Le défi en cours
            const defiHtml = escapeHtml(defiActuel || 'Défi à venir.').replace(/\n/g, '<br>');
            texte += `<br><br><span class="defi-label">Le défi</span><br>${defiHtml}`;
            responseContent.innerHTML = texte;
        }

        // Charger une nouvelle photo
        loadPhoto();

        // Réinitialiser le formulaire
        form.reset();
    } catch (error) {
        console.error('Erreur:', error);
        responseDiv.classList.add('warning');
        responseContent.textContent = 'Erreur de connexion. Essaie plus tard.';
    }
});
