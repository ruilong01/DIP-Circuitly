window.AdminDashboard = function ({ onLogout }) {
    const container = document.createElement('div');
    container.className = 'animate-fade-in';
    container.style.padding = '20px';
    container.style.maxWidth = '1000px';
    container.style.margin = '0 auto';
    container.style.paddingTop = '80px'; 

    const title = document.createElement('h2');
    title.textContent = "Admin Dashboard - User Progress";
    title.style.marginBottom = '20px';
    container.appendChild(title);

    const renderTable = async () => {
        const profiles = await window.ProfileService.getAllProfiles();
        
        const tableContainer = document.createElement('div');
        tableContainer.style.overflowX = 'auto';
        tableContainer.style.background = '#1f2937';
        tableContainer.style.borderRadius = '12px';
        tableContainer.style.padding = '20px';

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.color = '#e5e7eb';

        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr style="border-bottom: 2px solid #374151; text-align: left;">
                <th style="padding: 12px;">Name</th>
                <th style="padding: 12px;">Student ID</th>
                <th style="padding: 12px;">Group</th>
                <th style="padding: 12px;">Total XP</th>
                <th style="padding: 12px;">Time Spent</th>
                <th style="padding: 12px;">Last Active</th>
                <th style="padding: 12px;">Actions</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        if (profiles.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="padding:20px; text-align:center; color:#9ca3af;">No users found.</td></tr>`;
        } else {
        profiles.forEach(p => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #374151';

            // Format Date
            let dateStr = 'Never';
            if (p.lastActive) {
                dateStr = new Date(p.lastActive).toLocaleDateString();
            } else if (p.createdAt) {
                dateStr = new Date(p.createdAt).toLocaleDateString();
            }

            // Calculate total time
            const totalTimeSec = Object.values(p.topicProgress || {}).reduce((acc, curr) => acc + (curr.time || 0), 0);
            const totalTimeMin = Math.round(totalTimeSec / 60);

            tr.innerHTML = `
                <td style="padding: 12px; font-weight:bold;">${p.name}</td>
                <td style="padding: 12px;">${p.studentId}</td>
                <td style="padding: 12px;">${p.classGroup || '-'}</td>
                <td style="padding: 12px; color:var(--primary); font-family:monospace;">${p.xp}</td>
                <td style="padding: 12px;">${totalTimeMin}m</td>
                <td style="padding: 12px; font-size:0.9rem; color:#9ca3af;">${dateStr}</td>
                <td style="padding: 12px;"></td>
            `;

            // Action Cell
            const actionTd = tr.querySelector('td:last-child');

            const viewBtn = document.createElement('button');
            viewBtn.textContent = 'View Stats';
            viewBtn.className = 'btn btn-secondary';
            viewBtn.style.padding = '4px 8px';
            viewBtn.style.fontSize = '0.8rem';
            viewBtn.onclick = () => {
                if (window.StatsChart) {
                    window.StatsChart({ stats: p.stats });
                } else {
                    alert("Stats module missing");
                }
            };
            actionTd.appendChild(viewBtn);

            tbody.appendChild(tr);
        });
    }

        table.appendChild(tbody);
        tableContainer.appendChild(table);
        container.appendChild(tableContainer);
    };

    renderTable();
    return container;
};
