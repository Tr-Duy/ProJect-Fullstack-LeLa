import { test, expect } from '../fixtures/auth';
import { ProfilePage } from '../page-objects/profile.page';

test.describe('Learner journeys', () => {
  test.use({ storageState: '.auth/user.json' });

  test('dashboard loads and learner shortcuts are visible', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Chặng hôm nay', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Học từ mới ngay/ })).toBeVisible();
  });




  test('profile update works', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.open();
    await profilePage.updateProfile('QA Automation User');
    await expect(page.getByText(/Cập nhật thông tin thành công|Cập nhật|QA Automation User/i).first()).toBeVisible();
  });


  test('decks exploration page supports search', async ({ page }) => {
    await page.goto('/decks', { waitUntil: 'domcontentloaded' });
    await expect(page.getByPlaceholder(/Bạn muốn học gì hôm nay/i)).toBeVisible();
    await page.getByPlaceholder(/Bạn muốn học gì hôm nay/i).fill('English');
    await expect(page.getByRole('heading', { name: /Khám phá bộ thẻ|Không tìm thấy bộ thẻ nào/i }).first()).toBeVisible();

  });
});

