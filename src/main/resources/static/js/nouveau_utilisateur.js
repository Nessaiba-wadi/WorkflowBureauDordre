document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('utilisateurForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    // Récupérer le token depuis localStorage
    function getAuthToken() {
        return localStorage.getItem('authToken');
    }

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        event.stopPropagation();

        // Cacher les messages précédents
        errorMessage.classList.add('d-none');
        successMessage.classList.add('d-none');

        // Valider le formulaire
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        // Récupérer les valeurs du formulaire
        const nom = document.getElementById('nom').value;
        const prenom = document.getElementById('prenom').value;
        const email = document.getElementById('email').value;
        const telephone = document.getElementById('telephone').value;
        const motDePasse = document.getElementById('motDePasse').value;
        const roleId = document.getElementById('role').value;

        // Préparer les données pour l'API
        const userData = {
            nom: nom,
            prenom: prenom,
            email: email,
            telephone: telephone,
            motDePasse: motDePasse,
            role: {
                idRole: parseInt(roleId)
            }
        };

        // Envoyer les données à l'API
        fetch('http://localhost:8082/utilisateurs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getAuthToken() // Ajouter le token d'authentification
            },
            body: JSON.stringify(userData)
        })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(text || 'Erreur lors de la création de l\'utilisateur');
                    });
                }
                return response.json();
            })
            .then(data => {
                // Afficher le message de succès
                successMessage.textContent = 'Utilisateur créé avec succès !';
                successMessage.classList.remove('d-none');

                // Réinitialiser le formulaire
                form.reset();
                form.classList.remove('was-validated');

                // Rediriger vers la liste des utilisateurs après 2 secondes
                setTimeout(() => {
                    window.location.href = '/admin/utilisateurs';
                }, 2000);
            })
            .catch(error => {
                // Afficher le message d'erreur
                errorMessage.textContent = error.message;
                errorMessage.classList.remove('d-none');
            });
    });

    // Validation du mot de passe (au moins 8 caractères)
    const motDePasseInput = document.getElementById('motDePasse');
    motDePasseInput.addEventListener('input', function() {
        if (this.value.length < 8) {
            this.setCustomValidity('Le mot de passe doit contenir au moins 8 caractères');
        } else {
            this.setCustomValidity('');
        }
    });

    // Validation de l'email (format valide)
    const emailInput = document.getElementById('email');
    emailInput.addEventListener('input', function() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.value)) {
            this.setCustomValidity('Veuillez saisir une adresse email valide');
        } else {
            this.setCustomValidity('');
        }
    });
});