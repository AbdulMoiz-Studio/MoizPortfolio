/**
 * Vercel Serverless Function Entrypoint: /api/server
 * Connects Vercel Serverless requests to the Express application
 */

const app = require('../server/index');

module.exports = (req, res) => {
  return app(req, res);
};
