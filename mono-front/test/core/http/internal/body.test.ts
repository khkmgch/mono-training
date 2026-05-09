import { describe, expect, it } from 'vitest';
import { serializeBody } from '$lib/core/http/internal/body';

describe('serializeBody', () => {
	it('returns body: null for null', () => {
		expect(serializeBody(null)).toEqual({ body: null });
	});

	it('returns body: null for undefined', () => {
		expect(serializeBody(undefined)).toEqual({ body: null });
	});

	it('passes FormData through without setting Content-Type (fetch will set it with the boundary)', () => {
		const formData = new FormData();
		formData.append('name', 'alice');
		const result = serializeBody(formData);
		expect(result.body).toBe(formData);
		expect(result.contentType).toBeUndefined();
	});

	it('passes URLSearchParams through without setting Content-Type', () => {
		const params = new URLSearchParams({ a: '1' });
		const result = serializeBody(params);
		expect(result.body).toBe(params);
		expect(result.contentType).toBeUndefined();
	});

	it('passes Blob through', () => {
		const blob = new Blob(['hello'], { type: 'text/plain' });
		const result = serializeBody(blob);
		expect(result.body).toBe(blob);
		expect(result.contentType).toBeUndefined();
	});

	it('passes ArrayBuffer through', () => {
		const buf = new ArrayBuffer(8);
		const result = serializeBody(buf);
		expect(result.body).toBe(buf);
	});

	it('passes ArrayBufferView (e.g. Uint8Array) through', () => {
		const view = new Uint8Array([1, 2, 3]);
		const result = serializeBody(view);
		expect(result.body).toBe(view);
	});

	it('passes ReadableStream through', () => {
		const stream = new ReadableStream();
		const result = serializeBody(stream);
		expect(result.body).toBe(stream);
	});

	it('passes string through without setting Content-Type (caller is responsible)', () => {
		const result = serializeBody('raw text');
		expect(result.body).toBe('raw text');
		expect(result.contentType).toBeUndefined();
	});

	it('JSON-stringifies a plain object and sets application/json', () => {
		const result = serializeBody({ name: 'alice', age: 30 });
		expect(result.body).toBe('{"name":"alice","age":30}');
		expect(result.contentType).toBe('application/json');
	});

	it('JSON-stringifies an array and sets application/json', () => {
		const result = serializeBody([1, 2, 3]);
		expect(result.body).toBe('[1,2,3]');
		expect(result.contentType).toBe('application/json');
	});

	it('JSON-stringifies primitives that survived the null/undefined check', () => {
		expect(serializeBody(0)).toEqual({ body: '0', contentType: 'application/json' });
		expect(serializeBody(false)).toEqual({ body: 'false', contentType: 'application/json' });
	});
});
