window.Leaderboard = function () {
    const players = window.ProfileService.getLeaderboard();

    const container = document.createElement('div');
    container.className = 'leaderboard-container card-glass animate-fade-in';
    container.style.marginTop = '40px';
    container.style.padding = '32px';
    container.style.background = 'rgba(15, 23, 42, 0.4)';

    const title = document.createElement('div');
    title.style.display = 'flex';
    title.style.justifyContent = 'space-between';
    title.style.alignItems = 'center';
    title.style.marginBottom = '40px';

    const titleText = document.createElement('h2');
    titleText.className = 'text-gradient';
    titleText.textContent = 'Weekly Champions';
    titleText.style.fontSize = '2rem';
    titleText.style.fontWeight = '800';
    title.appendChild(titleText);

    const period = document.createElement('span');
    period.style.fontSize = '0.85rem';
    period.style.color = 'var(--text-muted)';
    period.style.background = 'rgba(255,255,255,0.05)';
    period.style.padding = '6px 16px';
    period.style.borderRadius = '50px';
    period.style.border = '1px solid var(--surface-border)';
    period.textContent = 'This Week';
    title.appendChild(period);

    container.appendChild(title);

    if (players.length === 0) {
        const empty = document.createElement('p');
        empty.textContent = 'Competing starts soon! Be the first on the podium.';
        empty.style.textAlign = 'center';
        empty.style.color = 'var(--text-muted)';
        empty.style.padding = '40px';
        container.appendChild(empty);
        return container;
    }

    // --- PODIUM SECTION (Top 3) ---
    const podiumRow = document.createElement('div');
    podiumRow.style.display = 'flex';
    podiumRow.style.alignItems = 'flex-end';
    podiumRow.style.justifyContent = 'center';
    podiumRow.style.gap = '15px';
    podiumRow.style.marginBottom = '50px';
    podiumRow.style.padding = '0 10px';

    // Order: 2nd, 1st, 3rd
    const podiumPositions = [1, 0, 2]; // index into players array

    podiumPositions.forEach(idx => {
        const player = players[idx];
        if (!player) return;

        const rank = idx + 1;
        const podiumCol = document.createElement('div');
        podiumCol.style.display = 'flex';
        podiumCol.style.flexDirection = 'column';
        podiumCol.style.alignItems = 'center';
        podiumCol.style.width = '100px';
        podiumCol.style.flex = '1';
        podiumCol.style.maxWidth = '150px';

        // Avatar/Icon
        const avatar = document.createElement('div');
        avatar.style.width = rank === 1 ? '80px' : '60px';
        avatar.style.height = rank === 1 ? '80px' : '60px';
        avatar.style.borderRadius = '50%';
        avatar.style.marginBottom = '12px';
        avatar.style.display = 'flex';
        avatar.style.alignItems = 'center';
        avatar.style.justifyContent = 'center';
        avatar.style.fontSize = rank === 1 ? '2.5rem' : '1.8rem';
        avatar.style.background = 'var(--surface)';
        avatar.style.border = '3px solid';
        avatar.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';

        if (rank === 1) {
            avatar.innerHTML = '👑';
            avatar.style.borderColor = '#fbbf24'; // Gold
            avatar.style.boxShadow = '0 0 25px rgba(251, 191, 36, 0.4)';
        } else if (rank === 2) {
            avatar.innerHTML = '🥈';
            avatar.style.borderColor = '#94a3b8'; // Silver
        } else {
            avatar.innerHTML = '🥉';
            avatar.style.borderColor = '#b45309'; // Bronze
        }
        podiumCol.appendChild(avatar);

        // Name
        const name = document.createElement('div');
        name.textContent = player.name;
        name.style.fontWeight = '700';
        name.style.fontSize = rank === 1 ? '1.1rem' : '0.9rem';
        name.style.marginBottom = '4px';
        name.style.textAlign = 'center';
        name.style.whiteSpace = 'nowrap';
        name.style.overflow = 'hidden';
        name.style.textOverflow = 'ellipsis';
        name.style.width = '100%';
        podiumCol.appendChild(name);

        // Score
        const score = document.createElement('div');
        score.innerHTML = `<span style="color:var(--warning)">⚡</span> ${player.weeklyXP}`;
        score.style.fontSize = '0.85rem';
        score.style.fontWeight = '800';
        score.style.marginBottom = '15px';
        podiumCol.appendChild(score);

        // Podium Block
        const block = document.createElement('div');
        block.style.width = '100%';
        block.style.borderRadius = '12px 12px 0 0';
        block.style.display = 'flex';
        block.style.alignItems = 'center';
        block.style.justifyContent = 'center';
        block.style.color = 'rgba(255,255,255,0.9)';
        block.style.fontSize = '1.5rem';
        block.style.fontWeight = '900';
        block.style.transition = 'height 0.8s cubic-bezier(0.16, 1, 0.3, 1)';

        let height = '0px';
        if (rank === 1) {
            height = '140px';
            block.style.background = 'linear-gradient(to bottom, #fbbf24, #d97706)';
            block.style.boxShadow = '0 15px 35px rgba(217, 119, 6, 0.2)';
            block.textContent = '1';
        } else if (rank === 2) {
            height = '100px';
            block.style.background = 'linear-gradient(to bottom, #94a3b8, #475569)';
            block.textContent = '2';
        } else {
            height = '70px';
            block.style.background = 'linear-gradient(to bottom, #b45309, #78350f)';
            block.textContent = '3';
        }

        podiumCol.appendChild(block);
        podiumRow.appendChild(podiumCol);

        // Trigger height animation
        setTimeout(() => {
            block.style.height = height;
        }, 100);
    });

    container.appendChild(podiumRow);

    // --- LIST SECTION (4th+) ---
    if (players.length > 3) {
        const listContainer = document.createElement('div');
        listContainer.style.display = 'flex';
        listContainer.style.flexDirection = 'column';
        listContainer.style.gap = '10px';
        listContainer.style.borderTop = '1px solid var(--surface-border)';
        listContainer.style.paddingTop = '24px';

        players.slice(3).forEach((player, index) => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.padding = '12px 20px';
            row.style.background = 'rgba(255, 255, 255, 0.03)';
            row.style.borderRadius = '14px';
            row.style.border = '1px solid rgba(255, 255, 255, 0.05)';

            const rank = document.createElement('div');
            rank.textContent = index + 4;
            rank.style.width = '30px';
            rank.style.fontWeight = '800';
            rank.style.color = 'var(--text-muted)';
            row.appendChild(rank);

            const name = document.createElement('div');
            name.textContent = player.name;
            name.style.flex = '1';
            name.style.fontWeight = '600';
            name.style.marginLeft = '10px';
            row.appendChild(name);

            const xp = document.createElement('div');
            xp.innerHTML = `<span style="color:var(--warning)">⚡</span> ${player.weeklyXP}`;
            xp.style.fontWeight = '800';
            row.appendChild(xp);

            listContainer.appendChild(row);
        });

        container.appendChild(listContainer);
    }

    return container;
};
