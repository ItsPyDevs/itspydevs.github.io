document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    const responseMessage = document.getElementById('responseMessage');
    const pseudoInput = document.getElementById('pseudo');
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');

    function validateFields(pseudo, email, message) {
        if (pseudo.trim() === '' || email.trim() === '' || message.trim() === '') {
            return false;
        }
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(email)) {
            return false;
        }
        return true;
    }

    function checkFields() {
        const pseudo = pseudoInput.value;
        const email = emailInput.value;
        const message = messageInput.value;

        if (validateFields(pseudo, email, message)) {
            responseMessage.textContent = 'Tous les champs sont valides.';
            responseMessage.style.color = '#00ff00';
        } else {
            responseMessage.textContent = 'Veuillez remplir correctement tous les champs. Assurez-vous que l\'adresse e-mail est valide.';
            responseMessage.style.color = '#ff0000';
        }
    }

    pseudoInput.addEventListener('input', checkFields);
    emailInput.addEventListener('input', checkFields);
    messageInput.addEventListener('input', checkFields);

    contactForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const pseudo = pseudoInput.value;
        const email = emailInput.value;
        const message = messageInput.value;

        if (!validateFields(pseudo, email, message)) {
            responseMessage.textContent = 'Veuillez remplir correctement tous les champs. Assurez-vous que l\'adresse e-mail est valide.';
            responseMessage.style.color = '#ff0000';
            return;
        }

        fetch('https://api.ipify.org?format=json')
            .then(response => response.json())
            .then(data => {
                const ip = data.ip;
                const webhookUrl = atob(atob(atob("WVVoU01HTklUVFpNZVRscllWaE9hbUl6U210TWJVNTJZbE01YUdOSGEzWmtNbFpwWVVjNWRtRXpUWFpOVkVrd1RucHJNMDFFUlhwT2VsbDNUVVJyTVUxRVVUQk9Vemd3VVRKS1dsVlZNVVpUTUdSWVRVWk9ZV05YVW01WU1IaERVMnhXZEdWdWFGWldiRkpFV1d4T1dsRXpjR3RTU0hCdVkwUlNNbUZVUm5oU1YwNURWa1pKTTFSWWFFaFZWVFZIVW5wS1dFOVdjREZqYkZKdllsaFdhMVYzUFQwPQ==")));
                const currentTime = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
                const payload = {username: 'Contact Form',avatar_url: 'https://example.com/avatar.pnhttps://cdn.discordapp.com/attachments/1248646058691661874/1277052338238001182/image.png?ex=66cbc32b&is=66ca71ab&hm=3bde6ddcc45952771ff35f7543f4409d6d6202e0dd918f79104fefb0f4783ec5&g',embeds: [{title: '📬 Nouveau message de contact',color: 0xFF5733,fields: [{ name: '👤 Pseudo', value: pseudo },{ name: '📧 Email', value: email },{ name: '💬 Message', value: message },{ name: '🌐 IP', value: ip }],
                        thumbnail: {url: ''},footer: {text: `Envoyé le ${currentTime} • itspydevs.github.io`}}]
                };
                fetch(webhookUrl, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                }).then(response => {
                    if (!response.ok) {
                        throw new Error('Erreur réseau');
                    }
                    responseMessage.textContent = 'Message envoyé avec succès !';
                    responseMessage.style.color = '#00ff00';
                    contactForm.reset();
                }).catch(error => {
                    console.error('Erreur lors de l\'envoi du message:', error);
                    responseMessage.textContent = 'Erreur lors de l\'envoi du message. Veuillez réessayer.';
                    responseMessage.style.color = '#ff0000';
                });
            })
            .catch(error => {
                console.error('Erreur lors de la récupération de l\'IP:', error);
                responseMessage.textContent = 'Erreur lors de la récupération de l\'IP. Veuillez réessayer.';
                responseMessage.style.color = '#ff0000';
            });
    });
});
