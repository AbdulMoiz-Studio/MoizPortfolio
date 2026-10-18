/**
 * Vercel Serverless Function: /api/admin/* (catch-all route)
 * Routes all admin dashboard API calls (login, me, content, projects, media, inbox) to Express
 */

const app = require('../../server/index');

module.exports = (req, res) => {
  return app(req, res);
};
