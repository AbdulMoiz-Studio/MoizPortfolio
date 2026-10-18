/**
 * Vercel Serverless Function: GET /api/content
 * Returns public portfolio data, projects, testimonials, and site configuration
 */
const app = require('../server/index');

module.exports = (req, res) => {
  req.url = '/api/content';
  return app(req, res);
};
