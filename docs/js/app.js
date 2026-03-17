// Main App Entry
const app = document.getElementById('app');

const ROUTES = { // constant object used as maps like buttons on an elevator
    LOGIN: 'login',
    HOME: 'home',
    QUIZ: 'quiz',
    RESULT: 'result',
    PROFILES: 'profiles',
    ADMIN: 'admin',
    UNFAMILIAR: 'unfamiliar'
};

// Global State
let State = {
    view: ROUTES.LOGIN,// Update state.view when changing pages
    username: null,
    xp: 0,
    hearts: 5,
    nextHeartRestoreTime: null,
    activeTopicId: null,
    topicProgress: {},
    revisionPool: [],
    isAdmin: false
};

// --- INIT ---
const initApp = async () => {
    // Always start at Profile Selection / Login
    // Check for existing session slightly differently: Maybe pre-load but don't auto-navigate?
    // User request: "login page is at the start whenever the app opens"

    // We can still get the active profile to highlight/select, but we don't call loadUser() immediately.
    State.view = ROUTES.LOGIN;
    render();
};

const loadUser = (profile) => {
    State = {
        ...State,
        view: profile.role === 'admin' ? ROUTES.ADMIN : ROUTES.HOME,
        username: profile.name, // Display Name
        studentId: profile.studentId,
        xp: profile.xp,
        hearts: profile.hearts,
        nextHeartRestoreTime: profile.lastActive ? null : null, // Todo: Heart logic in ProfileService if needed
        topicProgress: profile.topicProgress || {},
        revisionPool: profile.revisionPool || [],
        isAdmin: profile.role === 'admin'
    };
    /* 
       Note: Heart Timer logic was based on "nextHeartRestoreTime" in State.
       ProfileService currently just stores 'hearts'. 
       If we want to persist timer, we need to add that to ProfileService.
       For now, let's keep it simple: Reset to 5 on new session or keep current behavior if we want.
       Let's assume we just load what's there. 
    */

    render();
};

const syncState = () => {
    if (State.studentId) {
        window.ProfileService.updateProgress(State.studentId, {
            xp: State.xp,
            hearts: State.hearts,
            topicProgress: State.topicProgress,
            revisionPool: State.revisionPool
        });
    }
};

