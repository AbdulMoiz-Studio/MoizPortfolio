/**
 * Vercel Serverless Function: /api/inbox
 */
const app = require('../server/index');

module.exports = (req, res) => {
  const id = (req.query && req.query.id) || '';
  if (id) {
    req.url = '/api/admin/inbox/' + id;
  } else {
    req.url = '/api/admin/inbox';
  }
  return app(req, res);
};
