//tự động hóa việc nạp trạng thái đăng nhập
import { test as base } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const storagePath = fileURLToPath(new URL('../../.auth/user.json', import.meta.url));

export const test = base.extend({
  storageState: async ({}, use) => {
    await use(storagePath);
  },
});

export { expect } from '@playwright/test';
