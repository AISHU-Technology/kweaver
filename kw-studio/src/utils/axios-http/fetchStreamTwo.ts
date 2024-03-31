import Cookie from 'js-cookie';

import { sessionStore } from '@/utils/handleFunction';

const requestInterceptors = (config: any = {}) => {
  const kwLang = Cookie.get('kwLang');
  const sessionidCookie = Cookie.get('sessionid') || '';
  const sessionidStorage = sessionStore.get('sessionid') || '';
  const uuid = Cookie.get('uuid');
  const token = Cookie.get('token');
  const sourceType = Cookie.get('source_type') || 0;

  if (sessionidCookie && sessionidCookie !== sessionidStorage) {
    sessionStore.set('sessionid', sessionidCookie);
    window.location.reload();
  }
  if (!config.headers) config.headers = {};
  if (token && config.url !== '/api/rbac/v1/login') config.headers.token = token;
  if (uuid) config.headers.uuid = uuid;
  if (sessionidCookie) config.headers.sessionid = sessionidCookie;
  if (!config.headers['Content-Type']) config.headers['Content-Type'] = 'application/json; charset=utf-8';
  config.headers['Accept-Language'] = kwLang === 'en-US' ? 'en-US' : 'zh-CN';
  config.headers['source-type'] = sourceType;

  return config;
};

const postStream = (url: string, body: any) => {
  return window.fetch(
    url,
    requestInterceptors({
      url,
      method: 'post',
      headers: {
        responseType: 'text/event-stream',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(body)
    })
  );
};

export { postStream };
