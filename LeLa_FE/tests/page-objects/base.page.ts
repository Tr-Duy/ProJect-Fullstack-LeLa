import type { Page } from '@playwright/test';

export class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path = '/') {
    await this.page.goto(path);
  }

  async getButton(name: string | RegExp) {
    return this.page.getByRole('button', { name }).first();
  }

  async clickButton(name: string | RegExp) {
    await (await this.getButton(name)).click();
  }

  async getInputByLabel(label: string) {
    const labelLocator = this.page.getByLabel(label, { exact: false }).first();
    if (await labelLocator.count()) {
      return labelLocator;
    }

    const placeholderLocator = this.page.getByPlaceholder(label, { exact: false }).first();
    if (await placeholderLocator.count()) {
      return placeholderLocator;
    }

    const formItem = this.page.locator('label').filter({ hasText: new RegExp(label, 'i') }).first();
    if (await formItem.count()) {
      const container = formItem.locator('xpath=ancestor::div[contains(@class, "ant-form-item")]').first();
      const nestedInput = container.locator('input, textarea, .ant-input-affix-wrapper input').first();
      if (await nestedInput.count()) {
        return nestedInput;
      }
    }

    return this.page.getByRole('textbox', { name: new RegExp(label, 'i') }).first();
  }

  async fillInput(label: string, value: string) {
    const input = await this.getInputByLabel(label);
    await input.fill(value);
  }

  async expectHeading(text: string | RegExp) {
    await this.page.getByRole('heading', { name: text }).first().waitFor();
  }
}
