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
        this.gpio.setupOutputPin(config.settings.gatePin);
        let value = this.gpio.read(config.settings.gatePin);
        debug(`gate: ${value}`);
    }

    public setupGateSensors(): void {
        this.gpio.setupInput(config.settings.gateOpenPin);
        this.gpio.setPullDown(config.settings.gateOpenPin);
        this.gpio.setupInput(config.settings.gateClosedPin);
        this.gpio.setPullDown(config.settings.gateClosedPin);
        let open = this.gpio.read(config.settings.gateOpenPin);
        let closed = this.gpio.read(config.settings.gateClosedPin);
        debug(`open/closed: ${open}/${closed}`);
    }

    private start(): void {
        this.setupGateSensors();
        this.setupGate();

        this.gpio.setRisingInterrupt(config.settings.gateOpenPin, (delta) => {
                // Triggered when it comes back high again
                this.bus.notifyGateOpened();
                // Push notification
                this.notify(`Pin ${config.settings.gateOpenPin} changed to HIGH ${delta}`);
        });

        this.gpio.setFallingInterrupt(config.settings.gateOpenPin, (delta) => {
            // Triggered when it comes back high again
            this.bus.notifyGateMoving();
            // Push notification
            this.notify(`Pin ${config.settings.gateOpenPin} changed to LOW ${delta}`);
    });

        this.gpio.setRisingInterrupt(config.settings.gateClosedPin, (delta) => {
            // Triggered when it comes back high again
            this.bus.notifyGateClosed();
            // Push notification
            this.notify(`Pin ${config.settings.gateClosedPin} changed to HIGH ${delta}`);
        });

        this.gpio.setFallingInterrupt(config.settings.gateClosedPin, (delta) => {
            // Triggered when it comes back high again
            this.bus.notifyGateMoving();
            // Push notification
            this.notify(`Pin ${config.settings.gateClosedPin} changed to LOW ${delta}`);
        });
    }

    private notify(message: string): void {
        debug(`Notify: ${message}`);
    }
}
