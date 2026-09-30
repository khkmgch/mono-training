import {test as base, expect, Page} from "@playwright/test";

import { createUser, deleteUserIfExists, uniqueLoginId, User } from "./users-api";

type Fixtures = {
  /** A user created through the API before the test and removed after it. */
  existingUser: User;
};

export const test = base.extend<Fixtures>({
  existingUser: async ({ request }, use) => {
    const user = await createUser(request, {
      loginId: uniqueLoginId('existing'),
      fullName: 'E2E Existing',
    });

    await use(user);

    await deleteUserIfExists(request, user.id);
  },
});

/**
 * Opens a page and waits until SvelteKit has hydrated it. Before hydration the HTML is visible but
 * no JavaScript is attached yet, so typed values can be reset and forms submit without enhancement.
 * The root layout sets `data-hydrated` on <body> in onMount.
 */
export async function openPage(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page.locator('body[data-hydrated]')).toBeAttached({ timeout: 15_000 });
}

export { expect };