/**
 * Vercel Serverless Function: /api/backups
 */
const app = require('../server/index');

module.exports = (req, res) => {
  const action = (req.query && req.query.action) || '';
  if (action === 'restore') {
    req.url = '/api/admin/backups/restore';
  } else {
    req.url = '/api/admin/backups';
  }
  return app(req, res);
};
