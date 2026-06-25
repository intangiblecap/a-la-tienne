// Récupérer les éléments HTML
const form = document.getElementById('trinqueForm');
const playerSelect = document.getElementById('player');
const trinquadeInput = document.getElementById('trinquade');
const responseDiv = document.getElementById('response');
const responseContent = document.getElementById('responseContent');
const photoDisplay = document.getElementById('photoDisplay');

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
        } else {
            // On a déjà trinqué à ça...
            responseDiv.classList.add('warning');
            responseContent.textContent = `Vous avez déjà trinqué à "${trinquade}". Défi à venir.`;
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
