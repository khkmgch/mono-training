import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: true }));

const { focusFirstFieldError } = await import('$lib/app/shared/error');

const buildForm = (html: string): HTMLFormElement => {
	const form = document.createElement('form');
	form.innerHTML = html;
	document.body.appendChild(form);
	return form;
};

describe('focusFirstFieldError (browser)', () => {
	let form: HTMLFormElement;

	beforeEach(() => {
		document.body.innerHTML = '';
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('focuses the input matching the first field error', () => {
		form = buildForm('<input name="email" /><input name="name" />');
		const target = form.querySelector<HTMLInputElement>('[name="email"]');
		const focusSpy = vi.spyOn(target!, 'focus');

		focusFirstFieldError(form, {
			message: 'x',
			fields: [{ name: 'email', message: 'invalid' }]
		});

		expect(focusSpy).toHaveBeenCalledOnce();
	});

	it('does nothing when error is undefined', () => {
		form = buildForm('<input name="email" />');
		const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
		focusFirstFieldError(form, undefined);
		expect(focusSpy).not.toHaveBeenCalled();
		focusSpy.mockRestore();
	});

	it('does nothing when fields is empty', () => {
		form = buildForm('<input name="email" />');
		const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
		focusFirstFieldError(form, { message: 'x', fields: [] });
		expect(focusSpy).not.toHaveBeenCalled();
		focusSpy.mockRestore();
	});

	it('does nothing when no input matches the field name', () => {
		form = buildForm('<input name="email" />');
		const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
		focusFirstFieldError(form, {
			message: 'x',
			fields: [{ name: 'address', message: 'missing' }]
		});
		expect(focusSpy).not.toHaveBeenCalled();
		focusSpy.mockRestore();
	});
});

describe('focusFirstFieldError (SSR)', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.doUnmock('$app/environment');
	});

	it('is a no-op when browser is false', async () => {
		vi.doMock('$app/environment', () => ({ browser: false }));
		const ssr = await import('$lib/app/shared/error');
		const form = document.createElement('form');
		form.innerHTML = '<input name="email" />';
		document.body.appendChild(form);
		const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
		ssr.focusFirstFieldError(form, {
			message: 'x',
			fields: [{ name: 'email', message: 'bad' }]
		});
		expect(focusSpy).not.toHaveBeenCalled();
		focusSpy.mockRestore();
	});
});
