import { config } from "node-config-ts";
import { Gpio } from "../facades/gpio";
import { GateStatus } from "../constants/GateStatus";

export class GateStateController {
    private gpio: Gpio;

    public constructor(gpio: Gpio) {
        this.gpio = gpio;
    }

    public getState(): string {
        let open = this.gpio.read(config.gateOpenPin);
        let closed = this.gpio.read(config.gateClosedPin);

        if (open === 1 && closed === 1) {
            return GateStatus.Open;
        }
        if (open === 1) {
            return GateStatus.Open;
        }
        if (closed === 1) {
            return GateStatus.Closed;
        }
        return GateStatus.Moving;
    }
}
