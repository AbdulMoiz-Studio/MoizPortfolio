/**
 * Vercel Serverless Function: /api/media
 */
const app = require('../server/index');

module.exports = (req, res) => {
  const action = (req.query && req.query.action) || '';
  if (action === 'upload') {
    req.url = '/api/admin/media/upload';
  } else if (action === 'replace') {
    req.url = '/api/admin/media/replace';
  } else if (action) {
    req.url = '/api/admin/media/' + action;
  } else {
    req.url = '/api/admin/media';
  }
  return app(req, res);
};
