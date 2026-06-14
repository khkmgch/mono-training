import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActionResult, SubmitFunction } from '@sveltejs/kit';

vi.mock('$app/environment', () => ({ browser: true }));

const gotoSpy = vi.fn(async (_target: string) => {});
const invalidateSpy = vi.fn(async () => {});
vi.mock('$app/navigation', () => ({ goto: gotoSpy, invalidate: invalidateSpy }));

// applyAction touches the SvelteKit client runtime (app.*), which isn't
// initialized under unit tests — stub it so redirect/error paths stay testable.
vi.mock('$app/forms', () => ({ applyAction: vi.fn() }));

const focusFirstFieldErrorSpy = vi.fn();
vi.mock('$lib/app/shared/error/transform/focus-first-field-error', () => ({
	focusFirstFieldError: focusFirstFieldErrorSpy
}));

let confirmAnswers: boolean[] = [];
const confirmAskSpy = vi.fn(async () => {
	const next = confirmAnswers.shift();
	return next ?? false;
});
const fakeConfirmState = {
	intent: null,
	ask: confirmAskSpy,
	resolve: vi.fn()
};
vi.mock('$lib/app/shared/confirmation', async () => {
	const actual = await vi.importActual<typeof import('$lib/app/shared/confirmation')>(
		'$lib/app/shared/confirmation'
	);
	return { ...actual, getConfirmContext: () => fakeConfirmState };
});

const toastPushSpy = vi.fn(() => 'toast-id');
const fakeToastState = {
	items: [],
	push: toastPushSpy,
	dismiss: vi.fn(),
	clear: vi.fn()
};
vi.mock('$lib/app/shared/toast', async () => {
	const actual =
		await vi.importActual<typeof import('$lib/app/shared/toast')>('$lib/app/shared/toast');
	return { ...actual, getToastContext: () => fakeToastState };
});

const { createSubmitHandler } = await import('$lib/app/shared/pending/create-submit-handler');

type SubmitInput = Parameters<SubmitFunction>[0];
type ResultCallback = Exclude<Awaited<ReturnType<SubmitFunction>>, void>;

const buildInput = (overrides: Partial<SubmitInput> = {}): SubmitInput => {
	const form = overrides.formElement ?? document.createElement('form');
	form.requestSubmit = vi.fn();
	return {
		formData: overrides.formData ?? new FormData(),
		formElement: form,
		action: overrides.action ?? new URL('http://test/users'),
		controller: overrides.controller ?? new AbortController(),
		submitter: overrides.submitter ?? null,
		cancel: overrides.cancel ?? vi.fn()
	};
};

const callbackArgs = (
	result: ActionResult,
	update?: () => Promise<void>,
	overrides: Partial<{ formElement: HTMLFormElement; formData: FormData; action: URL }> = {}
): {
	formData: FormData;
	formElement: HTMLFormElement;
	action: URL;
	result: ActionResult;
	update: () => Promise<void>;
} => ({
	formData: overrides.formData ?? new FormData(),
	formElement: overrides.formElement ?? document.createElement('form'),
	action: overrides.action ?? new URL('http://test/users'),
	result,
	update: update ?? vi.fn(async () => {})
});

