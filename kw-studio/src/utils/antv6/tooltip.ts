import _ from 'lodash';
import G6 from '@antv/g6';
import intl from 'react-intl-universal';

import HELPER from '@/utils/helper';

const tooltip = () =>
  new G6.Tooltip({
    offsetX: 10,
    offsetY: 20,
    className: 'g6tip',
    trigger: 'mouseenter',
    itemTypes: ['node', 'edge'],
    getContent(e: any) {
      const item = e.item.getModel()._sourceData;
      const outDiv = document.createElement('div');
      outDiv.setAttribute(
        'style',
        `max-width: 320px;
         background-color: rgba(0,0,0,.8);
         padding: 10px 8px;
         border-radius: 4px;
         font-size: 12px;
         color: #fff;
         border: 1px solid rgb(0,0,0);`
      );
      outDiv.innerHTML = `
      <ul>
        <li>name: ${item.name}</li>
        <li>count: ${HELPER.formatNumberWithComma(item.count)}</li>
      </ul>`;
      return outDiv;
    }
  });

const toolTipWorkFlow = (maxWidth = 320) =>
  new G6.Tooltip({
    offsetX: 10,
    offsetY: 20,
    className: 'g6tip',
    trigger: 'mouseenter',
    itemTypes: ['node', 'edge'],
    getContent(e: any) {
      const item = e?.item?.getModel()?._sourceData;
      if (_.isEmpty(item) || item.noTip) return '';
      const isEdge = !!item?.relations;
      const outDiv = document.createElement('div');
      outDiv.setAttribute(
        'style',
        `max-width: ${maxWidth}px;
        background-color: rgba(0,0,0,.8);
        padding: 10px 16px; 
        border-radius: 4px; 
        font-size: 14px;
        color: #fff; 
        border: 1px solid rgb(0,0,0);`
      );
      outDiv.innerHTML = `
    <div>
      <div>${isEdge ? intl.get('createEntity.reN') : intl.get('createEntity.ecn')}<div>
      <div style="word-break: break-all;">${item?.name}</div>
      <div>-----------<div>
      <div>${intl.get('createEntity.acn')}<div>
      <div style="word-break: break-all;">${item?.alias}</div>
    </div>`;
      return outDiv;
    }
  });

const attrToolTipOntoLib = (isNodeCopyBehavior: any) =>
  new G6.Tooltip({
    className: 'onto_lib_attr_tooltip',
    trigger: 'mouseenter',
    itemTypes: ['node', 'edge'],
    getContent(e: any) {
      const NODE_HALO_CLASS = 'node-halo-class';
      if (e.target.get('className') !== NODE_HALO_CLASS && !isNodeCopyBehavior.current) {
        const sourceData = e?.item?.getModel()?._sourceData;
        if (_.isEmpty(sourceData)) return '';
        const properties = sourceData?.attributes;
        const outDiv = `
          <div style="background-color: rgba(255,255,255); border-radius: 4px; font-size: 14px; color: #000;
            box-shadow: 0px 2px 12px 0px rgba(0,0,0,0.06); width: 320px;" 
          >
            <div style="display: flex; align-items: center; height: 48px; border-bottom: 1px solid #F8F8F8; padding: 0 20px;">
              <span style="display: inline-block; width: 16px; height: 16px; border-radius: 50%; background:${
                sourceData?.fillColor || sourceData.color
              }; margin-right: 8px"></span>
              <div style=" display: flex; width: 240px; flex-direction: column;">
                <div style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 14px;">
                  ${sourceData?.name || '--'} 
                </div>
                <div style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 12px; color: rgba(0, 0, 0, 0.45)">
                  ${sourceData?.alias || '--'}
                </div>
              </div>
            </div>
            <ul style="max-height: 220px; padding: 0 20px; overflow-y:scroll;">
              ${_.map(properties, pro => {
                return `
                <li key={${pro?.attrName}} style="width: 100%; display:flex; align-items: center; height:40px;">
                  <div style="max-width: 220px; padding-right: 10px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;" title=${
                    pro?.attrName
                  }>
                    ${pro?.attrName || '--'}
                  </div>
                  <div style="width: 60px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; text-align: right; flex: 1;">
                    ${pro?.attrType}
                  </div>
                </li>
                `;
              }).join('')}
            </ul>
          </div>
        `;
        return outDiv;
      }
      return '';
    }
  });

