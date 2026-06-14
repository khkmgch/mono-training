import { describe, expect, it } from 'vitest';
import { toAppError } from '$lib/app/shared/error';
import { buildHttpError } from './helpers';

describe('toAppError', () => {
	it('maps a 422 validation response into App.Error with fields and inline action', () => {
		const err = buildHttpError({
			kind: 'http',
			status: 422,
			problem: {
				type: 'urn:problem:validation',
				title: 'Validation failed',
				detail: 'Please correct the highlighted fields.',
				errors: [
					{ name: 'email', message: 'メールアドレスの形式が不正です', code: 'email_format' },
					{ name: 'name', message: '名前は必須です' }
				]
			}
		});
		const result = toAppError(err);
		expect(result.code).toBe('VALIDATION');
		expect(result.action).toBe('inline');
		expect(result.status).toBe(422);
		expect(result.message).toBe('Please correct the highlighted fields.');
		expect(result.fields).toEqual([
			{ name: 'email', message: 'メールアドレスの形式が不正です', code: 'email_format' },
			{ name: 'name', message: '名前は必須です' }
		]);
	});

	it('drops malformed entries from the problem.errors array', () => {
		const err = buildHttpError({
			kind: 'http',
			status: 422,
			problem: {
				type: 'urn:problem:validation',
				errors: [
					{ name: 'good', message: 'ok' },
					null,
					{ name: 'no-message' },
					{ message: 'no-name' },
					'oops'
				]
			}
		});
		expect(toAppError(err).fields).toEqual([{ name: 'good', message: 'ok' }]);
	});

	it('omits fields when problem.errors is missing or empty', () => {
		expect(toAppError(buildHttpError({ kind: 'http', status: 422 })).fields).toBeUndefined();
		expect(
			toAppError(
				buildHttpError({
					kind: 'http',
					status: 422,
					problem: { type: 'urn:problem:validation', errors: [] }
				})
			).fields
		).toBeUndefined();
	});

	describe('requestId priority', () => {
		it('prefers the X-Request-Id response header', () => {
			const err = buildHttpError({
				kind: 'http',
				status: 500,
				problem: { instance: 'urn:trace:instance-id' },
				responseHeaders: { 'x-request-id': 'header-id' }
			});
			expect(toAppError(err).requestId).toBe('header-id');
		});

		it('falls back to ProblemDetails.instance', () => {
			const err = buildHttpError({
				kind: 'http',
				status: 500,
				problem: { instance: 'urn:trace:instance-id' }
			});
			expect(toAppError(err).requestId).toBe('urn:trace:instance-id');
		});

		it('has no requestId when neither header nor instance is present', () => {
			// requestId is server-provided only; we never fabricate one client-side.
			const err = buildHttpError({ kind: 'http', status: 500 });
			expect(toAppError(err).requestId).toBeUndefined();
		});
	});

	it('marks NETWORK / TIMEOUT / RATE_LIMIT as retryable', () => {
		expect(toAppError(buildHttpError({ kind: 'network' })).retryable).toBe(true);
		expect(toAppError(buildHttpError({ kind: 'timeout' })).retryable).toBe(true);
		expect(toAppError(buildHttpError({ kind: 'http', status: 429 })).retryable).toBe(true);
	});

	it('does not mark VALIDATION / SYSTEM / NOT_FOUND as retryable', () => {
		expect(toAppError(buildHttpError({ kind: 'http', status: 422 })).retryable ?? false).toBe(
			false
		);
		expect(toAppError(buildHttpError({ kind: 'http', status: 500 })).retryable ?? false).toBe(
			false
		);
		expect(toAppError(buildHttpError({ kind: 'http', status: 404 })).retryable ?? false).toBe(
			false
		);
	});

	it('extracts retryAfterSec from the Retry-After header on 429 / 503', () => {
		expect(
			toAppError(
				buildHttpError({
					kind: 'http',
					status: 429,
					responseHeaders: { 'retry-after': '60' }
				})
			).retryAfterSec
		).toBe(60);
		expect(
			toAppError(
				buildHttpError({
					kind: 'http',
					status: 503,
					responseHeaders: { 'retry-after': '5' }
				})
			).retryAfterSec
		).toBe(5);
	});

	it('does not set retryAfterSec for unrelated statuses or non-numeric headers', () => {
		expect(
			toAppError(
				buildHttpError({
					kind: 'http',
					status: 500,
					responseHeaders: { 'retry-after': '60' }
				})
			).retryAfterSec
		).toBeUndefined();
		expect(
			toAppError(
				buildHttpError({
					kind: 'http',
					status: 429,
					responseHeaders: { 'retry-after': 'tomorrow' }
				})
			).retryAfterSec
		).toBeUndefined();
	});

	it('uses the HttpError message when ProblemDetails has no detail / title', () => {
		const err = buildHttpError({ kind: 'network', message: 'Failed to reach server' });
		expect(toAppError(err).message).toBe('Failed to reach server');
	});

	it('override.message wins over ProblemDetails detail', () => {
		const err = buildHttpError({
			kind: 'http',
			status: 422,
			problem: { detail: 'auto detail' }
		});
		expect(toAppError(err, { message: 'custom' }).message).toBe('custom');
	});

	it('override.action overrides the inferred action', () => {
		const err = buildHttpError({ kind: 'http', status: 422 });
		expect(toAppError(err, { action: 'page' }).action).toBe('page');
	});

	it('override.fields wins even when explicitly empty', () => {
		const err = buildHttpError({
			kind: 'http',
			status: 422,
			problem: {
				type: 'urn:problem:validation',
				errors: [{ name: 'email', message: 'x' }]
			}
		});
		expect(toAppError(err, { fields: [] }).fields).toEqual([]);
	});
});
