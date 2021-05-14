import App from "../app";

import { IUser } from "../mongodb/models/user.model";

import { Response, Request } from "express";

import { IPermission } from "../permission/permission";

export type IRequest = {
	requiredPermissions?: IPermission[]; // What permissions the user needs to access this resource.
	requiredQueries?: string[]; // The queries that you need to specify in order to access this resource.

	onRequest(app: App, request: Request, response: Response, queryParameters: string[], user?: IUser): void; // Gets executed when a request is made to this endpoint.
}
