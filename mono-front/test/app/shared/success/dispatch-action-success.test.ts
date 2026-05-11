import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: true }));

const gotoSpy = vi.fn(async (_target: string) => {});
const invalidateSpy = vi.fn(async (_target: string | URL | ((url: URL) => boolean)) => {});

vi.mock('$app/navigation', () => ({
	goto: gotoSpy,
	invalidate: invalidateSpy
}));

const { dispatchActionSuccess } = await import('$lib/app/shared/success');
const { ToastState } = await import('$lib/app/shared/toast');

type UpdateOpts = { reset?: boolean; invalidateAll?: boolean };

type UpdateFn = (opts?: UpdateOpts) => Promise<void>;

const buildContext = () => {
	const calls: string[] = [];
	const toasts = new ToastState();
	const pushSpy = vi.spyOn(toasts, 'push').mockImplementation((input) => {
		calls.push(`push:${input.type}:${input.message}`);
		return 'id';
	});
	const update = vi.fn<UpdateFn>(async (opts) => {
		calls.push(`update:${opts?.invalidateAll ?? 'undef'}:${opts?.reset ?? 'undef'}`);
	});
	gotoSpy.mockImplementation(async (target: string) => {
		calls.push(`goto:${target}`);
	});
	invalidateSpy.mockImplementation(async (target: unknown) => {
		const label =
			typeof target === 'function'
				? 'fn'
				: target instanceof URL
					? `url:${target.href}`
					: `str:${target as string}`;
		calls.push(`invalidate:${label}`);
	});
	return { toasts, pushSpy, update, calls };
};

describe('dispatchActionSuccess', () => {
	beforeEach(() => {
		gotoSpy.mockReset();
		invalidateSpy.mockReset();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('pushes a toast when intent.toast is set', async () => {
		const ctx = buildContext();
		await dispatchActionSuccess(
			{ toast: { message: 'saved' } },
			{ toasts: ctx.toasts, update: ctx.update }
		);
		expect(ctx.pushSpy).toHaveBeenCalledWith({ type: 'success', message: 'saved' });
	});

	it('omits toast push when intent.toast is undefined', async () => {
		const ctx = buildContext();
		await dispatchActionSuccess({}, { toasts: ctx.toasts, update: ctx.update });
		expect(ctx.pushSpy).not.toHaveBeenCalled();
	});

	it('defaults to invalidateAll: true when invalidate is omitted', async () => {
		const ctx = buildContext();
		await dispatchActionSuccess({}, { toasts: ctx.toasts, update: ctx.update });
		expect(ctx.update).toHaveBeenCalledWith({ reset: true, invalidateAll: true });
	});

	it('respects invalidate: "none" with invalidateAll: false', async () => {
		const ctx = buildContext();
		await dispatchActionSuccess({ invalidate: 'none' }, { toasts: ctx.toasts, update: ctx.update });
		expect(ctx.update).toHaveBeenCalledWith({ reset: true, invalidateAll: false });
		expect(invalidateSpy).not.toHaveBeenCalled();
	});

	it('invokes invalidate(target) when invalidate is a string', async () => {
		const ctx = buildContext();
		await dispatchActionSuccess(
			{ invalidate: '/users' },
			{ toasts: ctx.toasts, update: ctx.update }
		);
		expect(ctx.update).toHaveBeenCalledWith({ reset: true, invalidateAll: false });
		expect(invalidateSpy).toHaveBeenCalledWith('/users');
	});

	it('invokes invalidate(URL) when invalidate is a URL', async () => {
		const ctx = buildContext();
		const url = new URL('http://api.test/users');
		await dispatchActionSuccess({ invalidate: url }, { toasts: ctx.toasts, update: ctx.update });
		expect(invalidateSpy).toHaveBeenCalledWith(url);
	});

	it('invokes invalidate(predicate) when invalidate is a function', async () => {
		const ctx = buildContext();
		const predicate = (url: URL): boolean => url.pathname === '/users';
		await dispatchActionSuccess(
			{ invalidate: predicate },
			{ toasts: ctx.toasts, update: ctx.update }
		);
		expect(invalidateSpy).toHaveBeenCalledWith(predicate);
	});

	it('navigates with goto when navigateTo is set', async () => {
		const ctx = buildContext();
		await dispatchActionSuccess(
			{ navigateTo: '/users/1' },
			{ toasts: ctx.toasts, update: ctx.update }
		);
		expect(gotoSpy).toHaveBeenCalledWith('/users/1');
	});

	it('passes resetForm: false through to update', async () => {
		const ctx = buildContext();
		await dispatchActionSuccess({ resetForm: false }, { toasts: ctx.toasts, update: ctx.update });
		expect(ctx.update).toHaveBeenCalledWith({ reset: false, invalidateAll: true });
	});

	it('runs in order: toast push -> update -> invalidate -> goto', async () => {
		const ctx = buildContext();
		await dispatchActionSuccess(
			{
				toast: { message: 'done' },
				invalidate: '/users',
				navigateTo: '/users/1'
			},
			{ toasts: ctx.toasts, update: ctx.update }
		);
		expect(ctx.calls).toEqual([
			'push:success:done',
			'update:false:true',
			'invalidate:str:/users',
			'goto:/users/1'
		]);
	});

	it('passes info toast type through unchanged', async () => {
		const ctx = buildContext();
		await dispatchActionSuccess(
			{ toast: { type: 'info', message: 'hi' } },
			{ toasts: ctx.toasts, update: ctx.update }
		);
		expect(ctx.pushSpy).toHaveBeenCalledWith({ type: 'info', message: 'hi' });
	});
});
