import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: true }));

const { ToastState } = await import('$lib/app/shared/toast');

describe('ToastState (browser)', () => {
	let state: InstanceType<typeof ToastState>;

	beforeEach(() => {
		vi.useFakeTimers();
		state = new ToastState();
	});

	afterEach(() => {
		state.clear();
		vi.useRealTimers();
	});

	it('starts empty', () => {
		expect(state.items).toEqual([]);
	});

	it('push appends a toast with id and createdAt', () => {
		const id = state.push({ type: 'success', message: 'saved' });
		expect(state.items).toHaveLength(1);
		expect(state.items[0]).toMatchObject({ id, type: 'success', message: 'saved' });
		expect(state.items[0].createdAt).toBeTypeOf('number');
	});

	it('dedups by key by replacing the existing entry in place', () => {
		const firstId = state.push({ type: 'info', message: 'one', key: 'k' });
		const secondId = state.push({ type: 'info', message: 'two', key: 'k' });
		expect(secondId).toBe(firstId);
		expect(state.items).toHaveLength(1);
		expect(state.items[0].message).toBe('two');
	});

	it('dismiss removes the matching item', () => {
		const id = state.push({ type: 'success', message: 'a' });
		state.push({ type: 'success', message: 'b' });
		state.dismiss(id);
		expect(state.items).toHaveLength(1);
		expect(state.items[0].message).toBe('b');
	});

	it('dismiss is a no-op when the id is unknown', () => {
		state.push({ type: 'success', message: 'a' });
		expect(() => state.dismiss('does-not-exist')).not.toThrow();
		expect(state.items).toHaveLength(1);
	});

	it('clear removes all items', () => {
		state.push({ type: 'success', message: 'a' });
		state.push({ type: 'success', message: 'b' });
		state.clear();
		expect(state.items).toEqual([]);
	});

	it('autoCloseMs schedules removal', () => {
		const id = state.push({ type: 'success', message: 'a', autoCloseMs: 3000 });
		expect(state.items).toHaveLength(1);
		vi.advanceTimersByTime(2999);
		expect(state.items).toHaveLength(1);
		vi.advanceTimersByTime(1);
		expect(state.items.find((t) => t.id === id)).toBeUndefined();
	});

	it('autoCloseMs of 0 keeps the toast until manual dismiss', () => {
		state.push({ type: 'error', message: 'permanent', autoCloseMs: 0 });
		vi.advanceTimersByTime(60_000);
		expect(state.items).toHaveLength(1);
	});

	it('autoCloseMs absent keeps the toast until manual dismiss', () => {
		state.push({ type: 'success', message: 'persists' });
		vi.advanceTimersByTime(60_000);
		expect(state.items).toHaveLength(1);
	});

	it('dedup by key resets the auto-close timer', () => {
		state.push({ type: 'info', message: 'first', key: 'k', autoCloseMs: 1000 });
		vi.advanceTimersByTime(800);
		state.push({ type: 'info', message: 'second', key: 'k', autoCloseMs: 1000 });
		vi.advanceTimersByTime(800);
		expect(state.items).toHaveLength(1);
		expect(state.items[0].message).toBe('second');
		vi.advanceTimersByTime(300);
		expect(state.items).toHaveLength(0);
	});

	it('dismiss clears the auto-close timer', () => {
		const id = state.push({ type: 'success', message: 'a', autoCloseMs: 1000 });
		state.dismiss(id);
		vi.advanceTimersByTime(2000);
		expect(state.items).toHaveLength(0);
	});
});

describe('ToastState (SSR)', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.doUnmock('$app/environment');
	});

	it('push works without scheduling timers when browser is false', async () => {
		vi.doMock('$app/environment', () => ({ browser: false }));
		const ssr = await import('$lib/app/shared/toast');
		const ssrState = new ssr.ToastState();
		const setSpy = vi.spyOn(globalThis, 'setTimeout');
		ssrState.push({ type: 'success', message: 'ssr', autoCloseMs: 1000 });
		expect(ssrState.items).toHaveLength(1);
		expect(setSpy).not.toHaveBeenCalled();
		setSpy.mockRestore();
	});
});
