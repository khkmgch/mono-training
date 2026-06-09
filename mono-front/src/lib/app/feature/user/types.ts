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

/** Distinct from {@link UpsertUserRequest} (the API body) so the form's field
 *  contract can diverge from the wire contract. */
export type UserFormValues = {
	loginId: string;
	fullName: string;
};
