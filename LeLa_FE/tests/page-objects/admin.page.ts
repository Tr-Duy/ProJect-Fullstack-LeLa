import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class AdminPage extends BasePage {
  async openDashboard() {
    await this.goto('/admin/dashboard');
  }

  async openDecks() {
    await this.goto('/admin/decks');
  }

  async openQuizzes() {
    await this.goto('/admin/quizzes');
  }

  async expectUnauthorized() {
    await expect(this.page).toHaveURL(/unauthorized|login/);
  }

  async openCreateDeck() {
    await this.clickButton('Thêm bộ thẻ');
  }

  async fillDeckForm({ title, description }: { title: string; description: string }) {
    const textboxes = this.page.locator('form input, form textarea');
    await textboxes.nth(0).fill(title);
    await textboxes.nth(1).fill(description);
    await this.page.getByRole('combobox').nth(0).selectOption({ index: 1 });
    await this.page.getByRole('combobox').nth(1).selectOption({ index: 1 });
    await this.page.getByRole('combobox').nth(2).selectOption({ index: 1 });
  }

  async saveDeck() {
    await this.clickButton('Lưu');
  }

  async deleteFirstDeck() {
    await this.page.getByTitle('Xóa').first().click();
    await this.page.getByRole('button', { name: 'Xóa' }).last().click();
  }
}
