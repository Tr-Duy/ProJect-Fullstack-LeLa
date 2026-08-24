import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class ProfilePage extends BasePage {
  async open() {
    const today = new Date().toISOString().split('T')[0];
    await this.page.addInitScript((date) => {
      localStorage.setItem('lela_last_goal_prompt_date', date);
    }, today);
    await this.goto('/profile');
    await this.page.waitForSelector('#fullName', { state: 'visible', timeout: 10000 });
  }


  async updateProfile(fullName: string) {
    const modalClose = this.page.locator('.ant-modal-wrap button').first();
    if (await modalClose.isVisible().catch(() => false)) {
      await modalClose.click({ force: true }).catch(() => {});
    }
    const input = this.page.locator('#fullName').first();
    await input.click({ force: true });
    await input.fill(fullName);
    await input.press('Tab');
    const btn = this.page.getByRole('button', { name: /Lưu Thay Đổi/i }).first();
    await btn.scrollIntoViewIfNeeded();
    const responsePromise = this.page.waitForResponse(resp => resp.url().includes('/profile') && resp.request().method() === 'PATCH', { timeout: 10000 }).catch(() => null);
    await btn.click({ force: true });
    await responsePromise;
  }







  async expectUpdatedMessage() {
    await expect(this.page.getByText(/Cập nhật thông tin thành công/i)).toBeVisible();
  }
}
