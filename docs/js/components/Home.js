window.Home = function ({ topicProgress, revisionPoolCount, unfamiliarPoolCount, onStart, onStartRevision, onStartUnfamiliar, onDiscussion }) {
    const topics = window.DataService.getTopics();
    const container = document.createElement('div');
    container.className = 'dashboard-container animate-fade-in';

    // Header Section
    const header = document.createElement('div');
    header.className = 'dashboard-header';
    header.innerHTML = `
        <h1 class="brand-title" style="display:inline-block; margin-right: 15px;">Impulse</h1>
        <button id="info-guide-btn" style="background:transparent; border:none; font-size:1.5rem; cursor:pointer; color:var(--accent); vertical-align: text-bottom; transition: transform 0.2s;" title="How it Works">ℹ️</button>
        <button id="discussion-btn" style="background:transparent; border:none; font-size:1.5rem; cursor:pointer; vertical-align: text-bottom; transition: transform 0.2s; margin-left: 8px;" title="Discussion Panel">💬</button>
        <p class="brand-motto">Mastery in every pulse.</p>
    `;

    const infoBtn = header.querySelector('#info-guide-btn');
    if (infoBtn) {
        infoBtn.onmouseenter = () => infoBtn.style.transform = 'scale(1.1)';
        infoBtn.onmouseleave = () => infoBtn.style.transform = 'scale(1)';
        infoBtn.onclick = () => {
            const modal = document.createElement('div');
            modal.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.85); z-index:1000; display:flex; justify-content:center; align-items:center; padding:20px;';
            const card = document.createElement('div');
            card.className = 'card-glass animate-pop';
            card.style.cssText = 'max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto; padding: 30px; position: relative; text-align: left;';
            card.innerHTML = `
                <button id="close-guide-btn" style="position:absolute; top:20px; right:20px; background:transparent; border:none; color:#9ca3af; font-size:1.5rem; cursor:pointer; line-height:1;">×</button>
                <h2 style="color:var(--accent); margin-bottom:20px; font-size:1.8rem; margin-top:0;">How Impulse Works</h2>
                <div style="color:var(--text-main); font-size:0.95rem; line-height:1.6; display:flex; flex-direction:column; gap:16px;">
                    <div><strong>⚡ XP & Levels:</strong> Earn XP by answering questions correctly. Accumulate 100 XP in a module to level up and unlock harder questions via adaptive difficulty.</div>
                    <div><strong>📊 EMA (Proficiency Score):</strong> Your module score is based on an Exponential Moving Average. This means recent attempts carry more weight. If you improve, your score adapts quickly and forgives past mistakes!</div>
                    <div><strong>🏆 Weekly Champions:</strong> The podium highlights the top players based ONLY on XP earned in the last 7 days. Climb the ranks every week!</div>
                    <div><strong>🔄 Revision Module:</strong> Whenever you answer a question incorrectly, it's saved here. Practice this pool regularly to turn your weaknesses into strengths.</div>
                    <div><strong>⚠️ Unfamiliar Concepts:</strong> If you face a theory question you have no clue about, tap 'Not Familiar'. It automatically skips the question and logs it here for you to review the explanation later.</div>
                    <div><strong>💬 Discussion Panel:</strong> Encounter a buggy question or need help? Post it in the discussion board with a screenshot!</div>
                </div>
            `;
            modal.appendChild(card);
            document.body.appendChild(modal);

            card.querySelector('#close-guide-btn').onclick = () => modal.remove();
            modal.onclick = (e) => { if(e.target === modal) modal.remove(); }
        };
    }

    const discussionBtn = header.querySelector('#discussion-btn');
    if (discussionBtn) {
        discussionBtn.onmouseenter = () => discussionBtn.style.transform = 'scale(1.1)';
        discussionBtn.onmouseleave = () => discussionBtn.style.transform = 'scale(1)';
        discussionBtn.onclick = () => {
            if (onDiscussion) onDiscussion();
        };
    }

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

        // Progress Section
        const stats = (topicProgress && topicProgress[topic.id]) ? topicProgress[topic.id] : { xp: 0 };
        const level = Math.floor(stats.xp / 100) + 1;
        const currentLevelXP = stats.xp % 100;

        const progressInfo = document.createElement('div');
        progressInfo.style.display = 'flex';
        progressInfo.style.justifyContent = 'space-between';
        progressInfo.style.fontSize = '0.8rem';
        progressInfo.style.marginBottom = '6px';
        progressInfo.style.color = '#cbd5e1';
        progressInfo.innerHTML = `
            <span>Lvl ${level}</span>
            <span style="color:var(--accent)">${currentLevelXP} / 100 XP</span>
        `;
        card.appendChild(progressInfo);

        const rail = document.createElement('div');
        rail.className = 'progress-rail';
        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        fill.style.width = `${currentLevelXP}%`;
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

    // Weekly Champions Podium Section
    const podiumSection = document.createElement('div');
    podiumSection.className = 'card-glass animate-fade-in';
    podiumSection.style.marginTop = '40px';
    podiumSection.style.padding = '32px';
    podiumSection.style.background = 'rgba(15, 23, 42, 0.4)';
    podiumSection.style.position = 'relative';

    const podiumTitle = document.createElement('div');
    podiumTitle.style.display = 'flex';
    podiumTitle.style.justifyContent = 'space-between';
    podiumTitle.style.alignItems = 'center';
    podiumTitle.style.marginBottom = '60px';

    const pTitleText = document.createElement('h2');
    pTitleText.className = 'text-gradient';
    pTitleText.textContent = 'Weekly Champions';
    pTitleText.style.fontSize = '2rem';
    pTitleText.style.fontWeight = '800';
    podiumTitle.appendChild(pTitleText);

    const periodTag = document.createElement('div');
    periodTag.textContent = 'This Week';
    periodTag.style.cssText = 'padding:6px 14px; border-radius:50px; border:1px solid var(--surface-border); background:rgba(255,255,255,0.05); color:var(--text-muted); font-size:0.8rem; font-weight:500;';
    podiumTitle.appendChild(periodTag);

    podiumSection.appendChild(podiumTitle);

    let players = [];
    if (window.ProfileService && window.ProfileService.getLeaderboard) {
        players = window.ProfileService.getLeaderboard();
    }

    const getWeeklyXP = (player) => {
        const now = Date.now();
        const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
        const relevantAttempts = (player.answer_history || []).filter(attempt => 
            new Date(attempt.timestamp).getTime() > weekAgo
        );
        let weekXP = relevantAttempts.reduce((sum, a) => sum + (a.xp || 0), 0);
        
        // Fallback for players without deep history to make podium look alive
        if (weekXP === 0 && player.xp > 0 && (!player.answer_history || player.answer_history.length === 0)) {
            weekXP = player.xp;
        }
        return weekXP;
    };

    const sortedWeekly = [...players].sort((a, b) => getWeeklyXP(b) - getWeeklyXP(a));

    const pContainer = document.createElement('div');
    pContainer.style.cssText = 'display:flex; align-items:flex-end; justify-content:center; gap:16px; height:200px; margin-top:20px;';

    const ranks = [
        { rank: 2, height: '120px', color: 'linear-gradient(180deg, #9ca3af 0%, #4b5563 100%)', shadow: '0 10px 30px -10px rgba(156,163,175,0.5)', icon: '🥈', ring: '#9ca3af' },
        { rank: 1, height: '160px', color: 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)', shadow: '0 10px 40px -10px rgba(251,191,36,0.6)', icon: '👑', ring: '#fbbf24' },
        { rank: 3, height: '100px', color: 'linear-gradient(180deg, #b45309 0%, #78350f 100%)', shadow: '0 10px 30px -10px rgba(180,83,9,0.5)', icon: '🥉', ring: '#b45309' }
    ];

    ranks.forEach((r) => {
        const player = sortedWeekly[r.rank - 1]; 

        const col = document.createElement('div');
        col.style.cssText = 'display:flex; flex-direction:column; align-items:center; width:120px;';

        if (player) {
            const avatar = document.createElement('div');
            avatar.style.cssText = `
                width: 50px; height: 50px; border-radius: 50%; 
                background: #1f2937; display:flex; align-items:center; justify-content:center;
                font-size: 1.5rem; margin-bottom: 12px;
                border: 2px solid ${r.ring};
                box-shadow: 0 0 15px ${r.ring}40;
                position: relative;
                z-index: 2;
            `;
            avatar.textContent = r.icon;

            const name = document.createElement('div');
            // Prefer leaderboard_name from the backend sync if it exists 
            name.textContent = player.leaderboard_name || player.name || 'Unknown';
            name.style.cssText = 'font-weight:700; font-size:0.9rem; margin-bottom:4px; max-width:110px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:center;';

            const score = document.createElement('div');
            score.innerHTML = `<span style="color:#fbbf24; margin-right:4px;">⚡</span>${getWeeklyXP(player)}`;
            score.style.cssText = 'font-size:0.85rem; font-weight:700; margin-bottom: 16px;';

            col.appendChild(avatar);
            col.appendChild(name);
            col.appendChild(score);
        } else {
            const placeholder = document.createElement('div');
            placeholder.style.height = '112px'; 
            col.appendChild(placeholder);
        }

        const block = document.createElement('div');
        block.style.cssText = `
            width: 100%;
            height: ${r.height};
            background: ${r.color};
            border-radius: 12px 12px 0 0;
            box-shadow: ${r.shadow};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.2rem;
            font-weight: 800;
            color: rgba(255,255,255,0.9);
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            position: relative;
            z-index: 1;
        `;
        block.textContent = r.rank;

        col.appendChild(block);
        pContainer.appendChild(col);
    });

    podiumSection.appendChild(pContainer);
    container.appendChild(podiumSection);

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

    const currentUser = window.ProfileService && window.ProfileService.getCurrentUser ? window.ProfileService.getCurrentUser() : null;
    if (currentUser && currentUser.role === 'admin') {
        footer.appendChild(importInput);
        footer.appendChild(importBtn);
        footer.appendChild(resetBtn);
        container.appendChild(footer);
    }

    return container;
};
