/**
 * Vercel Serverless Function: /api/admin/projects
 */
const app = require('../../server/index');

module.exports = (req, res) => {
  return app(req, res);
};
