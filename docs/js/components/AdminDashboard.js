window.AdminDashboard = function ({ onViewAsUser }) {
    const container = document.createElement('div');
    container.className = 'animate-fade-in';
    container.style.cssText = 'padding:20px; max-width:1100px; margin:0 auto; padding-top:80px;';

    // ─── Header Row ───────────────────────────────────────────────
    const headerRow = document.createElement('div');
    headerRow.style.cssText = 'display:flex; align-items:center; justify-content:space-between; margin-bottom:28px;';

    const title = document.createElement('h2');
    title.className = 'text-gradient';
    title.style.cssText = 'font-size:1.8rem; font-weight:800; margin:0;';
    title.textContent = 'Admin Dashboard';
    headerRow.appendChild(title);

    const headerBtns = document.createElement('div');
    headerBtns.style.cssText = 'display:flex; gap:10px;';

    if (onViewAsUser) {
        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn';
        viewBtn.style.cssText = 'background:rgba(96,165,250,0.2); border:1px solid #60a5fa; color:#60a5fa; padding:8px 18px; border-radius:8px; cursor:pointer; font-weight:600;';
        viewBtn.innerHTML = '👁 View as User';
        viewBtn.onclick = onViewAsUser;
        headerBtns.appendChild(viewBtn);
    }

    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn';
    exportBtn.style.cssText = 'background:#10b981; color:white; padding:8px 18px; border-radius:8px; cursor:pointer; font-weight:600; border:none;';
    exportBtn.innerHTML = '📊 Export Profiles';
    exportBtn.onclick = () => { if (window.ProfileService) window.ProfileService.exportToExcel(); };
    headerBtns.appendChild(exportBtn);

    const analyticsBtn = document.createElement('button');
    analyticsBtn.className = 'btn';
    analyticsBtn.style.cssText = 'background:#8b5cf6; color:white; padding:8px 18px; border-radius:8px; cursor:pointer; font-weight:600; border:none;';
    analyticsBtn.innerHTML = '📈 Analytics Dashboard';
    analyticsBtn.onclick = () => { window.open('dev-dashboard.html', '_blank'); };
    headerBtns.appendChild(analyticsBtn);

    headerRow.appendChild(headerBtns);
    container.appendChild(headerRow);

    // ─── Tabs ─────────────────────────────────────────────────────
    let activeTab = 'users';

    const tabBar = document.createElement('div');
    tabBar.style.cssText = 'display:flex; gap:4px; margin-bottom:24px; border-bottom:2px solid #374151; padding-bottom:0;';

    function makeTab(key, label, icon) {
        const btn = document.createElement('button');
        btn.dataset.tabKey = key;
        btn.style.cssText = `padding:10px 22px; border:none; background:transparent; color:#9ca3af; cursor:pointer; font-size:0.95rem; font-weight:600; border-radius:8px 8px 0 0; transition:all 0.2s;`;
        btn.innerHTML = `${icon} ${label}`;
        btn.onclick = () => { activeTab = key; refreshTabs(); renderContent(); };
        return btn;
    }

    const tabUsers = makeTab('users', 'Users', '👥');
    const tabQuestions = makeTab('questions', 'Questions', '📝');
    tabBar.appendChild(tabUsers);
    tabBar.appendChild(tabQuestions);
    container.appendChild(tabBar);

    function refreshTabs() {
        [tabUsers, tabQuestions].forEach(t => {
            const isActive = t.dataset.tabKey === activeTab;
            t.style.color = isActive ? '#60a5fa' : '#9ca3af';
            t.style.borderBottom = isActive ? '2px solid #60a5fa' : '2px solid transparent';
            t.style.background = isActive ? 'rgba(96,165,250,0.08)' : 'transparent';
        });
    }
    refreshTabs();

    // ─── Content Area ─────────────────────────────────────────────
    const contentArea = document.createElement('div');
    container.appendChild(contentArea);

    // ══════════════════════════════════════════════════════════════
    // USERS TAB
    // ══════════════════════════════════════════════════════════════
    async function renderUsersTab(isSilent = false) {
        if (!isSilent) {
            contentArea.innerHTML = '<div style="padding:20px; color:#9ca3af; text-align:center;">Loading users...</div>';
        }
        const profiles = window.ProfileService ? await window.ProfileService.getAllProfiles() : [];
        if (activeTab !== 'users') return; // Cancel if tab was changed during the fetch
        contentArea.innerHTML = '';

        const wrap = document.createElement('div');
        wrap.style.cssText = 'overflow-x:auto; background:#1f2937; border-radius:12px; padding:20px;';

        const table = document.createElement('table');
        table.style.cssText = 'width:100%; border-collapse:collapse; color:#e5e7eb;';

        table.innerHTML = `
            <thead>
                <tr style="border-bottom:2px solid #374151; text-align:left;">
                    <th style="padding:12px;">Name</th>
                    <th style="padding:12px;">Student ID</th>
                    <th style="padding:12px;">Group</th>
                    <th style="padding:12px;">Total XP</th>
                    <th style="padding:12px;">Last Active</th>
                    <th style="padding:12px;">Role</th>
                    <th style="padding:12px; min-width:250px;">Actions</th>
                </tr>
            </thead>
        `;

        const tbody = document.createElement('tbody');

        if (profiles.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="padding:24px; text-align:center; color:#9ca3af;">No users registered yet.</td></tr>`;
        } else {
            profiles.forEach(p => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #374151';
                tr.style.transition = 'background 0.2s';
                tr.onmouseenter = () => tr.style.background = 'rgba(255,255,255,0.03)';
                tr.onmouseleave = () => tr.style.background = '';

                let dateStr = 'Never';
                if (p.lastActive) dateStr = new Date(p.lastActive).toLocaleDateString();
                else if (p.createdAt) dateStr = new Date(p.createdAt).toLocaleDateString();

                const isAdmin = p.role === 'admin';
                const roleBadge = isAdmin
                    ? `<span style="background:rgba(251,191,36,0.2);color:#fbbf24;border:1px solid #fbbf24;padding:2px 10px;border-radius:50px;font-size:0.75rem;font-weight:700;">ADMIN</span>`
                    : `<span style="background:rgba(96,165,250,0.1);color:#60a5fa;border:1px solid rgba(96,165,250,0.3);padding:2px 10px;border-radius:50px;font-size:0.75rem;">User</span>`;

                tr.innerHTML = `
                    <td style="padding:12px; font-weight:600;">${p.name}</td>
                    <td style="padding:12px; font-family:monospace; color:#9ca3af;">${p.studentId}</td>
                    <td style="padding:12px;">${p.classGroup || '—'}</td>
                    <td style="padding:12px; color:var(--primary); font-weight:700;">⚡ ${p.xp || 0}</td>
                    <td style="padding:12px; font-size:0.85rem; color:#9ca3af;">${dateStr}</td>
                    <td style="padding:12px;">${roleBadge}</td>
                    <td style="padding:12px;"></td>
                `;

                const actionTd = tr.querySelector('td:last-child');
                actionTd.style.cssText = 'padding:12px; display:flex; gap:6px; flex-wrap:wrap;';

                function mkBtn(label, color, onClick) {
                    const b = document.createElement('button');
                    b.textContent = label;
                    b.style.cssText = `padding:4px 10px; border-radius:6px; border:1px solid ${color}; background:transparent; color:${color}; cursor:pointer; font-size:0.78rem; font-weight:600; transition:all 0.2s;`;
                    b.onmouseenter = () => { b.style.background = color; b.style.color = '#0f172a'; };
                    b.onmouseleave = () => { b.style.background = 'transparent'; b.style.color = color; };
                    b.onclick = onClick;
                    return b;
                }

                // View Stats
                actionTd.appendChild(mkBtn('View Stats', '#60a5fa', () => {
                    if (window.StatsChart) {
                        const modal = window.StatsChart({ profile: p, onClose: () => modal && modal.remove() });
                        document.body.appendChild(modal);
                    }
                }));

                // Make/Revoke Admin
                if (isAdmin) {
                    actionTd.appendChild(mkBtn('Revoke Admin', '#f59e0b', () => {
                        if (confirm(`Remove admin role from ${p.name}?`)) {
                            window.ProfileService.demoteFromAdmin(p.studentId);
                            renderUsersTab();
                        }
                    }));
                } else {
                    actionTd.appendChild(mkBtn('Make Admin', '#34d399', () => {
                        if (confirm(`Grant admin rights to ${p.name}?\n\nThey will see the Admin Dashboard on next login.`)) {
                            window.ProfileService.promoteToAdmin(p.studentId);
                            renderUsersTab();
                        }
                    }));
                }

                // Reset
                actionTd.appendChild(mkBtn('Reset', '#f87171', () => {
                    if (confirm(`⚠️ Reset ALL progress for ${p.name}? This cannot be undone.`)) {
                        window.ProfileService.resetProfile(p.studentId);
                        renderUsersTab();
                    }
                }));

                // Delete
                actionTd.appendChild(mkBtn('Delete', '#ef4444', () => {
                    if (confirm(`🗑️ Permanently delete ${p.name}'s account? This cannot be undone.`)) {
                        window.ProfileService.deleteProfile(p.studentId);
                        renderUsersTab();
                    }
                }));

                tbody.appendChild(tr);
            });
        }

        table.appendChild(tbody);
        wrap.appendChild(table);
        contentArea.appendChild(wrap);
    }

    // ══════════════════════════════════════════════════════════════
    // QUESTIONS TAB
    // ══════════════════════════════════════════════════════════════
    const TOPICS_MAP = {
        1: 'Fundamentals', 2: 'Energy Storage', 3: 'Transient/Steady',
        4: 'Op-Amps', 5: 'Laplace', 6: 'Network Func',
        7: 'DC vs AC', 8: '3-Phase', 9: 'Test (Beta)'
    };
    const DIFF_MAP = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };
    const DIFF_COLOR = { 1: '#34d399', 2: '#f59e0b', 3: '#f87171' };

    let questionSearchTerm = '';
    let questionTopicFilter = 'all';

    function renderQuestionsTab() {
        contentArea.innerHTML = '';

        // ── Top bar ──────────────────────────────────────
        const topBar = document.createElement('div');
        topBar.style.cssText = 'display:flex; gap:12px; align-items:center; margin-bottom:16px; flex-wrap:wrap;';

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '🔍 Search questions...';
        searchInput.value = questionSearchTerm;
        searchInput.style.cssText = 'flex:1; min-width:200px; padding:8px 14px; background:#1f2937; border:1px solid #374151; border-radius:8px; color:#e5e7eb; font-size:0.9rem;';
        searchInput.oninput = e => { questionSearchTerm = e.target.value; renderQuestionsTab(); };
        topBar.appendChild(searchInput);

        const topicFilter = document.createElement('select');
        topicFilter.style.cssText = 'padding:8px 12px; background:#1f2937; border:1px solid #374151; border-radius:8px; color:#e5e7eb; font-size:0.9rem; cursor:pointer;';
        topicFilter.innerHTML = '<option value="all">All Topics</option>';
        Object.entries(TOPICS_MAP).forEach(([k, v]) => {
            topicFilter.innerHTML += `<option value="${k}">${v}</option>`;
        });
        topicFilter.value = questionTopicFilter;
        topicFilter.onchange = e => { questionTopicFilter = e.target.value; renderQuestionsTab(); };
        topBar.appendChild(topicFilter);

        const addBtn = document.createElement('button');
        addBtn.style.cssText = 'padding:8px 18px; background:rgba(52,211,153,0.2); border:1px solid #34d399; color:#34d399; border-radius:8px; cursor:pointer; font-weight:700; font-size:0.9rem;';
        addBtn.innerHTML = '+ Add Question';
        addBtn.onclick = () => openQuestionModal(null);
        topBar.appendChild(addBtn);

        const exportCsvBtn = document.createElement('button');
        exportCsvBtn.style.cssText = 'padding:8px 18px; background:rgba(96,165,250,0.2); border:1px solid #60a5fa; color:#60a5fa; border-radius:8px; cursor:pointer; font-weight:700; font-size:0.9rem;';
        exportCsvBtn.innerHTML = '⬇ Export CSV';
        exportCsvBtn.title = 'Download updated QuestionBank.csv — replace the file in data/questions/ to make changes permanent.';
        exportCsvBtn.onclick = exportQuestionsCSV;
        topBar.appendChild(exportCsvBtn);

        contentArea.appendChild(topBar);

        const note = document.createElement('p');
        note.style.cssText = 'font-size:0.78rem; color:#9ca3af; margin-bottom:14px;';
        note.innerHTML = '⚠️ Changes here are live for this session. Click <strong style="color:#60a5fa;">Export CSV</strong> and replace <code>data/questions/QuestionBank.csv</code> to make them permanent.';
        contentArea.appendChild(note);

        // ── Table ─────────────────────────────────────────
        const wrap = document.createElement('div');
        wrap.style.cssText = 'overflow-x:auto; background:#1f2937; border-radius:12px; padding:20px;';

        const table = document.createElement('table');
        table.style.cssText = 'width:100%; border-collapse:collapse; color:#e5e7eb;';
        table.innerHTML = `
            <thead>
                <tr style="border-bottom:2px solid #374151; text-align:left;">
                    <th style="padding:10px; width:60px;">ID</th>
                    <th style="padding:10px; width:120px;">Topic</th>
                    <th style="padding:10px;">Question</th>
                    <th style="padding:10px; width:80px;">Diff</th>
                    <th style="padding:10px; width:120px;">Actions</th>
                </tr>
            </thead>
        `;

        const tbody = document.createElement('tbody');
        let qs = window.DataService ? [...window.DataService.questions] : [];

        // Filter
        if (questionTopicFilter !== 'all') {
            qs = qs.filter(q => String(q.topicId) === questionTopicFilter);
        }
        if (questionSearchTerm.trim()) {
            const term = questionSearchTerm.toLowerCase();
            qs = qs.filter(q => (q.question || '').toLowerCase().includes(term));
        }

        if (qs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="padding:24px; text-align:center; color:#9ca3af;">No questions found.</td></tr>`;
        } else {
            qs.forEach(q => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #374151';
                tr.onmouseenter = () => tr.style.background = 'rgba(255,255,255,0.03)';
                tr.onmouseleave = () => tr.style.background = '';

                const diff = q.difficulty || 1;
                const diffColor = DIFF_COLOR[diff] || '#9ca3af';
                const preview = (q.question || '').length > 80 ? q.question.slice(0, 77) + '…' : q.question;

                tr.innerHTML = `
                    <td style="padding:10px; font-family:monospace; color:#9ca3af; font-size:0.85rem;">${q.id}</td>
                    <td style="padding:10px; font-size:0.85rem; color:#a78bfa;">${TOPICS_MAP[q.topicId] || q.topicId}</td>
                    <td style="padding:10px; font-size:0.85rem;">${preview}</td>
                    <td style="padding:10px;"><span style="background:${diffColor}22; color:${diffColor}; border:1px solid ${diffColor}55; padding:2px 8px; border-radius:50px; font-size:0.75rem; font-weight:700;">${DIFF_MAP[diff] || diff}</span></td>
                    <td style="padding:10px;"></td>
                `;

                const actionTd = tr.querySelector('td:last-child');
                actionTd.style.cssText = 'padding:10px; display:flex; gap:6px;';

                function mkSmBtn(label, color, onClick) {
                    const b = document.createElement('button');
                    b.textContent = label;
                    b.style.cssText = `padding:3px 9px; border-radius:5px; border:1px solid ${color}; background:transparent; color:${color}; cursor:pointer; font-size:0.75rem; font-weight:600; transition:all 0.2s;`;
                    b.onmouseenter = () => { b.style.background = color; b.style.color = '#0f172a'; };
                    b.onmouseleave = () => { b.style.background = 'transparent'; b.style.color = color; };
                    b.onclick = onClick;
                    return b;
                }

                actionTd.appendChild(mkSmBtn('Edit', '#60a5fa', () => openQuestionModal(q)));
                actionTd.appendChild(mkSmBtn('Del', '#ef4444', () => {
                    if (confirm(`Delete question ID ${q.id}?\n"${q.question ? q.question.slice(0, 60) : ''}..."`)) {
                        window.DataService.questions = window.DataService.questions.filter(x => x.id !== q.id);
                        renderQuestionsTab();
                    }
                }));

                tbody.appendChild(tr);
            });
        }

        table.appendChild(tbody);
        wrap.appendChild(table);
        contentArea.appendChild(wrap);

        const countNote = document.createElement('p');
        countNote.style.cssText = 'font-size:0.8rem; color:#9ca3af; margin-top:10px; text-align:right;';
        countNote.textContent = `Showing ${qs.length} of ${window.DataService ? window.DataService.questions.length : 0} questions`;
        contentArea.appendChild(countNote);
    }

    // ── Question Add/Edit Modal ────────────────────────────────────
    function openQuestionModal(existingQ) {
        const isEdit = !!existingQ;
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px;';

        const modal = document.createElement('div');
        modal.style.cssText = 'background:#1e293b; border:1px solid #374151; border-radius:16px; padding:28px; width:100%; max-width:680px; max-height:90vh; overflow-y:auto;';

        const mTitle = document.createElement('h3');
        mTitle.style.cssText = 'margin:0 0 20px; font-size:1.2rem; font-weight:700; color:#e5e7eb;';
        mTitle.textContent = isEdit ? '✏️ Edit Question' : '➕ Add New Question';
        modal.appendChild(mTitle);

        const form = document.createElement('form');
        form.style.cssText = 'display:flex; flex-direction:column; gap:14px;';
        form.onsubmit = e => e.preventDefault();

        function createField(label, name, value = '', type = 'text', required = false) {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'display:flex; flex-direction:column; gap:4px;';
            const lbl = document.createElement('label');
            lbl.textContent = label + (required ? ' *' : '');
            lbl.style.cssText = 'font-size:0.82rem; color:#9ca3af; font-weight:600;';
            const input = document.createElement('input');
            input.type = type;
            input.name = name;
            input.value = value !== null && value !== undefined ? value : '';
            input.required = required;
            input.style.cssText = 'padding:8px 12px; background:#0f172a; border:1px solid #374151; border-radius:8px; color:#e5e7eb; font-size:0.9rem; outline:none;';
            input.onfocus = () => input.style.borderColor = '#60a5fa';
            input.onblur = () => input.style.borderColor = '#374151';
            wrapper.appendChild(lbl);
            wrapper.appendChild(input);
            return wrapper;
        }

        function createSelect(label, name, options, value) {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'display:flex; flex-direction:column; gap:4px;';
            const lbl = document.createElement('label');
            lbl.textContent = label + ' *';
            lbl.style.cssText = 'font-size:0.82rem; color:#9ca3af; font-weight:600;';
            const sel = document.createElement('select');
            sel.name = name;
            sel.style.cssText = 'padding:8px 12px; background:#0f172a; border:1px solid #374151; border-radius:8px; color:#e5e7eb; font-size:0.9rem; cursor:pointer;';
            options.forEach(([v, t]) => {
                const opt = document.createElement('option');
                opt.value = v;
                opt.textContent = t;
                if (String(v) === String(value)) opt.selected = true;
                sel.appendChild(opt);
            });
            wrapper.appendChild(lbl);
            wrapper.appendChild(sel);
            return wrapper;
        }

        // Two-column row
        function twoCol(...children) {
            const row = document.createElement('div');
            row.style.cssText = 'display:grid; grid-template-columns:1fr 1fr; gap:14px;';
            children.forEach(c => row.appendChild(c));
            return row;
        }

        // Auto-generate next ID
        const nextId = existingQ
            ? existingQ.id
            : Math.max(0, ...(window.DataService.questions.map(q => Number(q.id) || 0))) + 1;

        form.appendChild(twoCol(
            createField('Question ID', 'id', nextId, 'number', true),
            createSelect('Topic', 'topicId', Object.entries(TOPICS_MAP).map(([k, v]) => [k, `${k} — ${v}`]), existingQ ? existingQ.topicId : 1)
        ));

        const questionWrapper = document.createElement('div');
        questionWrapper.style.cssText = 'display:flex; flex-direction:column; gap:4px;';
        const qLabel = document.createElement('label');
        qLabel.textContent = 'Question *';
        qLabel.style.cssText = 'font-size:0.82rem; color:#9ca3af; font-weight:600;';
        const qArea = document.createElement('textarea');
        qArea.name = 'question';
        qArea.rows = 3;
        qArea.required = true;
        qArea.value = existingQ ? (existingQ.question || '') : '';
        qArea.style.cssText = 'padding:8px 12px; background:#0f172a; border:1px solid #374151; border-radius:8px; color:#e5e7eb; font-size:0.9rem; resize:vertical; outline:none;';
        qArea.onfocus = () => qArea.style.borderColor = '#60a5fa';
        qArea.onblur = () => qArea.style.borderColor = '#374151';
        questionWrapper.appendChild(qLabel);
        questionWrapper.appendChild(qArea);
        form.appendChild(questionWrapper);

        form.appendChild(twoCol(
            createField('Option A', 'optionA', existingQ ? existingQ.optionA : '', 'text', true),
            createField('Option B', 'optionB', existingQ ? existingQ.optionB : '', 'text', true)
        ));
        form.appendChild(twoCol(
            createField('Option C', 'optionC', existingQ ? existingQ.optionC : '', 'text', true),
            createField('Option D (optional)', 'optionD', existingQ ? (existingQ.optionD || '') : '')
        ));

        const answerHint = document.createElement('p');
        answerHint.style.cssText = 'font-size:0.78rem; color:#9ca3af; margin:-8px 0 0;';
        answerHint.textContent = 'Answer: Enter the exact text of the correct option, or a single letter (a/b/c/d).';

        form.appendChild(twoCol(
            createField('Correct Answer', 'answer', existingQ ? existingQ.answer : '', 'text', true),
            createSelect('Difficulty', 'difficulty', [[1,'Easy'],[2,'Medium'],[3,'Hard']], existingQ ? existingQ.difficulty : 1)
        ));
        form.appendChild(answerHint);
        form.appendChild(createField('Image URL (optional)', 'image', existingQ ? (existingQ.image || '') : ''));
        form.appendChild(createField('Explanation (optional)', 'explanation', existingQ ? (existingQ.explanation || '') : ''));

        // Buttons
        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex; gap:10px; justify-content:flex-end; margin-top:8px;';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = 'padding:9px 20px; border-radius:8px; border:1px solid #374151; color:#9ca3af; background:transparent; cursor:pointer; font-weight:600;';
        cancelBtn.onclick = () => overlay.remove();
        btnRow.appendChild(cancelBtn);

        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.textContent = isEdit ? '💾 Save Changes' : '✅ Add Question';
        saveBtn.style.cssText = 'padding:9px 20px; border-radius:8px; border:none; background:#60a5fa; color:#0f172a; cursor:pointer; font-weight:700; font-size:0.9rem;';
        saveBtn.onclick = () => {
            const get = (name) => {
                const el = form.querySelector(`[name="${name}"]`);
                return el ? el.value.trim() : '';
            };
            const newQ = {
                id: Number(get('id')),
                topicId: Number(get('topicId')),
                question: get('question'),
                optionA: get('optionA'),
                optionB: get('optionB'),
                optionC: get('optionC'),
                optionD: get('optionD') || null,
                answer: get('answer'),
                image: get('image') || null,
                explanation: get('explanation') || null,
                difficulty: Number(get('difficulty')) || 1,
            };

            if (!newQ.question || !newQ.optionA || !newQ.optionB || !newQ.optionC || !newQ.answer) {
                alert('Please fill in all required fields (Question, Options A–C, Answer).');
                return;
            }

            // Resolve letter answers
            const ansLetter = newQ.answer.toLowerCase();
            if (ansLetter === 'a') newQ.answer = newQ.optionA;
            else if (ansLetter === 'b') newQ.answer = newQ.optionB;
            else if (ansLetter === 'c') newQ.answer = newQ.optionC;
            else if (ansLetter === 'd' && newQ.optionD) newQ.answer = newQ.optionD;

            if (isEdit) {
                const idx = window.DataService.questions.findIndex(q => q.id === existingQ.id);
                if (idx !== -1) window.DataService.questions[idx] = newQ;
            } else {
                const exists = window.DataService.questions.find(q => q.id === newQ.id);
                if (exists) { alert(`Question ID ${newQ.id} already exists. Choose a different ID.`); return; }
                window.DataService.questions.push(newQ);
            }

            overlay.remove();
            renderQuestionsTab();
        };
        btnRow.appendChild(saveBtn);
        form.appendChild(btnRow);

        modal.appendChild(form);
        overlay.appendChild(modal);
        overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
        document.body.appendChild(overlay);
    }

    // ── Export CSV ────────────────────────────────────────────────
    function exportQuestionsCSV() {
        const qs = window.DataService ? window.DataService.questions : [];
        const header = 'id,topicId,question,optionA,optionB,optionC,optionD,answer,image,explanation,difficulty';

        function escapeCSV(val) {
            if (val === null || val === undefined) return '';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        }

        const rows = qs.map(q => [
            q.id, q.topicId, q.question,
            q.optionA, q.optionB, q.optionC, q.optionD || '',
            q.answer, q.image || '', q.explanation || '', q.difficulty || 1
        ].map(escapeCSV).join(','));

        const csv = [header, ...rows].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'QuestionBank.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    // ─── Render active tab ────────────────────────────────────────
    function renderContent() {
        if (activeTab === 'users') renderUsersTab();
        else renderQuestionsTab();
    }

    renderContent();

    // Auto-refresh users tab silently every 30 seconds
    const adminTimer = setInterval(() => {
        if (!document.body.contains(container)) {
            clearInterval(adminTimer);
            return;
        }
        if (activeTab === 'users') {
            renderUsersTab(true);
        }
    }, 30000);

    return container;
};
