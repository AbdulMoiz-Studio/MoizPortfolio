/**
 * Vercel Serverless Function: /api/admin
 * Base admin route handler
 */

const app = require('../../server/index');

module.exports = (req, res) => {
  req.url = '/api/admin';
  return app(req, res);
};
