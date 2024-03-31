import _ from 'lodash';
import G6 from '@antv/g6';

import { IF_EVENT } from '@/enums';

const globalThis = window;
const postMessage = (type: string, data?: any) => {
  const postBody: any = { type, res: { data: data || {}, code: 1000, message: 'OK' } };
  if (data?.__event_key) {
    postBody.event_key = data.__event_key;
    delete data.__event_key;
  }
  globalThis.parent.postMessage(postBody, '*');
};

const Graph = G6.Graph;
const TreeGraph = G6.TreeGraph;

const createExtendGraph = (extend: any) => {
  return class extends extend {
    events: any;
    handlers: any;
    constructor(props: any) {
      super(props);
      this.events = [];
      this.handlers = [];

      this.on('node:click', () => {});
      this.on('edge:click', () => {});
      this.on('canvas:click', () => {});
    }
    on(eventName: any, handler: any, cantPostMessage?: boolean) {
      if (!cantPostMessage) {
        if (this.events && !this.events.includes(eventName)) {
          this.events.push(eventName);
          if (!this.handlers.includes(handler)) {
            this.handlers.push(handler);
          }
        }
      }

      super.on(eventName, (event: any) => {
        handler(event);
        try {
          if (!this.handlers.includes(handler)) return; // 过滤掉非主动注册的事件
          if (eventName === 'itemcollapsed') {
            // 在 TreeGraph 上使用了 'collapse-expand' Behavior 并触发了该行为后，该事件被触发
            const model: any = { collapsed: true, item: {} };
            const _event = _.cloneDeep(event);
            model.collapsed = _event.collapsed;
            model.item = _event.item?._cfg?.model;
            postMessage(IF_EVENT, { __event_key: eventName, model });
            return;
          }
          if (eventName === 'nodeselectchange') {
            // 使用了 'brush-select' , 'click-select' 或 'lasso-select' Behavior 且选中元素发生变化时，该事件被触发
            const model: any = { select: true, selectedItems: { nodes: [], edges: [] } };
            const _event = _.cloneDeep(event);

            model.select = _event.select;
            model.selectedItems.nodes = _.map(_event?.selectedItems?.nodes || [], item => item?._cfg?.model);
            model.selectedItems.edges = _.map(_event?.selectedItems?.edges || [], item => {
              const _tem = item?._cfg?.model;
              _tem.sourceNode = _tem?.sourceNode?._cfg?.model || {};
              _tem.targetNode = _tem?.targetNode?._cfg?.model || {};
              return _tem;
            });
            postMessage(IF_EVENT, { __event_key: eventName, model });
            return;
          }

          let model: any = {};
          const _event = _.cloneDeep(event);
          if (eventName.includes('canvas')) {
            delete _event.target;
            delete _event.originalEvent;
            delete _event.currentTarget;
            delete _event.delegateTarget;
            model = _event;
            postMessage(IF_EVENT, { __event_key: eventName, model });
          }
          if (eventName.includes('node')) {
            model = _event?.item?._cfg?.model;
            postMessage(IF_EVENT, { __event_key: eventName, model });
          }
          if (eventName.includes('edge')) {
            model = _event?.item?._cfg?.model;
            model.sourceNode = model?.sourceNode?._cfg?.model || {};
            model.targetNode = model?.targetNode?._cfg?.model || {};
            postMessage(IF_EVENT, { __event_key: eventName, model });
          }
        } catch (error) {
          postMessage('ERROR', { __event_key: 'ERROR', error });
        }
      });
    }
  };
};

const IframeTree = createExtendGraph(TreeGraph);
const IframeGraph = createExtendGraph(Graph);

export { IframeTree, IframeGraph };
