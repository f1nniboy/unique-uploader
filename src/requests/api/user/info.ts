import App from "../../../app";

import { IUser } from "../../../mongodb/models/user.model";

import { IRequest } from "../../../request/request";
import { ResponseHelper } from "../../../request/responseHelper";

import { PermissionList } from "../../../permission/permission";

import { Request, Response } from "express";

export const RequestClass: IRequest = {
	requiredPermissions: [ PermissionList.USER_INFO ],
	requiredQueries: [ "id" ],

	async onRequest(app: App, request: Request, response: Response, queryParameters: string[], requestUser: IUser) {
		let user: IUser = await app.mongoConnection.findUserByIdentifier(queryParameters["id"]);

		if(user) {
			ResponseHelper.sendJSON(response, {
				name: user.name,
				identifier: user.identifier,
				permissions: app.mongoConnection.convertIdentifierListToPermissionList(user.permissions)
			});
		} else {
			ResponseHelper.sendJSON(response, {
				message: "The requested user cannot be found."
			}, 404);
		}
	}
}
