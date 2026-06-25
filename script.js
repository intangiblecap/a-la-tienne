// Récupérer les éléments HTML
const form = document.getElementById('trinqueForm');
const playerSelect = document.getElementById('player');
const trinquadeInput = document.getElementById('trinquade');
const responseDiv = document.getElementById('response');
const responseContent = document.getElementById('responseContent');
const photoDisplay = document.getElementById('photoDisplay');

// IDs Unsplash curatés: gens qui boivent, fêtent, trinquent — style vintage/candid
const PHOTO_IDS = [
    '1510812431401-41d2bd2722f3', // groupe qui trinque
    '1575037614876-c38a4d44f5b8', // coupes de champagne
    '1541614101331-1a5a3a194e92', // cheers extérieur
    '1527529482837-4698179dc6ce', // fête entre amis
    '1567696153798-5a61e8f8c9c5', // verres levés
    '1574096079513-d8259312b785', // terrasse été
    '1558618666-fcd25c85cd64', // fête vintage
    '1560840408-21f3ade17a60', // bar ambiance
    '1516997121675-4c2d1684aa3e', // amis qui rient
    '1528823872057-9c018a7a7553', // soirée joyeuse
];

function loadPhoto() {
    const id = PHOTO_IDS[Math.floor(Math.random() * PHOTO_IDS.length)];
    photoDisplay.classList.add('loading');
    const url = `https://images.unsplash.com/photo-${id}?w=800&h=1000&fit=crop&auto=format&q=80`;
    const img = new Image();
    img.onload = () => {
        photoDisplay.src = url;
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
