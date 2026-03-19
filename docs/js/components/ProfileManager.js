window.ProfileManager = function ({ onBack, onProfileSwitched }) {
    const container = document.createElement('div');
    container.className = 'animate-slide-in';
    container.style.padding = '20px';
    container.style.paddingBottom = '80px';

    // Header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '24px';

    const backBtn = document.createElement('button');
    backBtn.textContent = '← MENU';
    backBtn.className = 'btn btn-secondary';
    backBtn.style.padding = '8px 16px';
    backBtn.style.fontSize = '0.9rem';
    backBtn.onclick = onBack;
    header.appendChild(backBtn);

    const title = document.createElement('h2');
    title.textContent = "Manage Profiles";
    header.appendChild(title);

    container.appendChild(header);

    // Form Section
    const formCard = document.createElement('div');
    formCard.className = 'card';
    formCard.style.marginBottom = '24px';
    formCard.style.display = 'flex';
    formCard.style.flexDirection = 'column';
    formCard.style.gap = '16px';

    const formTitle = document.createElement('h3');
    formTitle.textContent = "Add New Profile";
    formCard.appendChild(formTitle);

    // Inputs
    const createInput = (placeholder, type = 'text') => {
        const input = document.createElement('input');
        input.type = type;
        input.placeholder = placeholder;
        input.style.width = '100%';
        input.style.padding = '12px';
        input.style.borderRadius = '8px';
        input.style.border = '1px solid #374151';
        input.style.background = '#1f2937';
        input.style.color = 'white';
        input.style.marginBottom = '8px';
        return input;
    };

    const nameInput = createInput("Full Name");
    const idInput = createInput("Student ID / Matrix No.");
    const classInput = createInput("Class / Group (Optional)");

    formCard.appendChild(nameInput);
    formCard.appendChild(idInput);
    formCard.appendChild(classInput);

    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn-primary';
    addBtn.textContent = '+ ADD PROFILE';
    addBtn.onclick = () => {
        const name = nameInput.value.trim();
        const id = idInput.value.trim();
        const group = classInput.value.trim();

        const result = window.ProfileService.addProfile({
            name: name,
            studentId: id,
            classGroup: group
        });

        if (result.success) {
            // Clear inputs
            nameInput.value = '';
            idInput.value = '';
            classInput.value = '';
            renderList(); // Refresh list
        } else {
            alert(result.error);
        }
    };
    formCard.appendChild(addBtn);
    container.appendChild(formCard);

    // Export Section
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn';
    exportBtn.style.background = '#10b981'; // Green for Excel
    exportBtn.style.color = 'white';
    exportBtn.style.width = '100%';
    exportBtn.style.marginBottom = '24px';
    exportBtn.style.display = 'flex';
    exportBtn.style.justifyContent = 'center';
    exportBtn.style.alignItems = 'center';
    exportBtn.style.gap = '8px';
    exportBtn.innerHTML = '<span>📊</span> Export to Excel';
    exportBtn.onclick = () => {
        window.ProfileService.exportToExcel();
    };
    container.appendChild(exportBtn);

    // List Section
    const listTitle = document.createElement('h3');
    listTitle.textContent = "Registered Profiles";
    listTitle.style.marginBottom = '12px';
    container.appendChild(listTitle);

    const listContainer = document.createElement('div');
    listContainer.style.display = 'flex';
    listContainer.style.flexDirection = 'column';
    listContainer.style.gap = '12px';
    container.appendChild(listContainer);

    function renderList() {
        listContainer.innerHTML = '';
        const profiles = window.ProfileService.getProfiles();

        if (profiles.length === 0) {
            listContainer.innerHTML = '<div style="color:#9ca3af; text-align:center; padding:20px;">No profiles added yet.</div>';
            return;
        }

        const activeProfile = window.ProfileService.getActiveProfile();

        profiles.forEach(p => {
            const isActive = activeProfile && activeProfile.studentId === p.studentId;
            const item = document.createElement('div');
            item.className = 'card';
            item.style.padding = '12px';
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            item.style.background = isActive ? '#374151' : '#1f2937';
            item.style.border = isActive ? '2px solid var(--primary)' : '1px solid #374151';

            const info = document.createElement('div');
            let nameHTML = `<div style="font-weight:bold; color:white;">${p.name}</div>`;
            if (isActive) {
                nameHTML = `<div style="font-weight:bold; color:var(--primary);">★ ${p.name} (Active)</div>`;
            }

            info.innerHTML = `
                ${nameHTML}
                <div style="font-size:0.85rem; color:#9ca3af;">ID: ${p.studentId} ${p.classGroup ? ` • ${p.classGroup}` : ''}</div>
            `;

            const actions = document.createElement('div');
            actions.style.display = 'flex';
            actions.style.gap = '8px';

            if (!isActive) {
                const selectBtn = document.createElement('button');
                selectBtn.textContent = 'Select';
                selectBtn.className = 'btn btn-secondary';
                selectBtn.style.padding = '4px 8px';
                selectBtn.style.fontSize = '0.8rem';
                selectBtn.style.marginBottom = '0';
                selectBtn.onclick = () => {
                    window.ProfileService.setActiveProfile(p.studentId);
                    if (onProfileSwitched) onProfileSwitched();
                    renderList();
                };
                actions.appendChild(selectBtn);
            } else {
                // If active, show STATS button
                const statsBtn = document.createElement('button');
                statsBtn.textContent = '📈 Stats';
                statsBtn.className = 'btn btn-primary';
                statsBtn.style.padding = '4px 8px';
                statsBtn.style.fontSize = '0.8rem';
                statsBtn.style.marginBottom = '0';
                statsBtn.onclick = () => {
                    if (window.StatsChart) {
                        // pass full profile so StatsChart can read stats AND answer_history
                        window.StatsChart({ profile: p });
                    } else {
                        alert("Charts not loaded");
                    }
                };
                actions.appendChild(statsBtn);
            }



            const resetBtn = document.createElement('button');
            resetBtn.textContent = '🔄';
            resetBtn.title = "Reset Progress";
            resetBtn.style.background = 'transparent';
            resetBtn.style.border = 'none';
            resetBtn.style.cursor = 'pointer';
            resetBtn.style.fontSize = '1.2rem';
            resetBtn.onclick = () => {
                if (confirm(`Reset ALL progress for ${p.name}? This cannot be undone.`)) {
                    window.ProfileService.resetProfile(p.studentId);
                    // If this was the active profile, we need to reload app state
                    if (isActive && onProfileSwitched) {
                        onProfileSwitched();
                    }
                    renderList();
                    if (isActive) alert("Profile reset. Stats cleared.");
                }
            };
            actions.appendChild(resetBtn);

            const delBtn = document.createElement('button');
            delBtn.textContent = '🗑️';
            delBtn.style.background = 'transparent';
            delBtn.style.border = 'none';
            delBtn.style.cursor = 'pointer';
            delBtn.style.fontSize = '1.2rem';
            delBtn.onclick = () => {
                if (confirm(`Delete profile for ${p.name}?`)) {
                    window.ProfileService.deleteProfile(p.studentId);
                    renderList();
                }
            };
            actions.appendChild(delBtn);

            item.appendChild(info);
            item.appendChild(actions);
            listContainer.appendChild(item);
        });
    }

    // Initial render
    renderList();

    return container;
};
