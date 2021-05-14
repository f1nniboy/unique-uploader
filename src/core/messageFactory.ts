import App from "../app";

import chalk from "chalk";
import moment from "moment";
import figlet from "figlet";

export enum LogType {
	Info    = "INFO",
	Warning = "WARN",
	Error   = "ERROR",
	Debug   = "DEBUG",
	ASCII   = "ASCII"
}

export default class MessageFactory {
	protected readonly app: App;

	public constructor(app: App) {
		this.app = app;
	}

	public create(sender: string, message: any, senderColor: string = "white") {
		let messageString: string = message.toString();
		let timeString: string = moment().format('HH:mm:ss');

		// If the color starts with a '#', indicating that it is a hex color we can simply convert the hex to a similar-looking color, but if it isn't a hex color, refuse to append the message.
		if (senderColor.startsWith("#")) sender = chalk.hex(senderColor)(sender);
		else if (chalk[senderColor] === undefined || typeof chalk[senderColor] !== "function") return this.warning("A invalid sender color was provided.");
		else sender = ((chalk)[senderColor])(sender);

		let line: string = this.app.state.get().logFormat
			.replace("{time}", timeString)
			.replace("{sender}", sender)
			.replace("{message}", messageString);

		console.log(line);
    }

	public info(message: any) {
		this.create(LogType.Info, message, "blue");
	}

	public warning(message: any) {
		this.create(LogType.Warning, message, "yellow");
	}

	public error(message: any) {
		this.create(LogType.Error, message, "red");
	}

	public debug(message: any) {
		const shouldShow = this.app.state.get().debugMode;
		if(shouldShow) this.create(LogType.Debug, message, "green");
	}

	public ascii(message: string) {
		const asciiArt = figlet.textSync(message);
		const lineArray: string[] = asciiArt.split("\n");

		lineArray.forEach((line) => {
			this.create(LogType.ASCII, line, "blue");
		});
	}
}
