import { Application } from "express";
import { Request, Response, NextFunction } from "express";
import { config } from "node-config-ts";
import { Gpio } from "../facades/gpio";
import { GateStateController } from "../controllers/GateStateController";
import { MessageBus } from "../notifications/MessageBus";
import * as sleep from "system-sleep";
import * as Fs from "fs";
import * as path from "path";
import { pki }from "node-forge";
import { VerifyOptions, verify } from "jsonwebtoken";
import Debug from "debug";
const debug = Debug("GateWebApi");

interface IRequest extends Request {
    access_token: string;
}

export class OAuthGateRoutes {
    private AUTH_HEADER = "authorization";

    public routes(app: Application, messageBus: MessageBus, gpio: Gpio): void {
        let stateController = new GateStateController(gpio);

        app.route("/V2")
        .get((req: IRequest, res: Response) => {
            res.status(200).send("Alive!");
        });

        app.get("/V2/ProtectedAlive", this.retrieveAccessToken, this.requireAccessToken,
          (req: IRequest, res: Response) => {
               res.status(200).send("Alive");
        });

        app.post("/V2/MoveGate", this.retrieveAccessToken, this.requireAccessToken, this.requireGateClaim,
            (req: IRequest, res: Response) => {
                gpio.setupOutputPin(config.settings.gatePin);
                gpio.write(config.settings.gatePin, 1);
                debug("MoveGate: Written 1.");
                sleep(config.settings.gateMoveDelay);
                gpio.write(config.settings.gatePin, 0);
                debug("MoveGate: Written 0.");

                res.status(200).send("Gate moved successfully");
            },
        );

        app.get("/V2/GetInfo", this.retrieveAccessToken, this.requireAccessToken, this.requireGateClaim,
            (req: IRequest, res: Response) => {
                let message =  gpio.getPiBoardId();
                res.status(200).send(message);
            },
        );

        app.get("/V2/GetState", this.retrieveAccessToken, this.requireAccessToken, this.requireGateClaim,
            (req: IRequest, res: Response) => {
                let state = stateController.getState();
                messageBus.notifyGate(state);

                res.status(200).send(state);
            },
        );
    }

    private requireGateClaim = (req: IRequest, res: Response, next: NextFunction) => {
        let claims = (req.access_token as any).claims;

        if (claims && claims.includes(config.settings.gateClaim)) {
            next();
        }
        res.status(401).send();
        next("Unauthorized");
    }

    private retrieveAccessToken = (req: IRequest, res: Response, next: NextFunction) => {
        // get the auth servers public key
        let serverCert = Fs.readFileSync(path.join(process.cwd(), config.settings.serverCert)).toString();
        let publicKey = pki.publicKeyToPem(pki.certificateFromPem(serverCert).publicKey);
        let accessToken = this.getAccessToken(req);

        debug(`Server public key: ${JSON.stringify(publicKey)}`);

        // Verify access token
        let decodedToken;
        try {
            let options = this.getVerifyOptions();
            decodedToken = verify(accessToken, publicKey, options);
        } catch (err) {
            debug(`Verifying accessToken failed: ${err.message}`);
            res.status(401).send(JSON.stringify(err));
            // tslint:disable-next-line:whitespace
            next(err.message);
        }

        if (decodedToken) {
            debug(`AccessToken signature valid. ${decodedToken}`);
            req.access_token = decodedToken;
        }
        next();
    }

    // If access_token doesn't exist on request, we couldn't verify it => return Unauthorized
    private requireAccessToken = (req: IRequest, res: Response, next: NextFunction) => {

        if (!req.access_token) {
            res.status(401).send();
            next("Unauthorized");
        }
        next();
    }

    // Get the access token from the request
    // It should be in the header (bearer: "....")
    // It might be in the body or in the query
    // It shouldn't be, but it might
    private getAccessToken = (req: IRequest): string => {
        let authHeader = req.headers[this.AUTH_HEADER];
        let token: string = "";

        if (authHeader && authHeader.toString().toLowerCase().indexOf("bearer") === 0) {
            debug(`Found token in header.`);
            token = authHeader.slice("bearer ".length).toString();
        } else if (req.body && req.body.access_token) {
            debug(`Found token in body.`);
            token = req.body.access_token.toString();
        } else if (req.query && req.query.access_token) {
            debug(`Found token in header.`);
            token = req.query.access_token.toString();
        }
        debug(`Token: ${token}`);

        return token;
    }

    private getVerifyOptions = () => {
        let verifyOptions: VerifyOptions = {};

        verifyOptions.issuer = config.settings.issuer;
        verifyOptions.audience = config.settings.audience;
        verifyOptions.ignoreNotBefore = false;
        verifyOptions.ignoreExpiration = false;
        verifyOptions.algorithms = [config.settings.algorithm];

        return verifyOptions;
    }
}
