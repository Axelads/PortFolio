const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  // Proxy pour PocketBase - DOIT être en premier
  app.use(
    '/pocketbase',
    createProxyMiddleware({
      target: 'https://coastal-abagail-axelads-a874777e.koyeb.app',
      changeOrigin: true,
      secure: true,
      pathRewrite: {
        '^/pocketbase': '',
      },
      onProxyRes: function (proxyRes, req, res) {
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      },
    })
  );

  // Proxy pour ton backend existant
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://port-folio-front.vercel.app',
      changeOrigin: true,
    })
  );
};
