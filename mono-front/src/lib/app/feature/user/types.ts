/**
 * @remarks `version` participates in optimistic locking — update/delete must
 *   echo the last observed value; a stale value surfaces as `CONFLICT_VERSION`.
 */
export type User = {
	id: string;
	loginId: string;
	fullName: string;
	version: number;
	createdAt: string;
	updatedAt: string;
};

export type UpsertUserRequest = {
	loginId: string;
	fullName: string;
};
