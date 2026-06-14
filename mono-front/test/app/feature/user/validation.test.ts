import { describe, expect, it } from 'vitest';
import { validateLoginId, validateFullName } from '$lib/app/feature/user/validation';

describe('validateLoginId (expects a canonicalized value)', () => {
	it.each([
		['', 'required'],
		['ab', 'min'], // shorter than 3
		['a'.repeat(65), 'size'], // longer than 64
		['abc!', 'pattern'], // disallowed symbol
		['a b c', 'pattern'], // spaces (defensive; normalization strips them)
		['日本語', 'pattern'] // non-ASCII
	])('validateLoginId(%j) -> %s', (input, code) => {
		expect(validateLoginId(input)?.code).toBe(code);
	});

	it.each([['abc'], ['a'.repeat(64)], ['admin_01.test-x']])('accepts %j', (input) => {
		expect(validateLoginId(input)).toBeNull();
	});
});

describe('validateFullName (expects a canonicalized value)', () => {
	it.each([
		['', 'required'],
		['a'.repeat(101), 'size'] // longer than 100
	])('validateFullName(%j) -> %s', (input, code) => {
		expect(validateFullName(input)?.code).toBe(code);
	});

	it.each([['Tanaka Kenji'], ['山田 太郎'], ['a'.repeat(100)]])('accepts %j', (input) => {
		expect(validateFullName(input)).toBeNull();
	});
});
