import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
	let currentUrl = new URL('https://example.test/users');
	return {
		setUrl(u: URL): void {
			currentUrl = u;
		},
		readUrl(): URL {
			return currentUrl;
		},
		goto: vi.fn()
	};
});

vi.mock('$app/state', () => ({
	page: {
		get url() {
			return mocks.readUrl();
		}
	}
}));

vi.mock('$app/navigation', () => ({
	goto: mocks.goto
}));

const { pushNavigate, replaceNavigate } = await import('$lib/app/shared/ui/list/navigate-helpers');

beforeEach(() => {
	mocks.setUrl(new URL('https://example.test/users'));
	mocks.goto.mockReset();
});

describe('navigate-helpers — same-URL skip', () => {
	describe('pushNavigate', () => {
		it('skips goto when the target URL equals the current URL', () => {
			pushNavigate(new URL('https://example.test/users'));
			expect(mocks.goto).not.toHaveBeenCalled();
		});

		it('calls goto (push) when the target differs', () => {
			pushNavigate(new URL('https://example.test/users?page=2'));
			expect(mocks.goto).toHaveBeenCalledOnce();
			expect(mocks.goto.mock.calls[0][1]).toMatchObject({ replaceState: false });
		});

		it('skips when a cleared empty search resolves back to the current /users', () => {
			pushNavigate(new URL('https://example.test/users'));
			expect(mocks.goto).not.toHaveBeenCalled();
		});

		it('skips when clicking the page the user is already on', () => {
			mocks.setUrl(new URL('https://example.test/users?page=2'));
			pushNavigate(new URL('https://example.test/users?page=2'));
			expect(mocks.goto).not.toHaveBeenCalled();
		});
	});

	describe('replaceNavigate', () => {
		it('skips goto when the target URL equals the current URL', () => {
			replaceNavigate(new URL('https://example.test/users'));
			expect(mocks.goto).not.toHaveBeenCalled();
		});

		it('calls goto (replace) when the target differs', () => {
			replaceNavigate(new URL('https://example.test/users?q=x'));
			expect(mocks.goto).toHaveBeenCalledOnce();
			expect(mocks.goto.mock.calls[0][1]).toMatchObject({ replaceState: true });
		});
	});
});
