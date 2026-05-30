<script lang="ts">
	import { resolve } from '$app/paths';
	import * as m from '$lib/paraglide/messages';

	import { formatDateTime } from '$lib/app/shared/format';
	import Breadcrumb from '$lib/app/shared/ui/Breadcrumb.svelte';
	import Card from '$lib/app/shared/ui/Card.svelte';
	import DangerZone from '$lib/app/shared/ui/DangerZone.svelte';
	import DetailMeta from '$lib/app/shared/ui/DetailMeta.svelte';
	import Page from '$lib/app/shared/ui/Page.svelte';
	import PageHeader from '$lib/app/shared/ui/PageHeader.svelte';
	import UserForm from '$lib/app/feature/user/component/UserForm.svelte';
	import DeleteUserForm from '$lib/app/feature/user/component/DeleteUserForm.svelte';

	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>
		{data.user.loginId} - {m.common_screen_title_edit({ entity: m.term_entity_user() })}
	</title>
</svelte:head>

<Page variant="detail">
	<Breadcrumb
		items={[{ label: m.app_nav_users(), href: resolve('/users') }, { label: data.user.loginId }]}
	/>

	<PageHeader title={m.common_screen_title_edit({ entity: m.term_entity_user() })}>
		{#snippet end()}
			<DetailMeta
				items={[
					{
						label: m.feature_user_detail_meta_created_at_label(),
						value: formatDateTime(data.user.createdAt)
					},
					{
						label: m.feature_user_detail_meta_updated_at_label(),
						value: formatDateTime(data.user.updatedAt)
					}
				]}
			/>
		{/snippet}
	</PageHeader>

	<Card>
		<UserForm user={data.user} {form} />
	</Card>

	<DangerZone
		ariaLabel={m.feature_user_detail_danger_zone_title()}
		description={m.feature_user_detail_danger_zone_description()}
	>
		<DeleteUserForm user={data.user} />
	</DangerZone>
</Page>
