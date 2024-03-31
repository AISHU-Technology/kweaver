import { kwCookie, sessionStore } from '@/utils/handleFunction';

import { fetchEventSource } from '@microsoft/fetch-event-source';

/**
 * 请求拦截
 */
const requestInterceptors = (config: any = {}) => {
  const kwLang = kwCookie.get('kwLang');

  if (!config.headers) config.headers = {};
  if (!config.headers['Content-Type']) config.headers['Content-Type'] = 'application/json; charset=utf-8';
  config.headers['Accept-Language'] = kwLang === 'en-US' ? 'en-US' : 'zh-CN';

  return config;
};

const postStream = async (url: any, data: any, setAbortController: any, config: any) => {
  const controller = new AbortController();
  setAbortController(controller);
  const signal = controller.signal;
  let error: any = {};
  // get请求可用EventSource，post可用fetchEventSource或fetch
  // 相对于fetch来讲，在onmessage中获取到的数据不需要再进行解析
  await fetchEventSource(url, {
    ...requestInterceptors({
      url,
      method: data?.method,
      headers: {
        responseType: 'text/event-stream',
        Connection: 'keep-alive',
        'Content-Type': 'application/json'
      },
      signal,
      body: JSON.stringify(data?.body)
    }),
    async onopen(response: any) {
      if (response.ok) {
        //
      } else {
        let finish = false;
        const reader = response.body?.getReader();
        const textDecoder = new TextDecoder('utf-8');

        if (!finish) {
          const chunk = await reader?.read();
          const valueError = textDecoder.decode(chunk?.value);
          if (response?.statusText === valueError) {
            finish = true;
            controller.abort();
            error = { description: valueError, code: response?.code };
          }
          finish = true;
          error = JSON.parse(valueError);
          controller.abort();
        }
      }
    },
    ...config
  });
  return error;
};

export { postStream };
