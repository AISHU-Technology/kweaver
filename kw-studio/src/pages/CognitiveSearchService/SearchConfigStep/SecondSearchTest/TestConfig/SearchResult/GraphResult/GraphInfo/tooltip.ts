import _ from 'lodash';
import G6 from '@antv/g6';
import intl from 'react-intl-universal';
import { ANALYSIS_PROPERTIES } from '@/enums';
const { textMap } = ANALYSIS_PROPERTIES;

const toolContent = (e: any) => {
  const item = e?.item?.getModel();
  const { uid: id, properties, alias, tags, color, ask_property } = item?._sourceData;
  const arr = properties;
  const entityAttr = [
    { key: '#id', value: id },
    { key: '#entity_class', value: tags },
    { key: '#alias', value: alias }
  ];
  const showLabels = [...entityAttr, ...arr];
  if (_.isEmpty(item)) return '';
  const outDiv = `
    <div style="background-color: rgba(255,255,255); border-radius: 4px; font-size: 14px; color: #000;
      box-shadow: 0px 2px 12px 0px rgba(0,0,0,0.06); width: 320px;" 
    >
      <div style="display: flex; align-items: center; height: 40px; border-bottom: 1px solid #F8F8F8; padding: 0 20px;">
        <span style="display: inline-block; width: 16px; height: 16px; border-radius: 50%; background:${color}; margin-right: 8px" ></span>
        <div style="width: 240px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">${alias}</div>
      </div>
      <ul style="max-height: 120px; padding: 0 20px; overflow-y:scroll;">
      ${_.map(showLabels, pro => {
        return `<li key={${pro}} style="display:flex;align-items:center;height:40px;"><div style="width:120px">${
          _.includes(_.keys(textMap), pro?.key) ? intl.get(textMap?.[pro?.key]) : pro?.alias || pro?.key || pro?.n
        }</div>
          <div style="max-width:145px;overflow: hidden;white-space:nowrap;text-overflow: ellipsis;">${
            pro?.value || pro?.v || ''
          }</div>
      </li>`;
      }).join('')}
      </ul>
    </div>`;

  return outDiv;
};

const updateToolTip = (graph: any, data: any) => {
  const model = data?.item?._cfg?.model;
  if (!model) return;
  const offset = (model.size || 32) / 2;
  const { x, y } = graph.current.getCanvasByPoint(model.x, model.y);
  const outDiv = toolContent(data);
  graph.current.__tip.innerHTML = outDiv;
  graph.current.__tip.setAttribute('style', 'position: absolute; display: block; visibility: hidden;');

  const container = graph.current.getContainer();
  const width = graph.current.__tip.clientWidth;
  const height = graph.current.__tip.clientHeight;

  const position = { x: x + offset, y: y + offset };
  if (x + offset + width >= container.clientWidth) position.x = x - width - offset;
  if (y + offset + height >= container.clientHeight) position.y = y - height - offset;

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

const registerToolTip = (graph: any) => {
  if (!graph || !graph.current || !graph.current.on) return;

  // 初始化, 给 canvas 添加上 tooltip
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
  graph.current.on('node:dblclick', (data: any) => {
    clearShowTimer(graph);
  });
  graph.current.on('node:mouseover', (data: any) => {
    if (graph.current.__tipHideTimer) clearTimeout(graph.current.__tipHideTimer);
    if (graph.current.__tipShowTimer) clearTimeout(graph.current.__tipShowTimer);
    graph.current.__tipShowTimer = setTimeout(() => {
      updateToolTip(graph, data);
    }, 1000);
  });
  graph.current.on('node:mouseout', () => {
    graph.current.__tipHideTimer = setTimeout(() => {
      clearShowTimer(graph);
    }, 50);
  });
};

export { registerToolTip };
