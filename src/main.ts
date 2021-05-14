console.log("Starting application ...");

import App from "./app";
const app: App = new App();

try {
	app.setup();
} catch (error) {
	console.log("Something went wrong.");
	process.exit(1);
}
