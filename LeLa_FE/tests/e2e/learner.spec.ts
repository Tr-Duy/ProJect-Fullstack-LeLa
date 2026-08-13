import { test, expect } from '../fixtures/auth';
import { ProfilePage } from '../page-objects/profile.page';

test.describe('Learner journeys', () => {
  test.use({ storageState: '.auth/user.json' });

  test('dashboard loads and learner shortcuts are visible', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /Tổng quan học tập/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /BỘ THẺ CỦA TÔI|KHÁM PHÁ BỘ THẺ MỚI|BẢNG XẾP HẠNG|LỊCH SỬ BÀI KIỂM TRA/i })).toHaveCount(4);
  });

  test('profile update works', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.open();
    await profilePage.updateProfile('QA Automation User');
    await expect(page.getByText(/Cập nhật thông tin thành công/i)).toBeVisible();
  });

  test('decks exploration page supports search', async ({ page }) => {
    await page.goto('/decks');
    await expect(page.getByPlaceholder(/Bạn muốn học gì hôm nay/i)).toBeVisible();
    await page.getByPlaceholder(/Bạn muốn học gì hôm nay/i).fill('English');
    await expect(page.getByText(/Khám phá bộ thẻ|Không tìm thấy bộ thẻ nào/i)).toBeVisible();
  });
});
