/* tslint:disable */
interface Config {
  gateOpenPin: number;
  gateClosedPin: number;
  gatePin: number;
  gateMoveDelay: number;
  defaultWiringPiMode: string;
  client: string;
  mac: string;
  validTokens: ValidToken[];
  mqttGateTopic: string;
  mqttBroker: string;
  mqttUser: string;
  mqttPassword: string;
  issuer: string;
  audience: string;
  serverCert: string
  algorithm: string;
  gateClaim: string;
}
interface ValidToken {
  client: string;
  key: string;
}
