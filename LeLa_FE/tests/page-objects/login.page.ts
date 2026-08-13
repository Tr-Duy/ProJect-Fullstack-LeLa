import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  async open() {
    await this.goto('/login');
  }

  async login(username: string, password: string) {
    await this.fillInput('Tên đăng nhập hoặc Email', username);
    await this.fillInput('Mật khẩu', password);
    await this.clickButton('Đăng Nhập');
  }

  async expectValidationMessage(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async expectError(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }
}
