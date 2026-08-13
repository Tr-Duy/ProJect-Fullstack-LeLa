import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class LandingPage extends BasePage {
  async open() {
    await this.goto('/');
  }

  async expectHeroVisible() {
    await expect(this.page.getByRole('heading', { name: /Học Từ Vựng|Không Nhàm Chán/i })).toBeVisible();
  }

  async goToLogin() {
    await this.clickButton('Đăng nhập');
  }

  async goToRegister() {
    await this.clickButton('Đăng ký');
  }
}
