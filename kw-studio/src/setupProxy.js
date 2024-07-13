const { createProxyMiddleware } = require('http-proxy-middleware');

const PROXY_URL = 'https://10.4.134.253:8444';
const INTERCEPTED_SERVICES = ['engine', 'builder', 'eventStats', 'alg-server', 'model-factory'];

const PROXY_EACH_URLS = {
  engine: 'http://10.4.108.161:6480',
  builder: 'http://10.4.108.161:6475',
  eventStats: 'http://10.4.108.161:8001',
  'alg-server': 'http://10.4.108.161:6480',
  'model-factory': 'http://10.4.108.161:9898'
};

module.exports = function (app) {
  if (process.env.NODE_ENV === 'production') return;

  INTERCEPTED_SERVICES.forEach(service => {
    app.use(
      createProxyMiddleware(`/api/${service}`, {
        target: PROXY_EACH_URLS[service] || PROXY_URL,
        changeOrigin: true,
        secure: false
      })
    );
  });
};
