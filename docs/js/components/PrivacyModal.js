window.PrivacyModal = function ({ onAccept }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay animate-fade-in';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    overlay.style.backdropFilter = 'blur(10px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '10000';

    const card = document.createElement('div');
    card.className = 'card-glass animate-slide-in';
    card.style.maxWidth = '500px';
    card.style.width = '90%';
    card.style.padding = '40px';
    card.style.textAlign = 'center';
    card.style.border = '1px solid var(--primary)';
    card.style.boxShadow = '0 0 30px var(--primary-glow)';

    const icon = document.createElement('div');
    icon.innerHTML = '🛡️';
    icon.style.fontSize = '3rem';
    icon.style.marginBottom = '20px';
    card.appendChild(icon);

    const title = document.createElement('h2');
    title.className = 'brand-title';
    title.textContent = 'Privacy Notice';
    title.style.fontSize = '2rem';
    title.style.marginBottom = '16px';
    card.appendChild(title);

    const message = document.createElement('p');
    message.style.color = 'var(--text-muted)';
    message.style.lineHeight = '1.6';
    message.style.marginBottom = '32px';
    message.innerHTML = `
        To proceed, please review and complete the 
        <a href="https://forms.office.com/r/3qnwPbAbQM" target="_blank" style="color: var(--primary-color); text-decoration: underline;">
            consent form
        </a>. 
        Once you have submitted your response, you may continue to the application.
    `;
    card.appendChild(message);

    const btn = document.createElement('button');
    btn.className = 'btn-glass-action';
    btn.textContent = 'Accept & Continue';
    btn.style.marginTop = '0';
    btn.style.padding = '16px 32px';
    btn.style.fontSize = '1.1rem';

    btn.onclick = () => {
        sessionStorage.setItem('privacyAccepted', 'true');
        overlay.classList.add('animate-fade-out'); // Optional transition if defined
        setTimeout(() => {
            overlay.remove();
            if (onAccept) onAccept();
        }, 300);
    };

    card.appendChild(btn);
    overlay.appendChild(card);

    return overlay;
};
