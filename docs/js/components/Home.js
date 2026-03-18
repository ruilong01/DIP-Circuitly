window.Home = function ({ topicProgress, revisionPoolCount, unfamiliarPoolCount, onStart, onStartRevision, onStartUnfamiliar }) {
    const topics = window.DataService.getTopics();
    const container = document.createElement('div');
    container.className = 'dashboard-container animate-fade-in';

    // Header Section
    const header = document.createElement('div');
    header.className = 'dashboard-header';
    header.innerHTML = `
        <h1 class="brand-title">Impulse</h1>
        <p class="brand-motto">Mastery in every pulse.</p>
    `;
    container.appendChild(header);

    // Topics Grid
    const grid = document.createElement('div');
    grid.className = 'topic-grid';

    // Render regular topics
    topics.forEach(topic => {
        const card = document.createElement('div');
        card.className = 'card-glass';

        // Header (ID Badge)
        const idBadge = document.createElement('div');
        idBadge.className = 'topic-id';
        idBadge.textContent = topic.id;
        card.appendChild(idBadge);

        // Title
        const title = document.createElement('h3');
        title.style.fontSize = '1.25rem';
        title.style.marginBottom = '8px';
        title.style.fontWeight = '700';
        title.textContent = topic.name;
        card.appendChild(title);

        // Subtitle/ID text (Optional, matching previous style)
        const sub = document.createElement('div');
        sub.style.fontSize = '0.85rem';
        sub.style.color = 'var(--text-muted)';
        sub.style.marginBottom = '16px';
        sub.textContent = `Module ${topic.id}`;
        card.appendChild(sub);

        // Progress Section — Bayesian proficiency + XP level
        const profile = window.ProfileService.getActiveProfile();
        const globalStats = profile ? profile.stats : null;
        const topicStats = (globalStats && globalStats[topic.id]) ? globalStats[topic.id] : { correctCount: 0, totalAttempts: 0, xp: 0 };
        const stats = (topicProgress && topicProgress[topic.id]) ? topicProgress[topic.id] : { xp: topicStats.xp || 0 };

        // Bayesian-smoothed proficiency (from teammate's version — more meaningful at low attempts)
        const k = 5;
        const attempts = topicStats.totalAttempts || 0;
        const correct = topicStats.correctCount || 0;
        let proficiency = 0;
        if (attempts > 0) {
            const safeAttempts = Math.max(attempts, correct);
            proficiency = Math.min(100, Math.round(((correct + k) / (safeAttempts + 2 * k)) * 100));
        }

        // XP level (kept from existing version)
        const level = Math.floor(stats.xp / 100) + 1;
        const currentLevelXP = stats.xp % 100;

        const progressInfo = document.createElement('div');
        progressInfo.style.display = 'flex';
        progressInfo.style.justifyContent = 'space-between';
        progressInfo.style.fontSize = '0.8rem';
        progressInfo.style.marginBottom = '6px';
        progressInfo.style.color = '#cbd5e1';
        progressInfo.innerHTML = `
            <span>Lvl ${level} &bull; Proficiency</span>
            <span style="color:var(--accent)">${proficiency}%</span>
        `;
        card.appendChild(progressInfo);

        const rail = document.createElement('div');
        rail.className = 'progress-rail';
        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        fill.style.width = `${proficiency}%`;
        rail.appendChild(fill);
        card.appendChild(rail);


        // Action Button
        const btn = document.createElement('button');
        btn.className = 'btn-glass-action';
        btn.textContent = 'Play Now';
        btn.onclick = (e) => {
            e.stopPropagation();
            onStart(topic.id);
        };
        card.appendChild(btn);

        card.onclick = () => onStart(topic.id);
        grid.appendChild(card);
    });

    // Revision Module Card (Matching Style)
    if (revisionPoolCount > 0) {
        const card = document.createElement('div');
        card.className = 'card-glass';
        card.style.borderColor = 'var(--accent)';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';

        const title = document.createElement('h3');
        title.style.fontSize = '1.25rem';
        title.style.marginBottom = '8px';
        title.style.fontWeight = '700';
        title.textContent = 'Revision Module';
        card.appendChild(title);

        const sub = document.createElement('div');
        sub.style.fontSize = '0.85rem';
        sub.style.color = 'var(--text-muted)';
        sub.style.marginBottom = '16px';
        sub.textContent = `${revisionPoolCount} Questions Pending`;
        card.appendChild(sub);

        const spacer = document.createElement('div');
        spacer.style.flexGrow = '1';
        card.appendChild(spacer);

        // Action Button
        const btn = document.createElement('button');
        btn.className = 'btn-glass-action';
        btn.style.background = 'linear-gradient(45deg, var(--accent), var(--primary))';
        btn.textContent = 'Practice';
        btn.onclick = (e) => {
            e.stopPropagation();
            onStartRevision();
        };
        card.appendChild(btn);

        card.onclick = () => onStartRevision();
        grid.insertBefore(card, grid.firstChild);
    }

    // Unfamiliar Concepts Card
    if (unfamiliarPoolCount > 0) {
        const card = document.createElement('div');
        card.className = 'card-glass';
        card.style.borderColor = 'var(--warning, #f59e0b)';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';

        const title = document.createElement('h3');
        title.style.fontSize = '1.25rem';
        title.style.marginBottom = '8px';
        title.style.fontWeight = '700';
        title.textContent = 'Unfamiliar Concepts';
        card.appendChild(title);

        const sub = document.createElement('div');
        sub.style.fontSize = '0.85rem';
        sub.style.color = 'var(--text-muted)';
        sub.style.marginBottom = '16px';
        sub.textContent = `${unfamiliarPoolCount} Concepts to Review`;
        card.appendChild(sub);

        const spacer = document.createElement('div');
        spacer.style.flexGrow = '1';
        card.appendChild(spacer);

        // Action Button
        const btn = document.createElement('button');
        btn.className = 'btn-glass-action';
        btn.style.background = 'linear-gradient(45deg, var(--warning, #f59e0b), var(--error))';
        btn.textContent = 'Review';
        btn.onclick = (e) => {
            e.stopPropagation();
            onStartUnfamiliar();
        };
        card.appendChild(btn);

        card.onclick = () => onStartUnfamiliar();
        grid.insertBefore(card, grid.firstChild);
    }

    container.appendChild(grid);

    // Footer Section
    const footer = document.createElement('div');
    footer.className = 'dashboard-header'; // Re-using style for footer padding/center
    footer.style.padding = '40px 0';
    footer.style.marginTop = '40px';
    footer.style.borderTop = '1px solid var(--surface-border)';

    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.accept = '.csv';
    importInput.style.display = 'none';
    importInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = window.DataService.importCSV(event.target.result);
            if (result.success) {
                alert(`Success! Loaded ${result.count} questions.`);
                location.reload();
            } else {
                alert(`Error: ${result.error}`);
            }
        };
        reader.readAsText(file);
    };

    const importBtn = document.createElement('button');
    importBtn.className = 'btn btn-secondary';
    importBtn.style.fontSize = '0.85rem';
    importBtn.style.padding = '8px 16px';
    importBtn.style.marginRight = '8px';
    importBtn.textContent = 'Import CSV';
    importBtn.onclick = () => importInput.click();

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-secondary';
    resetBtn.style.fontSize = '0.85rem';
    resetBtn.style.padding = '8px 16px';
    resetBtn.textContent = 'Reset Data';
    resetBtn.onclick = () => {
        if (confirm('Reset all progress and questions?')) {
            window.DataService.resetToDefault();
            location.reload();
        }
    };

    footer.appendChild(importInput);
    footer.appendChild(importBtn);
    footer.appendChild(resetBtn);
    container.appendChild(footer);

    return container;
};
