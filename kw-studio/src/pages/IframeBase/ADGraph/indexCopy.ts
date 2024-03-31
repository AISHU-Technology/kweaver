import {
  FA_LAYOUT,
  FA_UPDATE_CONFIG,
  FA_EVENT_EMITTER,
  IF_RENDER_COMPLETE,
  IF_EVENT,
  IF_TEMP_SYNC_DATA
} from '@/enums';

type ADGraphType = {
  config?: any;
  location: LocationType;
  container: HTMLDivElement;
};
type ItemType = { id: string; [key: string]: any };
type NodesType = ItemType[];
type EdgesType = ItemType[];
type SourceType = { nodes: NodesType; edges: EdgesType };
type LocationType = { origin: string; pathname?: string; search?: string };

const globalThis = window;
class ADGraph {
  config: any;
  location: LocationType;
  isIframeInit: boolean;
  iframe: HTMLIFrameElement;
  container: HTMLDivElement;

  handlers: any;
  contentWindow: any;

  constructor(init: ADGraphType) {
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

  set Config(data: any) {
    this.postMessage(FA_UPDATE_CONFIG, { config: data });
    if (
      data?.container?.width !== this.config.container.width ||
      data?.container?.height !== this.config.container.height
    ) {
      const width = data?.container?.width || 0;
      const height = data?.container?.height || 0;
      this.iframe.setAttribute('style', `border: 0; width: ${width}px; height: ${height}px;`);
    }
    this.config = data;
  }

  init() {
    const width = this.container.clientWidth || 0;
    const height = this.container.clientHeight || 0;
    const { origin, pathname = '', search = '' } = this.location;

    this.iframe.name = 'adgraph';
    this.iframe.allow = 'fullscreen';
    this.iframe.src = origin + pathname + search;
    this.iframe.setAttribute('style', `border: 0; width: ${width}px; height: ${height}px;`);

    this.container.appendChild(this.iframe);
  }

  /** 向 iframe 发送信息
   * @param type string - 发送信息类型
   * @param data any - 发送信息的内容
   */
  postMessage(type: string, data?: any) {
    const postBody: any = { type, res: { data: data || {}, code: 1000, message: 'OK' } };
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
  receiveMessage(event: any) {
    if (event.origin !== this.location.origin || !event.data.type) return;
    const type = event.data?.type || '';
    if (type === IF_RENDER_COMPLETE) {
      this.iframeInit();
    }
    if (type === IF_EVENT) {
      const { res, event_key } = event.data;
      if (!event_key) return;
      (this.handlers[event_key] || []).forEach((fn: any) => {
        if (fn) fn(res?.data?.model);
      });
    }
  }

  /** 创建一个临时监听 message 的 Promise, 用来完成与 iframe 的时时数据通信  */
  createTempSyncData(_data: any) {
    const { __event_key = 'getNodes', data = {} } = _data;
    return new Promise((resolve, reject) => {
      this.postMessage(FA_EVENT_EMITTER, { __event_key, ...data });

      const temp = (event: any) => {
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
  on(key: string, fn: (item: any) => void) {
    if (this.handlers[key]) {
      this.handlers[key].push(fn);
    } else {
      this.handlers[key] = [fn];
    }
  }
  /** 解绑 graph 的基础事件 */
  off(key: string, fn: (item: any) => void) {
    if (this.handlers[key]) {
      this.handlers[key] = this.handlers[key]?.filter((item: any) => item !== fn);
    }
  }

  // get 数据
  getNodes() {
    return this.createTempSyncData({ __event_key: 'getNodes' });
  }
  getEdges() {
    return this.createTempSyncData({ __event_key: 'getEdges' });
  }
  findById(id: string) {
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
  getNeighbors(id: string, type?: string) {
    const data: any = { id };
    if (type) data.type = type;
    return this.createTempSyncData({ __event_key: 'getNeighbors', data });
  }

  // set 数据
  /**
   * 数据源变更
   * @param data - { nodes: NodesType; edges: EdgesType } - 需要变更的数据源
   */
  onChangeData(data: { nodes: NodesType; edges: EdgesType }) {
    (data as any).__event_key = 'onChangeData';
    this.postMessage(FA_EVENT_EMITTER, data);
  }
  /**
   * 新增元素（节点和边）
   * @param type string - 元素类型，可选值为 'node'、'edge'
   * @param model ItemType - 元素的数据模型
   */
  addItem(type: string, model: ItemType) {
    if (!type) return;
    this.postMessage(FA_EVENT_EMITTER, { type, model, __event_key: 'addItem' });
  }
  /**
   * 删除元素
   * @param id 元素 ID
   */
  removeItem(id: string) {
    if (!id) return;
    this.postMessage(FA_EVENT_EMITTER, { id, __event_key: 'removeItem' });
  }
  /** 更新元素
   * @param id string - 元素 id
   * @param model any - 需要更的元素数据
   */
  updateItem(id: string, model: any) {
    if (!id) return;
    this.postMessage(FA_EVENT_EMITTER, { id, model, __event_key: 'updateItem' });
  }
  /**
   * 缩放视窗窗口到一个固定比例
   * @param ratio number - 缩放的固定比例值
   * @param center ?{ x: number; y: number } - 缩放的中心点
   */
  zoomTo(ratio: number, center?: { x: number; y: number }) {
    const data: any = { ratio, __event_key: 'zoomTo' };
    if (center) data.center = center;
    this.postMessage(FA_EVENT_EMITTER, data);
  }
  /**
   * 让画布内容适应视口
   * @param padding number -	[top, right, bottom, left] 四个方向上的间距值
   * @param option - 其他参数 { onlyOutOfViewPort: true, ratioRule: 'max', direction: 'y' }
   */
  fitView(padding: number | number[], option?: any) {
    const data: any = { padding, __event_key: 'fitView' };
    if (option) data.option = option;
    this.postMessage(FA_EVENT_EMITTER, data);
  }
  /**
   * 移动图，使得 item 对齐到视口中心，该方法可用于做搜索后的缓动动画。
   * @param id string - 元素 ID
   * @param animate boolean - 是否带有动画
   * @param animateCfg any - 若带有动画，可配置动画
   */
  focusItem(id: string, animate?: boolean, animateCfg?: any) {
    const data: any = { id, __event_key: 'focusItem' };
    if (animate) data.animate = animate;
    if (animateCfg) data.animateCfg = animateCfg;
    this.postMessage(FA_EVENT_EMITTER, data);
  }
}

export default ADGraph;
