import { afterEach, describe, expect, it } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/svelte';
import Field from '$lib/app/shared/ui/Field.svelte';
import { collapseSpaces, stripSpaces } from '$lib/core/text';
import { validateLoginId } from '$lib/app/feature/user/validation';

afterEach(cleanup);

describe('Field — normalize prop', () => {
	it('normalizes the value on blur when normalize is provided', async () => {
		const { getByLabelText } = render(Field, {
			label: 'Full name',
			name: 'fullName',
			normalize: collapseSpaces
		});
		const input = getByLabelText('Full name') as HTMLInputElement;

		await fireEvent.input(input, { target: { value: '  Tanaka　　Kenji  ' } });
		await fireEvent.blur(input);

		expect(input.value).toBe('Tanaka Kenji');
	});

	it('leaves the value untouched on blur when normalize is omitted', async () => {
		const { getByLabelText } = render(Field, {
			label: 'Full name',
			name: 'fullName'
		});
		const input = getByLabelText('Full name') as HTMLInputElement;

		await fireEvent.input(input, { target: { value: '  Tanaka  ' } });
		await fireEvent.blur(input);

		expect(input.value).toBe('  Tanaka  ');
	});
});

describe('Field — validate prop', () => {
	it('shows a validation error on blur and clears it on correction (reward early)', async () => {
		const { getByLabelText, queryByRole } = render(Field, {
			label: 'User ID',
			name: 'loginId',
			normalize: stripSpaces,
			validate: validateLoginId
		});
		const input = getByLabelText('User ID') as HTMLInputElement;

		await fireEvent.input(input, { target: { value: 'ab' } }); // shorter than min 3
		await fireEvent.blur(input);
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(queryByRole('alert')).not.toBeNull();

		await fireEvent.input(input, { target: { value: 'abc' } }); // corrected
		expect(input.getAttribute('aria-invalid')).toBeNull();
		expect(queryByRole('alert')).toBeNull();
	});

	it('does not validate before blur (punish late)', async () => {
		const { getByLabelText, queryByRole } = render(Field, {
			label: 'User ID',
			name: 'loginId',
			normalize: stripSpaces,
			validate: validateLoginId
		});
		const input = getByLabelText('User ID') as HTMLInputElement;

		await fireEvent.input(input, { target: { value: 'ab' } }); // invalid, but not blurred yet
		expect(queryByRole('alert')).toBeNull();
	});

	it('does not clear the typed value when re-validation runs after blur', async () => {
		const { getByLabelText } = render(Field, {
			label: 'User ID',
			name: 'loginId',
			value: '',
			normalize: stripSpaces,
			validate: validateLoginId
		});
		const input = getByLabelText('User ID') as HTMLInputElement;

		await fireEvent.input(input, { target: { value: 'admin' } });
		await fireEvent.blur(input); // touched, valid
		await fireEvent.input(input, { target: { value: 'admin!' } }); // re-focus + invalid char

		expect(input.value).toBe('admin!'); // must NOT be reset to the initial value
	});
});
