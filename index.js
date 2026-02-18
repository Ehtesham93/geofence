//index.js

// Entry point for nemo3-api-geofence-svc. Wires config, logging, db clients,
// services, handlers, routes, and starts the HTTP server.
import winston from "winston";
import config from "./app/config/config.js";
import PgPool from "./app/utils/pgpool.js";
import ClickHouseClient from "./app/utils/clickhouse.js";
import APIServer from "./app/apiserver.js";
import { swaggerDocs } from "./docs/swagger.js";

import HealthSvc from "./app/services/healthsvc/healthsvc.js";
import HealthHdlr from "./app/handlers/healthhdlr/healthhdlr.js";
import ReportSvc from "./app/services/reportsvc/reportsvc.js";

import GeofenceSvc from "./app/services/geofencesvc/geofencesvc.js";
import GeofenceHdlr from "./app/handlers/geofencehdlr/geofencehdlr.js";
import ReportHdlr from "./app/handlers/reporthdlr/reporthdlr.js";
import { Logger } from "./lib/nemo3-lib-observability/index.js";

// The config has been given here, we can proceed with the starting of the services...
const myFormat = winston.format.printf(
  ({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${JSON.stringify(message)}`;
  }
);

// Centralized logger with metrics instrumentation. When logToConsole=false,
// logs are written/rotated via the observability lib and metrics middleware is enabled.
const logger = new Logger({
  environment: process.env.APP_ENV || "LOCAL",
  service: "nemo3-api-geofence-svc",
  instance: process.env.TASK_ARN || "localhost",
  ip: process.env.TASK_IP || "127.0.0.1",
  loglevel: "info",
  logToConsole: config.logToConsole || false,
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  maxBackups: 5,
  checkIntervalMs: 2 * 1000,
  autoInstrument: true,
  flushInterval: 5000,
});

// 0. Config Related...
const apiserverport = config.apiserver.port;

// 1. Services...
const servicelogger = logger;
// Shared data clients
const pgPoolI = new PgPool(config.pgdb, servicelogger, config);
const chClientI = new ClickHouseClient();

const geofenceSvcI = new GeofenceSvc(pgPoolI, servicelogger, config);
const healthSvcI = new HealthSvc();
const reportSvcI = new ReportSvc(chClientI, pgPoolI, servicelogger, config);

// 2. Handlers...
const healthHdlrI = new HealthHdlr(healthSvcI);
const geofenceHdlrI = new GeofenceHdlr(geofenceSvcI, servicelogger);
const reportHdlrI = new ReportHdlr(reportSvcI, servicelogger);

// 3. Handler Map...
// Route prefix → handler instance mapping
const apiRoutes = [
  ["/api/v1/fms/geofence/health/", healthHdlrI],
  ["/api/v1/fms/geofence/", geofenceHdlrI],
  ["/api/v1/fms/geofence/report/", reportHdlrI],
];

// 4. API Server...
// Express app wrapper with common middleware and error handling
const App = new APIServer(apiRoutes, servicelogger, config);


// Enable metrics and structured logging when not running in console-only mode
if(!config.logToConsole){
  App.app.use(logger.getMetrics().middleware());
  logger.start();
}

// 5. Initialize Swagger documentation
swaggerDocs(App.app);

// Start HTTP server
App.Start(apiserverport);
