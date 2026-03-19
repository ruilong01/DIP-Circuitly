window.SubTopicSelection = function ({ onSelect, onBack }) {
    const container = document.createElement('div');
    container.className = 'dashboard-container animate-fade-in';
    container.style.paddingTop = '20px';

    // Header with Back Button
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.marginBottom = '20px';

    const backBtn = document.createElement('button');
    backBtn.innerHTML = '&#8592; Back';
    backBtn.className = 'btn btn-secondary';
    backBtn.style.marginRight = '15px';
    backBtn.onclick = onBack;

    const title = document.createElement('h2');
    title.textContent = 'Select Topic';
    title.style.margin = '0';
    title.className = 'text-gradient';

    header.appendChild(backBtn);
    header.appendChild(title);
    container.appendChild(header);

    // Subtopics Data
    const subTopics = [
        { id: 'kirchhoff', name: 'Kirchhoff Laws' },
        { id: 'dc_eq_res', name: 'DC Equivalent Resistance' },
        { id: 'dc_circuits', name: 'DC Circuits' },
        { id: 'dc_thevenin', name: 'DC Thevenin-Norton equivalents' },
        { id: 'dc_mna', name: 'DC Modified Nodal Analysis' },
        { id: 'dc_two_port', name: 'DC Two-Ports' },
        { id: 'ac_imp', name: 'AC Equivalent Impedance' },
        { id: 'ac_circuits', name: 'AC Circuits' },
        { id: 'ac_thevenin', name: 'AC Thevenin-Norton equivalents' },
        { id: 'ac_power', name: 'AC Power' },
        { id: 'ac_multi', name: 'AC Multi-frequency' },
        { id: 'first_order', name: 'First-Order circuits' },
        { id: 'transfer_func', name: 'Transfer functions' },
        { id: 'impulse', name: 'Impulse Responses' },
        { id: 'natural_freq', name: 'Natural Frequencies' },
        { id: 'bode', name: 'Bode Diagrams' },
        { id: 'state_eq', name: 'State Equations' },
        { id: 'trans_no_ic', name: 'Transients, no IC' },
        { id: 'trans_ic_dc', name: 'Transients, IC from DC Analysis' },
        { id: 'gen_trans', name: 'General Transients' },
        { id: 'mna_lti', name: 'MNA of LTI Circuits' },
        { id: 'lti_two_port', name: 'LTI Two-Ports' }
    ];

    // Grid Layout
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
    grid.style.gap = '15px';

    subTopics.forEach(topic => {
        const card = document.createElement('div');
        card.className = 'card-glass';
        card.style.padding = '15px';
        card.style.cursor = 'pointer';
        card.style.transition = 'transform 0.2s, background 0.2s';
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.justifyContent = 'space-between';

        const name = document.createElement('span');
        name.style.fontWeight = '600';
        name.style.color = '#e2e8f0';
        name.textContent = topic.name;

        const arrow = document.createElement('span');
        arrow.innerHTML = '&#8250;';
        arrow.style.fontSize = '1.5rem';
        arrow.style.color = 'var(--accent)';

        card.appendChild(name);
        card.appendChild(arrow);

        // Hover Effect
        card.onmouseenter = () => {
            card.style.transform = 'translateY(-2px)';
            card.style.background = 'rgba(255,255,255,0.1)';
        };
        card.onmouseleave = () => {
            card.style.transform = 'translateY(0)';
            card.style.background = 'rgba(255,255,255,0.05)';
        };

        card.onclick = () => onSelect(topic.id);

        grid.appendChild(card);
    });

    container.appendChild(grid);
    return container;
};
