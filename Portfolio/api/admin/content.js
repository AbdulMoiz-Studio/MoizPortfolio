/**
 * Vercel Serverless Function: GET/PUT /api/admin/content
 */
const app = require('../../server/index');

module.exports = (req, res) => {
  req.url = '/api/admin/content';
  return app(req, res);
};
