/**
 * 手动触发DOM事件
 * @param {string} eventName 事件名称, 如 'click'
 * @param {EventTarget & HTMLElement} dom DOM节点，默认为window
 */
const triggerEvent = (eventName: string, dom: EventTarget & HTMLElement = window as any) => {
  const event = new Event(eventName, { bubbles: true, cancelable: true });
  dom.dispatchEvent(event);
};

export { triggerEvent };
