/**
 * Vercel Serverless Function: /api/admin
 * Base admin route handler
 */

const app = require('../../server/index');

module.exports = (req, res) => {
  return app(req, res);
};