const toolContent = (e: any, isNodeCopyBehavior: any) => {
  const NODE_HALO_CLASS = 'node-halo-class';
  if (e.target.get('className') !== NODE_HALO_CLASS && !isNodeCopyBehavior.current) {
    const sourceData = e?.item?.getModel()?._sourceData;
    if (_.isEmpty(sourceData)) return '';
    const properties = sourceData?.attributes;
    const outDiv = `
          <div style="background-color: rgba(255,255,255); border-radius: 4px; font-size: 14px; color: #000;
            box-shadow: 0px 2px 12px 0px rgba(0,0,0,0.06); width: 320px;" 
          >
            <div style="display: flex; align-items: center; height: 48px; border-bottom: 1px solid #F8F8F8; padding: 0 20px;">
              <span style="display: inline-block; width: 16px; height: 16px; border-radius: 50%; background:${
                sourceData?.fillColor || sourceData.color
              }; margin-right: 8px"></span>
              <div style=" display: flex; width: 240px; flex-direction: column;">
                <div style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 14px;">
                  ${sourceData?.name || '--'} 
                </div>
                <div style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 12px; color: rgba(0, 0, 0, 0.45)">
                  ${sourceData?.alias || '--'}
                </div>
              </div>
            </div>
            <ul style="max-height: 220px; width: 100%; padding: 0 20px ; overflow-y:scroll;">
              ${_.map(properties, pro => {
                return `
                <li key={${pro?.attrName}} style="display:flex; align-items: center; height:40px;">
                  <div style="width: 220px; padding-right: 10px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;" title=${
                    pro?.attrName
                  }>
                    ${pro?.attrName || '--'}
                  </div>
                  <div style="min-width: 60px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; text-align: left; flex: 1;">
                    ${pro?.attrType}
                  </div>
                </li>
                `;
              }).join('')}
            </ul>
          </div>
        `;
    return outDiv;
  }
  return '';
};

const updateToolTip = (graph: any, data: any, isNodeCopyBehavior: any) => {
  const model = data?.item?._cfg?.model;
  if (!model) return;
  const offset = (model.size || 32) / 2;
  const { x, y } = graph.current.getCanvasByPoint(model.x, model.y);
  const outDiv = toolContent(data, isNodeCopyBehavior);
  graph.current.__tip.innerHTML = outDiv;
  graph.current.__tip.setAttribute('style', 'position: absolute; display: block; visibility: hidden;');

  const container = graph.current.getContainer();
  const width = graph.current.__tip.clientWidth;
  const height = graph.current.__tip.clientHeight;

  let position = { x: x + offset, y: y + offset };
  if (x + offset + width >= container.clientWidth) position.x = x - width - offset;
  if (y + offset + height >= container.clientHeight) position.y = y - height - offset;

  if (model._sourceData?.relations) {
    const edgeGroup = data?.item?._cfg?.group;
    const shape = _.filter(edgeGroup.get('children'), item => item.cfg.name === 'edge-line')[0];
    const midPoint = shape.getPoint(0.5);
    position = graph.current.getCanvasByPoint(midPoint.x, midPoint.y);
  }

  graph.current.__tip.setAttribute(
    'style',
    `position: absolute; display: block; visibility: visible; left: ${position.x}px; top: ${position.y}px`
  );
};

const clearShowTimer = (graph: any) => {
  if (graph.current.__tip) {
    graph.current.__tip.style.display = 'none';
    if (graph.current.__tipShowTimer) {
      clearTimeout(graph.current.__tipShowTimer);
      graph.current.__tipShowTimer = null;
    }
  }
};

const registerToolTip = (graph: any, isNodeCopyBehavior: any) => {
  if (!graph || !graph.current || !graph.current.on) return;
  const container = graph.current.getContainer();
  const graphTip = container.querySelector('.graphTip');
  if (graphTip) graphTip.remove();
  graph.current.__tip = document.createElement('div');
  graph.current.__tip.classList.add('graphTip');
  graph.current.__tip.setAttribute('style', 'position: absolute; display: none; left: 0px; top: 0px;');
  graph.current.__tip.onmouseenter = () => clearTimeout(graph.current.__tipHideTimer);
  graph.current.__tip.onmouseleave = () => clearShowTimer(graph);
  container.appendChild(graph.current.__tip);

  graph.current.on('canvas:click', () => {
    clearShowTimer(graph);
  });
  graph.current.on('node:drag', () => {
    clearShowTimer(graph);
  });
  graph.current.on('node:click', () => {
    clearShowTimer(graph);
  });
  graph.current.on('node:mouseover', (data: any) => {
    if (graph.current.__tipHideTimer) clearTimeout(graph.current.__tipHideTimer);
    if (graph.current.__tipShowTimer) clearTimeout(graph.current.__tipShowTimer);
    graph.current.__tipShowTimer = setTimeout(() => {
      updateToolTip(graph, data, isNodeCopyBehavior);
    }, 1000);
  });
  graph.current.on('node:mouseout', () => {
    graph.current.__tipHideTimer = setTimeout(() => {
      clearShowTimer(graph);
    }, 50);
  });
  graph.current.on('edge:click', () => {
    clearShowTimer(graph);
  });
  graph.current.on('edge:mouseover', (data: any) => {
    if (graph.current.__tipHideTimer) clearTimeout(graph.current.__tipHideTimer);
    if (graph.current.__tipShowTimer) clearTimeout(graph.current.__tipShowTimer);
    graph.current.__tipShowTimer = setTimeout(() => {
      updateToolTip(graph, data, isNodeCopyBehavior);
    }, 1000);
  });
  graph.current.on('edge:mouseout', () => {
    graph.current.__tipHideTimer = setTimeout(() => {
      clearShowTimer(graph);
    }, 50);
  });
};

export { tooltip, toolTipWorkFlow, attrToolTipOntoLib, registerToolTip };
