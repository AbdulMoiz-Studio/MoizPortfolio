/**
 * Vercel Serverless Function: /api/admin/backups
 */
const app = require('../../server/index');

module.exports = (req, res) => {
  return app(req, res);
};
