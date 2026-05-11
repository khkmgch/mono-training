import { describe, expect, it } from 'vitest';
import { inferAction, inferCode, PROBLEM_TYPE_TO_CODE } from '$lib/app/shared/error';
import { buildHttpError } from './helpers';

describe('inferCode', () => {
	it('returns NETWORK / TIMEOUT / PARSE from the kind regardless of ProblemDetails', () => {
		expect(inferCode(buildHttpError({ kind: 'network' }))).toBe('NETWORK');
		expect(inferCode(buildHttpError({ kind: 'timeout' }))).toBe('TIMEOUT');
		expect(
			inferCode(
				buildHttpError({
					kind: 'parse',
					problem: { type: 'urn:problem:validation' }
				})
			)
		).toBe('PARSE');
	});

	it('uses PROBLEM_TYPE_TO_CODE when the response has a known problem type', () => {
		expect(
			inferCode(
				buildHttpError({
					kind: 'http',
					status: 422,
					problem: { type: 'urn:problem:validation' }
				})
			)
		).toBe('VALIDATION');
		expect(
			inferCode(
				buildHttpError({
					kind: 'http',
					status: 409,
					problem: { type: 'urn:problem:conflict-unique' }
				})
			)
		).toBe('CONFLICT_UNIQUE');
		expect(
			inferCode(
				buildHttpError({
					kind: 'http',
					status: 409,
					problem: { type: 'urn:problem:conflict-version' }
				})
			)
		).toBe('CONFLICT_VERSION');
	});

	it('falls back to status when ProblemDetails are absent or unknown', () => {
		expect(inferCode(buildHttpError({ kind: 'http', status: 404 }))).toBe('NOT_FOUND');
		expect(inferCode(buildHttpError({ kind: 'http', status: 409 }))).toBe('CONFLICT_UNIQUE');
		expect(inferCode(buildHttpError({ kind: 'http', status: 422 }))).toBe('VALIDATION');
		expect(inferCode(buildHttpError({ kind: 'http', status: 429 }))).toBe('RATE_LIMIT');
		expect(
			inferCode(
				buildHttpError({
					kind: 'http',
					status: 422,
					problem: { type: 'urn:problem:unknown' }
				})
			)
		).toBe('VALIDATION');
	});

	it('falls back to SYSTEM for unrecognized statuses', () => {
		expect(inferCode(buildHttpError({ kind: 'http', status: 500 }))).toBe('SYSTEM');
		expect(inferCode(buildHttpError({ kind: 'http', status: 418 }))).toBe('SYSTEM');
		expect(inferCode(buildHttpError({ kind: 'http' }))).toBe('SYSTEM');
	});
});

describe('inferAction (design 8.3.3.1)', () => {
	it.each([
		['VALIDATION', 'inline'],
		['CONFLICT_UNIQUE', 'inline'],
		['CONFLICT_VERSION', 'banner'],
		['RATE_LIMIT', 'banner'],
		['NETWORK', 'banner'],
		['TIMEOUT', 'banner'],
		['NOT_FOUND', 'page'],
		['PARSE', 'page'],
		['SYSTEM', 'page']
	] as const)('maps %s -> %s', (code, action) => {
		expect(inferAction(code)).toBe(action);
	});
});

describe('PROBLEM_TYPE_TO_CODE', () => {
	it('is frozen and exposes the documented type URNs', () => {
		expect(Object.isFrozen(PROBLEM_TYPE_TO_CODE)).toBe(true);
		expect(PROBLEM_TYPE_TO_CODE['urn:problem:validation']).toBe('VALIDATION');
		expect(PROBLEM_TYPE_TO_CODE['urn:problem:conflict-unique']).toBe('CONFLICT_UNIQUE');
		expect(PROBLEM_TYPE_TO_CODE['urn:problem:conflict-version']).toBe('CONFLICT_VERSION');
	});
});
