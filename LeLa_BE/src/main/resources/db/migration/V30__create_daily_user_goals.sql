CREATE TABLE daily_user_goals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    goal_date DATE NOT NULL,
    target_cards INT NOT NULL,
    confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_daily_goal_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uk_daily_goal_user_date UNIQUE (user_id, goal_date)
);
