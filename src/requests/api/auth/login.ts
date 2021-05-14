import App from "../../../app";

import { IRequest } from "../../../request/request";
import { ResponseHelper } from "../../../request/responseHelper";

import { Request, Response } from "express";

export const RequestClass: IRequest = {
	requiredQueries: [ "name", "password" ],

	async onRequest(app: App, request: Request, response: Response, queryParameters: string[]) {
		app.mongoConnection.verifyLogin(queryParameters["name"], queryParameters["password"])
			.then((message) => {
				ResponseHelper.sendJSON(response, message);
			}).catch((error) => {
				ResponseHelper.sendJSON(response, error, 400);
			});
	}
}
