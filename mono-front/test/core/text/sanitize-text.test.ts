import { describe, expect, it } from 'vitest';
import { sanitizeText } from '$lib/core/text/sanitize-text';

const cp = (...codes: number[]): string => String.fromCodePoint(...codes);

describe('sanitizeText', () => {
	it.each([
		{ label: 'NFC composes か+dakuten → が', input: cp(0x304b, 0x3099), expected: cp(0x304c) },
		{ label: 'removes zero-width', input: 'ad' + cp(0x200b) + 'min', expected: 'admin' },
		{ label: 'removes BOM', input: cp(0xfeff) + 'admin', expected: 'admin' },
		{ label: 'removes bidi', input: 'a' + cp(0x202e) + 'b' + cp(0x2066) + 'c', expected: 'abc' },
		{ label: 'removes C0/C1', input: 'a' + cp(0x01) + 'b' + cp(0x7f) + 'c', expected: 'abc' },
		{ label: 'keeps tab/newline/space', input: 'a\tb\nc d', expected: 'a\tb\nc d' },
		{ label: 'clean unchanged', input: 'admin01', expected: 'admin01' }
	])('$label', ({ input, expected }) => {
		expect(sanitizeText(input)).toBe(expected);
	});

	it('is idempotent', () => {
		const once = sanitizeText(cp(0x304b, 0x3099) + cp(0x200b));
		expect(sanitizeText(once)).toBe(once);
	});
});
