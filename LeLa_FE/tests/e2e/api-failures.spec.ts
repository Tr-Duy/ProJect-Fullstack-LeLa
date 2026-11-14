import { test, expect } from '@playwright/test';

test.describe('API failure and loading states', () => {
  test('handles failed auth request gracefully', async ({ page }) => {
    await page.context().clearCookies();

    await page.route('**/auth/login', route => route.fulfill({ status: 500, body: JSON.stringify({ message: 'Server error' }) }));
    await page.goto('/login');
    await page.getByLabel(/Tên đăng nhập hoặc email/i).fill('qa');
    await page.getByPlaceholder(/Nhập mật khẩu của bạn/i).fill('qa');
    await page.getByRole('button', { name: /^Đăng nhập$/i }).click();

    await expect(page).toHaveURL(/\/login/);
  });

  test('shows empty states for no data', async ({ page }) => {
    await page.route('**/quiz-attempts/my*', route => route.fulfill({ status: 200, body: JSON.stringify({ data: { content: [] } }) }));
    await page.goto('/my-quiz-attempts');
    await expect(page.getByText(/Chưa có bài kiểm tra nào/i)).toBeVisible();
  });
});
