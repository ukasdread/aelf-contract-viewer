/**
 * @file export config
 * @author atom-yang
 */
/* eslint-disable global-require */
let config = require('../../../config');

config = {
  ...config,
  sql: {
    ...config.sql,
    username: config.sql.user,
    dialect: 'mysql',
    dialectOptions: {
      supportBigNumbers: true
    },
    define: {
      timestamp: false
    }
  },
  scanSql: {
    ...config.scanSql,
    username: config.scanSql.user,
    dialect: 'mysql',
    dialectOptions: {
      supportBigNumbers: true
    },
    define: {
      timestamp: false
    }
  }
};

module.exports = config;
/* eslint-enable global-require */
