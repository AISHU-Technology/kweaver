export const FA_LAYOUT = 'layout'; // father -> iframe 布局信息
export const FA_UPDATE_CONFIG = 'update_config'; // father -> iframe 更新布局信息
export const FA_EVENT_EMITTER = 'event_emitter'; // father -> iframe graph 设置
export const FA_TEMP_SYNC_DATA = 'temp_sync_data'; // father -> iframe export 临时同步元素数据

export const IF_RENDER_COMPLETE = 'render_complete'; // iframe -> father 渲染结束事件
export const IF_EVENT = 'event'; // iframe -> father 基础事件
export const IF_TEMP_SYNC_DATA = 'temp_sync_data'; // iframe -> father 临时同步元素数据

const globalThis = window;
class ADGraph {
  config;
  location;
  isIframeInit;
  iframe;
  container;

  handlers;
  contentWindow;

  constructor(init) {
    const { config = {}, location, container } = init;
    this.config = config;
    this.location = location;
    this.isIframeInit = true;
    this.iframe = document.createElement('iframe');
    this.container = container;

    this.handlers = {};

    globalThis.addEventListener('message', this.receiveMessage.bind(this));
    this.init();
  }

  set Config(data) {
    this.postMessage(FA_UPDATE_CONFIG, { config: data });
    if (
      data?.container?.width !== this.config.container.width ||
      data?.container?.height !== this.config.container.height
    ) {
      const width = data?.container?.width || 0;
      const height = data?.container?.height || 0;
      this.iframe.setAttribute('style', 'border: 0; width: ' + width + 'px; height: ' + height + 'px;');
    }
    this.config = data;
  }

  init() {
    const width = this.container.clientWidth || 0;
    const height = this.container.clientHeight || 0;
    if (this.config?.container === undefined) {
      const width = this.container?.clientWidth || 0;
      const height = this.container?.clientHeight || 0;
      this.config.container = { width, height };
    }

    const { origin, pathname = '', search = '' } = this.location;

    this.iframe.name = 'adgraph';
    this.iframe.allow = 'fullscreen';
    this.iframe.src = origin + pathname + search;
    this.iframe.setAttribute('style', 'border: 0; width: ' + width + 'px; height: ' + height + 'px;');

    this.container.appendChild(this.iframe);
  }

  /** 向 iframe 发送信息
   * @param type string - 发送信息类型
   * @param data any - 发送信息的内容
   */
  postMessage(type, data) {
    const postBody = { type, res: { data: data || {}, code: 1000, message: 'OK' } };
    if (data?.__event_key) {
      postBody.event_key = data.__event_key;
      delete data.__event_key;
    }
    if (this.contentWindow?.postMessage) {
      this.contentWindow.postMessage(postBody, this.location.origin);
    }
  }

  /** 传输 iframe 所需的初始化数据 */
  iframeInit() {
    if (!this.isIframeInit) return;
    if (!this.iframe.contentWindow) return;
    this.contentWindow = this.iframe.contentWindow;
    this.postMessage(FA_LAYOUT, { config: this.config });
    this.isIframeInit = false;
  }

  /** 接受 iframe 传来的消息 */
  receiveMessage(event) {
    if (event.origin !== this.location.origin || !event.data.type) return;
    const type = event.data?.type || '';
    if (type === IF_RENDER_COMPLETE) {
      this.iframeInit();
    }
    if (type === IF_EVENT) {
      const { res, event_key } = event.data;
      if (!event_key) return;
      (this.handlers[event_key] || []).forEach(fn => {
        if (fn) fn(res?.data?.model);
      });
    }
  }

  /** 创建一个临时监听 message 的 Promise, 用来完成与 iframe 的时时数据通信  */
  createTempSyncData(_data) {
    const { __event_key = 'getNodes', data = {} } = _data;
    return new Promise((resolve, reject) => {
      this.postMessage(FA_EVENT_EMITTER, { __event_key, ...data });

      const temp = event => {
        if (event.origin !== this.location.origin || !event.data?.type) return;
        const type = event.data.type || '';
        if (type === IF_TEMP_SYNC_DATA) {
          const result = event.data?.res?.data || null;
          resolve(result);
        }
        globalThis.removeEventListener('message', temp);
      };
      globalThis.addEventListener('message', temp);
    });
  }

