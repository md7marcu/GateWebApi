import { Application } from "express";
import { Request, Response } from "express";
import { config } from "node-config-ts";
import { Gpio } from "../facades/gpio";
import { GateStateController } from "../controllers/GateStateController";
import { MessageBus } from "../notifications/MessageBus";
import * as sleep from "system-sleep";
import  * as passport from "passport";
import { Strategy } from "passport-http-bearer";
import Tokens from "../database/tokens";
import Debug from "debug";
const debug = Debug("GateWebApi");

export class GateRoutes {

    public routes(app: Application, messageBus: MessageBus, gpio: Gpio): void {
        let stateController = new GateStateController(gpio);

        passport.use(new Strategy(
            function(token, cb) {
                Tokens.findToken(token, function(err, tokenMatch) {
                    if (err) {
                        return cb(err);
                    }
                    return cb(undefined, tokenMatch);
                });
            },
        ));

        app.route("/")
        .get((req: Request, res: Response) => {
            res.status(200).send({
                  status: "Alive",
            });
        });

        app.post("/MoveGate", passport.authenticate("bearer", { session: false}),
            (req: Request, res: Response) => {
                gpio.setupOutputPin(config.settings.gatePin);
                gpio.write(config.settings.gatePin, 1);
                debug("MoveGate: Written 1.");
                sleep(config.settings.gateMoveDelay);
                gpio.write(config.settings.gatePin, 0);
                debug("MoveGate: Written 0.");

                res.status(200).send({
                    message: "Gate moved successfully",
                });
            },
        );

        app.get("/GetInfo", passport.authenticate("bearer", { session: false}),
            (req: Request, res: Response) => {
                let message =  gpio.getPiBoardId();
                res.status(200).send({
                    message: message,
                });
            },
        );

        app.get("/GetState", passport.authenticate("bearer", { session: false}),
            (req: Request, res: Response) => {
                let state = stateController.getState();
                messageBus.notifyGate(state);

                res.status(200).send({
                    message: state,
                });
            },
        );
    }
}
