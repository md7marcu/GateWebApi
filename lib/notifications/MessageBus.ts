import * as socketio from "socket.io";
import * as http from "http";
import { connect, Client } from "mqtt";
import { config } from "node-config-ts";
import { Gpio } from "../facades/gpio";
import { GateStateController } from "../controllers/GateStateController";
import { GateStatus } from "../constants/GateStatus";
import Debug from "debug";
const debug = Debug("GateWebApi");

export class MessageBus {
    private io: any;
    private gpio: Gpio;
    private mqttClient: Client;

    constructor(server: http.Server, gpio: Gpio) {
        this.io = socketio.listen(server);
        this.gpio = gpio;
        this.mqttClient = connect(`mqtt://${config.mqttUser}:${config.mqttPassword}@${config.mqttBroker}`, {});
        this.initBus();
    }

    initBus(): void {
        this.io.on("connect", this.onConnect.bind(this));
        this.io.on("disconnect", this.onDisconnect);
        this.io.on("connection", socket => {
            socket.on("getState", this.getState);
        });
        this.mqttClient.on("connect", () => {
            let state = this.readGateState();
            debug(`MQTT Client connected: ${state}`);
            this.publishMqtt(state);
        });
    }

    public notifyGate(state: string): void {
        debug(`MessageBus: Gate ${state}`);
        this.io.sockets.emit("gateState", state);
        this.publishMqtt(state);
    }

    public notifyGateOpened(): void {
        debug("MessageBus: Gate opened");
        this.io.sockets.emit("gateState", GateStatus.Open);
        this.publishMqtt(GateStatus.Open);
    }

    public notifyGateClosed(): void {
        debug("MessageBus: Gate Closed");
        this.io.sockets.emit("gateState", GateStatus.Closed);
        this.publishMqtt(GateStatus.Closed);
    }

    public notifyGateMoving(): void {
        debug("MessageBus: Gate Moving");
        this.io.sockets.emit("gateState", GateStatus.Moving);
        this.publishMqtt(GateStatus.Moving);
    }

    public notifyGateError(): void {
        debug("MessageBus: Gate Error");
        this.io.sockets.emit("gateState", GateStatus.Error);
        this.publishMqtt(GateStatus.Error);
    }

    private onConnect(socket) {
        socket.emit("gateState", this.readGateState());
    }

    private onDisconnect() {
        debug("MessageBus: user disconnected");
    }

    private getState = () => {
        debug("MessageBus: gateState request received");
        this.notifyGate(this.readGateState());
    }

    private readGateState = () => {
        let message = new GateStateController(this.gpio).getState();
        debug(`MessageBus: GateState sent: ${message}`);

        return message;
    }

    private publishMqtt = (position: string) => {
        let payload = JSON.stringify({ state: position});
        debug(`Publishing: ${payload}`);
        this.mqttClient.publish(config.mqttGateTopic, payload, { qos: 2});
    }
}
