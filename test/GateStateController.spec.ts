import "mocha";
import { expect } from "chai";
import { GateStateController } from "../lib/controllers/GateStateController";
import { Gpio } from "../lib/facades/gpio";
import { GateStatus } from "../lib/constants/GateStatus";

describe("Gate State Routes", () => {
    let gpio: Gpio;

    before( async() => {
        gpio = new Gpio();
    });

    it("Should return moving state for gate", async () => {
        gpio.ready.then( () => {
            let gate = new GateStateController(gpio);

            let state = gate.getState();

            expect(state).to.equal(GateStatus.Moving);
        });
    });
});
