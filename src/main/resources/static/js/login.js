document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const button = document.querySelector('button[type="submit"]');

    try {
        button.innerHTML = 'Connexion...';
        button.disabled = true;


        const response = await fetch('http://localhost:8082/utilisateurs/authentifier', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `email=${encodeURIComponent(email)}&motDePasse=${encodeURIComponent(password)}`
        });

        console.log('Réponse du serveur:', response);
        const data = await response.json();
        console.log('Données reçues:', data);

        if (response.ok) {
            sessionStorage.setItem('userInfo', JSON.stringify({
                id: data.id,
                nom: data.nom,
                prenom: data.prenom,
                role: data.role
            }));
            console.log('Données stockées:', sessionStorage.getItem('userInfo'));


            switch(data.role.toLowerCase()) {
                case 'comptable':
                    window.location.href = '../../templates/comptable/index.html';
                    break;
                case 'bureau d\'ordre':
                    window.location.href = '../../templates/BO/commandes.html';
                    break;
                case 'trésorerie':
                    window.location.href = '../../templates/Tresorerie/index.html';
                    break;
                default:
                    throw new Error('Rôle non reconnu');
            }
        } else {
            throw new Error(data.message || 'Erreur de connexion');
        }

    } catch (error) {
        alert('Erreur : ' + error.message);
    } finally {
        button.innerHTML = 'Se connecter';
        button.disabled = false;
    }
});


// icon de mot de passe

document.addEventListener('DOMContentLoaded', function() {
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.querySelector('#password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            // Toggle du type de l'input
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Toggle de l'icône
            const icon = this.querySelector('i');
            if (type === 'password') {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
                this.classList.remove('show');
            } else {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
                this.classList.add('show');
            }

            // Animation de l'icône
            icon.style.transform = 'scale(1.2)';
            setTimeout(() => {
                icon.style.transform = 'scale(1)';
            }, 200);
        });
    }
});