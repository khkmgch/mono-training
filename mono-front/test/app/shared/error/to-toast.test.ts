import { describe, expect, it } from 'vitest';
import { toErrorToast } from '$lib/app/shared/error';
import { buildHttpError } from './helpers';

describe('toErrorToast', () => {
	it('uses requestId as the dedup key when present', () => {
		const httpErr = buildHttpError({
			kind: 'http',
			status: 500,
			problem: { instance: 'urn:trace:abc' }
		});
		const toast = toErrorToast(httpErr);
		expect(toast.type).toBe('error');
		expect(toast.key).toBe('urn:trace:abc');
	});

	it('uses code as the dedup key when requestId is not available', () => {
		const appErr: App.Error = { message: 'lost', code: 'NETWORK' };
		const toast = toErrorToast(appErr);
		expect(toast.key).toBe('NETWORK');
	});

	it('sets autoCloseMs to 0 to comply with WCAG 2.2.3', () => {
		const toast = toErrorToast(buildHttpError({ kind: 'network', message: 'down' }));
		expect(toast.autoCloseMs).toBe(0);
	});

	it('passes the App.Error message through', () => {
		const appErr: App.Error = { message: 'custom message', code: 'SYSTEM' };
		expect(toErrorToast(appErr).message).toBe('custom message');
	});
});
