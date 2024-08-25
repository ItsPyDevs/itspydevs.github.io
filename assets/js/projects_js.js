document.addEventListener('DOMContentLoaded', () => {
    const projectsContainer = document.getElementById('projects-container');
    const githubApiUrl = `https://api.github.com/users/ItsPyDevs/repos`;

    fetch(githubApiUrl)
        .then(response => response.json())
        .then(repos => {
            repos.forEach(repo => {
                const card = document.createElement('div');
                card.classList.add('project-card');

                const repoName = document.createElement('h3');
                repoName.textContent = repo.name;
                card.appendChild(repoName);

                const repoDescription = document.createElement('p');
                repoDescription.textContent = repo.description || 'Pas de description';
                card.appendChild(repoDescription);

                const repoLink = document.createElement('a');
                repoLink.href = repo.html_url;
                repoLink.target = '_blank';
                repoLink.textContent = 'Voir le projet';
                repoLink.style.color = '#ff0000';
                card.appendChild(repoLink);

                projectsContainer.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des projets GitHub:', error);
            const errorMessage = document.createElement('p');
            errorMessage.textContent = 'Impossible de récupérer les projets GitHub.';
            errorMessage.style.color = '#ff0000';
            projectsContainer.appendChild(errorMessage);
        });
});
