/**
 * Vercel Serverless Function: /api/admin/inbox
 */
const app = require('../../server/index');

module.exports = (req, res) => {
  return app(req, res);
};
