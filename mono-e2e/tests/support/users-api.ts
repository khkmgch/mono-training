import { APIRequestContext, expect } from "@playwright/test";

/** Quarkus REST API. Test data is prepared here directly, not through the UI. */
const API_URL = 'http://localhost:8080/users';

export type User = {
  id: string;
  loginId: string;
  fullName: string;
  version: number;
};

/** Returns a loginId no other test (or earlier run) uses, so tests never collide. */
export function uniqueLoginId(label: string): string {
  return `e2e-${label}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function createUser(request: APIRequestContext, data: { loginId: string; fullName: string}): Promise<User> {
    const response  = await request.post(API_URL, { data });
    await expect(response).toBeOK();
    return (await response.json()) as User;
}

export async function deleteUserIfExists(request: APIRequestContext, id: string): Promise<void> {
    const current = await request.get(`${API_URL}/${id}`);
    if (current.status() === 404) return;
    await expect(current).toBeOK();

    const { version } = (await current.json()) as User;
    const response = await request.delete(`${API_URL}/${id}`, { params: { version } });
    await expect(response).toBeOK();
}