function render() { // Inside render, code looks at state.view and matches it against ROUTES
    app.innerHTML = ''; // Clear

    // Header (Always show branding, but stats only if logged in and not on profiles page)
    if (true) {
        const header = document.createElement('div');
        header.className = 'header-bar';

        const isLoggedIn = State.view !== ROUTES.LOGIN && State.view !== ROUTES.PROFILES;

        if (State.isAdmin) {
            header.innerHTML = `
                <div class="brand-logo-compact" onclick="location.reload()" style="pointer-events: auto;">
                    <div class="logo-icon">I</div>
                    <div class="logo-text">Impulse</div>
                </div>
                <div class="stats-container">
                    <div class="stat-pill glass-pill accent-pill">ADMINISTRATOR</div>
                    <div class="stat-pill glass-pill" style="cursor:pointer; background:rgba(255, 50, 50, 0.2);" id="logout-btn">
                        🚪 Log Out
                    </div>
                </div>
            `;
        } else {
            header.innerHTML = `
                <div class="brand-logo-compact" onclick="location.reload()" style="pointer-events: auto;">
                    <div class="logo-icon">I</div>
                    <div class="logo-text">Impulse</div>
                </div>
                ${isLoggedIn ? `
                <div class="stats-container">
                    <div class="stat-pill glass-pill" id="heart-btn" style="cursor:pointer" title="Click to refill">
                        <span style="margin-right:8px">❤️</span> ${State.hearts}
                    </div>
                    <div class="stat-pill glass-pill accent-pill"><span style="margin-right:8px">⚡</span> ${State.xp} XP</div>
                    
                    <!-- Profile Menu -->
                    <div class="stat-pill glass-pill" style="cursor:pointer; margin-right: 8px;" id="profile-btn" title="Profile Details">
                         👤 ${State.username}
                    </div>

                    <!-- Logout Button -->
                    <div class="stat-pill glass-pill" style="cursor:pointer; background: rgba(255, 50, 50, 0.2); border: 1px solid rgba(255, 50, 50, 0.3);" id="logout-btn" title="Log Out">
                         🚪
                    </div>
                </div>
                ` : ''}
            `;
        }

        app.appendChild(header);

        // Bind Buttons
        setTimeout(() => {
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) logoutBtn.onclick = () => {
                if (confirm('Log out?')) {
                    // Log the behavior before clearing state
                    if (window.ProfileService && State.studentId) {
                        window.ProfileService.logBehaviour('user_logout');
                    }
                    
                    // Clear Logic
                    State.username = null;
                    State.studentId = null;
                    State.xp = 0;
                    State.hearts = 5;
                    State.topicProgress = {};
                    State.revisionPool = [];
                    State.isAdmin = false;
                    State.view = ROUTES.LOGIN;
                    render();
                }
            };

            if (!State.isAdmin) {
                // Profile Button -> Go to Stats Chart (Bypass Profile Manager)
                const profileBtn = document.getElementById('profile-btn');
                if (profileBtn) profileBtn.onclick = () => {
                    const profile = window.ProfileService.getActiveProfile();
                    if (profile && window.StatsChart) {
                        window.StatsChart({ stats: profile.stats });
                    } else {
                        alert("Stats not available.");
                    }
                };

                const heartBtn = document.getElementById('heart-btn');
                if (heartBtn) heartBtn.onclick = () => {
                    if (confirm('Refill hearts to MAX?')) {
                        State.hearts = 5;
                        State.nextHeartRestoreTime = null;
                        if (window.ProfileService) {
                            window.ProfileService.updateProgress(State.studentId, { hearts: 5 });
                        }
                        render();
                    }
                };
            }
        }, 0);
    }

    // View Content
    let component;
    switch (State.view) {
        case ROUTES.LOGIN:
            if (window.Login) {
                component = window.Login({
                    onLogin: async (username, password) => {
                        const result = await window.ProfileService.authenticate(username, password);
                        if (result.success) {
                            window.ProfileService.logBehaviour('user_login', { username: username });
                            loadUser(result.profile);
                        } else {
                            alert(result.error);
                        }
                    },
                    onRegister: async (data) => {
                        const result = await window.ProfileService.addProfile(data);
                        if (result.success) {
                            // Auto login after signup? Or ask to login?
                            // Let's auto-login for better UX
                            const auth = await window.ProfileService.authenticate(data.username, data.password);
                            if (auth.success) {
                                window.ProfileService.logBehaviour('user_registered', { username: data.username });
                                loadUser(auth.profile);
                            }
                        } else {
                            alert(result.error);
                        }
                    }
                });
            }
            break;

        case ROUTES.HOME:
            if (window.Home) {
                const activeProfile = window.ProfileService.getActiveProfile();
                const unfamiliarCount = activeProfile && activeProfile.unfamiliarPool ? activeProfile.unfamiliarPool.length : 0;

                component = window.Home({
                    topicProgress: State.topicProgress,
                    revisionPoolCount: State.revisionPool.length,
                    unfamiliarPoolCount: unfamiliarCount,
                    onStart: (topicId) => {
                        if (State.hearts <= 0) {
                            alert("You have no hearts left! Wait for them to restore.");
                            return;
                        }
                        State.activeTopicId = topicId;
                        State.view = ROUTES.QUIZ;
                        window.ProfileService.logBehaviour('quiz_started', { topicId: topicId });
                        render();
                    },
                    onStartRevision: () => {
                        if (State.hearts <= 0) {
                            alert("You have no hearts left!");
                            return;
                        }
                        State.activeTopicId = 'revision';
                        State.view = ROUTES.QUIZ;
                        window.ProfileService.logBehaviour('revision_started');
                        render();
                    },
                    onStartUnfamiliar: () => {
                        State.view = ROUTES.UNFAMILIAR;
                        window.ProfileService.logBehaviour('unfamiliar_started');
                        render();
                    }
                });
            }
            break;

        case ROUTES.UNFAMILIAR:
            if (window.UnfamiliarConceptsModule) {
                component = window.UnfamiliarConceptsModule({
                    onExit: () => {
                        State.view = ROUTES.HOME;
                        window.ProfileService.logBehaviour('unfamiliar_exited');
                        render();
                    }
                });
            }
            break;

        case ROUTES.QUIZ:
            if (window.Quiz) {
                let quizQuestions = [];
                const isRevision = State.activeTopicId === 'revision';

                if (isRevision) {
                    const pool = [...State.revisionPool];
                    for (let i = pool.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [pool[i], pool[j]] = [pool[j], pool[i]];
                    }
                    quizQuestions = pool.slice(0, 10);
                }

                component = window.Quiz({
                    topicId: State.activeTopicId,
                    customQuestions: isRevision ? quizQuestions : null,
                    onCorrect: (questionId) => {
                        if (isRevision) {
                            State.revisionPool = State.revisionPool.filter(q => q.id !== questionId);
                            syncState();
                        }
                    },
                    onComplete: (result) => {
                        let earnedScore = 0;
                        let passed = false;
                        let timeSpent = result.timeSpent || 0;

                        if (!isRevision) {
                            const percentage = (result.correctCount / result.totalQuestions) * 100;
                            if (percentage >= 80) passed = true;

                            earnedScore = result.score;
                            State.xp += earnedScore;

                            if (!State.topicProgress[State.activeTopicId]) {
                                State.topicProgress[State.activeTopicId] = { xp: 0 };
                            }
                            State.topicProgress[State.activeTopicId].xp += earnedScore;
                            window.ProfileService.updateStats(State.studentId, State.activeTopicId, earnedScore, timeSpent);

                            if (!passed && State.hearts > 0) State.hearts--;

                            if (result.incorrectResponses) {
                                result.incorrectResponses.forEach(inc => {
                                    const exists = State.revisionPool.some(p => p.prompt === inc.question);
                                    if (!exists) {
                                        State.revisionPool.push({
                                            id: inc.id || ('pushed_' + Date.now() + Math.random()),
                                            topicId: State.activeTopicId,
                                            prompt: inc.question,
                                            options: inc.options, // These are the labels
                                            correctAnswer: inc.correctAnswer,
                                            image: inc.image,
                                            explanation: inc.explanation
                                        });
                                    }
                                });
                            }
                        } else {
                            earnedScore = result.correctCount;
                            State.xp += earnedScore;
                        }

                        syncState();
                        
                        window.ProfileService.logBehaviour('quiz_completed', { 
                            topicId: State.activeTopicId,
                            isRevision: isRevision,
                            score: earnedScore,
                            correctCount: result.correctCount,
                            totalQuestions: result.totalQuestions,
                            timeSpent: timeSpent,
                            passed: passed
                        });

                        State.view = ROUTES.HOME;
                        render();
                    },
                    onExit: () => {
                        window.ProfileService.logBehaviour('quiz_exited_early', { topicId: State.activeTopicId });
                        State.view = ROUTES.HOME;
                        render();
                    }
                });
            }
            break;

        case ROUTES.PROFILES:
            if (window.ProfileManager) {
                component = window.ProfileManager({
                    onBack: () => {
                        if (State.studentId) {
                            State.view = ROUTES.HOME;
                            render();
                        } else {
                            // If no user, stay here or warn
                            alert("Please select a profile first.");
                        }
                    },
                    onProfileSwitched: () => {
                        const profile = window.ProfileService.getActiveProfile();
                        if (profile) {
                            window.ProfileService.logBehaviour('profile_switched');
                            loadUser(profile);
                        }
                    }
                });
            }
            break;

        case ROUTES.ADMIN:
            if (window.AdminDashboard) {
                component = window.AdminDashboard({});
            }
            break;
    }

    if (component) app.appendChild(component);
}

