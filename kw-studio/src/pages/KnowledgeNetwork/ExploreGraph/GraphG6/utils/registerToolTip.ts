import _ from 'lodash';
import intl from 'react-intl-universal';
import { ANALYSIS_PROPERTIES } from '@/enums';
const { textMap } = ANALYSIS_PROPERTIES;

const clearShowTimer = (graph: any) => {
  if (graph.current.__tip) {
    graph.current.__tip.style.display = 'none';
    if (graph.current.__tipShowTimer) {
      clearTimeout(graph.current.__tipShowTimer);
      graph.current.__tipShowTimer = null;
    }
  }
};
const toolContent = (data: any) => {
  const sourceData = data?.item?.getModel()?._sourceData;
  const properties = sourceData?.showLabels;
  const outDiv = `
    <div style="background-color: rgba(255,255,255); border-radius: 4px; font-size: 14px; color: #000;
      box-shadow: 0px 2px 12px 0px rgba(0,0,0,0.06); width: 320px;" 
    >
      <div style="display: flex; align-items: center; height: 40px; border-bottom: 1px solid #F8F8F8; padding: 0 20px;">
        <span style="display: inline-block; width: 16px; height: 16px; border-radius: 50%; background:${
          sourceData?.color
        }; margin-right: 8px" ></span>
        <div style="width: 240px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">${
          sourceData.alias
        }</div>
      </div>
      <ul style="max-height: 220px; padding: 0 20px; overflow-y:scroll;">
        ${_.map(properties, pro => {
          return `<li key={${pro}} style="display:flex; align-items: center; height:40px;">
          <div style="width: 120px; padding-right: 10px; white-space: normal; text-overflow: ellipsis; overflow: hidden;">
            ${
              _.includes(_.keys(textMap), pro?.key)
                ? intl.get(textMap?.[pro?.key])
                : (pro?.alias || pro?.key)?.replace('#', '')
            }
          </div>
            <div style="max-width: 145px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;" title=${
              pro?.value
            }>${pro?.value}</div>
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
    if (graph.current?.__configMenu?.hover?.tooltip?.checked === false) return;
    clearShowTimer(graph);
  });
  graph.current.on('node:drag', () => {
    if (graph.current?.__configMenu?.hover?.tooltip?.checked === false) return;
    clearShowTimer(graph);
  });
  graph.current.on('node:dblclick', () => {
    if (graph.current?.__configMenu?.hover?.tooltip?.checked === false) return;
    clearShowTimer(graph);
  });
  graph.current.on('contextmenu', (data: any) => {
    if (graph.current?.__configMenu?.hover?.tooltip?.checked === false) return;
    if (data?.item?._cfg?.type === 'node') clearShowTimer(graph);
  });
  graph.current.on('node:mouseover', (data: any) => {
    if (graph.current?.__configMenu?.hover?.tooltip?.checked === false) return;
    if (data?.item?._cfg?.model?.class === '__more') return;
    if (data?.item?._cfg?.model?.type === 'nodeText') return;
    if (_.includes(data?.target?.cfg?.id, 'shadow-node')) return;
    if (graph.current.__tipHideTimer) clearTimeout(graph.current.__tipHideTimer);
    if (graph.current.__tipShowTimer) clearTimeout(graph.current.__tipShowTimer);
    graph.current.__tipShowTimer = setTimeout(() => {
      updateToolTip(graph, data);
    }, 1500);
  });
  graph.current.on('node:mouseout', () => {
    if (graph.current?.__configMenu?.hover?.tooltip?.checked === false) return;
    graph.current.__tipHideTimer = setTimeout(() => {
      clearShowTimer(graph);
    }, 50);
  });
};

export default registerToolTip;
