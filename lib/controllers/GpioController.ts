import { config } from "node-config-ts";
import { MessageBus } from "../notifications/MessageBus";
import { Gpio } from "../facades/gpio";
import Debug from "debug";
const debug = Debug("GateWebApi");

export class GpioController {
    private gpio: Gpio;
    private bus: MessageBus;

    public constructor(bus: MessageBus, gpio: Gpio) {
        this.bus = bus;
        this.gpio = gpio;
        this.start();
    }

    public setupGate(): void {
        this.gpio.setupOutputPin(config.gatePin);
        let value = this.gpio.read(config.gatePin);
        debug(`gate: ${value}`);
    }

    public setupGateSensors(): void {
        this.gpio.setupInput(config.gateOpenPin);
        this.gpio.setPullDown(config.gateOpenPin);
        this.gpio.setupInput(config.gateClosedPin);
        this.gpio.setPullDown(config.gateClosedPin);
        let open = this.gpio.read(config.gateOpenPin);
        let closed = this.gpio.read(config.gateClosedPin);
        debug(`open/closed: ${open}/${closed}`);
    }

    private start(): void {
        this.setupGateSensors();
        this.setupGate();

        this.gpio.setRisingInterrupt(config.gateOpenPin, (delta) => {
                // Triggered when it comes back high again
                this.bus.notifyGateOpened();
                // Push notification
                this.notify(`Pin ${config.gateOpenPin} changed to HIGH ${delta}`);
        });

        this.gpio.setFallingInterrupt(config.gateOpenPin, (delta) => {
            // Triggered when it comes back high again
            this.bus.notifyGateMoving();
            // Push notification
            this.notify(`Pin ${config.gateOpenPin} changed to LOW ${delta}`);
    });

        this.gpio.setRisingInterrupt(config.gateClosedPin, (delta) => {
            // Triggered when it comes back high again
            this.bus.notifyGateClosed();
            // Push notification
            this.notify(`Pin ${config.gateClosedPin} changed to HIGH ${delta}`);
        });

        this.gpio.setFallingInterrupt(config.gateClosedPin, (delta) => {
            // Triggered when it comes back high again
            this.bus.notifyGateMoving();
            // Push notification
            this.notify(`Pin ${config.gateClosedPin} changed to LOW ${delta}`);
        });
    }

    private notify(message: string): void {
        debug(`Notify: ${message}`);
    }
}
