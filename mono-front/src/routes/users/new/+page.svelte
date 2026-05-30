<script lang="ts">
	import { resolve } from '$app/paths';
	import * as m from '$lib/paraglide/messages';

	import Breadcrumb from '$lib/app/shared/ui/Breadcrumb.svelte';
	import Card from '$lib/app/shared/ui/Card.svelte';
	import Page from '$lib/app/shared/ui/Page.svelte';
	import PageHeader from '$lib/app/shared/ui/PageHeader.svelte';
	import UserForm from '$lib/app/feature/user/component/UserForm.svelte';

	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>
		{m.common_screen_title_create({ entity: m.term_entity_user() })} - Mono Training
	</title>
</svelte:head>

<Page variant="detail">
	<Breadcrumb
		items={[
			{ label: m.app_nav_users(), href: resolve('/users') },
			{ label: m.common_screen_title_create({ entity: m.term_entity_user() }) }
		]}
	/>

	<PageHeader title={m.common_screen_title_create({ entity: m.term_entity_user() })} />

	<Card>
		<UserForm {form} />
	</Card>
</Page>
