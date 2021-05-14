export type IPermission = {
	identifier: string; // The identifier of the permission (e.g. "CAN_SEARCH_USERS")
	name: string; // The name of the permission (e.g. "Can search for users")
};

export const PermissionList = {
	USER_INFO: createPermission("USER_INFO", "View public information of users")
}

function createPermission(identifier: string, name: string): IPermission {
	const newPermission: IPermission = {
		identifier: identifier,
		name: name
	};

	return newPermission;
}
