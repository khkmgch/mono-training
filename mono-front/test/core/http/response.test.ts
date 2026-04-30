import { describe, expect, it } from 'vitest';
import { ensureOk, processResponse } from '$lib/core/http/response';
import { HttpError } from '$lib/core/http/errors';

const makeRequest = (url = 'https://api.example.com/r'): Request => new Request(url);

describe('processResponse', () => {
	it('parses application/json into an object', async () => {
		const response = new Response('{"id":1,"name":"alice"}', {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
		const result = await processResponse(response, makeRequest());
		expect(result).toEqual({ id: 1, name: 'alice' });
	});

	it('parses application/json with charset parameter', async () => {
		const response = new Response('{"ok":true}', {
			status: 200,
			headers: { 'Content-Type': 'application/json; charset=utf-8' }
		});
		const result = await processResponse(response, makeRequest());
		expect(result).toEqual({ ok: true });
	});

	it('parses application/problem+json the same way as application/json', async () => {
		const response = new Response('{"message":"ok"}', {
			status: 200,
			headers: { 'Content-Type': 'application/problem+json' }
		});
		const result = await processResponse(response, makeRequest());
		expect(result).toEqual({ message: 'ok' });
	});

	it('parses application/octet-stream into a Blob', async () => {
		const response = new Response(new Uint8Array([1, 2, 3]), {
			status: 200,
			headers: { 'Content-Type': 'application/octet-stream' }
		});
		const result = await processResponse<Blob>(response, makeRequest());
		expect(result).toBeInstanceOf(Blob);
	});

	it('falls back to text() for unknown Content-Type', async () => {
		const response = new Response('hello', {
			status: 200,
			headers: { 'Content-Type': 'text/plain' }
		});
		const result = await processResponse(response, makeRequest());
		expect(result).toBe('hello');
	});

	it('falls back to text() when Content-Type is missing', async () => {
		const response = new Response('hi', { status: 200 });
		const result = await processResponse(response, makeRequest());
		expect(result).toBe('hi');
	});

	it('returns undefined for 204 No Content', async () => {
		const response = new Response(null, { status: 204 });
		const result = await processResponse(response, makeRequest());
		expect(result).toBeUndefined();
	});

	it('returns undefined for 205 Reset Content', async () => {
		const response = new Response(null, { status: 205 });
		const result = await processResponse(response, makeRequest());
		expect(result).toBeUndefined();
	});

	it('returns undefined when Content-Length is 0', async () => {
		const response = new Response('', {
			status: 200,
			headers: { 'Content-Length': '0' }
		});
		const result = await processResponse(response, makeRequest());
		expect(result).toBeUndefined();
	});

	it('throws kind: "parse" when JSON cannot be parsed', async () => {
		const response = new Response('not-json', {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
		await expect(processResponse(response, makeRequest())).rejects.toMatchObject({
			name: 'HttpError',
			kind: 'parse'
		});
	});

	it('parse failure preserves the response and the SyntaxError as cause', async () => {
		const response = new Response('garbage', {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
		const request = makeRequest();
		try {
			await processResponse(response, request);
			throw new Error('expected throw');
		} catch (e) {
			expect(e).toBeInstanceOf(HttpError);
			const err = e as HttpError;
			expect(err.kind).toBe('parse');
			expect(err.response).toBe(response);
			expect(err.request).toBe(request);
			expect(err.cause).toBeInstanceOf(SyntaxError);
		}
	});
});

describe('ensureOk', () => {
	it('returns void for 2xx responses', async () => {
		await expect(
			ensureOk(new Response(null, { status: 200 }), makeRequest())
		).resolves.toBeUndefined();
		await expect(
			ensureOk(new Response(null, { status: 299 }), makeRequest())
		).resolves.toBeUndefined();
	});

	it('throws kind: "http" with status for non-2xx responses', async () => {
		const response = new Response('boom', { status: 500 });
		await expect(ensureOk(response, makeRequest())).rejects.toMatchObject({
			name: 'HttpError',
			kind: 'http',
			status: 500
		});
	});

	it('extracts ProblemDetails when Content-Type is application/problem+json', async () => {
		const problem = {
			type: 'https://example.com/probs/out-of-credit',
			title: 'You do not have enough credit.',
			status: 403,
			detail: 'Your current balance is 30, but that costs 50.',
			instance: '/account/12345/msgs/abc',
			balance: 30
		};
		const response = new Response(JSON.stringify(problem), {
			status: 403,
			headers: { 'Content-Type': 'application/problem+json' }
		});
		try {
			await ensureOk(response, makeRequest());
			throw new Error('expected throw');
		} catch (e) {
			expect(e).toBeInstanceOf(HttpError);
			const err = e as HttpError;
			expect(err.kind).toBe('http');
			expect(err.status).toBe(403);
			expect(err.problem).toEqual(problem);
			// extension member preserved
			expect(err.problem?.balance).toBe(30);
		}
	});

	it('does not attach ProblemDetails when Content-Type is not application/problem+json', async () => {
		const response = new Response('{"message":"oops"}', {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
		try {
			await ensureOk(response, makeRequest());
			throw new Error('expected throw');
		} catch (e) {
			const err = e as HttpError;
			expect(err.problem).toBeUndefined();
		}
	});

	it('keeps kind: "http" even when problem+json body is malformed', async () => {
		const response = new Response('not-json', {
			status: 502,
			headers: { 'Content-Type': 'application/problem+json' }
		});
		try {
			await ensureOk(response, makeRequest());
			throw new Error('expected throw');
		} catch (e) {
			const err = e as HttpError;
			expect(err.kind).toBe('http');
			expect(err.status).toBe(502);
			expect(err.problem).toBeUndefined();
		}
	});

	it('does not consume the response body of the original response', async () => {
		const response = new Response('{"detail":"x"}', {
			status: 400,
			headers: { 'Content-Type': 'application/problem+json' }
		});
		try {
			await ensureOk(response, makeRequest());
		} catch {
			// ignored
		}
		expect(response.bodyUsed).toBe(false);
	});
});
