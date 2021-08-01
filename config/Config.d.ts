/* tslint:disable */
interface Config {
  gateOpenPin: number;
  gateClosedPin: number;
  gatePin: number;
  gateMoveDelay: number;
  defaultWiringPiMode: string;
  client: string;
  mac: string;
  mqttGateTopic: string;
  mqttBroker: string;
  mqttPassword: string;
  mqttUser: string;
  validTokens: ValidToken[];
  issuer: string;
  audience: string;
  serverCert: string;
  algorithm: string;
  gateClaim: string;
}
interface ValidToken {
  client: string;
  key: string;
}