import App from "../app";

import UserModel, { IUser } from "./models/user.model";

import { IPermission, PermissionList } from "../permission/permission";

import mongoose from "mongoose";
import crypto from "crypto";
import * as bcrypt from "bcrypt";

export default class MongoConnector {
    protected readonly app: App;

    public constructor(app: App) {
        this.app = app;
    }

	// Establish a MongoDB connection using the URI specified in the state.
	public startConnection() {
		mongoose.connect(this.app.state.get().mongoURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
		.then(() => {
			this.app.message.info(`Started MongoDB on database '${mongoose.connection.name}'.`);
		})
		.catch((error) => {
			this.app.message.error(`Failed to start MongoDB: ${error.message}`);
		});
	}

	// Create a user and add it to the MongoDB.
	public async addUser(name: string, password: string): Promise<any> {
		return new Promise(async (resolve, reject) => {
			let generatedToken: string = crypto.randomBytes(16).toString("hex");
			let generatedUID: string = crypto.randomBytes(16).toString("hex");

			if(name == undefined || name == "") return reject({ message: "Please specify a name." });
			if(password == undefined || password == "") return reject({ message: "Please specify a password." });

			if(await this.userExistsByName(name)) return reject({ message: "The specified name is already taken." });

			let hashedPassword: string = await bcrypt.hash(password, 10);

			// TODO: Sanitize name

			const newUser: IUser = new UserModel({
				name: name,
				identifier: generatedUID,
				hashedPassword: hashedPassword,
				token: generatedToken
			});
			newUser.save();

			resolve({
				name: name,
				identifier: generatedUID,
				token: generatedToken,
				permissions: newUser.permissions
			});
			
		});
	}

	public async verifyLogin(name: string, password: string): Promise<any> {
		return new Promise(async (resolve, reject) => {
			if(name == undefined || name == "") return reject({ message: "Please specify a name." });
			if(password == undefined || password == "") return reject({ message: "Please specify a password." });

			let user: IUser = await this.findUserByName(name);
			if(!user) return reject({ message: "The specified name doesn't exist." });

			bcrypt.compare(password, user.hashedPassword, (_, valid) => {
				if(valid) {
					resolve({
						name: user.name,
						token: user.token
					});
				} else {
					reject({
						message: "The specified password is invalid."
					});
				}
			});

		});
	}



	/*
	 * User Searching
	 */

	public async findUserByToken(token: string): Promise<IUser> {
		return await UserModel.findOne({ token: token });
	}

	public async userExistsByToken(token: string): Promise<boolean> {
		return await this.findUserByToken(token) != undefined;
	}

	public async findUserByName(name: string): Promise<IUser> {
		return await UserModel.findOne({ name: name });
	}

	public async userExistsByName(name: string): Promise<boolean> {
		return await this.findUserByName(name) != undefined;
	}

	public async findUserByIdentifier(identifier: string): Promise<IUser> {
		return await UserModel.findOne({ identifier: identifier });
	}

	public async userExistsByIdentifier(identifier: string): Promise<boolean> {
		return await this.findUserByIdentifier(identifier) != undefined;
	}



	/*
	 * Permission-related functions
	 */

	public convertIdentifierListToPermissionList(identifierList: string[]): IPermission[] {
		let permissionList: IPermission[] = [];

		identifierList.forEach((identifier: string) => {
			if(this.permissionExists(identifier)) permissionList.push(PermissionList[identifier]);
		});

		return permissionList;
	}

	// Check if a permission is defined in the permission list.
	public permissionExists(permissionIdentifier: string): boolean {
		return PermissionList[permissionIdentifier] != undefined;
	}

	// Check if the user has the specified permission.
	public hasPermission(user: IUser, permission: IPermission): Promise<boolean> {
		return new Promise((resolve) => {
			if(!this.permissionExists(permission.identifier)) return resolve(false);

			if(user) {
				let userPermissions: IPermission[] = this.convertIdentifierListToPermissionList(user.permissions);

				let foundPermissions: IPermission[] = userPermissions.filter((foundPermission: IPermission) => foundPermission.identifier === permission.identifier);
				let hasPermission: boolean = foundPermissions.length != 0;

				resolve(hasPermission);
			} else {
				resolve(false);
			}
		});
	}

	// Get the permissions that the user is missing to access a specific resource.
	public async getMissingPermissions(user: IUser, permissionIdentifiers: IPermission[]): Promise<IPermission[]> {
		let missingPermissions: IPermission[] = [];

		for(const permissionIndex in permissionIdentifiers) {
			let permission: IPermission = permissionIdentifiers[permissionIndex];

			let hasPermission: boolean = await this.hasPermission(user, permission);
			if(!hasPermission) missingPermissions.push(permission);
		}

		return missingPermissions;
	}

	// Check if the user has the specified permissions. Returns 'false' if the user doesn't have all the specified permissions.
	public hasPermissions(user: IUser, permissionIdentifiers: IPermission[]): Promise<boolean> {
		return new Promise(async (resolve) => {
			let missingPermissions: IPermission[] = await this.getMissingPermissions(user, permissionIdentifiers);
			resolve(missingPermissions.length == 0);
		});
	}
}
