const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    createProxyMiddleware('/api', {
      target: 'https://port-folio-front.vercel.app', // Adresse de ton backend
      changeOrigin: true,
    })
  );
};