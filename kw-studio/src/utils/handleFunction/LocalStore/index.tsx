/**
 * localStorage封装, 对存入的数据进行url编码
 */
const store = window.localStorage;
const localStore = {
  get: (key: string) => {
    const data = store.getItem(key);
    return data ? JSON.parse(decodeURIComponent(data)) : undefined;
  },
  set: (key: string, data: any) => {
    const encodeData = encodeURIComponent(JSON.stringify(data));
    store.setItem(key, encodeData);
  },
  remove: (key: string) => {
    store.removeItem(key);
  }
};

export { localStore };
