// Postgres connection pool wrapper with transaction helpers and structured errors.
import pg from 'pg';
import FabErr from './faberr.js';

export const ErrConnect = new FabErr('ERR_CONNECT', null, 'db connect error');
export const ErrTXNStart = new FabErr('ERR_TXN_START', null, 'txn start error');
export const ErrTXNRollback = new FabErr('ERR_TXN_ROLLBACK', null, 'txn rollback error');
export const ErrTXNExec = new FabErr('ERR_TXN_EXEC', null, 'txn exec error');

export default class PgPool {
    // pgcfg: { user, host, port, database, password, schema }
    // logger/config: used for error logging and search_path setup
    constructor(pgcfg, logger, config) {
        this.logger = logger;
        this.config = config;
        this.Pool = new pg.Pool({
            user: pgcfg.user,
            host: pgcfg.host,
            port: pgcfg.port,
            database: pgcfg.database,
            password: pgcfg.password,
            min: 2,
            max: 5,
            statement_timeout: 30 * 1000,
            ssl: {
                rejectUnauthorized: false,
              },
        });
        this.Pool.on('connect', (client) => {
            client.query('SET search_path TO ' + pgcfg.schema + ',' + this.config.schemas.fmscoresch + ',public');
            client.query("SET TIME ZONE 'Asia/Kolkata'");
        });
    }

    async Query(...args) {
        return this.Pool.query(...args);
    }

    async StartTransaction() {
        let client = null;
        try {
            client = await this.Pool.connect();
        } catch (error) {
            this.logger.error(error);
            const errorresp = error;
            if (error.hasOwnProperty('message')) {
                errorresp.msg = error.message;
            }
            return [null, ErrConnect.NewWData(error)];
        }
        try {
            await client.query('BEGIN');
            return [client, null];
        } catch (error) {
            this.logger.error(error);
            const errorresp = error;
            if (error.hasOwnProperty('message')) {
                errorresp.msg = error.message;
            }
            return [null, ErrTXNStart.NewWData(error)];
        }
    }

    async RunTransaction(queryfn) {
        let client = null;
        try {
            client = await this.Pool.connect();
        } catch (error) {
            this.logger.error(error);
            const errorresp = error;
            if (error.hasOwnProperty('message')) {
                errorresp.msg = error.message;
            }
            return [null, ErrConnect.NewWData(error)];
        }
        try {
            await client.query('BEGIN');
            const funcres = await queryfn(client);
            await client.query('COMMIT');
            return funcres;
        } catch (error) {
            // Ensure we attempt to rollback before surfacing execution error
            const rollbackerr = await this.TxRollback(client);
            if (rollbackerr != null) {
                this.logger.error(rollbackerr);
                const errorresp = rollbackerr;
                if (error.hasOwnProperty('message')) {
                    errorresp.msg = rollbackerr.message;
                }
                return [null, ErrTXNRollback.NewWData(rollbackerr)];
            }
            this.logger.error(error);
            const errorresp = error;
            if (error.hasOwnProperty('message')) {
                errorresp.msg = error.message;
            }
            return [null, ErrTXNExec.NewWData(errorresp)];
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    async TxCommit(client) {
        try {
            await client.query('COMMIT');
            return null;
        } catch (error) {
            return error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    async TxRollback(client) {
        try {
            await client.query('ROLLBACK');
            return null;
        } catch (error) {
            return error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    async End() {
        try {
            await this.Pool.end();
        } catch (error) {
            return error;
        }
        return null;
    }
}
