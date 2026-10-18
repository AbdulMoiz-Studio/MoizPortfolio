/**
 * Vercel Serverless Function: GET /api/admin/export
 */
const app = require('../../server/index');

module.exports = (req, res) => {
  return app(req, res);
};
