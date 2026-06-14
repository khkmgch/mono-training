import { afterEach, describe, expect, it } from 'vitest';
import { normalizeInput } from '$lib/app/shared/ui/normalize-input';
import { collapseSpaces, stripSpaces } from '$lib/core/text';

afterEach(() => {
	document.body.innerHTML = '';
});

// blur normalization is unit-testable in jsdom; the formdata path (which fires
// from `new FormData(form)`) is browser-only and verified manually / e2e.
function mountInput(name = 'fullName'): HTMLInputElement {
	const form = document.createElement('form');
	const input = document.createElement('input');
	input.name = name;
	form.appendChild(input);
	document.body.appendChild(form);
	return input;
}

describe('normalizeInput', () => {
	it('normalizes the DOM value on blur', () => {
		const input = mountInput();
		const action = normalizeInput(input, collapseSpaces);
		input.value = '  Tanaka　　Kenji  ';
		input.dispatchEvent(new Event('blur'));
		expect(input.value).toBe('Tanaka Kenji');
		action?.destroy?.();
	});

	it('does nothing on blur when no normalizer is given', () => {
		const input = mountInput();
		const action = normalizeInput(input, undefined);
		input.value = '  Tanaka  ';
		input.dispatchEvent(new Event('blur'));
		expect(input.value).toBe('  Tanaka  ');
		action?.destroy?.();
	});

	it('applies the replacement normalizer after update()', () => {
		const input = mountInput();
		const action = normalizeInput(input, collapseSpaces);
		action?.update?.(stripSpaces);
		input.value = ' a b ';
		input.dispatchEvent(new Event('blur'));
		expect(input.value).toBe('ab');
		action?.destroy?.();
	});

	it('detaches the blur listener on destroy', () => {
		const input = mountInput();
		const action = normalizeInput(input, collapseSpaces);
		action?.destroy?.();
		input.value = '  a b  ';
		input.dispatchEvent(new Event('blur'));
		expect(input.value).toBe('  a b  ');
	});
});
