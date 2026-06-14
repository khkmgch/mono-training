import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/svelte';

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/paths', () => ({ resolve: (p: string) => p }));
vi.mock('$app/navigation', () => ({ goto: vi.fn(), invalidate: vi.fn() }));
vi.mock('$app/forms', () => ({ enhance: () => ({ destroy() {} }), applyAction: vi.fn() }));

vi.mock('$lib/app/shared/confirmation', async () => {
	const actual = await vi.importActual<typeof import('$lib/app/shared/confirmation')>(
		'$lib/app/shared/confirmation'
	);
	return { ...actual, getConfirmContext: () => ({ intent: null, ask: vi.fn(), resolve: vi.fn() }) };
});

vi.mock('$lib/app/shared/toast', async () => {
	const actual =
		await vi.importActual<typeof import('$lib/app/shared/toast')>('$lib/app/shared/toast');
	return {
		...actual,
		getToastContext: () => ({ items: [], push: vi.fn(), dismiss: vi.fn(), clear: vi.fn() })
	};
});

vi.mock('$lib/app/shared/pending/context.svelte', async () => {
	const actual = await vi.importActual<typeof import('$lib/app/shared/pending/context.svelte')>(
		'$lib/app/shared/pending/context.svelte'
	);
	return { ...actual, getPendingContext: () => ({ start: vi.fn(), end: vi.fn() }) };
});

const { default: UserForm } = await import('$lib/app/feature/user/component/UserForm.svelte');

afterEach(cleanup);

// Verifies that UserForm wires the right normalizer to each Field (a real bug
// once shipped). Submit-time validation flows through enhance and is left to
// manual / e2e verification rather than re-enacting the enhance pipeline here.
describe('UserForm — field normalization wiring', () => {
	it('strips all spaces from loginId on blur', async () => {
		const { container } = render(UserForm);
		const input = container.querySelector('input[name="loginId"]') as HTMLInputElement;

		await fireEvent.input(input, { target: { value: '  ad min  ' } });
		await fireEvent.blur(input);

		expect(input.value).toBe('admin');
	});

	it('collapses spaces in fullName on blur (full-width → half-width)', async () => {
		const { container } = render(UserForm);
		const input = container.querySelector('input[name="fullName"]') as HTMLInputElement;

		await fireEvent.input(input, { target: { value: '  Tanaka　　Kenji  ' } });
		await fireEvent.blur(input);

		expect(input.value).toBe('Tanaka Kenji');
	});
});
