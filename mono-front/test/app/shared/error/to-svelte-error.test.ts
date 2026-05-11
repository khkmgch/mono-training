import { describe, expect, it } from 'vitest';
import { toSvelteError } from '$lib/app/shared/error';
import { buildHttpError } from './helpers';

const captureThrow = (fn: () => unknown): unknown => {
	try {
		fn();
	} catch (err) {
		return err;
	}
	throw new Error('expected the function to throw');
};

describe('toSvelteError', () => {
	it('throws SvelteKit error with status from App.Error', () => {
		const httpErr = buildHttpError({ kind: 'http', status: 404, message: 'gone' });
		const thrown = captureThrow(() => toSvelteError(httpErr)) as {
			status: number;
			body: App.Error;
		};
		expect(thrown.status).toBe(404);
		expect(thrown.body.code).toBe('NOT_FOUND');
		expect(thrown.body.action).toBe('page');
	});

	it('falls back to status 500 when App.Error has no status', () => {
		const appErr: App.Error = { message: 'systemic', code: 'SYSTEM' };
		const thrown = captureThrow(() => toSvelteError(appErr)) as { status: number };
		expect(thrown.status).toBe(500);
	});

	it('passes App.Error through when given an App.Error directly', () => {
		const appErr: App.Error = {
			message: 'rate limited',
			code: 'RATE_LIMIT',
			action: 'banner',
			status: 429
		};
		const thrown = captureThrow(() => toSvelteError(appErr)) as {
			status: number;
			body: App.Error;
		};
		expect(thrown.status).toBe(429);
		expect(thrown.body.code).toBe('RATE_LIMIT');
	});

	it('applies override on top of HttpError-derived App.Error', () => {
		const httpErr = buildHttpError({ kind: 'http', status: 422, message: 'auto' });
		const thrown = captureThrow(() =>
			toSvelteError(httpErr, { message: 'overridden', status: 400 })
		) as { status: number; body: App.Error };
		expect(thrown.status).toBe(400);
		expect(thrown.body.message).toBe('overridden');
	});
});
