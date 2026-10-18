/**
 * Vercel Serverless Function: /api/admin/projects
 */
const app = require('../../server/index');

module.exports = (req, res) => {
  const slug = (req.query && req.query.slug) || '';
  if (slug) {
    req.url = '/api/admin/projects/' + slug;
  } else {
    req.url = '/api/admin/projects';
  }
  return app(req, res);
};
