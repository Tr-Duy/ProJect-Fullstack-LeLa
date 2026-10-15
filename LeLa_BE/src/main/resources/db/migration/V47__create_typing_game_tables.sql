-- 1. Bảng cấu hình bộ thẻ
CREATE TABLE IF NOT EXISTS typing_game_deck_configs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    deck_id BIGINT NOT NULL,
    requires_pro BOOLEAN NOT NULL DEFAULT FALSE,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_typing_game_deck_configs PRIMARY KEY (id),
    CONSTRAINT uk_tg_deck_configs_deck UNIQUE (deck_id),
    CONSTRAINT fk_tg_deck_configs_deck FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng lượt chơi (runs)
CREATE TABLE IF NOT EXISTS typing_game_runs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    public_id VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    deck_id BIGINT NOT NULL,
    mode VARCHAR(10) NOT NULL, -- 'EASY', 'HARD'
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS', 'COMPLETED', 'GAME_OVER', 'ABANDONED'
    score INT NOT NULL DEFAULT 0,
    stage_reached INT NOT NULL DEFAULT 1,
    total_stages INT NOT NULL DEFAULT 1,
    lives_left INT NOT NULL DEFAULT 3,
    current_combo INT NOT NULL DEFAULT 0,
    max_combo INT NOT NULL DEFAULT 0,
    words_cleared INT NOT NULL DEFAULT 0,
    words_missed INT NOT NULL DEFAULT 0,
    total_keystrokes INT NOT NULL DEFAULT 0,
    wrong_keystrokes INT NOT NULL DEFAULT 0,
    accuracy DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    wpm DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    xp_earned INT NOT NULL DEFAULT 0,
    current_stage_served_at DATETIME(6) NULL,
    flagged_cheat BOOLEAN NOT NULL DEFAULT FALSE,
    started_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    finished_at DATETIME(6) NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_typing_game_runs PRIMARY KEY (id),
    CONSTRAINT uk_typing_game_runs_public_id UNIQUE (public_id),
    CONSTRAINT fk_typing_game_runs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_typing_game_runs_deck FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_tg_runs_user_status ON typing_game_runs (user_id, status);
CREATE INDEX idx_tg_runs_user_started ON typing_game_runs (user_id, started_at);
CREATE INDEX idx_tg_runs_deck_status ON typing_game_runs (deck_id, status);

-- 3. Bảng chi tiết từng từ trong lượt chơi
CREATE TABLE IF NOT EXISTS typing_game_run_words (
    id BIGINT NOT NULL AUTO_INCREMENT,
    run_id BIGINT NOT NULL,
    flashcard_id BIGINT NOT NULL,
    stage_no INT NOT NULL,
    position_no INT NOT NULL,
    is_heart_word BOOLEAN NOT NULL DEFAULT FALSE,
    result VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'CLEARED', 'MISSED'
    wrong_keystrokes INT NOT NULL DEFAULT 0,
    client_duration_ms INT NOT NULL DEFAULT 0,
    cleared_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_typing_game_run_words PRIMARY KEY (id),
    CONSTRAINT uk_tg_run_words_run_card UNIQUE (run_id, flashcard_id),
    CONSTRAINT fk_tg_run_words_run FOREIGN KEY (run_id) REFERENCES typing_game_runs(id) ON DELETE CASCADE,
    CONSTRAINT fk_tg_run_words_flashcard FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_tg_run_words_run_stage ON typing_game_run_words (run_id, stage_no);

-- 4. Bảng kỷ lục điểm cao cá nhân
CREATE TABLE IF NOT EXISTS typing_game_high_scores (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    deck_id BIGINT NOT NULL,
    mode VARCHAR(10) NOT NULL, -- 'EASY', 'HARD'
    best_score INT NOT NULL DEFAULT 0,
    best_stage INT NOT NULL DEFAULT 1,
    best_wpm DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    best_accuracy DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    run_id BIGINT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_typing_game_high_scores PRIMARY KEY (id),
    CONSTRAINT uk_tg_high_scores_user_deck_mode UNIQUE (user_id, deck_id, mode),
    CONSTRAINT fk_tg_high_scores_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_tg_high_scores_deck FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
    CONSTRAINT fk_tg_high_scores_run FOREIGN KEY (run_id) REFERENCES typing_game_runs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_tg_high_scores_deck_mode_score ON typing_game_high_scores (deck_id, mode, best_score DESC);

-- 5. Seed dữ liệu mặc định
INSERT IGNORE INTO typing_game_deck_configs (deck_id, requires_pro, is_enabled, created_at, updated_at)
SELECT id, FALSE, TRUE, NOW(6), NOW(6) FROM decks;
