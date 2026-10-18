/**
 * Vercel Serverless Function: GET/PUT /api/admin/content
 */
const app = require('../../server/index');

module.exports = (req, res) => {
  return app(req, res);
};
