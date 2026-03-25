// Main App Entry
const app = document.getElementById('app');

const ROUTES = { // constant object used as maps like buttons on an elevator
    LOGIN: 'login',
    HOME: 'home',
    QUIZ: 'quiz',
    RESULT: 'result',
    PROFILES: 'profiles',
    ADMIN: 'admin',
    UNFAMILIAR: 'unfamiliar',
    LEADERBOARD: 'leaderboard',
    DISCUSSION: 'discussion'
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
    localStorage.removeItem('privacyAccepted'); // Clear old persistent acceptance
    render();

    // Initialize Chatbot UI Globally
    if (window.ChatbotUI) {
        window.ChatbotUI.init();
    }
};

const checkPrivacyNotice = () => {
    const isAccepted = sessionStorage.getItem('privacyAccepted') === 'true';
    if (!isAccepted && window.PrivacyModal) {
        // Prevent duplicates
        if (document.getElementById('privacy-modal-overlay')) return;

        const modal = window.PrivacyModal({
            onAccept: () => {
                sessionStorage.setItem('privacyAccepted', 'true'); // Changed to sessionStorage
                console.log("Privacy accepted.");
            }
        });
        modal.id = 'privacy-modal-overlay';
        document.body.appendChild(modal);
    }
};

const loadUser = (profile) => {
    State = {
        ...State,
        view: profile.role === 'admin' ? ROUTES.ADMIN : ROUTES.HOME,
        username: profile.name,
        studentId: profile.studentId,
        xp: profile.xp,
        hearts: profile.hearts,
        nextHeartRestoreTime: profile.nextHeartRestoreTime || null,
        topicProgress: profile.topicProgress || {},
        revisionPool: profile.revisionPool || [],
        isAdmin: profile.role === 'admin'
    };

    sessionStorage.removeItem('privacyAccepted');
    render();
    checkPrivacyNotice();
    
    // Resume the heart timer if one was already running
    if (State.hearts < 5) {
        if (!State.nextHeartRestoreTime) {
            // Start fresh timer
            State.nextHeartRestoreTime = Date.now() + (5 * 60 * 1000);
            if (window.ProfileService) {
                window.ProfileService.updateProgress(State.studentId, { nextHeartRestoreTime: State.nextHeartRestoreTime });
            }
        }
        startHeartTimer();
    }
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
                <div class="brand-logo-compact" id="logo-btn" style="pointer-events: auto; cursor:pointer;" title="Home">
                    <div class="logo-icon">I</div>
                    <div class="logo-text">Impulse</div>
                </div>
                <div class="stats-container">
                    <div class="stat-pill glass-pill accent-pill">ADMINISTRATOR</div>
                    
                    <div class="stat-pill glass-pill" style="cursor:pointer; margin-right: 8px;" id="admin-dashboard-btn" title="Admin Dashboard">
                         ⚙️ Dashboard
                    </div>

                    <div class="stat-pill glass-pill" style="cursor:pointer; margin-right: 8px;" id="admin-leaderboard-btn" title="Leaderboard">
                         🏆 Leaderboard
                    </div>

                    <div class="stat-pill glass-pill" style="cursor:pointer; background:rgba(255, 50, 50, 0.2);" id="logout-btn">
                        🚪 Log Out
                    </div>
                </div>
            `;
        } else {
            header.innerHTML = `
                <div class="brand-logo-compact" id="logo-btn" style="pointer-events: auto; cursor:pointer;">
                    <div class="logo-icon">I</div>
                    <div class="logo-text">Impulse</div>
                </div>
                ${isLoggedIn ? `
                <div class="stats-container">
                    <div class="stat-pill glass-pill" id="heart-btn" style="cursor:pointer" title="Click to refill">
                        <span style="margin-right:8px">❤️</span> ${State.hearts}
                        ${State.hearts < 5 ? `<span id="heart-timer" style="font-size:0.7rem; color:#f87171; margin-left:6px;">...</span>` : ''}
                    </div>
                    <div class="stat-pill glass-pill accent-pill"><span style="margin-right:8px">⚡</span> ${State.xp} XP</div>
                    
                    <!-- Leaderboard Menu -->
                    <div class="stat-pill glass-pill" style="cursor:pointer; margin-right: 8px;" id="leaderboard-tab-btn" title="Leaderboard">
                         🏆 Leaderboard
                    </div>

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
            // Logo -> go to topic menu (home) without reloading
            const logoBtn = document.getElementById('logo-btn');
            if (logoBtn) logoBtn.onclick = () => {
                if (State.studentId) {
                    State.view = ROUTES.HOME;
                    render();
                }
            };

            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) logoutBtn.onclick = () => {
                if (confirm('Log out?')) {
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
                        window.StatsChart({ profile: profile });
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

                const lbBtn = document.getElementById('leaderboard-tab-btn');
                if (lbBtn) lbBtn.onclick = () => {
                    State.view = ROUTES.LEADERBOARD;
                    render();
                };
            } else {
                // Admin specific buttons
                const adminDashBtn = document.getElementById('admin-dashboard-btn');
                if (adminDashBtn) adminDashBtn.onclick = () => {
                    State.view = ROUTES.ADMIN;
                    render();
                };

                const adminLbBtn = document.getElementById('admin-leaderboard-btn');
                if (adminLbBtn) adminLbBtn.onclick = () => {
                    State.view = ROUTES.LEADERBOARD;
                    render();
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
                            window.ProfileService.logBehaviour('login', { username });
                            
                            // Check for leaderboard name (Onboarding)
                            if (!result.profile.leaderboard_name && window.LeaderboardNameModal) {
                                const modal = window.LeaderboardNameModal({
                                    onSave: async (newName) => {
                                        await window.ProfileService.updateLeaderboardName(result.profile.studentId, newName);
                                        result.profile.leaderboard_name = newName;
                                        loadUser(result.profile);
                                    }
                                });
                                document.body.appendChild(modal);
                            } else {
                                loadUser(result.profile);
                            }
                        } else {
                            alert(result.error);
                        }
                    },
                    onRegister: async (data) => {
                        const result = await window.ProfileService.addProfile(data);
                        if (result.success) {
                            window.ProfileService.logBehaviour('register', { username: data.username });
                            // Let's auto-login for better UX
                            const auth = await window.ProfileService.authenticate(data.username, data.password);
                            if (auth.success) loadUser(auth.profile);
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
                        window.ProfileService.logBehaviour('start_topic', { topicId });
                        State.view = ROUTES.QUIZ;
                        render();
                    },
                    onStartRevision: () => {
                        if (State.hearts <= 0) {
                            alert("You have no hearts left!");
                            return;
                        }
                        State.activeTopicId = 'revision';
                        window.ProfileService.logBehaviour('start_revision', { count: State.revisionPool.length });
                        State.view = ROUTES.QUIZ;
                        render();
                    },
                    onStartUnfamiliar: () => {
                        window.ProfileService.logBehaviour('start_unfamiliar');
                        State.view = ROUTES.UNFAMILIAR;
                        render();
                    },
                    onDiscussion: () => {
                        State.view = ROUTES.DISCUSSION;
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
                        render();
                    }
                });
            }
            break;

        case ROUTES.DISCUSSION:
            if (window.DiscussionPanel) {
                component = window.DiscussionPanel({
                    onBack: () => {
                        State.view = ROUTES.HOME;
                        render();
                    }
                });
            }
            break;

        case ROUTES.LEADERBOARD:
            if (window.Leaderboard) {
                component = window.Leaderboard();
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
                            window.ProfileService.updateStats(
                                State.studentId,
                                State.activeTopicId,
                                result.correctCount,    // correctAdded
                                result.totalQuestions,  // totalAdded
                                earnedScore,            // xpAdded
                                timeSpent               // timeAdded
                            );

                            if (!passed && State.hearts > 0) {
                                State.hearts--;
                                // Record timer start time - will call startHeartTimer after render
                                if (!State.nextHeartRestoreTime) {
                                    State.nextHeartRestoreTime = Date.now() + (5 * 60 * 1000);
                                    window.ProfileService.updateProgress(State.studentId, { nextHeartRestoreTime: State.nextHeartRestoreTime, hearts: State.hearts });
                                }
                            }

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
                            
                            window.ProfileService.updateStats(
                                State.studentId,
                                'revision', // topicId as revision string
                                result.correctCount,
                                result.totalQuestions,
                                earnedScore,
                                timeSpent
                            );
                        }

                        syncState();
                        State.view = ROUTES.HOME;
                        render();

                        // Start heart timer AFTER render so #heart-btn exists in the DOM
                        if (State.hearts < 5 && State.nextHeartRestoreTime) {
                            startHeartTimer();
                        }
                    },
                    onExit: () => {
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
                            loadUser(profile);
                        }
                    }
                });
            }
            break;

        case ROUTES.ADMIN:
            if (window.AdminDashboard) {
                component = window.AdminDashboard({
                    onViewAsUser: () => {
                        State.view = ROUTES.HOME;
                        render();
                    }
                });
            }
            break;
    }

    if (component) app.appendChild(component);

}

// Heart Timer Logic
let heartInterval = null;

function startHeartTimer() {
    if (heartInterval) clearInterval(heartInterval);
    if (State.hearts >= 5) return; // nothing to do

    const REGEN_MS = 5 * 60 * 1000; // 5 minutes per heart

    const tick = () => {
        if (State.hearts >= 5 || !State.nextHeartRestoreTime) {
            clearInterval(heartInterval);
            heartInterval = null;
            // Refresh header so timer span disappears
            render();
            return;
        }

        const diff = State.nextHeartRestoreTime - Date.now();

        if (diff <= 0) {
            // Restore one heart
            State.hearts = Math.min(5, State.hearts + 1);

            if (State.hearts >= 5) {
                State.hearts = 5;
                State.nextHeartRestoreTime = null;
                clearInterval(heartInterval);
                heartInterval = null;
            } else {
                // Schedule next heart
                State.nextHeartRestoreTime = Date.now() + REGEN_MS;
            }

            // Persist
            if (window.ProfileService && State.studentId) {
                window.ProfileService.updateProgress(State.studentId, {
                    hearts: State.hearts,
                    nextHeartRestoreTime: State.nextHeartRestoreTime
                });
            }

            // Re-render header so heart count updates
            render();

            // If still missing hearts, keep ticking
            if (heartInterval === null && State.hearts < 5) {
                startHeartTimer();
            }
            return;
        }

        // Update the countdown text inside the heart pill
        const btn = document.getElementById('heart-btn');
        if (btn) {
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            const countdown = `(+1 in ${m}:${s.toString().padStart(2, '0')})`;
            // Replace inner HTML to show updated count + countdown
            btn.innerHTML = `<span style="margin-right:8px">❤️</span> ${State.hearts} <span id="heart-timer" style="font-size:0.7rem;color:#f87171;margin-left:6px;">${countdown}</span>`;
        }
    };

    heartInterval = setInterval(tick, 1000);
    // First tick after a short delay so DOM is ready
    setTimeout(tick, 100);
}

// Initial Boot
if (window.DataService && window.DataService.init) {
    window.DataService.init().then(() => {
        initApp();
    });
} else {
    initApp();
}