  /** 解绑 message 监听 */
  offMessage() {
    globalThis.removeEventListener('message', this.receiveMessage);
  }

  /** 注册 graph 的基础事件 */
  on(key, fn) {
    if (this.handlers[key]) {
      this.handlers[key].push(fn);
    } else {
      this.handlers[key] = [fn];
    }
  }
  /** 解绑 graph 的基础事件 */
  off(key, fn) {
    if (this.handlers[key]) {
      this.handlers[key] = this.handlers[key]?.filter(item => item !== fn);
    }
  }

  // get 数据
  getNodes() {
    return this.createTempSyncData({ __event_key: 'getNodes' });
  }
  getEdges() {
    return this.createTempSyncData({ __event_key: 'getEdges' });
  }
  findById(id) {
    if (!id) return;
    return this.createTempSyncData({ __event_key: 'findById', data: { id } });
  }
  getZoom() {
    return this.createTempSyncData({ __event_key: 'getZoom' });
  }
  /**
   * 获取邻居
   * @param id string - 节点 ID
   * @param type string - 邻居类型， 'source' 只获取当前节点的源节点，'target' 只获取当前节点指向的目标节点， 若不指定则返回所有类型的邻居
   * @returns
   */
  getNeighbors(id, type) {
    const data = { id };
    if (type) data.type = type;
    return this.createTempSyncData({ __event_key: 'getNeighbors', data });
  }

  // set 数据
  /**
   * 数据源变更
   * @param data - { nodes: NodesType; edges: EdgesType } - 需要变更的数据源
   */
  onChangeData(data) {
    data.__event_key = 'onChangeData';
    this.postMessage(FA_EVENT_EMITTER, data);
  }
  /**
   * 新增元素（节点和边）
   * @param type string - 元素类型，可选值为 'node'、'edge'
   * @param model ItemType - 元素的数据模型
   */
  addItem(type, model) {
    if (!type) return;
    this.postMessage(FA_EVENT_EMITTER, { type, model, __event_key: 'addItem' });
  }
  /**
   * 删除元素
   * @param id 元素 ID
   */
  removeItem(id) {
    if (!id) return;
    this.postMessage(FA_EVENT_EMITTER, { id, __event_key: 'removeItem' });
  }
  /** 更新元素
   * @param id string - 元素 id
   * @param model any - 需要更的元素数据
   */
  updateItem(id, model) {
    if (!id) return;
    this.postMessage(FA_EVENT_EMITTER, { id, model, __event_key: 'updateItem' });
  }
  /**
   * 缩放视窗窗口到一个固定比例
   * @param ratio number - 缩放的固定比例值
   * @param center ?{ x: number; y: number } - 缩放的中心点
   */
  zoomTo(ratio, center) {
    const data = { ratio, __event_key: 'zoomTo' };
    if (center) data.center = center;
    this.postMessage(FA_EVENT_EMITTER, data);
  }
  /**
   * 让画布内容适应视口
   * @param padding number -	[top, right, bottom, left] 四个方向上的间距值
   * @param option - 其他参数 { onlyOutOfViewPort: true, ratioRule: 'max', direction: 'y' }
   */
  fitView(padding, option) {
    const data = { padding, __event_key: 'fitView' };
    if (option) data.option = option;
    this.postMessage(FA_EVENT_EMITTER, data);
  }
  /**
   * 移动图，使得 item 对齐到视口中心，该方法可用于做搜索后的缓动动画。
   * @param id string - 元素 ID
   * @param animate boolean - 是否带有动画
   * @param animateCfg any - 若带有动画，可配置动画
   */
  focusItem(id, animate, animateCfg) {
    const data = { id, __event_key: 'focusItem' };
    if (animate) data.animate = animate;
    if (animateCfg) data.animateCfg = animateCfg;
    this.postMessage(FA_EVENT_EMITTER, data);
  }
}

export default ADGraph;
