// Development environment configuration
export default {
  pgdb: {
        host: '10.151.3.100',
        port: 5432,
        database: 'lmm_intellicar_nemo',
        schema: 'geofencesch',
        user: 'muser',
        password: 'mahindra@987',
    },
    schemas: {
        fmscoresch: 'devfmscoresch',
    },
    apiserver: {
        port: 10006,
    },
    geofenceFeature: {
        getSubscribedVinsOnly: false
    },
    logToConsole: true,
    externalApiUrl: 'http://localhost:10004',
    clickhouse: {
        urls: [
          "http://10.178.0.242:8123",
          "http://10.178.0.16:8123",
          "http://10.178.0.210:8123",
          "http://10.178.0.45:8123",
          "http://10.178.0.132:8123",
        ],
        username: "default",
        password: "",
        database: "lmmdata",
        maxBatchDataSize: 25000,
        maxParallelRequests: 100000,
        compression: {
          response: true,
          request: true,
        },
        keep_alive: {
          enabled: true,
        },
      }
};
