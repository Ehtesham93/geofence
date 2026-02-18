// Local development configuration (developer machine/testing)
export default {
    pgdb: {
        host: 'mahindra-tunnel.intellicar.io',
        port: 22041,
        database: 'lmmintellicar',
        schema: 'geofencesch',
        user: 'lmmintellicar_admin',
        password: 'Z52DWfsAZIBtnOK',
    },
    schemas: {
        fmscoresch: 'devfmscoresch',
    },
    apiserver: {
        port: 10069,
    },
    geofenceFeature: {
        getSubscribedVinsOnly: false
    },
    logToConsole: true,
    externalApiUrl: 'https://stg-nemo.mahindralastmilemobility.com:2083',
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
