const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * 代理服务器地址
 */
// const TARGET_URL = 'https://10.4.68.144';
// const TARGET_URL = 'https://10.4.69.53';
// const TARGET_URL = 'https://10.2.174.228';
// const TARGET_URL = 'https://10.4.107.186';
// const TARGET_URL = 'https://10.4.106.255';
// const TARGET_URL = 'https://10.4.129.24';
// const TARGET_URL = 'https://10.4.69.176';
// const TARGET_URL = 'http://10.2.174.230';
// const TARGET_URL = 'https://10.240.0.42';
// const TARGET_URL = 'https://10.2.235.242';
// const TARGET_URL = 'https://10.2.196.57';
// const TARGET_URL = 'https://10.4.71.138';
// const TARGET_URL = 'http://10.2.174.230:6800';
// const TARGET_URL = 'http://10.4.69.51';
const TARGET_URL = 'http://10.4.131.17';

/**
 * 拦截的服务
 */
const PROXY_URLS = ['studio', 'builder', 'engine'];

/**
 * 单独设置某个服务的地址，默认都使用 TARGET_URL
 */
const RESET = {
  // studio: '127.0.0.0',
  // builder: '127.0.0.0',
  // engine: '127.0.0.0'
};

module.exports = function (app) {
  if (process.env.NODE_ENV === 'production') return;

  PROXY_URLS.forEach(url => {
    app.use(
      createProxyMiddleware(`/api/${url}`, {
        target: RESET[url] || TARGET_URL,
        changeOrigin: true,
        secure: false
      })
    );
  });
};
