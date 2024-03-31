import _ from 'lodash';

// 清除图例选中状态
const cleanSelected = (graph: any) => {
  if (!graph?.current?.__legend) return;
  const legendContents = graph.current.__legend?.querySelectorAll('.selected');
  _.forEach(legendContents, item => item.classList.remove('selected'));
  return legendContents?.length;
};

// 更行图例
const updateLegend = _.debounce((graph: any, nodeStyle?: any) => {
  if (!graph?.current?.__legend) return;
  graph.current.__legend.innerHTML = '';
  const nodes = _.filter(graph.current.getNodes(), d => d?.get('visible')) || [];

  const classList = _.uniqBy(nodes, (d: any) => d?._cfg?.model?._sourceData?.class);

  _.forEach(classList, item => {
    if (item?._cfg?.model?.isAgencyNode) return;
    const legendContainer = document.createElement('div');
    legendContainer.classList.add('legend');
    const legendContent = document.createElement('div');
    legendContent.classList.add('legendItem');

    const data = item?._cfg?.model?._sourceData || {};
    const defaultStyle = nodeStyle?.[item?._cfg?.model?._sourceData?.class];
    const fillColor = defaultStyle?.fillColor || item?._cfg?.model?.style?.fill || '#126ee3';
    const strokeColor = defaultStyle?.strokeColor || item?._cfg?.model?.style?.fill || '#126ee3';

    const borderColor = `border-color:  ${strokeColor}`;
    const backgroundColor = `background-color: ${fillColor}`;
    const borderRadius = 'border-radius: 11px';
    legendContent.setAttribute('style', 'display: flex; align-items: center;');
    legendContent.innerHTML = `
      <div class="legendItemIcon" style="${borderColor}; ${backgroundColor}; ${borderRadius};" ></div>
      <div class="">${data?.alias}</div>
    `;
    legendContent.onclick = () => {
      const hasSelected = legendContent.classList.contains('selected');
      if (hasSelected) {
        legendContent.classList.remove('selected');
      } else {
        legendContent.classList.add('selected');
      }
      _.forEach(graph.current.getNodes() || [], item => {
        const className = item?._cfg?.model?._sourceData?.class || '';
        if (className !== data?.class) return;

        graph.current.clearItemStates(item);
        if (hasSelected) {
          _.forEach(item?.getEdges() || [], edge => {
            graph.current.clearItemStates(edge);
          });
        } else {
          graph.current.setItemState(item, '_shallow', true);
          _.forEach(item?.getEdges() || [], edge => {
            graph.current.clearItemStates(edge);
            graph.current.setItemState(edge, '_shallow', true);
          });
        }
      });
    };

    legendContainer.appendChild(legendContent);
    graph.current.__legend.appendChild(legendContainer);
  });
}, 300);

const cancel = (graph: any) => {
  if (graph.current.__legend) graph.current.__legend.remove();
};

const registerLegend = (graph: any, hasLegend: boolean, nodeStyle?: any) => {
  if (hasLegend === false) return;
  if (!graph || !graph.current || !graph.current.on) return;

  const container = graph.current.getContainer();
  const graphLegend = container.querySelector('.graphLegend');
  if (graphLegend) graphLegend.remove();

  graph.current.__legend = document.createElement('div');

  graph.current.__legend.classList.add('graphLegend');
  container.appendChild(graph.current.__legend);
  updateLegend(graph, nodeStyle);

  graph.current.on('afterlayout', () => {
    if (!graph.current.__legend) return;
    updateLegend(graph, nodeStyle);
  });
};
registerLegend.cancel = cancel;
registerLegend.updateLegend = updateLegend;
registerLegend.cleanSelected = cleanSelected;

export default registerLegend;
