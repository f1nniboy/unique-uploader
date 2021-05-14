import State, { IState, IStateOptions } from "./state/state";
import { defaultAppOptions } from "./core/constant";

import MessageFactory from "./core/messageFactory";
import Utils from "./core/utils";
import MongoConnector from "./mongodb/connector";

import express, { Application } from "express";
import bodyParser from "body-parser";

import RequestManager from "./request/requestManager";

export interface IAppOptions extends IStateOptions {
	readonly initialState: Partial<IState>;
}

export default class App {
	public server: Application;
	public mongoConnection: MongoConnector;

	public requestManager: RequestManager;

	public readonly state: State;
	public readonly options: IAppOptions;

	public readonly message: MessageFactory;

	public constructor() {
		this.message = new MessageFactory(this);
		this.requestManager = new RequestManager(this);

		this.options = defaultAppOptions;
		this.state = new State(this, this.options, this.options.initialState);
	}

	// Prepare the application.
	public async setup() {
		// Display a nice ASCII art containing the project's name and version. (softcoded, of course)
		const packageInfo = Utils.getPackageInfo();

		this.message.ascii(packageInfo.name);
		this.message.info(`v${packageInfo.version}`);

		// Load the configuration.
		await this.state.sync();

		this.message.info("Initialising ...");
		this.init();
	}

	// Start the web server and other things.
	public init() {
		this.server = express();
		this.mongoConnection = new MongoConnector(this);

		// Register middleware
		this.server.use(bodyParser.urlencoded({ extended: false }));
		this.server.use(bodyParser.json());

		// Remove "X-Powered-By" header
		this.server.disable("x-powered-by");

		this.server.listen(this.state.get().serverPort, () => {
			this.message.info(`Started web server on port ${this.state.get().serverPort}.`);
			this.registerRequests();
		});

		this.mongoConnection.startConnection();
	}

	// Register all request handlers that are in the configured folder.
	public async registerRequests() {
		let requestCount: number = await this.requestManager.loadAll();
		this.message.info(`Loaded ${requestCount} requests.`);
	}
}
