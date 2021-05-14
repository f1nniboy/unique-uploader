import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
	name: string; // The user's name
	identifier: string; // The unique identifier of the user
	hashedPassword: string; // The hashed password used for password verifcation
	token: string; // The generated token that the user will use for authentication
	permissions: string[]; // The permissions the user has which control what the user can do and has access to
}

const UserSchema: Schema = new Schema({
	name: { type: String, required: true, unique: true },
	identifier: { type: String, required: true, unique: true },
	token: { type: String, required: true, unique: true },
	hashedPassword: { type: String, required: true },
	permissions: { type: Array, default: [] }
});

export default mongoose.model<IUser>("User", UserSchema);
