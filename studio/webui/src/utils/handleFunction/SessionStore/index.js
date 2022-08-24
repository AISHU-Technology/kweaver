/**
 * sessionStorage封装, 对存入的数据进行url编码
 */
const sessionStore = new (function () {
  // 定义sessionStorage对象
  this.store = window.sessionStorage;

  // 解码取出
  this.get = key => {
    const data = this.store.getItem(key);

    return JSON.parse(data);
  };

  // 编码存入
  this.set = (key, data) => {
    const encodeData = JSON.stringify(data);

    this.store.setItem(key, encodeData);
  };

  // 删除
  this.remove = key => {
    this.store.removeItem(key);
  };
})();

export { sessionStore };