describe('createSubmitHandler', () => {
	beforeEach(() => {
		confirmAnswers = [];
		confirmAskSpy.mockClear();
		gotoSpy.mockClear();
		invalidateSpy.mockClear();
		focusFirstFieldErrorSpy.mockClear();
		toastPushSpy.mockClear();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('confirm', () => {
		it('static intent triggers two-pass requestSubmit on confirm', async () => {
			confirmAnswers = [true];
			const handler = createSubmitHandler({
				confirm: { title: 't', message: 'm', destructive: true }
			});
			const input = buildInput();
			const result = await handler(input);
			expect(input.cancel).toHaveBeenCalledOnce();
			expect(confirmAskSpy).toHaveBeenCalledOnce();
			expect(input.formElement.requestSubmit).toHaveBeenCalledOnce();
			expect(result).toBeUndefined();

			const second = await handler(buildInput({ formElement: input.formElement }));
			expect(typeof second).toBe('function');
		});

		it('cancels submit silently when user dismisses confirm', async () => {
			confirmAnswers = [false];
			const handler = createSubmitHandler({ confirm: { title: 't', message: 'm' } });
			const input = buildInput();
			const result = await handler(input);
			expect(input.cancel).toHaveBeenCalledOnce();
			expect(input.formElement.requestSubmit).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		it('resets confirmed flag for the next submission, prompting again', async () => {
			confirmAnswers = [true, true];
			const handler = createSubmitHandler({ confirm: { title: 't', message: 'm' } });
			const formElement = document.createElement('form');
			formElement.requestSubmit = vi.fn();

			await handler(buildInput({ formElement }));
			const secondPass = await handler(buildInput({ formElement }));
			expect(typeof secondPass).toBe('function');
			await (secondPass as ResultCallback)(callbackArgs({ type: 'success', status: 200 }));

			await handler(buildInput({ formElement }));
			expect(confirmAskSpy).toHaveBeenCalledTimes(2);
		});

		it('function returning null skips confirmation entirely', async () => {
			const handler = createSubmitHandler({ confirm: () => null });
			const input = buildInput();
			const result = await handler(input);
			expect(confirmAskSpy).not.toHaveBeenCalled();
			expect(input.cancel).not.toHaveBeenCalled();
			expect(typeof result).toBe('function');
		});

		it('function returning Promise<ConfirmIntent> resolves correctly', async () => {
			confirmAnswers = [true];
			const handler = createSubmitHandler({
				confirm: async () => ({ title: 'async', message: 'm' })
			});
			const input = buildInput();
			await handler(input);
			expect(confirmAskSpy).toHaveBeenCalledWith({ title: 'async', message: 'm' });
			expect(input.formElement.requestSubmit).toHaveBeenCalledOnce();
		});

		it('decides intent dynamically from submitter', async () => {
			const intentFn = vi.fn(({ submitter }: { submitter: HTMLElement | null }) =>
				submitter?.dataset.action === 'delete'
					? { title: 'del', message: '?', destructive: true }
					: null
			);
			const handler = createSubmitHandler({ confirm: intentFn });

			const saveBtn = document.createElement('button');
			await handler(buildInput({ submitter: saveBtn }));
			expect(confirmAskSpy).not.toHaveBeenCalled();

			confirmAnswers = [true];
			const deleteBtn = document.createElement('button');
			deleteBtn.dataset.action = 'delete';
			await handler(buildInput({ submitter: deleteBtn }));
			expect(confirmAskSpy).toHaveBeenCalledOnce();
		});
	});

	describe('success', () => {
		it('static SuccessIntent invokes dispatchActionSuccess with toast', async () => {
			const handler = createSubmitHandler({
				success: { toast: { message: 'saved' }, navigateTo: '/users' }
			});
			const callback = (await handler(buildInput())) as ResultCallback;
			const update = vi.fn(async () => {});
			await callback(callbackArgs({ type: 'success', status: 200 }, update));
			expect(toastPushSpy).toHaveBeenCalledWith({
				type: 'success',
				message: 'saved',
				autoCloseMs: 3000
			});
			expect(gotoSpy).toHaveBeenCalledWith('/users');
		});

		it('function variant receives the success result and can return null', async () => {
			const successFn = vi.fn(() => null);
			const handler = createSubmitHandler({ success: successFn });
			const callback = (await handler(buildInput())) as ResultCallback;
			const update = vi.fn(async () => {});
			await callback(callbackArgs({ type: 'success', status: 200, data: { id: 1 } }, update));
			expect(successFn).toHaveBeenCalledOnce();
			expect(update).toHaveBeenCalledOnce();
			expect(toastPushSpy).not.toHaveBeenCalled();
		});

		it('function variant returning intent runs dispatchActionSuccess', async () => {
			const handler = createSubmitHandler({
				success: ({ result }) =>
					result.data?.deleted === true
						? { toast: { message: 'deleted' }, navigateTo: '/users' }
						: { toast: { message: 'saved' }, resetForm: false }
			});
			const callback = (await handler(buildInput())) as ResultCallback;
			await callback(callbackArgs({ type: 'success', status: 200, data: { deleted: true } }));
			expect(toastPushSpy).toHaveBeenCalledWith({
				type: 'success',
				message: 'deleted',
				autoCloseMs: 3000
			});
			expect(gotoSpy).toHaveBeenCalledWith('/users');
		});
	});

	describe('failure', () => {
		it('"auto" calls update and focuses first field error for VALIDATION', async () => {
			const handler = createSubmitHandler({ failure: 'auto' });
			const callback = (await handler(buildInput())) as ResultCallback;
			const update = vi.fn(async () => {});
			const error: App.Error = {
				message: 'invalid',
				code: 'VALIDATION',
				fields: [{ name: 'email', message: 'bad' }]
			};
			await callback(callbackArgs({ type: 'failure', status: 422, data: { error } }, update));
			expect(update).toHaveBeenCalledOnce();
			expect(focusFirstFieldErrorSpy).toHaveBeenCalledOnce();
			expect(focusFirstFieldErrorSpy.mock.calls[0]?.[1]).toBe(error);
		});

		it('"auto" focuses first field error for CONFLICT_UNIQUE', async () => {
			const handler = createSubmitHandler({ failure: 'auto' });
			const callback = (await handler(buildInput())) as ResultCallback;
			const error: App.Error = {
				message: 'taken',
				code: 'CONFLICT_UNIQUE',
				fields: [{ name: 'email', message: 'taken' }]
			};
			await callback(callbackArgs({ type: 'failure', status: 409, data: { error } }));
			expect(focusFirstFieldErrorSpy).toHaveBeenCalledOnce();
		});

		it('"auto" does not focus when code is banner / page (NETWORK / SYSTEM)', async () => {
			const handler = createSubmitHandler({ failure: 'auto' });
			const callback = (await handler(buildInput())) as ResultCallback;
			await callback(
				callbackArgs({
					type: 'failure',
					status: 0,
					data: { error: { message: 'no net', code: 'NETWORK' } }
				})
			);
			expect(focusFirstFieldErrorSpy).not.toHaveBeenCalled();
		});

		it('function variant runs the user handler', async () => {
			const failureFn = vi.fn(async () => {});
			const handler = createSubmitHandler({ failure: failureFn });
			const callback = (await handler(buildInput())) as ResultCallback;
			await callback(
				callbackArgs({ type: 'failure', status: 500, data: { error: { message: 'x' } } })
			);
			expect(failureFn).toHaveBeenCalledOnce();
			expect(focusFirstFieldErrorSpy).not.toHaveBeenCalled();
		});
	});

	describe('onSubmit', () => {
		it('returning false aborts submission via cancel()', async () => {
			const onSubmit = vi.fn(async () => false as const);
			const handler = createSubmitHandler({ onSubmit });
			const input = buildInput();
			const result = await handler(input);
			expect(onSubmit).toHaveBeenCalledOnce();
			expect(input.cancel).toHaveBeenCalledOnce();
			expect(result).toBeUndefined();
		});

		it('calling cancel() aborts submission', async () => {
			const onSubmit = vi.fn(async ({ cancel }: { cancel: () => void }) => {
				cancel();
			});
			const handler = createSubmitHandler({ onSubmit });
			const input = buildInput();
			const result = await handler(input);
			expect(input.cancel).toHaveBeenCalledOnce();
			expect(result).toBeUndefined();
		});

		it('returning undefined / void allows submission to continue', async () => {
			const onSubmit = vi.fn(async () => undefined);
			const handler = createSubmitHandler({ onSubmit });
			const result = await handler(buildInput());
			expect(typeof result).toBe('function');
		});
	});

	describe('onResult', () => {
		it.each([
			['success', { type: 'success', status: 200 } as ActionResult],
			[
				'failure',
				{ type: 'failure', status: 422, data: { error: { message: 'x' } } } as ActionResult
			],
			['redirect', { type: 'redirect', status: 303, location: '/x' } as ActionResult],
			['error', { type: 'error', status: 500, error: new Error('x') } as ActionResult]
		])('runs after the type-specific handler for %s', async (_, result) => {
			const onResult = vi.fn<(opts: { result: ActionResult }) => Promise<void>>(async () => {});
			const handler = createSubmitHandler({ failure: 'auto', onResult });
			const callback = (await handler(buildInput())) as ResultCallback;
			await callback(callbackArgs(result));
			expect(onResult).toHaveBeenCalledOnce();
			expect(onResult.mock.calls[0]?.[0]?.result).toBe(result);
		});

		it('does NOT run when submission is cancelled by confirm dismiss', async () => {
			confirmAnswers = [false];
			const onResult = vi.fn<() => Promise<void>>(async () => {});
			const handler = createSubmitHandler({
				confirm: { title: 't', message: 'm' },
				onResult
			});
			await handler(buildInput());
			expect(onResult).not.toHaveBeenCalled();
		});
	});

	describe('redirect / error result types', () => {
		it('redirect does not call update (applyAction handles it)', async () => {
			const handler = createSubmitHandler({});
			const callback = (await handler(buildInput())) as ResultCallback;
			const update = vi.fn(async () => {});
			await callback(callbackArgs({ type: 'redirect', status: 303, location: '/x' }, update));
			expect(update).not.toHaveBeenCalled();
		});

		it('error does not call update (applyAction handles it)', async () => {
			const handler = createSubmitHandler({});
			const callback = (await handler(buildInput())) as ResultCallback;
			const update = vi.fn(async () => {});
			await callback(callbackArgs({ type: 'error', status: 500, error: new Error('x') }, update));
			expect(update).not.toHaveBeenCalled();
		});
	});
});
