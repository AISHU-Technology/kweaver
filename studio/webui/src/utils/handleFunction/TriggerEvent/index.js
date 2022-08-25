/**
 * 为了解决adtd某些组件的奇怪行为bug, 手动触发事件
 * @param {String} eventName 事件名称, 如click
 * @param {HTMLelement} dom DOM节点
 */
const triggerEvent = (eventName, dom = window) => {
  if (document.createEvent) {
    const event = document.createEvent('HTMLEvents');

    event.initEvent(eventName, true, true);
    dom.dispatchEvent(event);
  }

  if (document.fireEvent) {
    dom.fireEvent(`on${eventName}`);
  }
};

export { triggerEvent };
