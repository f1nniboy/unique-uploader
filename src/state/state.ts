import { EventEmitter } from "events";
import fs from "fs";
import { defaultState } from "./stateConstants";
import App from "../app";
import * as path from "path";

export interface IStateOptions {
    readonly stateFilePath: string;
}

export interface IState {
    readonly logFormat: string;
	
	readonly mongoURI: string;
	readonly serverPort: number;
	readonly debugMode: boolean;

    readonly requestPath: string;
}

export default class State extends EventEmitter {
    public readonly options: IStateOptions;
    protected state: IState;
    protected readonly app: App;

    public constructor(app: App, options: IStateOptions, initialState?: Partial<IState>) {
        super();

        this.app = app;
        this.options = options;

        // Initialize the state.
        this.state = {
            ...defaultState,
            ...initialState
        };
    }

    public get(): IState {
        return Object.assign({}, this.state);
    }

    /*
     * Change the application's state, triggering
     * a state change event.
     */
    public update(changes: Partial<IState>): this {
        this.emit("stateWillChange");

        // Store current state as previous state.
        const previousState: IState = this.state;

        // Update the state.
        this.state = {
            ...this.state,
            ...changes
        };

        // Fire the state change event. Provide the old and new state.
        this.emit("stateChanged", this.state, previousState);
        return this;
    }

    /*
     * Load and apply previously saved state from the
     * file system.
     */
    public async sync(): Promise<boolean> {
        if (fs.existsSync(path.join(__dirname, "..", this.options.stateFilePath))) {
            return new Promise<boolean>((resolve) => {
                fs.readFile(path.join(__dirname, "..", this.options.stateFilePath), (error: Error, data: Buffer) => {
                    if (error) {
                        this.app.message.error(`There was an error while reading the application state: ${error.message}`);

                        resolve(false);
                        return;
                    }

                    this.state = {
                        ...JSON.parse(data.toString()),
                    };

                    fs.access(path.join(__dirname, "..", this.options.stateFilePath), fs.constants.W_OK, (error) => {
                        if(error) this.app.message.info(`The '${path.join(__dirname, "..", this.options.stateFilePath)}' file is not writable. No configuration changes will be saved.`);
                    });

                    this.app.message.info(`Synced application state.`);
                    resolve(true);
                });
            });
        } else {
			this.app.message.warning("State file didn't exist yet, creating it now.");

			this.save();
			return this.sync();
		}
    }

    public save(notify: boolean = false): void {
        if(notify) this.app.message.info("Saving application state...");

        const data: string = JSON.stringify({
            ...this.state,
        });

        fs.writeFileSync(path.join(__dirname, "..", this.options.stateFilePath), data);
        if(notify) this.app.message.info(`Application state saved.`);
    }

}
