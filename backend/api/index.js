// Explicitly require mysql2 so Vercel's bundler includes it in the serverless function.
// Sequelize loads dialect drivers dynamically, which the bundler can't detect.
require('mysql2');

const app = require('../src/server');

module.exports = app;
