// Récupérer les éléments HTML
const form = document.getElementById('trinqueForm');
const playerSelect = document.getElementById('player');
const trinquadeInput = document.getElementById('trinquade');
const responseDiv = document.getElementById('response');
const responseContent = document.getElementById('responseContent');
const photoDisplay = document.getElementById('photoDisplay');

function loadPhoto() {
    photoDisplay.classList.add('loading');
    // picsum.photos: photos aléatoires fiables, seed différent à chaque appel
    const seed = Math.floor(Math.random() * 1000);
    const url = `https://picsum.photos/seed/${seed}/800/1000`;
    const img = new Image();
    img.onload = () => {
        photoDisplay.src = url;
        photoDisplay.classList.remove('loading');
    };
    img.onerror = () => {
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
