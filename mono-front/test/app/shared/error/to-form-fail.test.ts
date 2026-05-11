import { describe, expect, it } from 'vitest';
import { toFormFail } from '$lib/app/shared/error';
import { buildHttpError } from './helpers';

describe('toFormFail', () => {
	it('returns ActionFailure with status from App.Error and merged values + error', () => {
		const httpErr = buildHttpError({ kind: 'http', status: 422 });
		const result = toFormFail(httpErr, { name: 'taro', email: 'taro@example.com' });
		expect(result.status).toBe(422);
		expect(result.data?.name).toBe('taro');
		expect(result.data?.email).toBe('taro@example.com');
		expect(result.data?.error.code).toBe('VALIDATION');
	});

	it('falls back to status 400 when App.Error has no status', () => {
		const appErr: App.Error = { message: 'oops', code: 'SYSTEM' };
		const result = toFormFail(appErr);
		expect(result.status).toBe(400);
	});

	it('handles missing values argument', () => {
		const result = toFormFail(buildHttpError({ kind: 'http', status: 422 }));
		expect(result.data?.error).toBeDefined();
	});
});
