/**
 * sessionStorage封装, 对存入的数据进行url编码
 */
const store = window.sessionStorage;
const sessionStore = {
  get: (key: string) => {
    const data = store.getItem(key);
    return data ? JSON.parse(data) : undefined;
  },
  set: (key: string, data: any) => {
    const encodeData = JSON.stringify(data);
    store.setItem(key, encodeData);
  },
  remove: (key: string) => {
    store.removeItem(key);
  },
  clear: () => {
    store.clear();
  }
};

export { sessionStore };
