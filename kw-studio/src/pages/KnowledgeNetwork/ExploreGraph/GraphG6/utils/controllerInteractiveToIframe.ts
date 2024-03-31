import _ from 'lodash';

import { FA_LAYOUT, FA_UPDATE_CONFIG, FA_EVENT_EMITTER, FA_TEMP_SYNC_DATA, IF_RENDER_COMPLETE } from '@/enums';

const globalThis = window;
class InteractiveToIframe {
  graph: any;
  config: any;

  onChangeSourceData: any;
  receiveMessage: any;
  constructor(graph: any, onChangeSourceData: any) {
    this.graph = graph;
    this.onChangeSourceData = onChangeSourceData;
    this.receiveMessage = this._receiveMessage.bind(this);

    this.init();
  }

  init() {
    this.postMessage(IF_RENDER_COMPLETE);
    window.addEventListener('message', this.receiveMessage, true);
  }

  offMessage() {
    window.removeEventListener('message', this.receiveMessage, true);
  }

  postMessage = (type: string, data?: any) => {
    const postBody: any = { type, res: { data: data || {}, code: 1000, message: 'OK' } };
    if (data?.__event_key) {
      postBody.event_key = data.__event_key;
      delete data.__event_key;
    }
    globalThis.parent.postMessage(postBody, '*');
  };

  _receiveMessage(event: any) {
    const type = event.data?.type || '';
    if (type === 'webpackOk') return;
    if (type === FA_LAYOUT) {
      const config = event.data?.res?.data?.config || {};
      const container = config.container || { width: 0, height: 0 };
      this.graph.changeSize(container.width, container.height);
      this.graph.fitView(1, { onlyOutOfViewPort: true });
      this.config = config;
    }
    if (type === FA_UPDATE_CONFIG) {
      const config = event.data?.res?.data?.config || {};
      const container = config.container || { width: 0, height: 0 };
      this.graph.changeSize(container.width, container.height);
      this.graph.fitView(1, { onlyOutOfViewPort: true });
      this.config = config;
    }
    if (type === FA_EVENT_EMITTER) {
      const { res = {}, event_key } = event.data;
      if (!event_key) return;
      // 查询

      if (event_key === 'getNodes') {
        const nodes: any = _.map(this.graph.getNodes() || [], item => item?._cfg?.model);
        this.postMessage(FA_TEMP_SYNC_DATA, nodes);
      }
      if (event_key === 'findById') {
        const { id } = res?.data || {};
        const result = this.graph.findById(id);
        const data = result?._cfg?.model;
        if (result._cfg?.type === 'edge') {
          data.sourceNode = result?.sourceNode?._cfg?.model || {};
          data.targetNode = result?.targetNode?._cfg?.model || {};
        }
        this.postMessage(FA_TEMP_SYNC_DATA, data);
      }
      if (event_key === 'getEdges') {
        const edges: any = _.map(this.graph.getEdges() || [], item => {
          const _tem = item?._cfg?.model;
          _tem.sourceNode = _tem?.sourceNode?._cfg?.model || {};
          _tem.targetNode = _tem?.targetNode?._cfg?.model || {};
          return _tem;
        });
        this.postMessage(FA_TEMP_SYNC_DATA, edges);
      }
      if (event_key === 'getNeighbors') {
        const { id } = res?.data || {};
        if (!id) return;
        const nodes: any = _.map(this.graph.getNeighbors(id) || [], item => item?._cfg?.model);
        this.postMessage(FA_TEMP_SYNC_DATA, nodes);
      }
      if (event_key === 'getZoom') {
        const zoom = this.graph.getZoom();
        this.postMessage(FA_TEMP_SYNC_DATA, zoom);
      }

      // 设置
      if (event_key === 'onChangeData') {
        const source = event.data?.res?.data;
        this.onChangeSourceData(source);
      }
      if (event_key === 'addItem') {
        const { type, model } = event.data?.res?.data || {};
        if (!type || !model?.id) return;
        this.graph.addItem(type, model);
      }
      if (event_key === 'removeItem') {
        const { id } = event.data?.res?.data || {};
        if (!id) return;
        this.graph.removeItem(id);
      }
      if (event_key === 'updateItem') {
        const { id, model } = event.data?.res?.data || {};
        this.graph.updateItem(id, model);
      }
      if (event_key === 'zoomTo') {
        const { ratio, center } = res?.data || {};
        this.graph.zoomTo(ratio, center);
      }
      if (event_key === 'fitView') {
        const { padding, option = {} } = res?.data || {};
        this.graph.fitView(padding, option);
      }
      if (event_key === 'focusItem') {
        const { id, animate = false, animateCfg = {} } = res?.data || {};
        if (!id) return;
        this.graph.focusItem(id, animate, animateCfg);
      }
    }
  }
}

export default InteractiveToIframe;
