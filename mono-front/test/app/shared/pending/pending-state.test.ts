import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: true }));

const { PendingState } = await import('$lib/app/shared/pending');

const flushMicrotasks = (): Promise<void> => Promise.resolve();

describe('PendingState (browser)', () => {
	let state: InstanceType<typeof PendingState>;

	beforeEach(() => {
		vi.useFakeTimers();
		state = new PendingState();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('starts not visible', () => {
		expect(state.visible).toBe(false);
	});

	it('starts not active', () => {
		expect(state.active).toBe(false);
	});

	it('turns active immediately on start, before the flash window elapses', () => {
		state.start();
		expect(state.active).toBe(true);
		expect(state.visible).toBe(false);
	});

	it('stays active while nested operations remain and resets on the final end', () => {
		state.start();
		state.start();
		state.end();
		expect(state.active).toBe(true);
		state.end();
		expect(state.active).toBe(false);
	});

	it('keeps active false on end without a running operation (no negative counter)', () => {
		state.end();
		expect(state.active).toBe(false);
		state.start();
		expect(state.active).toBe(true);
	});

	it('does not turn visible inside the 100ms flash window', () => {
		state.start();
		vi.advanceTimersByTime(99);
		expect(state.visible).toBe(false);
	});

	it('turns visible after 100ms when still active', () => {
		state.start();
		vi.advanceTimersByTime(100);
		expect(state.visible).toBe(true);
	});

	it('stays invisible when the operation ends inside the flash window', () => {
		state.start();
		vi.advanceTimersByTime(50);
		state.end();
		expect(state.visible).toBe(false);
		vi.advanceTimersByTime(200);
		expect(state.visible).toBe(false);
	});

	it('balances counter: start, start, end keeps visible after delay', () => {
		state.start();
		state.start();
		vi.advanceTimersByTime(100);
		expect(state.visible).toBe(true);
		state.end();
		expect(state.visible).toBe(true);
	});

	it('balances counter: start, end, end resets visibility (extra end is no-op)', () => {
		state.start();
		vi.advanceTimersByTime(100);
		expect(state.visible).toBe(true);
		state.end();
		expect(state.visible).toBe(false);
		expect(() => state.end()).not.toThrow();
		expect(state.visible).toBe(false);
	});

	it('keeps visible while three concurrent paths are active and resets on the third end', () => {
		state.start(); // navigation
		state.start(); // form submit
		state.start(); // ad-hoc
		vi.advanceTimersByTime(100);
		expect(state.visible).toBe(true);
		state.end();
		state.end();
		expect(state.visible).toBe(true);
		state.end();
		expect(state.visible).toBe(false);
	});

	it('run() ends pending after the wrapped promise resolves', async () => {
		const resolved = state.run(async () => {
			vi.advanceTimersByTime(100);
			expect(state.visible).toBe(true);
			return 42;
		});
		await flushMicrotasks();
		const value = await resolved;
		expect(value).toBe(42);
		expect(state.visible).toBe(false);
	});

	it('run() ends pending even when the wrapped promise rejects', async () => {
		const promise = state.run(async () => {
			throw new Error('boom');
		});
		await expect(promise).rejects.toThrow('boom');
		expect(state.visible).toBe(false);
	});
});

describe('PendingState (SSR)', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.doUnmock('$app/environment');
	});

	it('visible and active are always false and start does not schedule timers', async () => {
		vi.doMock('$app/environment', () => ({ browser: false }));
		const ssr = await import('$lib/app/shared/pending');
		const ssrState = new ssr.PendingState();
		const setSpy = vi.spyOn(globalThis, 'setTimeout');
		ssrState.start();
		ssrState.start();
		expect(ssrState.visible).toBe(false);
		expect(ssrState.active).toBe(false);
		expect(setSpy).not.toHaveBeenCalled();
		setSpy.mockRestore();
	});
});
