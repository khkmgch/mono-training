import { expect, openPage, test } from "./support/fixture";
import { deleteUserIfExists, uniqueLoginId } from "./support/users-api";

test.describe('User CRUD', () => {
  test('creates a user from the registration screen', async ({ page, request }) => {
    const loginId = uniqueLoginId('create');

    await openPage(page, '/users');
    await page.getByRole('button', { name: '登録', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'ユーザー登録' })).toBeVisible();

    await page.getByRole('textbox', { name: 'ユーザー ID' }).fill(loginId);
    await page.getByRole('textbox', { name: 'ユーザー名' }).fill('E2E Created');
    await page.getByRole('button', { name: '登録', exact: true }).click();

    await expect(page.getByRole('status')).toContainText('ユーザーを登録しました');
    await expect(page).toHaveURL(/\/users\/[0-9a-f-]{36}$/);
    await expect(page.getByRole('heading', { name: 'ユーザー編集' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'ユーザー ID' })).toHaveValue(loginId);
    await expect(page.getByRole('textbox', { name: 'ユーザー名' })).toHaveValue('E2E Created');

    // Clean up: the new user's id is the last URL segment.
    const id = new URL(page.url()).pathname.split('/').pop()!;
    await deleteUserIfExists(request, id);
  });

  test('finds a user by loginId and opens the detail screen', async ({ page, existingUser }) => {
    await openPage(page, '/users');
    await page.getByRole('searchbox', { name: 'ユーザー ID' }).fill(existingUser.loginId);
    await page.getByRole('button', { name: '検索' }).click();

    const table = page.getByRole('table', { name: 'ユーザー一覧' });
    await expect(table.getByRole('row')).toHaveCount(2); // header row + 1 result
    await table.getByRole('link', { name: existingUser.loginId }).click();

    await expect(page).toHaveURL(`/users/${existingUser.id}`);
    await expect(page.getByRole('textbox', { name: 'ユーザー ID' })).toHaveValue(existingUser.loginId);
    await expect(page.getByRole('textbox', { name: 'ユーザー名' })).toHaveValue(existingUser.fullName);
  });

  test('updates a user from the detail screen', async ({ page, existingUser }) => {
    await openPage(page, `/users/${existingUser.id}`);

    await page.getByRole('textbox', { name: 'ユーザー名' }).fill('E2E Updated');
    await page.getByRole('button', { name: '保存' }).click();

    await expect(page.getByRole('status')).toContainText('ユーザーの情報を更新しました');

    // Reload to prove the change was persisted, not just kept in the form.
    await page.reload();
    await expect(page.getByRole('textbox', { name: 'ユーザー名' })).toHaveValue('E2E Updated');
  });

  test('deletes a user after confirming the dialog', async ({ page, existingUser }) => {
    await openPage(page, `/users/${existingUser.id}`);

    await page.getByRole('button', { name: '削除' }).click();
    const dialog = page.getByRole('alertdialog', { name: 'ユーザーの削除' });
    await expect(dialog).toContainText(existingUser.loginId);
    await dialog.getByRole('button', { name: '削除' }).click();

    await expect(page.getByRole('status')).toContainText('ユーザーを削除しました');
    await expect(page).toHaveURL('/users');

    await page.getByRole('searchbox', { name: 'ユーザー ID' }).fill(existingUser.loginId);
    await page.getByRole('button', { name: '検索' }).click();
    await expect(page.getByText('該当データがありません')).toBeVisible();
  });
});