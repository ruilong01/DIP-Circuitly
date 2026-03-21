window.AdminDashboard = function ({ onLogout }) {
    const container = document.createElement('div');
    container.className = 'animate-fade-in';
    container.style.padding = '20px';
    container.style.maxWidth = '1000px';
    container.style.margin = '0 auto';
    container.style.paddingTop = '80px'; // Space for header

    // Header Actions
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.justifyContent = 'flex-end';
    actions.style.marginBottom = '20px';
    actions.style.gap = '10px';

    async function runSystemDiagnostics() {
        let results = "⚙️ SYSTEM DIAGNOSTICS REPORT ⚙️\n\n";
        
        // 1. App Configuration
        results += "1. APP CONFIGURATION\n";
        if (window.CONFIG && typeof window.CONFIG.API_BASE_URL !== 'undefined') {
            results += `✅ OK - API Base URL: ${window.CONFIG.API_BASE_URL || '(relative path)'}\n`;
        } else {
            results += "❌ FAILED - window.CONFIG.API_BASE_URL is missing!\n";
        }

        // 2. Database Connectivity
        results += "\n2. DATABASE CONNECTIVITY\n";
        try {
            const dbRes = await fetch(`${window.CONFIG?.API_BASE_URL || ''}/api/health`);
            if (dbRes.ok) {
                results += `✅ OK - Connected successfully\n`;
            } else {
                results += `❌ FAILED - Status Code: ${dbRes.status}\n`;
            }
        } catch (e) {
            results += `❌ FAILED - Network Error: ${e.message}\n`;
        }

        // 3. Gemini AI Proxy Test
        results += "\n3. GEMINI AI API\n";
        try {
            const aiPayload = {
                contents: [{ role: "user", parts: [{ text: "Respond 'OK' if you receive this." }] }],
                generationConfig: { maxOutputTokens: 10 }
            };
            const aiRes = await fetch(`${window.CONFIG?.API_BASE_URL || ''}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payload: aiPayload })
            });
            const aiData = await aiRes.json();
            if (aiRes.ok && aiData.success) {
                results += `✅ OK - Gemini Responded Successfully.\n`;
            } else {
                results += `❌ FAILED - ${aiData.error || 'Unknown Error'}\n`;
            }
        } catch (e) {
            results += `❌ FAILED - Network/Proxy Error: ${e.message}\n`;
        }

        // 4. Data Service (Question Bank)
        results += "\n4. QUESTION BANK (DATASERVICE)\n";
        if (window.DataService && window.DataService.questions && window.DataService.questions.length > 0) {
            results += `✅ OK - ${window.DataService.questions.length} questions loaded.\n`;
        } else {
            results += "❌ FAILED - Questions not loaded or empty.\n";
        }

        // 5. Local Services
        results += "\n5. LOCAL PROFILE SERVICE\n";
        if (window.ProfileService) {
            results += `✅ OK - Local Storage Active.\n`;
        } else {
            results += "❌ FAILED - ProfileService completely missing.\n";
        }

        alert(results);
    }

    // Diagnostics Button
    const diagBtn = document.createElement('button');
    diagBtn.className = 'btn';
    diagBtn.style.background = '#3b82f6';
    diagBtn.style.color = 'white';
    diagBtn.innerHTML = '<span>🛠️</span> System Diagnostics';
    diagBtn.onclick = async () => {
        diagBtn.textContent = 'Running...';
        await runSystemDiagnostics();
        diagBtn.innerHTML = '<span>🛠️</span> System Diagnostics';
    };
    actions.appendChild(diagBtn);

    // Export All Button
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn';
    exportBtn.style.background = '#10b981';
    exportBtn.style.color = 'white';
    exportBtn.innerHTML = '<span>📊</span> Export All Data';
    exportBtn.onclick = () => {
        if (window.ProfileService) window.ProfileService.exportToExcel();
    };
    actions.appendChild(exportBtn);
    container.appendChild(actions);

    // Title
    const title = document.createElement('h2');
    title.textContent = "Admin Dashboard - User Progress";
    title.style.marginBottom = '20px';
    container.appendChild(title);

    // Table Container
    const tableContainer = document.createElement('div');
    tableContainer.style.overflowX = 'auto';
    tableContainer.style.background = '#1f2937';
    tableContainer.style.borderRadius = '12px';
    tableContainer.style.padding = '20px';

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.color = '#e5e7eb';

    // Table Header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr style="border-bottom: 2px solid #374151; text-align: left;">
            <th style="padding: 12px;">Name</th>
            <th style="padding: 12px;">Student ID</th>
            <th style="padding: 12px;">Group</th>
            <th style="padding: 12px;">Total XP</th>
            <th style="padding: 12px;">Last Active</th>
            <th style="padding: 12px;">Actions</th>
        </tr>
    `;
    table.appendChild(thead);

    // Table Body
    const tbody = document.createElement('tbody');
    const profiles = window.ProfileService ? window.ProfileService.getProfiles() : [];

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

            tr.innerHTML = `
                <td style="padding: 12px; font-weight:bold;">${p.name}</td>
                <td style="padding: 12px;">${p.studentId}</td>
                <td style="padding: 12px;">${p.classGroup || '-'}</td>
                <td style="padding: 12px; color:var(--primary); font-family:monospace;">${p.xp}</td>
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
                    window.StatsChart({ profile: p });
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

    return container;
};
