import { describe, expect, it } from 'vitest';
import { hasFieldError } from '$lib/app/shared/error';

describe('hasFieldError', () => {
	it('returns false when error is undefined', () => {
		expect(hasFieldError(undefined, 'email')).toBe(false);
	});

	it('returns false when fields is missing', () => {
		const error: App.Error = { message: 'x' };
		expect(hasFieldError(error, 'email')).toBe(false);
	});

	it('returns false when fields is empty', () => {
		const error: App.Error = { message: 'x', fields: [] };
		expect(hasFieldError(error, 'email')).toBe(false);
	});

	it('returns true when a field name matches', () => {
		const error: App.Error = {
			message: 'x',
			fields: [{ name: 'email', message: 'invalid' }]
		};
		expect(hasFieldError(error, 'email')).toBe(true);
	});

	it('returns false when no field name matches', () => {
		const error: App.Error = {
			message: 'x',
			fields: [{ name: 'email', message: 'invalid' }]
		};
		expect(hasFieldError(error, 'name')).toBe(false);
	});

	it('matches the exact name among multiple fields', () => {
		const error: App.Error = {
			message: 'x',
			fields: [
				{ name: 'email', message: 'invalid' },
				{ name: 'name', message: 'required' }
			]
		};
		expect(hasFieldError(error, 'email')).toBe(true);
		expect(hasFieldError(error, 'name')).toBe(true);
		expect(hasFieldError(error, 'address')).toBe(false);
	});
});
