import { Response } from "express";

export type IResponseHelper = {
	/*
	 * Send a JSON response with the specified status code.
	 */
    sendJSON(webResponse: Response, data: any, statusCode?: number): void;
}

export const ResponseHelper: IResponseHelper = {
	sendJSON(webResponse: Response, data: any = {}, statusCode: number = 200) {
		webResponse.status(statusCode).json({
			...data,
			code: statusCode
		});
	}
}
