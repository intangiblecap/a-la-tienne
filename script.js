// Récupérer les éléments HTML
const form = document.getElementById('trinqueForm');
const playerSelect = document.getElementById('player');
const trinquadeInput = document.getElementById('trinquade');
const responseDiv = document.getElementById('response');
const responseContent = document.getElementById('responseContent');

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
    responseContent.textContent = '🔄 Vérification en cours...';

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
            responseContent.innerHTML = `
                <div style="font-size: 2em; margin-bottom: 10px;">🎉</div>
                <strong>Bravo!</strong><br>
                Vous êtes libre jusqu'à la prochaine trinquade!<br>
                <small style="opacity: 0.8;">"${trinquade}" a été enregistrée ✓</small>
            `;
        } else {
            // On a déjà trinqué à ça...
            responseDiv.classList.add('warning');
            responseContent.innerHTML = `
                <div style="font-size: 2em; margin-bottom: 10px;">⚠️</div>
                <strong>Oh non!</strong><br>
                Vous avez déjà trinqué à "${trinquade}"!<br>
                <small style="opacity: 0.8;">Les défis arrivent bientôt...</small>
            `;
        }

        // Réinitialiser le formulaire
        form.reset();
    } catch (error) {
        console.error('Erreur:', error);
        responseDiv.classList.add('warning');
        responseContent.textContent = 'Erreur de connexion. Essaie plus tard.';
    }
});
