document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const button = document.querySelector('button[type="submit"]');

    try {
        button.innerHTML = 'Connexion...';
        button.disabled = true;

        console.log('Email:', email);
        console.log('Mot de passe:', password);

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
                nom: data.nom,
                prenom: data.prenom,
                role: data.role
            }));
            console.log('Données stockées dans sessionStorage:', sessionStorage.getItem('userInfo'));

            switch(data.role.toLowerCase()) {
                case 'comptable':
                    window.location.href = '../../templates/comptable/index.html';
                    break;
                case 'bureau d\'ordre':
                    window.location.href = '../../templates/BO/index.html';
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