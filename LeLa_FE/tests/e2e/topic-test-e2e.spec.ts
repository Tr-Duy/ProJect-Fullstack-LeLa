import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOT_DIR = path.resolve(__dirname, '../../../docs/screenshots/topic-tests');

function runSql(sql: string) {
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);
  for (const s of statements) {
    const sanitized = s.replace(/\r?\n/g, ' ').replace(/"/g, '\\"');
    const cmd = `python -c "import pymysql; conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password='123456', database='lela_db'); cur = conn.cursor(); cur.execute(\\"${sanitized}\\"); conn.commit()"`;
    execSync(cmd, { stdio: 'inherit' });
  }
}

function querySql(sql: string): any {
  const sanitized = sql.replace(/\r?\n/g, ' ').replace(/"/g, '\\"');
  const cmd = `python -c "import pymysql, json; conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password='123456', database='lela_db'); cur = conn.cursor(); cur.execute(\\"${sanitized}\\"); print(json.dumps(cur.fetchall()))"`;
  const out = execSync(cmd).toString().trim();
  return JSON.parse(out);
}

test.describe('Topic-Based Tests (Bài thi theo chủ đề) E2E Flow', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeAll(() => {
    // 1. Reset user 3 (learner1)
    runSql(`
      DELETE FROM card_progress WHERE user_id = 3;
      DELETE FROM daily_learning_activities WHERE user_id = 3;
      DELETE FROM quiz_attempts WHERE user_id = 3;
      DELETE FROM deck_enrollments WHERE user_id = 3;
      DELETE FROM daily_user_goals WHERE user_id = 3;
      DELETE FROM user_achievements WHERE user_id = 3;
      INSERT INTO daily_user_goals (user_id, goal_date, target_cards, confirmed, created_at, updated_at) VALUES (3, CURDATE(), 20, 1, NOW(), NOW());
      INSERT INTO deck_enrollments (user_id, deck_id, status, created_at, updated_at, topic_test_passed)
      VALUES (3, 18, 'ACTIVE', NOW(), NOW(), FALSE),
             (3, 8, 'ACTIVE', NOW(), NOW(), FALSE);
      UPDATE users SET prompt_daily_goal = FALSE, xp_total = 0, streak_current = 0, streak_longest = 0, last_activity_date = NULL WHERE id = 3;
    `);
  });

  test('Complete journey: locked -> insufficient cards -> study threshold -> unlock -> exam modal -> submit & result -> XP & streak verified', async ({ page }) => {
    test.setTimeout(90000);

    page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err));
    page.on('request', req => {
      if (req.url().includes('deck-tests')) console.log('REQ:', req.method(), req.url());
    });
    page.on('response', async res => {
      if (res.url().includes('deck-tests')) {
        console.log('RES:', res.status(), res.url());
        try { console.log('BODY:', await res.text()); } catch {}
      }
    });

    // 1. Login as learner1
    await page.goto('http://localhost:5173/login');
    await page.fill('#usernameOrEmail', 'learner1');
    await page.fill('#password', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard.*/, { timeout: 15000 });

    // Dismiss daily goal modal if visible
    const skipGoalBtn = page.locator('button:has-text("Bỏ qua")');
    if (await skipGoalBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipGoalBtn.click();
      await page.waitForTimeout(300);
    }

    // 2. Visit Deck 18 (Contracts - 16 valid cards, currently 0 learned => LOCKED)
    await page.goto('http://localhost:5173/decks/18');
    await expect(page.locator('text=TOEIC Dưới 500 - Contracts').first()).toBeVisible({ timeout: 10000 });
    
    // Topic test section
    await expect(page.locator('text=BÀI THI CHỦ ĐỀ').first()).toBeVisible();
    await expect(page.locator('text=ĐANG KHÓA').first()).toBeVisible();
    await expect(page.locator('text=/ 8 thẻ yêu cầu (16 thẻ hợp lệ)').first()).toBeVisible();
    await expect(page.locator('text=Cần học thêm 8 thẻ để mở khóa bài thi').first()).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_deck_detail_locked.png'), fullPage: true });

    // 3. Visit Deck 8 (Numbers - 5 valid cards, < 8 => INSUFFICIENT DATA)
    await page.goto('http://localhost:5173/decks/8');
    await expect(page.locator('text=Số đếm (Numbers)').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Bộ thẻ này chưa đủ dữ liệu cho bài thi').first()).toBeVisible();
    await expect(page.locator('text=Hệ thống yêu cầu tối thiểu 8 thẻ').first()).toBeVisible();
    await expect(page.locator('button:has-text("LÀM BÀI THI")')).toHaveCount(0);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_deck_detail_insufficient_cards.png'), fullPage: true });

    // 4. Progress learner1 on Deck 18: learn 8 cards (50% threshold)
    runSql(`
      INSERT INTO card_progress (user_id, card_id, state, repetitions, interval_days, ease_factor, created_at, updated_at)
      SELECT 3, id, 'LEARNING', 1, 1, 2.50, NOW(), NOW()
      FROM flashcards WHERE deck_id = 18 AND is_active = 1 LIMIT 8;
    `);

    // 5. Reload Deck 18 => Now ELIGIBLE!
    await page.goto('http://localhost:5173/decks/18');
    await expect(page.locator('text=ĐÃ ĐỦ ĐIỀU KIỆN THI').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/ 8 thẻ yêu cầu (16 thẻ hợp lệ)').first()).toBeVisible();
    const startTestBtn = page.locator('button:has-text("LÀM BÀI THI CHỦ ĐỀ")');
    await expect(startTestBtn).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_deck_detail_eligible.png'), fullPage: true });

    // 6. Visit Assessment Center / Final Level Tests page
    await page.goto('http://localhost:5173/final-level-tests');
    await expect(page.locator('button:has-text("BÀI THI THEO CHỦ ĐỀ")')).toBeVisible({ timeout: 10000 });
    
    // Switch to Topic Tests Tab
    await page.click('button:has-text("BÀI THI THEO CHỦ ĐỀ")');
    await expect(page.locator('text=TOEIC Dưới 500 - Contracts').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Bộ thẻ chưa có bài thi (chưa đủ dữ liệu tối thiểu)').first()).toBeVisible();
    await expect(page.locator('text=Số đếm (Numbers)').first()).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_assessment_center_topic_tests_tab.png'), fullPage: true });

    // 7. Click start test on Deck 18
    await page.goto('http://localhost:5173/decks/18');
    const startBtn = page.locator('button:has-text("LÀM BÀI THI CHỦ ĐỀ")');
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();

    // 8. Test Modal appears!
    const quizDialog = page.getByRole('dialog').filter({ hasText: 'Chọn đáp án đúng' });
    await expect(quizDialog).toBeVisible({ timeout: 15000 });
    await expect(quizDialog.locator('text=1/12').first()).toBeVisible();
    await expect(quizDialog.locator('button[aria-label="Tạm dừng"]')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_deck_test_modal_active.png'), fullPage: true });

    // 9. Answer question 1 correctly and finish exam
    const cardMapping: Record<string, string> = {
      'Tuân theo, chịu theo': 'Abide by',
      'Sự thoả thuận': 'Agreement',
      'Đồng ý': 'Agree',
      'Bảo đảm, chắc chắn': 'Assurance',
      'Hủy bỏ': 'Cancel',
      'Giải quyết vấn đề, xác định': 'Determine',
      'Thuê mướn, hứa hẹn': 'Engage',
      'Thành lập, thiết lập': 'Establish',
      'Bắt buộc, ép buộc': 'Obligate',
      'Nghĩa vụ, bổn phận': 'Obligation',
      'Nhóm làm việc chung, bên tham gia': 'Party',
      'Sự cung cấp, điều khoản': 'Provision',
      'Nhà cung cấp': 'Provider',
      'Kiên quyết, giải quyết': 'Resolve',
      'Định rõ, ghi rõ': 'Specify',
      'Sự chỉ rõ, đặc tả': 'Specification',
    };

    const promptText = (await quizDialog.locator('p.text-xl').first().textContent())?.trim() || '';
    const expectedAnswer = cardMapping[promptText];
    if (expectedAnswer) {
      await quizDialog.locator(`button:has-text("${expectedAnswer}")`).first().click();
    } else {
      const choiceButtons = quizDialog.locator('button:not([aria-label]):not(.ant-btn-primary)');
      if (await choiceButtons.count() > 0) {
        await choiceButtons.first().click();
      }
    }
    await page.waitForTimeout(600);

    // Exit & submit attempt
    await quizDialog.locator('button[aria-label="Thoát"]').click();
    await page.waitForTimeout(400);
    const exitSubmitBtn = quizDialog.locator('button.ant-btn-dangerous, button:has-text("Thoát")');
    await exitSubmitBtn.last().click();

    // Await result page
    await page.waitForURL(/.*\/quiz-attempts\/.*\/result.*/, { timeout: 20000 });
    await expect(page.locator('text=Kết quả').first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_quiz_result_page.png'), fullPage: true });

    // 10. Verify XP & Streak in Database
    const userRows = querySql('SELECT xp_total, streak_current FROM users WHERE id = 3');
    console.log('Database user row after submission:', userRows);
    const xpTotal = userRows[0][0];
    const streak = userRows[0][1];
    expect(xpTotal).toBeGreaterThanOrEqual(1);
    expect(streak).toBeGreaterThanOrEqual(1);

    const activityRows = querySql('SELECT xp_earned, quiz_count FROM daily_learning_activities WHERE user_id = 3');
    console.log('Daily learning activity row:', activityRows);
    expect(activityRows.length).toBeGreaterThanOrEqual(1);
    expect(activityRows[0][1]).toBeGreaterThanOrEqual(1);
  });
});
