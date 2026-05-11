import { describe, expect, it } from 'vitest';
import { dispatchActionError, dispatchLoadError } from '$lib/app/shared/error';
import { buildHttpError } from './helpers';

const captureThrow = (fn: () => unknown): unknown => {
	try {
		fn();
	} catch (err) {
		return err;
	}
	throw new Error('expected the function to throw');
};

describe('dispatchLoadError', () => {
	it('throws SvelteKit error from HttpError', () => {
		const thrown = captureThrow(() =>
			dispatchLoadError(buildHttpError({ kind: 'http', status: 404 }))
		) as { status: number; body: App.Error };
		expect(thrown.status).toBe(404);
		expect(thrown.body.code).toBe('NOT_FOUND');
	});

	it('re-throws non-HttpError without wrapping', () => {
		const original = new Error('not http');
		const thrown = captureThrow(() => dispatchLoadError(original));
		expect(thrown).toBe(original);
	});
});

describe('dispatchActionError', () => {
	it('returns fail() when action is inline (VALIDATION)', () => {
		const result = dispatchActionError(buildHttpError({ kind: 'http', status: 422 }), {
			values: { name: 'taro' }
		}) as Awaited<ReturnType<typeof dispatchActionError<{ name: string }>>>;
		// SvelteKit ActionFailure: { status, data }
		expect((result as { status: number }).status).toBe(422);
		expect((result as { data: { error: App.Error; name: string } }).data.error.action).toBe(
			'inline'
		);
		expect((result as { data: { error: App.Error; name: string } }).data.name).toBe('taro');
	});

	it('returns fail() when action is banner (NETWORK)', () => {
		const result = dispatchActionError(buildHttpError({ kind: 'network' }), {
			values: { email: 'x' }
		});
		expect((result as { status: number }).status).toBe(400);
		expect((result as { data: { error: App.Error } }).data.error.code).toBe('NETWORK');
	});

	it('throws SvelteKit error when action is page (NOT_FOUND)', () => {
		const thrown = captureThrow(() =>
			dispatchActionError(buildHttpError({ kind: 'http', status: 404 }), {})
		) as { status: number; body: App.Error };
		expect(thrown.status).toBe(404);
		expect(thrown.body.action).toBe('page');
	});

	it('re-throws non-HttpError without wrapping', () => {
		const original = new Error('not http');
		const thrown = captureThrow(() => dispatchActionError(original, {}));
		expect(thrown).toBe(original);
	});
});
