import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActionResult, SubmitFunction } from '@sveltejs/kit';

vi.mock('$app/environment', () => ({ browser: true }));

let captured: SubmitFunction | undefined;
const enhanceSpy = vi.fn(<F extends SubmitFunction>(_node: HTMLFormElement, fn?: F) => {
	captured = fn;
	return { destroy: vi.fn() };
});
vi.mock('$app/forms', () => ({
	enhance: enhanceSpy
}));

const fakePending = {
	starts: 0,
	ends: 0,
	visible: false,
	start: vi.fn(),
	end: vi.fn(),
	run: vi.fn()
};
vi.mock('$lib/app/shared/pending/context.svelte', () => ({
	getPendingContext: () => fakePending,
	setPendingContext: vi.fn()
}));

const { enhanceWithPending } = await import('$lib/app/shared/pending/enhance-with-pending');

const buildSubmitInput = (
	overrides: Partial<Parameters<SubmitFunction>[0]> = {}
): Parameters<SubmitFunction>[0] => {
	const formData = overrides.formData ?? new FormData();
	const formElement = overrides.formElement ?? document.createElement('form');
	const action = overrides.action ?? new URL('http://test/users');
	const controller = overrides.controller ?? new AbortController();
	const submitter = overrides.submitter ?? null;
	const cancel = overrides.cancel ?? vi.fn();
	return { formData, formElement, action, controller, submitter, cancel };
};

const successResult = (data: Record<string, unknown> = {}): ActionResult => ({
	type: 'success',
	status: 200,
	data
});

describe('enhanceWithPending', () => {
	beforeEach(() => {
		fakePending.start.mockClear();
		fakePending.end.mockClear();
		captured = undefined;
		enhanceSpy.mockClear();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('forwards the form node and a wrapped SubmitFunction to enhance', () => {
		const node = document.createElement('form');
		enhanceWithPending(node);
		expect(enhanceSpy).toHaveBeenCalledOnce();
		expect(enhanceSpy.mock.calls[0]?.[0]).toBe(node);
		expect(typeof captured).toBe('function');
	});

	it('exposes controller and submitter to the user submit fn', async () => {
		const userSubmit = vi.fn(async (_input: Parameters<SubmitFunction>[0]) => {});
		enhanceWithPending(document.createElement('form'), userSubmit);
		const controller = new AbortController();
		const submitter = document.createElement('button');
		await captured!(buildSubmitInput({ controller, submitter }));
		const arg = userSubmit.mock.calls[0]?.[0];
		expect(arg?.controller).toBe(controller);
		expect(arg?.submitter).toBe(submitter);
		expect(arg?.controller.signal).toBeInstanceOf(AbortSignal);
	});

	it('starts pending on submit and ends after the post-submit callback resolves', async () => {
		const userSubmit = vi.fn(
			async (_input: Parameters<SubmitFunction>[0]) =>
				async (_callback: { result: ActionResult; update: () => Promise<void> }) => {}
		);
		enhanceWithPending(document.createElement('form'), userSubmit);
		const callback = await captured!(buildSubmitInput());
		expect(fakePending.start).toHaveBeenCalledOnce();
		expect(fakePending.end).not.toHaveBeenCalled();
		await callback!({
			formData: new FormData(),
			formElement: document.createElement('form'),
			action: new URL('http://test'),
			result: successResult(),
			update: vi.fn(async () => {})
		});
		expect(fakePending.end).toHaveBeenCalledOnce();
	});

	it('calls update() automatically when the user did not return a callback', async () => {
		const update = vi.fn(async () => {});
		enhanceWithPending(document.createElement('form'), async () => undefined);
		const callback = await captured!(buildSubmitInput());
		await callback!({
			formData: new FormData(),
			formElement: document.createElement('form'),
			action: new URL('http://test'),
			result: successResult(),
			update
		});
		expect(update).toHaveBeenCalledOnce();
	});

	it('ends pending when user fn calls cancel and returns no callback', async () => {
		const cancel = vi.fn();
		enhanceWithPending(document.createElement('form'), async ({ cancel: c }) => {
			c();
		});
		const result = await captured!(buildSubmitInput({ cancel }));
		expect(cancel).toHaveBeenCalledOnce();
		expect(fakePending.end).toHaveBeenCalledOnce();
		expect(result).toBeUndefined();
	});

	it('ends pending when user fn throws', async () => {
		enhanceWithPending(document.createElement('form'), async () => {
			throw new Error('boom');
		});
		await expect(captured!(buildSubmitInput())).rejects.toThrow('boom');
		expect(fakePending.end).toHaveBeenCalledOnce();
	});

	it('ends pending even when the post-submit callback throws', async () => {
		const userSubmit = vi.fn(async () => async () => {
			throw new Error('callback boom');
		});
		enhanceWithPending(document.createElement('form'), userSubmit);
		const callback = await captured!(buildSubmitInput());
		await expect(
			callback!({
				formData: new FormData(),
				formElement: document.createElement('form'),
				action: new URL('http://test'),
				result: successResult(),
				update: vi.fn(async () => {})
			})
		).rejects.toThrow('callback boom');
		expect(fakePending.end).toHaveBeenCalledOnce();
	});
});
