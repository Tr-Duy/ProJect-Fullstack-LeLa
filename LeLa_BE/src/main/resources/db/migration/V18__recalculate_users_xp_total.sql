UPDATE users u
INNER JOIN (
    SELECT user_id, COALESCE(SUM(xp_earned), 0) as total_xp
    FROM daily_learning_activities
    GROUP BY user_id
) d ON u.id = d.user_id
SET u.xp_total = d.total_xp;
