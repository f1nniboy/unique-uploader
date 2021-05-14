import { IState } from "./state";
import chalk from "chalk";

export const defaultState: IState = {
    logFormat: "{time} " + chalk.white("|") + " {sender} " + chalk.white("~") + " {message}",

	mongoURI: "",
	serverPort: 8080,
	debugMode: true,

    requestPath: "requests/"
}
