import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: true }));

const { ConfirmState } = await import('$lib/app/shared/confirmation');

describe('ConfirmState (browser)', () => {
	let state: InstanceType<typeof ConfirmState>;

	beforeEach(() => {
		state = new ConfirmState();
	});

	it('starts with no active intent', () => {
		expect(state.intent).toBeNull();
	});

	it('ask installs the intent and returns a Promise pending until resolve', async () => {
		const intent = { title: 'Confirm', message: 'Proceed?' };
		const promise = state.ask(intent);
		expect(state.intent).toEqual(intent);

		state.resolve(true);
		await expect(promise).resolves.toBe(true);
		expect(state.intent).toBeNull();
	});

	it('resolves false on cancel and clears the intent', async () => {
		const promise = state.ask({ title: 't', message: 'm' });
		state.resolve(false);
		await expect(promise).resolves.toBe(false);
		expect(state.intent).toBeNull();
	});

	it('discards a previous ask by resolving it false when a new ask arrives', async () => {
		const first = state.ask({ title: 'first', message: 'm1' });
		const second = state.ask({ title: 'second', message: 'm2' });

		await expect(first).resolves.toBe(false);
		expect(state.intent).toEqual({ title: 'second', message: 'm2' });

		state.resolve(true);
		await expect(second).resolves.toBe(true);
	});

	it('resolve is a no-op when no ask is pending', () => {
		expect(() => state.resolve(true)).not.toThrow();
		expect(state.intent).toBeNull();
	});
});

describe('ConfirmState (SSR)', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.doUnmock('$app/environment');
	});

	it('ask resolves false immediately when browser is false', async () => {
		vi.doMock('$app/environment', () => ({ browser: false }));
		const ssr = await import('$lib/app/shared/confirmation');
		const ssrState = new ssr.ConfirmState();
		await expect(ssrState.ask({ title: 't', message: 'm' })).resolves.toBe(false);
		expect(ssrState.intent).toBeNull();
	});
});
