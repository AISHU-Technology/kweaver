/**
 * localStorage封装, 对存入的数据进行url编码
 */
const localStore = new (function () {
  // 定义localStorage对象
  this.store = window.localStorage;

  // 解码取出
  this.get = key => {
    const data = this.store.getItem(key);

    return JSON.parse(decodeURIComponent(data));
  };

  // 编码存入
  this.set = (key, data) => {
    const encodeData = encodeURIComponent(JSON.stringify(data));

    this.store.setItem(key, encodeData);
  };

  // 删除
  this.remove = key => {
    this.store.removeItem(key);
  };
})();

export { localStore };
