import path from "path";

export default abstract class Utils {

	// Get the package info of the project.
	public static getPackageInfo(): any {
		const packageInfo = require(path.join(__dirname, "..", "..", "package.json"));
		return packageInfo ? packageInfo : {};
	}

}
