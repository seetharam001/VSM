const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

let sequelize;

if (process.env.DB_HOST) {
  // Use MySQL (e.g., Aiven MySQL)
  sequelize = new Sequelize(
    process.env.DB_NAME || 'defaultdb',
    process.env.DB_USER || 'avnadmin',
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 10241,
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        ssl: {
          rejectUnauthorized: false, // Required for Aiven SSL connections
        },
      },
      define: {
        timestamps: true,
        underscored: false,
      },
    }
  );
} else {
  // Fallback to SQLite (local development default)
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.resolve(__dirname, '../../', process.env.DB_STORAGE || 'database.sqlite'),
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: false,
    },
  });
}

module.exports = sequelize;
