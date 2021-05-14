import fs from "fs";
import path from "path";

import { Request, Response } from "express";

import App from "../app";

import { IRequest } from "./request";
import { ResponseHelper } from "./responseHelper";
import { IUser } from "../mongodb/models/user.model";

export default class PluginManager {
    protected readonly app: App;

    public requests: Map<string, IRequest>;
	public requestFiles: any[];

    public constructor(app: App) {
        this.app = app;

        this.requests = new Map();
		this.requestFiles = [];
    }

    public async loadAll(): Promise<number> {
        let loaded: number = 0;

        if (this.app.state.get().requestPath) {
            const requestPath: string = this.app.state.get().requestPath;

			this.loadFiles(requestPath);
			
			this.requestFiles.forEach((info) => {
				this.loadRequest(info.name, info.fullPath);
				loaded++;
			});
        }

        return loaded;
    }

    public loadRequest(requestName: string, requestPath: string): boolean {
        if(!requestName || !requestPath) {
            this.app.message.error("Please specify a request name and path to load.");
            return false;
        }

        if(!this.app.server) {
            this.app.message.error("The web server must be started to load a request.");
            return false;
        }

        // Check if the plugin exists.
        if(!fs.existsSync(requestPath)) {
            this.app.message.error(`The request '{bold}${requestName}{/bold}' doesn't exist.`);
            return false;
        }

        // Check if the request is already loaded.
        if (this.requests.get(requestName)) {
            this.app.message.error(`The request '{bold}${requestName}{/bold}' is already loaded.`);
            return false;
        }

        let request: IRequest;

        try {
            request = require(requestPath);
            request = request[Object.keys(request)[0]];

			this.app.server.use(`/${requestName}`, async (webRequest: Request, webResponse: Response) => {
				try {
					// Combine both POST and GET queries.
					let queryList: any[] = {
					    ...webRequest.query,
					    ...webRequest.body
					};

					if(request.requiredPermissions) {
						let token: string = queryList["token"];

						if(token) {
							let user: IUser = await this.app.mongoConnection.findUserByToken(token);

							if(user) {
								let hasAllPermissions: boolean = await this.app.mongoConnection.hasPermissions(user, request.requiredPermissions);

								if(hasAllPermissions) {
									this.handleRequest(request, webRequest, webResponse, queryList, user);
								} else {
									ResponseHelper.sendJSON(webResponse, {
										message: "You do not have enough permissions to access this resource.",
										missingPermissions: await this.app.mongoConnection.getMissingPermissions(user, request.requiredPermissions)
									}, 403);
								}
							} else {
								ResponseHelper.sendJSON(webResponse, {
									message: "The specified token is invalid."
								}, 400);
							}
						} else {
							ResponseHelper.sendJSON(webResponse, {
								message: "You need to be authenticated to access this resource."
							}, 401);
						}
					} else {
						this.handleRequest(request, webRequest, webResponse, queryList);
					}
				} catch (error) {
					// Correctly handle an error.
					ResponseHelper.sendJSON(webResponse, {
						message: "Unable to fulfill your request because of a server-side error.",
						error: error
					}, 500);

					this.app.message.error(`Error while fulfilling a request for '${requestName}': ${error.message}`);
				}
			});

            this.requests.set(requestName, request);
        } catch (error) {
            this.app.message.error(`An error occurred while trying to load the request '${requestName}': ${error.message}`);
            return false;
        }

        this.app.message.debug(`Loaded the request '${requestName}'.`);
		return true;
    }

	// Recursively load the requets from the specified folder.
	public loadFiles(directory: string = this.app.state.get().requestPath, originalDirectory: string = directory, extensionToSearch: string = "js") {
		const fullPath: string = path.join(__dirname, "..", directory);

		fs.readdirSync(fullPath).forEach(file => {
			const absolutePath: string = path.join(directory, file);
			const fullAbsolutePath: string = path.join(fullPath, file);

			if(fs.statSync(fullAbsolutePath).isDirectory()) return this.loadFiles(absolutePath, originalDirectory, extensionToSearch);
			else {
				let location: string = absolutePath
					.replaceAll(originalDirectory, "")
					.replaceAll(`.${extensionToSearch}`, "");

				this.requestFiles.push({
					name: location,
					fullPath: fullAbsolutePath
				});
			}
		});
	}

	// Handle the web request.
	public handleRequest(request: IRequest, webRequest: Request, webResponse: Response, queryList, ...additionalArguments) {
		if(request.requiredQueries) {
			let missingQueries: string[] = [];

			for(const queryIndex in request.requiredQueries) {
				let query: string = request.requiredQueries[queryIndex];

				let queryExists: boolean = queryList[query] != undefined;
				if(!queryExists) missingQueries.push(query);
			}

			if(missingQueries.length != 0) {
				return ResponseHelper.sendJSON(webResponse, {
					message: "You did not specify all the required queries.",
					missingQueries: missingQueries
				});
			}
		}

		request.onRequest(this.app, webRequest, webResponse, queryList, ...additionalArguments);
	}
}
