import { describe, expect, it } from 'vitest';
import { HttpError, isHttpError, type ProblemDetails } from '$lib/core/http/errors';

const makeRequest = (url = 'https://api.example.com/users/1'): Request => new Request(url);
const makeResponse = (status = 200, body = '{}'): Response => new Response(body, { status });

describe('HttpError', () => {
	it('exposes name === "HttpError" and is an instance of Error', () => {
		const err = new HttpError({
			kind: 'http',
			message: 'Request failed with status 404',
			request: makeRequest(),
			response: makeResponse(404),
			status: 404
		});

		expect(err).toBeInstanceOf(Error);
		expect(err).toBeInstanceOf(HttpError);
		expect(err.name).toBe('HttpError');
		expect(err.message).toBe('Request failed with status 404');
	});

	it('preserves all fields for kind: "http"', () => {
		const request = makeRequest();
		const response = makeResponse(404);
		const problem: ProblemDetails = { type: 'about:blank', title: 'Not Found', status: 404 };

		const err = new HttpError({
			kind: 'http',
			message: 'Request failed with status 404',
			request,
			response,
			status: 404,
			problem
		});

		expect(err.kind).toBe('http');
		expect(err.request).toBe(request);
		expect(err.response).toBe(response);
		expect(err.status).toBe(404);
		expect(err.problem).toBe(problem);
		expect(err.cause).toBeUndefined();
	});

	it('preserves cause for kind: "network"', () => {
		const request = makeRequest();
		const cause = new TypeError('Failed to fetch');

		const err = new HttpError({
			kind: 'network',
			message: 'Network request failed',
			request,
			cause
		});

		expect(err.kind).toBe('network');
		expect(err.cause).toBe(cause);
		expect(err.response).toBeUndefined();
		expect(err.status).toBeUndefined();
		expect(err.problem).toBeUndefined();
	});

	it('preserves cause for kind: "timeout"', () => {
		const request = makeRequest();
		const cause = new DOMException('signal timed out', 'TimeoutError');

		const err = new HttpError({
			kind: 'timeout',
			message: 'Request timed out after 5000ms',
			request,
			cause
		});

		expect(err.kind).toBe('timeout');
		expect(err.cause).toBe(cause);
		expect(err.response).toBeUndefined();
	});

	it('preserves response and cause for kind: "parse"', () => {
		const request = makeRequest();
		const response = makeResponse(200, 'not-json');
		const cause = new SyntaxError('Unexpected token');

		const err = new HttpError({
			kind: 'parse',
			message: 'Failed to parse response body as JSON',
			request,
			response,
			status: 200,
			cause
		});

		expect(err.kind).toBe('parse');
		expect(err.response).toBe(response);
		expect(err.status).toBe(200);
		expect(err.cause).toBe(cause);
	});

	it('keeps cause undefined when constructor omits it (does not pass an empty options object)', () => {
		const err = new HttpError({
			kind: 'http',
			message: 'x',
			request: makeRequest()
		});
		expect(err.cause).toBeUndefined();
	});
});

describe('isHttpError', () => {
	it('returns true for an instance of core HttpError', () => {
		const err = new HttpError({
			kind: 'http',
			message: 'x',
			request: makeRequest()
		});
		expect(isHttpError(err)).toBe(true);
	});

	it('returns true for a cross-realm-like POJO with the duck-typed shape', () => {
		const foreign = {
			name: 'HttpError',
			kind: 'http' as const,
			request: makeRequest(),
			status: 404,
			message: 'Request failed with status 404'
		};
		expect(isHttpError(foreign)).toBe(true);
	});

	it('returns false for a SvelteKit HttpError-like object ({ status, body }, no name)', () => {
		const sveltekitLike = { status: 404, body: { message: 'Not found' } };
		expect(isHttpError(sveltekitLike)).toBe(false);
	});

	it('returns false for a plain Error', () => {
		expect(isHttpError(new Error('x'))).toBe(false);
	});

	it('returns false for non-object values', () => {
		expect(isHttpError(null)).toBe(false);
		expect(isHttpError(undefined)).toBe(false);
		expect(isHttpError('HttpError')).toBe(false);
		expect(isHttpError(404)).toBe(false);
	});

	it('returns false when name matches but kind/request shape is wrong', () => {
		expect(isHttpError({ name: 'HttpError' })).toBe(false);
		expect(isHttpError({ name: 'HttpError', kind: 'http' })).toBe(false);
		expect(isHttpError({ name: 'HttpError', kind: 'http', request: {} })).toBe(false);
		expect(isHttpError({ name: 'HttpError', kind: 42, request: makeRequest() })).toBe(false);
	});
});
