<script lang="ts">
	import { resolve } from '$app/paths';
	import * as m from '$lib/paraglide/messages';

	import { FormErrors } from '$lib/app/shared/error';
	import { enhanceWithPending, createSubmitHandler } from '$lib/app/shared/pending';
	import Field from '$lib/app/shared/ui/Field.svelte';
	import FormActions from '$lib/app/shared/ui/FormActions.svelte';

	import type { User } from '../types';

	type Props = {
		user?: User;
		form?:
			| ({ error?: App.Error; values?: Record<string, unknown> } & {
					[key: string]: unknown;
			  })
			| null;
	};

	let { user, form }: Props = $props();

	const isEdit = $derived(user !== undefined);

	const initial = $derived({
		loginId: (form?.values?.loginId as string | undefined) ?? user?.loginId ?? '',
		fullName: (form?.values?.fullName as string | undefined) ?? user?.fullName ?? '',
		version: user?.version ?? 0
	});

	const submit = createSubmitHandler({
		success: ({ result }) => {
			if (isEdit) {
				return {
					toast: {
						message: m.common_action_update_success({ entity: m.term_entity_user() })
					},
					invalidate: 'all'
				};
			}
			const createdId = (result.data as { created?: { id?: string } } | undefined)?.created?.id;
			return {
				toast: {
					message: m.common_action_create_success({ entity: m.term_entity_user() })
				},
				navigateTo: typeof createdId === 'string' ? `/users/${createdId}` : '/users',
				invalidate: 'all'
			};
		},
		failure: 'auto'
	});
</script>

<form method="POST" action="?/save" use:enhanceWithPending={submit}>
	<FormErrors error={form?.error} />

	<Field
		label={m.feature_user_detail_label_login_id()}
		name="loginId"
		type="text"
		required
		maxlength={64}
		value={initial.loginId}
		autocomplete="off"
		hint={m.feature_user_detail_hint_login_id()}
		error={form?.error}
	/>

	<Field
		label={m.feature_user_detail_label_full_name()}
		name="fullName"
		type="text"
		required
		maxlength={100}
		value={initial.fullName}
		autocomplete="off"
		error={form?.error}
	/>

	{#if isEdit}
		<input type="hidden" name="version" value={initial.version} />
	{/if}

	<FormActions>
		<a href={resolve('/users')} role="button" class="link-button">
			{m.term_action_cancel()}
		</a>
		<button type="submit">
			{isEdit ? m.term_action_save() : m.term_action_create()}
		</button>
	</FormActions>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: var(--ds-space-4);
		margin: 0;
	}
</style>
