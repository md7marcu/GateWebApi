import * as express from "express";
import * as bodyParser from "body-parser";
import { GateRoutes } from "./routes/GateRoutes";
import { OAuthGateRoutes } from "./routes/OAuthGateRoutes";
import { MessageBus } from "./notifications/MessageBus";
import { GpioController } from "./controllers/GpioController";
import { Gpio } from "./facades/gpio";
import * as https from "https";
import Debug from "debug";
import * as fs from "fs";
import { config } from "node-config-ts";

const debug = Debug("GateWebApi");

const httpsOptions = {
    key: fs.readFileSync("./" + config.settings.appKey),
    cert: fs.readFileSync("./" + config.settings.appCert),
 };

class App {
    public server: https.Server;
    private app: express.Application;
    private gateRoute: GateRoutes = new GateRoutes();
    private oauthRoute: OAuthGateRoutes = new OAuthGateRoutes();
    private gpioController: GpioController;
    private messageBus: MessageBus;
    private gpio: Gpio;

    constructor() {
        debug("Constructing app.");
        this.app = express();
        this.server = https.createServer(httpsOptions, this.app);
        this.config();
        this.gpio = new Gpio();
        this.gpio.ready.then(() => {
            debug("Gpio ready.");
            this.messageBus = new MessageBus(this.server, this.gpio);
            this.gateRoute.routes(this.app, this.messageBus, this.gpio);
            this.oauthRoute.routes(this.app, this.messageBus, this.gpio);
            this.gpioController  = new GpioController(this.messageBus, this.gpio);
        });
    }

    private config(): void {
        // support application/json type post data
        this.app.use(bodyParser.json());
        // support application/x-www-form-urlencoded post data
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(express.static("public"));
    }
}

export default new App().server;
