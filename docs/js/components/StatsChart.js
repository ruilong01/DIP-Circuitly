window.StatsChart = function ({ profile, onClose, compareWithProfile }) {
    try {
        const stats = profile ? profile.stats : null;
        const history = profile ? (profile.answer_history || []) : [];
        const isComparison = !!compareWithProfile;

        // Default 8 topics
        const labels = [
            "Fundamentals", "Energy Storage", "Transient/Steady",
            "Op-Amps", "Laplace", "Network Func",
            "DC vs AC", "3-Phase"
        ];

        // Modal backdrop
        const modal = document.createElement('div');
        modal.style.cssText = `
            position:fixed; top:0; left:0; right:0; bottom:0;
            background:rgba(0,0,0,0.85);
            z-index:1000;
            display:flex; justify-content:center; align-items:center;
            padding:20px;
        `;
        modal.addEventListener('click', (e) => { 
            if (e.target === modal) {
                modal.remove();
                if (onClose) onClose();
            }
        });

        // Main card — landscape (wider if comparison mode)
        const card = document.createElement('div');
        card.className = 'animate-pop';
        card.style.cssText = `
            background:#1f2937;
            border-radius:16px;
            border:1px solid #374151;
            width:95%;
            max-width:${isComparison ? '1200px' : '860px'};
            max-height:90vh;
            display:flex;
            flex-direction:column;
            overflow:hidden;
        `;

        // ── Header ────────────────────────────────────────────────
        const header = document.createElement('div');
        header.style.cssText = `
            display:flex; justify-content:space-between; align-items:center;
            padding:16px 20px;
            border-bottom:1px solid #374151;
            flex-shrink:0;
        `;

        // Totals for header pills
        let totalXP = profile ? (profile.xp || 0) : 0, totalSeconds = 0;
        if (stats) {
            Object.values(stats).forEach(s => {
                totalSeconds += (s.time || 0);
            });
        }
        const totalMins = Math.floor(totalSeconds / 60);
        const totalSecs = Math.floor(totalSeconds % 60);

        // Comparison info
        const comparisonText = isComparison ? ` vs ${compareWithProfile.name}` : '';
        const playerTitle = profile ? profile.name : 'Player';

        header.innerHTML = `
            <div style="display:flex; align-items:center; gap:16px;">
                <h3 style="margin:0; font-size:1.1rem; color:#e5e7eb;"><strong>${playerTitle}</strong>${comparisonText}</h3>
                <span style="font-size:0.8rem; background:rgba(59,130,246,0.15); color:#60a5fa; border:1px solid rgba(59,130,246,0.3); border-radius:20px; padding:3px 10px;">
                    ⚡ ${totalXP} XP
                </span>
                <span style="font-size:0.8rem; background:rgba(16,185,129,0.15); color:#34d399; border:1px solid rgba(16,185,129,0.3); border-radius:20px; padding:3px 10px;">
                    ⏱ ${totalMins}m ${totalSecs}s
                </span>
            </div>
            <button id="stats-close-btn" style="background:transparent; border:none; color:#9ca3af; font-size:1.5rem; cursor:pointer; line-height:1;">×</button>
        `;
        card.appendChild(header);
        setTimeout(() => {
            const cb = document.getElementById('stats-close-btn');
            if (cb) cb.onclick = () => {
                modal.remove();
                if (onClose) onClose();
            };
        }, 0);

        // ── Body row (radar | stats) or (overlaid comparison radar) ───────────────────────────────
        const body = document.createElement('div');
        
        if (isComparison && compareWithProfile) {
            // Comparison mode: full-width single radar with overlaid data
            body.style.cssText = `
                display:flex;
                flex-direction:column;
                flex:1;
                overflow:hidden;
                align-items:center;
                justify-content:center;
                padding:40px 20px;
                min-height:0;
            `;

            const canvasWrap = document.createElement('div');
            canvasWrap.style.cssText = 'position:relative; width:100%; max-width:560px; height:min(56vw, 500px);';
            const canvas = document.createElement('canvas');
            canvasWrap.appendChild(canvas);
            body.appendChild(canvasWrap);

            // Legend showing both players
            const legend = document.createElement('div');
            legend.style.cssText = `
                display:flex;
                gap:30px;
                margin-top:30px;
                justify-content:center;
                font-size:0.9rem;
            `;
            legend.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="width:16px; height:16px; background:rgb(59, 130, 246); border-radius:3px;"></span>
                    <span style="color:#e5e7eb;">${profile.name}</span>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="width:16px; height:16px; background:rgb(167, 139, 250); border-radius:3px;"></span>
                    <span style="color:#e5e7eb;">${compareWithProfile.name}</span>
                </div>
            `;
            body.appendChild(legend);

            card.appendChild(body);

            // Render combined overlay radar
            const dataPoints = [1,2,3,4,5,6,7,8].map(id => stats && stats[id] ? (stats[id].score || 0) * 100 : 0);
            const compareStats = compareWithProfile.stats || {};
            const compareDataPoints = [1,2,3,4,5,6,7,8].map(id => compareStats && compareStats[id] ? (compareStats[id].score || 0) * 100 : 0);

            if (window.Chart) {
                new Chart(canvas, {
                    type: 'radar',
                    data: {
                        labels,
                        datasets: [
                            {
                                label: profile.name,
                                data: dataPoints,
                                fill: true,
                                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                                borderColor: 'rgba(59, 130, 246, 0.35)',
                                borderDash: [5, 4],
                                pointRadius: 0,
                                pointHoverRadius: 0,
                                borderWidth: 2
                            },
                            {
                                label: compareWithProfile.name,
                                data: compareDataPoints,
                                fill: true,
                                backgroundColor: 'rgba(167, 139, 250, 0.25)',
                                borderColor: 'rgb(167, 139, 250)',
                                pointRadius: 0,
                                pointHoverRadius: 0,
                                borderWidth: 3
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: '#374151' }, angleLines: { color: '#374151' } } },
                        plugins: { legend: { display: false } }
                    }
                });
            }
        } else {
            // Normal mode: radar on left, stats on right
            body.style.cssText = `
                display:flex;
                flex:1;
                overflow:hidden;
                min-height:0;
            `;

            // Left: Radar chart
            const leftCol = document.createElement('div');
            leftCol.style.cssText = `
                flex:0 0 clamp(220px, 35%, 380px);
                display:flex;
                flex-direction:column;
                align-items:center;
                justify-content:center;
                padding:16px;
                border-right:1px solid #374151;
            `;

            const canvasWrap = document.createElement('div');
            canvasWrap.style.cssText = 'position:relative; width:100%; height:clamp(200px, 40vw, 480px);';
            const canvas = document.createElement('canvas');
            canvasWrap.appendChild(canvas);
            leftCol.appendChild(canvasWrap);

            // Add player label
            const label = document.createElement('div');
            label.style.cssText = 'font-size:0.85rem; color:#9ca3af; margin-top:8px; text-align:center;';
            label.textContent = profile.name;
            leftCol.appendChild(label);

            body.appendChild(leftCol);

            // Right: Normal stats breakdown and history
            const rightCol = document.createElement('div');
            rightCol.style.cssText = `
                flex:1;
                display:flex;
                flex-direction:column;
                overflow-y:auto;
                padding:20px;
                gap:20px;
            `;
            body.appendChild(rightCol);
            card.appendChild(body);

            // Render main radar chart
            const dataPoints = [1,2,3,4,5,6,7,8].map(id => stats && stats[id] ? (stats[id].score || 0) * 100 : 0);

            if (window.Chart) {
                new Chart(canvas, {
                    type: 'radar',
                    data: {
                        labels,
                        datasets: [{
                            label: 'Proficiency (%)',
                            data: dataPoints,
                            fill: true,
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            borderColor: 'rgb(59, 130, 246)',
                            pointRadius: 0,
                            pointHoverRadius: 0,
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            r: {
                                angleLines: { color: '#374151' },
                                grid: { color: '#374151' },
                                pointLabels: { color: '#e5e7eb', font: { size: 10 } },
                                ticks: { display: false, backdropColor: 'transparent' },
                                suggestedMin: 0,
                                suggestedMax: 100
                            }
                        },
                        plugins: { legend: { display: false } }
                    }
                });
            } else {
                canvasWrap.innerHTML = '<p style="text-align:center; color:red;">Chart.js not loaded.</p>';
            }

            // ── Topic Breakdown and Recent Attempts (only in non-comparison mode)
            const breakdownWrap = document.createElement('div');
            breakdownWrap.innerHTML = `<h4 style="margin:0 0 10px; color:#e5e7eb; font-size:0.95rem;">Topic Breakdown</h4>`;

            let anyData = false;
            labels.forEach((label, idx) => {
                const topicId = idx + 1;
                const s = stats && stats[topicId] ? stats[topicId] : null;
                if (!s || (s.total === 0 && s.time === 0)) return;
                anyData = true;

                const t = Math.floor(s.time || 0);
                const m = Math.floor(t / 60);
                const sc = t % 60;
                const scorePercent = Math.round((s.score || 0) * 100);
                const barColor = scorePercent >= 70 ? '#10b981' : scorePercent >= 40 ? '#f59e0b' : '#ef4444';

                // Per-question mastery
                const mastery = window.ProfileService
                    ? window.ProfileService.getTopicMastery(profile, topicId)
                    : { mastered: 0, attempted: 0 };
                const masteryColor = mastery.attempted === 0 ? '#6b7280'
                    : mastery.mastered === mastery.attempted ? '#10b981'
                    : '#f59e0b';

                const row = document.createElement('div');
                row.style.cssText = 'margin-bottom:12px;';
                row.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:baseline; font-size:0.82rem; color:#d1d5db; margin-bottom:4px;">
                        <span style="font-weight:500;">${label}</span>
                        <span style="color:#9ca3af; font-size:0.73rem;">${m}m ${sc}s</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span style="font-size:0.75rem; color:${masteryColor};">
                            ⭐ ${mastery.mastered} mastered / ${mastery.attempted} seen
                        </span>
                        <span style="font-size:0.73rem; font-weight:bold; color:${barColor};">${scorePercent}% EMA</span>
                    </div>
                    <div style="height:5px; background:#374151; border-radius:3px; overflow:hidden;">
                        <div style="height:100%; width:${scorePercent}%; background:${barColor}; border-radius:3px; transition:width 0.5s;"></div>
                    </div>
                `;
                breakdownWrap.appendChild(row);
            });

            if (!anyData) {
                breakdownWrap.innerHTML += `<div style="color:#6b7280; font-size:0.82rem; text-align:center; padding:16px 0;">No activity recorded yet.</div>`;
            }
            rightCol.appendChild(breakdownWrap);

            // ── Recent Attempts
            const historyWrap = document.createElement('div');
            historyWrap.innerHTML = `
                <h4 style="margin:0 0 10px; color:#e5e7eb; font-size:0.95rem; padding-top:12px; border-top:1px solid #374151;">Recent Attempts</h4>
            `;

            if (history.length === 0) {
                historyWrap.innerHTML += `<div style="color:#6b7280; font-size:0.82rem; text-align:center; padding:12px 0;">No attempts recorded yet.</div>`;
            } else {
                const recent = [...history].reverse().slice(0, 10);
                recent.forEach(attempt => {
                    const label = attempt.topicId === 'revision' ? 'Revision' : labels[attempt.topicId - 1] || 'Unknown';
                    const t = Math.floor(attempt.time || 0);
                    const m = Math.floor(t / 60);
                    const sc = t % 60;
                    const timeStr = t > 0 ? `${m}m ${sc}s` : 'N/A';
                    let timeAgo = '';
                    if (attempt.timestamp) {
                        const diff = Math.floor((Date.now() - new Date(attempt.timestamp).getTime()) / 60000);
                        if (diff < 60) timeAgo = `${diff}m ago`;
                        else if (diff < 1440) timeAgo = `${Math.floor(diff/60)}h ago`;
                        else timeAgo = `${Math.floor(diff/1440)}d ago`;
                    }
                    const row = document.createElement('div');
                    row.style.cssText = `
                        display:flex; justify-content:space-between;
                        background:rgba(255,255,255,0.03);
                        border:1px solid #374151;
                        border-radius:8px; padding:8px 12px;
                        font-size:0.82rem; color:#d1d5db;
                        margin-bottom:6px;
                    `;
                    row.innerHTML = `
                        <div>
                            <div><strong>${label}</strong> <span style="font-size:0.7rem; color:#6b7280;">${timeAgo}</span></div>
                            <div style="color:#9ca3af; font-size:0.73rem;">${attempt.correct}/${attempt.total} correct</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="color:#10b981;">${timeStr}</div>
                            <div style="color:#60a5fa; font-weight:bold;">+${attempt.xp} XP</div>
                        </div>
                    `;
                    historyWrap.appendChild(row);
                });
            }
            rightCol.appendChild(historyWrap);
        }

        // ── Footer close button
        const footer = document.createElement('div');
        footer.style.cssText = 'padding:14px 20px; border-top:1px solid #374151; flex-shrink:0; display:flex; justify-content:flex-end;';
        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn btn-primary';
        closeBtn.textContent = 'CLOSE';
        closeBtn.style.padding = '10px 28px';
        closeBtn.onclick = () => {
            modal.remove();
            if (onClose) onClose();
        };
        footer.appendChild(closeBtn);
        card.appendChild(footer);

        modal.appendChild(card);
        document.body.appendChild(modal);

        return modal;
    } catch (e) {
        console.error("Error in StatsChart:", e);
        alert("Error opening stats chart: " + e.message);
        // Return a simple error message div instead of undefined
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position:fixed; top:0; left:0; right:0; bottom:0;
            background:rgba(0,0,0,0.85);
            z-index:1000;
            display:flex; justify-content:center; align-items:center;
            color: #ef4444;
            font-size: 1.1rem;
            text-align: center;
            padding: 20px;
        `;
        errorDiv.innerHTML = `<div>Error loading profile data:<br>${e.message}</div>`;
        document.body.appendChild(errorDiv);
        return errorDiv;
    }
};
