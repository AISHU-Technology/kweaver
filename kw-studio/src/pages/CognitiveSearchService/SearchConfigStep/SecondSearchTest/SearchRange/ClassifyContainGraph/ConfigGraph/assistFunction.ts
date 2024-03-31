import duigou from '@/assets/images/duigou.svg';
import _ from 'lodash';
import intl from 'react-intl-universal';
import serviceGraphDetail from '@/services/graphDetail';
import { ANALYSIS_PROPERTIES } from '@/enums';

/**
 * 节点上方对号标记
 */
export const drawCircle = (graph: any, id: any, isDelete = false) => {
  const group = graph?.findById(id)?.getContainer();
  const circleShape = group?.findById(`duigou-${id}`);
  const circleShapeOut = group?.findById(`bigger-circle-${id}`);

  const cursor = 'pointer';
  if (!isDelete && circleShape) {
    return;
  }
  if (isDelete) {
    group?.removeChild(circleShapeOut);
    group?.removeChild(circleShape);
    return;
  }
  group?.addShape('circle', {
    attrs: { x: 14, y: -13, r: 8, fill: 'white', cursor },
    id: `bigger-circle-${id}`,
    name: `bigger-circle-${id}`,
    draggable: true
  });

  group?.addShape('image', {
    attrs: {
      x: 7,
      y: -20,
      r: 5,
      img: duigou,
      width: 14,
      height: 14,
      cursor
    },
    id: `duigou-${id}`,
    name: `duigou-${id}`,
    draggable: true
  });
};

/**
 * 清除对于图谱操作的事件
 */
const clearShowTimer = (graph: any) => {
  graph.current.__contextClick = false;
  if (graph.current.__tip) {
    graph.current.__tip.style.display = 'none';
    graph.current.__hover = false;
    if (graph.current.__tipShowTimer) {
      clearTimeout(graph.current.__tipShowTimer);
      graph.current.__tipShowTimer = null;
    }
  }
  clearTimeout(graph.current.__mouseTimer);
};

/**
 * 节点监听 移入 | 移出
 */
export const registerToolTip = (graph: any, setSelectedNode: any, setOperateType: any, graphUnderClassify: any) => {
  if (!graph || !graph.current) return;
  clearShowTimer(graph);
  // const isOperate = graphUnderClassify?.class_name === '全部资源';
  const container = graph.current.getContainer();
  // 悬停卡片设置
  graph.current.__tip = document.createElement('div');
  graph.current.__tip.setAttribute('style', 'position:absolute;display:none;left:0px;top:0px;');
  graph.current.__tip.onmouseenter = () => {
    graph.current.__hover = true;
  };
  graph.current.__tip.onmouseleave = () => clearShowTimer(graph);
  container.appendChild(graph.current.__tip);
  graph.current.on('node:mouseenter', (data: any) => {
    if (graph.current.__tipHideTimer) clearTimeout(graph.current.__tipHideTimer);
    graph.current.__tipShowTimer = setTimeout(() => {
      getData(graph, data);
    }, 700);
  });

  // 点击画布取消其他事件
  graph.current.on('canvas:click', () => {
    clearShowTimer(graph);
  });

  graph.current.on('node:mouseleave', (e: any) => {
    graph.current.__mouseTimer = setTimeout(() => {
      if (graph.current.__hover) return;
      clearShowTimer(graph);
    }, 100);
  });

  // 滚轮
  graph.current.on('wheelzoom', (e: any) => {
    clearShowTimer(graph);
    graph.current.__onGetZoom();
  });

  // 左键
  graph.current.on('node:click', (e: any) => {
    clearShowTimer(graph);
    const { item } = e;
    e.preventDefault();
    setSelectedNode([item]);
    setOperateType('contextmenu');
  });

  // 按住Shift+鼠标左键框选(不高亮)
  graph.current.on('nodeselectchange', (e: any) => {
    clearShowTimer(graph);
    const { nodes, edges } = e.selectedItems;
    _.forEach(nodes, (item: any) => graph.current.setItemState(item, 'selected', false));
    _.forEach(edges, (item: any) => graph.current.setItemState(item, 'selected', false));
    setSelectedNode([...nodes]);
    setOperateType('shift');
  });

  // if (!isOperate) {
  // onIsOperate(graph, setSelectedNode, setOperateType);
  // }

  // 右键
  graph.current.on('node:contextmenu', (e: any) => {
    e.preventDefault();
    clearShowTimer(graph);
    graph.current.__contextClick = true;
  });
};

/**
 * 操作
 */
const onIsOperate = (graph: any, setSelectedNode: any, setOperateType: any) => {
  // 左键
  graph.current.on('node:click', (e: any) => {
    clearShowTimer(graph);
    const { item } = e;
    e.preventDefault();
    setSelectedNode([item]);
    setOperateType('contextmenu');
  });

  // 按住Shift+鼠标左键框选(不高亮)
  graph.current.on('nodeselectchange', (e: any) => {
    clearShowTimer(graph);
    const { nodes, edges } = e.selectedItems;
    _.forEach(nodes, (item: any) => graph.current.setItemState(item, 'selected', false));
    _.forEach(edges, (item: any) => graph.current.setItemState(item, 'selected', false));
    setSelectedNode([...nodes]);
    setOperateType('shift');
  });
};

