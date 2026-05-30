<script lang="ts">
	import { Trash2 } from '@lucide/svelte';

	import * as m from '$lib/paraglide/messages';

	import { enhanceWithPending, createSubmitHandler } from '$lib/app/shared/pending';

	import type { User } from '../types';

	type Props = { user: User };

	let { user }: Props = $props();

	const submit = createSubmitHandler({
		confirm: () => ({
			title: m.common_dialog_delete_title({ entity: m.term_entity_user() }),
			message: m.feature_user_detail_delete_confirm_message({ loginId: user.loginId }),
			confirmLabel: m.term_action_delete(),
			destructive: true
		}),
		success: {
			toast: { message: m.common_action_delete_success({ entity: m.term_entity_user() }) },
			navigateTo: '/users'
		},
		failure: 'auto'
	});
</script>

<form method="POST" action="?/delete" use:enhanceWithPending={submit}>
	<input type="hidden" name="version" value={user.version} />
	<button type="submit" class="btn-icon">
		<Trash2 size={16} aria-hidden="true" />
		{m.term_action_delete()}
	</button>
</form>

<style>
	form {
		margin: 0;
	}
</style>
