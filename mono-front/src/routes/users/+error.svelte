<script lang="ts">
	import { resolve } from '$app/paths';
	import { ErrorPage } from '$lib/app/shared/error';
	import * as m from '$lib/paraglide/messages';
</script>

<ErrorPage>
	{#snippet actions()}
		<a href={resolve('/users')} role="button" class="secondary">
			{m.app_action_back_to_users()}
		</a>
	{/snippet}
</ErrorPage>
