<script lang="ts">
	import { resolve } from '$app/paths';
	import { Plus, Search } from '@lucide/svelte';

	import * as m from '$lib/paraglide/messages';

	import { formatDateTime } from '$lib/app/shared/format';
	import { normalizeInput } from '$lib/app/shared/ui/normalize-input';
	import Page from '$lib/app/shared/ui/Page.svelte';
	import PageHeader from '$lib/app/shared/ui/PageHeader.svelte';
	import { ListProvider, SearchForm, DataTable } from '$lib/app/shared/ui/list';
	import { collapseSpaces, stripSpaces } from '$lib/core/text';
	import type { Column } from '$lib/core/table';

	import { userListBinding } from '$lib/app/feature/user/list-binding';
	import type { User } from '$lib/app/feature/user/types';

	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const columns: ReadonlyArray<Column<User>> = [
		{
			id: 'loginId',
			header: m.feature_user_search_column_login_id(),
			accessor: (u) => u.loginId,
			cell: loginIdCell,
			sortable: true,
			width: '30%'
		},
		{
			id: 'fullName',
			header: m.feature_user_search_column_full_name(),
			accessor: (u) => u.fullName,
			sortable: true,
			width: '40%'
		},
		{
			id: 'updatedAt',
			header: m.feature_user_search_column_updated_at(),
			accessor: (u) => u.updatedAt,
			cell: updatedAtCell,
			sortable: true,
			width: '30%'
		}
	];
</script>

{#snippet loginIdCell({ row }: { row: User })}
	<a href={resolve(`/users/${row.id}`)}>{row.loginId}</a>
{/snippet}

{#snippet updatedAtCell({ value }: { value: unknown })}
	{formatDateTime(String(value))}
{/snippet}

<svelte:head>
	<title>{m.feature_user_search_title()} - Mono Training</title>
</svelte:head>

<Page variant="list">
	<PageHeader title={m.feature_user_search_title()}>
		{#snippet end()}
			<a class="btn-icon" href={resolve('/users/new')} role="button">
				<Plus size={16} aria-hidden="true" />
				{m.term_action_create()}
			</a>
		{/snippet}
	</PageHeader>

	<ListProvider binding={userListBinding} query={data.query} result={data.result}>
		<SearchForm aria-label={m.feature_user_search_form_label()}>
			{#snippet searchControls(ctx)}
				<div class="search-fields">
					<label class="search-field">
						<span class="sr-only">{m.feature_user_search_label_login_id()}</span>
						<input
							type="search"
							name="loginId"
							placeholder={m.feature_user_search_label_login_id()}
							value={ctx.query.searchParams.loginId ?? ''}
							maxlength="64"
							autocomplete="off"
							use:normalizeInput={stripSpaces}
						/>
					</label>
					<label class="search-field">
						<span class="sr-only">{m.feature_user_search_label_full_name()}</span>
						<input
							type="search"
							name="fullName"
							placeholder={m.feature_user_search_label_full_name()}
							value={ctx.query.searchParams.fullName ?? ''}
							maxlength="100"
							autocomplete="off"
							use:normalizeInput={collapseSpaces}
						/>
					</label>
					<div class="search-actions">
						{#if ctx.query.searchParams.loginId || ctx.query.searchParams.fullName}
							<a href={resolve('/users')} role="button" class="link-button">
								{m.feature_user_search_action_clear()}
							</a>
						{/if}
						<button type="submit" class="btn-icon">
							<Search size={16} aria-hidden="true" />
							{m.list_search_submit()}
						</button>
					</div>
				</div>
			{/snippet}
		</SearchForm>

		<DataTable
			{columns}
			getRowKey={(user: User) => user.id}
			ariaLabel={m.feature_user_search_table_caption()}
		/>
	</ListProvider>
</Page>

<style>
	.search-fields {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--ds-space-2);
	}

	.search-field {
		flex: 1 1 12rem;
		margin: 0;
	}

	.search-field input {
		width: 100%;
		margin: 0;
	}

	.search-actions {
		display: flex;
		align-items: center;
		gap: var(--ds-space-2);
		margin-left: auto;
	}

	.search-actions :global(button),
	.search-actions :global(a[role='button']) {
		width: auto;
		margin: 0;
		white-space: nowrap;
	}

	@media (max-width: 575px) {
		.search-actions {
			width: 100%;
			margin-left: 0;
			justify-content: flex-end;
		}
	}
</style>
