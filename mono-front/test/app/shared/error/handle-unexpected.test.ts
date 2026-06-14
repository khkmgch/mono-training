import { describe, expect, it } from 'vitest';
import { handleUnexpected } from '$lib/app/shared/error';
import { buildHttpError } from './helpers';

describe('handleUnexpected', () => {
	it('wraps non-HttpError input as SYSTEM (no client-fabricated requestId)', () => {
		const result = handleUnexpected({
			error: new Error('boom'),
			status: 500,
			message: 'Internal error'
		});
		expect(result.code).toBe('SYSTEM');
		expect(result.action).toBe('page');
		expect(result.status).toBe(500);
		expect(result.message).toBe('Internal error');
		expect(result.requestId).toBeUndefined();
	});

	it('wraps unknown values (string, null) safely', () => {
		expect(handleUnexpected({ error: null, status: 500, message: 'x' }).code).toBe('SYSTEM');
		expect(handleUnexpected({ error: 'string', status: 500, message: 'x' }).code).toBe('SYSTEM');
	});

	it('formats HttpError input through toAppError, applying status / message override', () => {
		const httpErr = buildHttpError({
			kind: 'http',
			status: 422,
			problem: { type: 'urn:problem:validation', detail: 'BE detail' }
		});
		const result = handleUnexpected({ error: httpErr, status: 500, message: 'final' });
		expect(result.code).toBe('VALIDATION');
		expect(result.status).toBe(500); // override wins
		expect(result.message).toBe('final'); // override wins
	});
});
