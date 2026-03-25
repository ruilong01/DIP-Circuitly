CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    class_group VARCHAR(50),
    xp INTEGER DEFAULT 0,
    hearts INTEGER DEFAULT 5,
    role VARCHAR(20) DEFAULT 'user',
    next_heart_restore_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leaderboard_name VARCHAR(50),
    answer_history JSONB DEFAULT '[]'::jsonb,
    stats JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS topic_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    topic_id INTEGER NOT NULL,
    xp_earned INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0,
    completion_count INTEGER DEFAULT 0,
    last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER NOT NULL,
    type VARCHAR(20) DEFAULT 'mcq',
    difficulty VARCHAR(20) DEFAULT 'medium',
    prompt TEXT NOT NULL,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    answer TEXT NOT NULL,
    image_url TEXT,
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON topic_progress(user_id);

CREATE TABLE IF NOT EXISTS user_behaviours (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_behaviours_user ON user_behaviours(user_id);

CREATE TABLE IF NOT EXISTS discussions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_data TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_discussions_recent ON discussions(timestamp DESC);