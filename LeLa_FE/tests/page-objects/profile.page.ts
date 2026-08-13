import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class ProfilePage extends BasePage {
  async open() {
    await this.goto('/');
    const today = new Date().toISOString().split('T')[0];
    await this.page.evaluate((date) => {
      localStorage.setItem('lela_last_goal_prompt_date', date);
    }, today);

    await this.goto('/profile');
  }

  async updateProfile(fullName: string) {
    await this.fillInput('Họ và Tên', fullName);
    await this.clickButton('Lưu Thay Đổi');
  }

  async expectUpdatedMessage() {
    await expect(this.page.getByText(/Cập nhật thông tin thành công/i)).toBeVisible();
  }
}
