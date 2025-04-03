document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.navbar a').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = document.querySelector(anchor.getAttribute('href'));
            targetSection.scrollIntoView({ behavior: 'smooth' });
            document.querySelectorAll('.navbar a').forEach(link => {
                link.classList.remove('active');
            });
            anchor.classList.add('active');
        });
    });

    const cursorCircle = document.querySelector('.cursor-circle');
    if (cursorCircle) {
        document.addEventListener('mousemove', (e) => {
            cursorCircle.style.left = `${e.clientX}px`;
            cursorCircle.style.top = `${e.clientY}px`;
        });
    } else {
        console.error("Élément .cursor-circle introuvable dans le DOM.");
    }

    const animatedTexts = document.querySelectorAll('.animated-text');
    animatedTexts.forEach(text => {
        const textContent = text.textContent;
        text.innerHTML = '';
        textContent.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char;
            if (char === ' ') span.innerHTML = ' ';
            span.style.transitionDelay = `${index * 50}ms`;
            text.appendChild(span);
        });
    });

    const highlightSpan = document.querySelector('.highlight');
    if (highlightSpan) {
        const highlightText = highlightSpan.textContent;
        highlightSpan.innerHTML = '';
        highlightText.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char;
            span.style.transitionDelay = `${(index + 15) * 50}ms`;
            highlightSpan.appendChild(span);
        });
    }

    const toggleTheme = () => {
        document.body.classList.toggle('light-mode');
        document.body.classList.toggle('dark-mode');
        const themeBtnIcon = document.querySelector('#theme-btn i');
        if (document.body.classList.contains('light-mode')) {
            themeBtnIcon.classList.remove('fa-moon');
            themeBtnIcon.classList.add('fa-sun');
        } else {
            themeBtnIcon.classList.remove('fa-sun');
            themeBtnIcon.classList.add('fa-moon');
        }

        const githubStats = document.getElementById('github-stats');
        const githubLangs = document.getElementById('github-langs');
        const projectCards = document.querySelectorAll('.project-card img');

        if (document.body.classList.contains('light-mode')) {
            githubStats.src = 'https://github-readme-stats.vercel.app/api?username=itspydevs&show_icons=true&theme=light';
            githubLangs.src = 'https://github-readme-stats.vercel.app/api/top-langs/?username=itspydevs&layout=pie&theme=light';
            projectCards.forEach(card => {
                const src = card.src;
                card.src = src.replace('theme=dark', 'theme=light');
            });
        } else {
            githubStats.src = 'https://github-readme-stats.vercel.app/api?username=itspydevs&show_icons=true&theme=dark';
            githubLangs.src = 'https://github-readme-stats.vercel.app/api/top-langs/?username=itspydevs&layout=pie&theme=dark';
            projectCards.forEach(card => {
                const src = card.src;
                card.src = src.replace('theme=light', 'theme=dark');
            });
        }
    };

    document.body.classList.add('dark-mode');

    const themeBtn = document.querySelector('#theme-btn');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }

    const username = 'ItsPyDevs';
    const projectList = document.getElementById('project-list');

    if (projectList) {
        fetch(`https://api.github.com/users/${username}/repos`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erreur HTTP ! Statut : ${response.status}`);
                }
                return response.json();
            })
            .then(repos => {
                if (repos.length === 0) {
                    projectList.innerHTML = '<p>Aucun projet trouvé sur GitHub.</p>';
                    return;
                }

                repos.forEach(repo => {
                    const projectCard = document.createElement('div');
                    projectCard.classList.add('project-card');
                    projectCard.setAttribute('data-aos', 'fade-up');
                    const theme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
                    projectCard.innerHTML = `
                        <a href="${repo.html_url}" target="_blank">
                            <img src="https://github-readme-stats.vercel.app/api/pin/?username=${username}&repo=${repo.name}&theme=${theme}" alt="${repo.name}">
                        </a>
                    `;
                    projectList.appendChild(projectCard);
                });
            })
            .catch(error => {
                console.error('Erreur lors de la récupération des dépôts GitHub:', error);
                projectList.innerHTML = '<p>Erreur lors du chargement des projets.</p>';
            });
    }
});