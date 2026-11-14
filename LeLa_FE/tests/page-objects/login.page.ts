import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  async open() {
    await this.goto('/login');
  }

  async login(username: string, password: string) {
    await this.page.getByLabel(/^Tên đăng nhập hoặc email$/i).fill(username);
    await this.page.getByLabel(/^Mật khẩu$/i).fill(password);
    await this.page.getByRole('button', { name: /^Đăng nhập$/i }).click();
  }

  async expectValidationMessage(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async expectError(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }
}