const getData = async (graph: any, data: any) => {
  const sourceData = data?.item.getModel();
  const result = await serviceGraphDetail.graphGetInfoDetail({
    graph_id: sourceData?.kg_id,
    name: sourceData.id,
    type: 'entity'
  });
  updateToolTip(graph, data, result?.res);
};

/**
 * 悬停实体类信息
 */
const updateToolTip = (graph: any, data: any, res?: any) => {
  const model = data?.item?._cfg?.model;
  const sourceData = data?.item?.getModel();
  const { indexes, properties } = res;
  if (!model) return;

  if (_.isEmpty(sourceData)) return '';
  const offset = (model.size[0] || 32) / 2;
  const { x, y } = graph.current.getCanvasByPoint(model.x, model.y);
  const outDiv = `
  <div style="background-color: #fff; border-radius: 3px;box-shadow: 0px 2px 12px 0px rgba(0,0,0,0.06);
  font-size: 14px; color:rgba(0, 0, 0, 0.85);width:320px;max-height:380px;overflow-y:auto;"
  >
    <div style="margin-bottom:16px;">
        <div style="padding:20px 20px 8px"font-weight:600;color:rgba(0,0,0,0.85);>类别信息</div>
        <div style="overflow:hidden;padding:0px 20px;align-items:center;margin-bottom:10px;">
          <div style="float:left;width:155px;display:inline-block;font-weight:500;color:rgba(0,0,0,0.85);">
            ${intl.get('workflow.knowledge.entityClass')}
          </div>
          <div style="float:right;display:inline-block;max-width: 80px; overflow: hidden; white-space: nowrap;
           text-overflow: ellipsis;font-weight:600;display:flex;align-items:center;" title=${sourceData.name}>
            <span style="display: inline-block; width: 16px; height: 16px; border-radius: 50%;
            background:${sourceData?.color}; margin-right: 4px" >
            </span>
            ${sourceData.name}
          </div> 
        </div>
        <div style="overflow:hidden;padding:0px 20px;align-items:center;">
          <div style="float:left;width:155px;display:inline-block;color:rgba(0,0,0,0.85);font-weight:500;">
            ${intl.get('graphDetail.entityAlias')}
          </div>
          <div style="float:right;display:inline-block;max-width:80px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;" title=${
            sourceData.label
          }>${sourceData.label}</div>
        </div>
    </div>
              
      
    <div style="padding: 0px 20px;color:rgba(0,0,0,0.85);margin-bottom:16px;">
      <div style="font-weight:600;font-size:20;
      ">${intl.get('graphDetail.indexes')} 
      <span style="color:rgba(0,0,0,0.25)">(${indexes.length})</span>
      </div>
      ${_.map(indexes, (i: any, index: any) => {
        return `<div key=${index} style="border-bottom:1px solid rgba(0,0,0,0.1);color:rgba(0,0,0,0.85);margin-bottom:12px;padding-bottom:12px;">
          <div style="overflow:hidden;">
            <div style="width:68px;float:left;">Name</div>
            <div title=${
              i?.name
            } style="max-width:120px;float:right;overflow:hidden;text-overflow:ellipsis;white-space: nowrap;margin-left:3px;">
              ${i?.name}
            </div>
          </div>
          <div style="overflow:hidden;">
            <div style="width:68px;float:left;">Type</div>
            <div style="float:right;max-width:120px;overflow:hidden;text-overflow:ellipsis;
              white-space:nowrap;" title=${i?.type}>
              ${i?.type}
            </div>
          </div>
          <div style="overflow:hidden;">
            <div style="width:68px;float:left;">Properties</div>
            <div style="float:right;overflow:hidden;white-space:wrap;max-width:120px;overflow:hidden;">${_.map(
              i?.properties,
              (n: any, key: any) => {
                return `<div key=${key} style="max-width:120px;overflow:hidden;float:right;
              text-overflow:ellipsis;white-space:nowrap;" title=${n?.alias}(${n?.name})>
              ${n?.alias}(${n?.name})</div>`;
              }
            ).join('')}
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>   
    <div style="padding: 0px 20px;"> 
      <div style="font-size:20;margin-bottom:8px;">
        <span style="font-weight:600;color:rgba(0,0,0,0.85);">${intl.get('createEntity.property')}</span>
        <span style="color:rgba(0,0,0,0.25)">(${properties.length})</span>
      </div>
      <div">${_.map(
        properties,
        (p: any, index: any) =>
          `<div key=${index} style="color:rgba(0,0,0,0.85);overflow:hidden;margin-bottom:8px;">
          <div style="float:left;max-width:215px;overflow:hidden;text-overflow:ellipsis;white-space: nowrap;" title=${
            p?.alias
          }(${p?.name})>${p?.alias}(${p?.name})</div>
          <div title=${p?.type.toUpperCase()} style="color:rgba(0,0,0,0.85);float:right;
            ">${p?.type.toUpperCase()}</div>
        </div>`
      ).join('')}</div>
    </div>
  </div>`;
  graph.current.__tip.innerHTML = outDiv;
  graph.current.__tip.setAttribute('style', 'position:absolute;display:block;');
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
