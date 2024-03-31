import _ from 'lodash';
import G6 from '@antv/g6';

import HELPER from '@/utils/helper';

/**
 * 处理子图的hover和点击select行为
 * @param name 行为模式名称, 默认`subGroup-Behavior`
 */
export default function registerGroupBehavior(name = 'subGroup-Behavior') {
  const hoverCache: Record<string, any> = {};
  const selectedCache: Record<string, any> = {};

  /**
   * 重置样式
   * @param groupCache
   */
  const resetStyles = (cfg: any, groupCache: Record<string, any>, type?: 'hover' | 'selected') => {
    const keys = _.keys(groupCache);
    if (!keys.length) return;
    _.forEach(keys, k => {
      const subGroup = groupCache[k];
      if (!subGroup || subGroup?.destroyed) {
        return Reflect.deleteProperty(groupCache, k);
      }

      // 选中状态, hover不触发清除
      if (type === 'hover' && _.includes(subGroup.cfg?.states, 'selected')) {
        return;
      }
      Reflect.deleteProperty(groupCache, k);
      const normalStyle = subGroup?.cfg?.style || {};
      if (subGroup?.cfg?.mode === 'dashed') {
        normalStyle.lineDash = [8, 5];
        normalStyle.fillOpacity = 0;
      } else {
        normalStyle.lineDash = [];
        normalStyle.fillOpacity = 1;
      }
      subGroup?.updateStyle(normalStyle, []);
    });
  };

  /**
   * 非选择灰置
   * @param graph
   * @param cfg
   * @param isReset
   */
  const setShallow = (graph: any, cfg: any, isReset = false) => {
    const subGroup = graph.__getSubGroupById?.(cfg.id);
    if (!subGroup) return;
    const { nodes = [], edges = [] } = subGroup.cfg?.info || {};
    _.forEach(graph.getNodes() || [], node => {
      const isNodeSelected = _.includes(nodes, node.get('id'));
      if (isReset || isNodeSelected) {
        //
      } else {
        graph.clearItemStates(node);
        graph.setItemState(node, '_shallow', true);
        _.forEach(node?.getEdges(), edge => {
          graph.clearItemStates(edge);
          graph.setItemState(edge, '_shallow', true);
        });
      }
    });
  };

  G6.registerBehavior(name, {
    getEvents() {
      return {
        mousemove: 'onMousemove',
        click: 'onClick'
      };
    },
    onMousemove(e: any) {
      const { cfg } = e.target;
      if (cfg?.shapeType !== 'subGroup') {
        resetStyles(cfg, hoverCache, 'hover');
        return;
      }

      if (hoverCache[cfg.id] || selectedCache[cfg.id]) return;
      const graph = this.graph as any;
      const subGroup = graph.__getSubGroupById(cfg.id);
      if (!subGroup) return;

      const fill = HELPER.hexToRgba(subGroup?.cfg?.style.fill, 0.1);
      const stroke = HELPER.hexToRgba(subGroup?.cfg?.style.stroke, 0.25);
      subGroup.updateStyle({ fill, stroke, lineDash: [], fillOpacity: 1 });
      hoverCache[cfg.id] = subGroup;
    },
    onClick(e: any) {
      const { cfg } = e.target;
      const graph = this.graph as any;
      if (cfg?.shapeType !== 'subGroup') {
        setShallow(graph, cfg, true);
        resetStyles(cfg, selectedCache);
        return;
      }
      if (selectedCache[cfg.id]) return;
      const subGroup = graph.__getSubGroupById(cfg.id);
      if (!subGroup) return;
      resetStyles(cfg, selectedCache, 'selected');

      const fill = HELPER.hexToRgba(subGroup?.cfg?.style.fill, 0.15);
      const stroke = HELPER.hexToRgba(subGroup?.cfg?.style.stroke, 0.35);
      subGroup.updateStyle({ fill, stroke, lineDash: [], fillOpacity: 1 }, ['selected']);
      selectedCache[cfg.id] = subGroup;
      graph.emit('onSubGroupSelected', subGroup);
      setTimeout(() => {
        setShallow(graph, cfg, false);
      }, 0);
    }
  });
}
