/* tslint:disable */
interface Config {
  settings: Settings;
}
interface Settings {
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
  validTokens: any[];
  issuer: string;
  audience: string;
  serverCert: string;
  appKey: string;
  appCert: string;
  algorithm: string;
  gateClaim: string;
}