// Heart Timer Logic
let heartInterval = null;

function startHeartTimer() {
    if (heartInterval) clearInterval(heartInterval);

    const updateTimerDisplay = () => {
        if (!State.nextHeartRestoreTime) {
            // Clean up if fully restored
            clearInterval(heartInterval);
            heartInterval = null;
            const el = document.getElementById('heart-timer');
            if (el) el.textContent = '';
            return;
        }

        const now = Date.now();
        const diff = State.nextHeartRestoreTime - now;

        if (diff <= 0) {
            // Restore Heart
            State.hearts++;

            if (State.hearts >= 5) {
                State.hearts = 5;
                State.nextHeartRestoreTime = null;
                clearInterval(heartInterval);
                heartInterval = null;
            } else {
                // Reset timer for NEXT heart
                State.nextHeartRestoreTime = Date.now() + (60 * 60 * 1000);
            }

            syncState();

            // Only re-render header info if we are in a view that shows it
            // Ideally we just update the DOM elements directly to avoid flicker
            const heartCountEl = document.querySelector('.stats-container .stat-pill');
            if (heartCountEl) {
                // Simple re-render to catch everything or manual DOM update
                // Manual update is safer for preserving input state if any, but render() is fine for this app structure
                render();
                return;
            }
        }

        // Update Display text
        const el = document.getElementById('heart-timer');
        if (el) {
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            el.textContent = `(+1 in ${m}:${s.toString().padStart(2, '0')})`;
        }
    };

    heartInterval = setInterval(updateTimerDisplay, 1000);
    updateTimerDisplay(); // Immediate run
}

// Initial Boot
if (window.DataService && window.DataService.init) {
    window.DataService.init().then(() => {
        initApp();
    });
} else {
    initApp();
}
