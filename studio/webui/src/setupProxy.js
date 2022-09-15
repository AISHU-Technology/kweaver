const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  if (process.env.NODE_ENV === 'production') return;
  app.use(
    createProxyMiddleware('/api/builder', {
      // target: 'https://10.4.68.144',
      // target: 'https://10.4.69.53',
      // target: 'https://10.2.174.228',
      // target: 'https://10.4.107.186',
      // target: 'https://10.4.106.255',
      // target: 'https://10.4.129.24',
      // target: 'https://10.4.69.176',
      // target: 'http://10.2.174.230',
      // target: 'https://10.240.0.42',
      // target: 'https://10.2.235.242',
      // target: 'https://10.2.196.57',
      // target: 'https://10.4.71.138',
      // target: 'http://10.2.174.230:6475',
      target: 'http://10.4.69.51',
      changeOrigin: true,
      secure: false
    })
  );
  app.use(
    createProxyMiddleware('/api/studio', {
      // target: 'https://10.4.68.144',
      // target: 'https://10.4.69.53',
      // target: 'https://10.2.174.228',
      // target: 'https://10.4.107.186',
      // target: 'https://10.4.106.255',
      // target: 'https://10.4.129.24',
      // target: 'https://10.4.69.176',
      // target: 'http://10.2.174.230',
      // target: 'https://10.240.0.42',
      // target: 'https://10.2.235.242',
      // target: 'https://10.2.196.57',
      // target: 'https://10.4.71.138',
      // target: 'http://10.2.174.230:6800',
      target: 'http://10.4.69.51',
      changeOrigin: true,
      secure: false
    })
  );
  app.use(
    createProxyMiddleware('/api/engine', {
      // target: 'https://10.4.68.144',
      target: 'http://10.4.69.51',
      // target: 'https://10.2.174.228',
      // target: 'https://10.4.107.186',
      // target: 'https://10.4.106.255',
      // target: 'https://10.4.129.24',
      // target: 'https://10.4.69.176',
      // target: 'http://10.2.174.230',
      // target: 'https://10.240.0.42',
      // target: 'https://10.2.235.242',
      // target: 'https://10.2.196.57',
      // target: 'https://10.4.71.138',
      // target: 'http://10.2.174.230:6474',
      changeOrigin: true,
      secure: false
    })
  );
};
