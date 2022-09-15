/* eslint-disable */
import G6 from '@antv/g6';
import _ from 'lodash';
import intl from 'react-intl-universal';
import menuDelete from '@/assets/images/d3-delete.svg';
import anylist from '@/assets/images/wendang-xianxing.svg';
import out from '@/assets/images/chuqu.svg';
import explore from '@/assets/images/tansuoguanxi.svg';
import inE from '@/assets/images/jinru.svg';
import five from '@/assets/images/five.svg';

/**
 * @description 鼠标移入操作盘时的样式
 */
const hoverIn = (e, group, graph, openInformation) => {
  if (!group || !e.target.cfg?.id) {
    return;
  }

  if (e.target.cfg.id === 'path1' || e.target.cfg.id === 'image-delete') {
    group.findById('path1').attr('fill', '#4a5362');
    group.findById('path2').attr('fill', '#637083');
    group.findById('path3').attr('fill', '#637083');
    group.findById('path4')?.attr('fill', '#637083');
    group.findById('path5').attr('fill', '#637083');
    openInformation('');

    return;
  }

  if (e.target.cfg.id === 'path2' || e.target.cfg.id === 'image-explore') {
    group.findById('path1').attr('fill', '#637083');
    group.findById('path2').attr('fill', '#4a5362');
    group.findById('path3').attr('fill', '#637083');
    group.findById('path4')?.attr('fill', '#637083');
    group.findById('path5').attr('fill', '#637083');
    openInformation('path');

    return;
  }

  if (e.target.cfg.id === 'path3' || e.target.cfg.id === 'image-out' || e.target.cfg.id === 'text-out') {
    group.findById('path1').attr('fill', '#637083');
    group.findById('path2').attr('fill', '#637083');
    group.findById('path3').attr('fill', '#4a5362');
    group.findById('path4')?.attr('fill', '#637083');
    group.findById('path5').attr('fill', '#637083');

    const inAndOut = document.getElementById('inAndOut');

    if (inAndOut) {
      return;
    }

    openInformation('out');

    return;
  }

  if (e.target.cfg.id === 'path4' || e.target.cfg.id === 'image-anylist') {
    group.findById('path1').attr('fill', '#637083');
    group.findById('path2').attr('fill', '#637083');
    group.findById('path3').attr('fill', '#637083');
    group.findById('path4')?.attr('fill', '#4a5362');
    group.findById('path5').attr('fill', '#637083');
    openInformation('');

    return;
  }

  if (e.target.cfg.id === 'path5' || e.target.cfg.id === 'image-in' || e.target.cfg.id === 'text-in') {
    group.findById('path1').attr('fill', '#637083');
    group.findById('path2').attr('fill', '#637083');
    group.findById('path3').attr('fill', '#637083');
    group.findById('path4')?.attr('fill', '#637083');
    group.findById('path5').attr('fill', '#4a5362');
    // setTip(e, graph, 'in');
    const inAndOut = document.getElementById('inAndOut');

    if (inAndOut) {
      return;
    }
    openInformation('in');

    return;
  }

  group.findById('path1')?.attr('fill', '#637083');
  group.findById('path2')?.attr('fill', '#637083');
  group.findById('path3')?.attr('fill', '#637083');
  group.findById('path4')?.attr('fill', '#637083');
  group.findById('path5')?.attr('fill', '#637083');
};

/**
 * @description 鼠标移出操作盘时的样式
 */
const hoverOut = group => {
  closeTip();

  if (
    !group ||
    !group.findById('path1') ||
    !group.findById('path2') ||
    !group.findById('path3') ||
    !group.findById('path5')
  ) {
    return;
  }

  group.findById('path1').attr('fill', '#637083');
  group.findById('path2').attr('fill', '#637083');
  group.findById('path3').attr('fill', '#637083');
  group.findById('path4')?.attr('fill', '#637083');
  group.findById('path5').attr('fill', '#637083');
};

/**
 * 打开操作盘
 * @param {object} group 图形组合
 * @param {object} data 点数据
 * @param {boolean} fourParts 是否是文档类型 文档类显示分析报告,无只显示4个板块
 */
const addToolPanel = (group, data, language, fourParts = false) => {
  fourParts = !data.analysis;

  // 删除
  const deletePath = fourParts
    ? 'M-40 0 L-80 0 A 80 80, 0, 0, 1, 0 -80 L0 -40 A 40 40, 1, 0, 0 -40 0'
    : 'M-38 -12.3 L-76 -24.6 A 80 80, 0, 0, 1, 0 -80 L0 -40 A 40 40, 1, 0, 0 -38 -12.3';
  group.addShape('path', {
    attrs: {
      path: deletePath,
      fill: '#637083',
      opacity: 0.95,
      cursor: 'pointer'
    },
    zIndex: -2,
    id: 'path1',
    name: 'path1'
  });

  // 探索分析
  const reportPath = fourParts
    ? 'M0.3 -40 L0.3 -80 A 80 80, 0, 0, 1, 80 0 L40 0 A 40 40, 1, 0, 0 0.3 -40'
    : 'M0.3 -40 L0.3 -80 A 80 80, 0, 0, 1, 76 -24.6 L38 -12.3 A 40 40, 1, 0, 0 0.3 -40';
  group.addShape('path', {
    attrs: {
      path: reportPath,
      fill: '#637083',
      opacity: 0.95,
      cursor: 'pointer'
    },
    zIndex: -2,
    id: 'path2',
    name: 'path2'
  });

  // 出边
  const outPath = fourParts
    ? 'M40 0.3 L80 0.3 A 80 80, 0, 0, 1, 0.3 80 L0.3 40 A 40 40, 1, 0, 0 40 0.3'
    : 'M38 -12.3 L76 -24.6 A 80 80, 0, 0, 1, 47 64.7 L23.5 32.3 A 40 40, 1, 0, 0 38 -12.3';
  group.addShape('path', {
    attrs: {
      path: outPath,
      fill: '#637083',
      opacity: 0.95,
      cursor: 'pointer'
    },
    zIndex: -2,
    id: 'path3',
    name: 'path3'
  });

  // 分析报告
  if (!fourParts) {
    group.addShape('path', {
      attrs: {
        path: 'M23.5 32.3 L47 64.7 A 80 80, 0, 0, 1, -47 64.7 L-23.5 32.3 A 40 40, 1, 0, 0 23.5 32.3',
        fill: '#637083',
        opacity: 0.95,
        cursor: 'pointer'
      },
      zIndex: -2,
      id: 'path4',
      name: 'path4'
    });
  }

  // 出边
  const inPath = fourParts
    ? 'M0 40 L0 80 A 80 80, 0, 0, 1, -80 0.3 L-40 0.3 A 40 40, 1, 0, 0 0 40'
    : 'M-23.5 32.3 L-47 64.7 A 80 80, 0, 0, 1, -76 -24.6 L-38 -12.3 A 40 40, 1, 0, 0 -23.5 32.3';
  group.addShape('path', {
    attrs: {
      path: inPath,
      fill: '#637083',
      opacity: 0.95,
      cursor: 'pointer'
    },
    zIndex: -2,
    id: 'path5',
    name: 'path5'
  });

  // 删除
  const fourPartsX = language === 'zh-CN' ? -50 : -64;
  const deleteXY = fourParts ? { x: -50, y: -60 } : { x: -45, y: -65 };
  const deleteTextXY = fourParts ? { x: fourPartsX, y: -30 } : { x: -50, y: -35 };
  group.addShape('image', {
    attrs: {
      ...deleteXY,
      width: 16,
      height: 16,
      img: menuDelete,
      cursor: 'pointer'
    },
    id: 'image-delete',
    name: 'image-delete'
  });

  group.addShape('text', {
    attrs: {
      ...deleteTextXY,
      text: [intl.get('searchGraph.remove')],
      fill: '#fff',
      shadowBlur: 10,
      fontSize: 10
    },
    id: 'text-delete',
    name: 'text-delete'
  });

  // 探索分析
  const reportXY = fourParts ? { x: 34, y: -55 } : { x: 26, y: -65 };
  const reportTextXY = fourParts ? { x: 30, y: -25 } : { x: 25, y: -34 };

  group.addShape('image', {
    attrs: {
      ...reportXY,
      width: 16,
      height: 16,
      img: explore,
      cursor: 'pointer'
    },
    id: 'image-explore',
    name: 'image-explore'
  });

  group.addShape('text', {
    attrs: {
      ...reportTextXY,
      text: [intl.get('searchGraph.er')],
      fill: '#fff',
      shadowBlur: 10,
      fontSize: 10
    },
    id: 'text-explore',
    name: 'text-explore'
  });

  // 出边
  const outXY = fourParts ? { x: 32, y: 25 } : { x: 47, y: 5 };
  const outTextXY = fourParts ? { x: 32, y: 57 } : { x: 45, y: 35 };
  group.addShape('image', {
    attrs: {
      ...outXY,
      width: 16,
      height: 16,
      img: out,
      cursor: 'pointer'
    },
    id: 'image-out',
    name: 'image-out'
  });

  group.addShape('text', {
    attrs: {
      ...outTextXY,
      text: [intl.get('searchGraph.out')],
      fill: '#fff',
      shadowBlur: 10,
      fontSize: 10
    },
    id: 'text-out',
    name: 'text-out'
  });

  // 分析报告
  if (!fourParts) {
    group.addShape('image', {
      attrs: {
        x: -10,
        y: 45,
        width: 16,
        height: 16,
        img: anylist,
        cursor: 'pointer'
      },

      id: 'image-anylist',
      name: 'image-anylist'
    });

    group.addShape('text', {
      attrs: {
        x: -20,
        y: 75,
        text: [intl.get('searchGraph.report')],
        fill: '#fff',
        shadowBlur: 10,
        fontSize: 10
      },
      id: 'text-anylist',
      name: 'text-anylist'
    });
  }

  // 进边
  const inXY = fourParts ? { x: -50, y: 25 } : { x: -65, y: 5 };
  const inTextXY = fourParts ? { x: -50, y: 57 } : { x: -65, y: 35 };
  group.addShape('image', {
    attrs: {
      ...inXY,
      width: 16,
      height: 16,
      img: inE,
      cursor: 'pointer'
    },
    id: 'image-in',
    name: 'image-in'
  });

  group.addShape('text', {
    attrs: {
      ...inTextXY,
      text: [intl.get('searchGraph.in')],
      fill: '#fff',
      shadowBlur: 10,
      fontSize: 10
    },
    id: 'text-in',
    name: 'text-in'
  });

  group.sort();

  group.toFront();
};

/**
 * @description 进出边选择栏定位
 */
const setInfoPosition = (selectedNode, graph, inOrOut) => {
  const infoPosition = document.getElementById('informationTab');

  if (infoPosition && selectedNode) {
    // 坐标系转化，用于dom元素定位

    const { x, y } = graph.getCanvasByPoint(selectedNode.x, selectedNode.y);

    if (inOrOut === 'in') {
      infoPosition.style.left = `${x - 390}px`;
      infoPosition.style.top = `${y - 150}px`;
    }
    if (inOrOut === 'out') {
      infoPosition.style.left = `${x + 95}px`;
      infoPosition.style.top = `${y - 150}px`;
    }
  }
};

/**
 * @description 扩展点选择栏定位
 */
const setInAndOutposition = (selectedNode, graph, inOrOut) => {
  const inAndOut = document.getElementById('inAndOut');

  if (inAndOut && selectedNode) {
    // 坐标系转化，用于dom元素定位
    const { x, y } = graph.getCanvasByPoint(selectedNode.x, selectedNode.y);

    if (inOrOut === 'in') {
      inAndOut.style.left = `${x - 365}px`;
      inAndOut.style.top = `${y - 150}px`;
    }
    if (inOrOut === 'out') {
      inAndOut.style.left = `${x + 95}px`;
      inAndOut.style.top = `${y - 150}px`;
    }
  }
};

/**
 * @description 进出边选择栏定位
 */
const setPathExplorePosition = (selectedNode, graph) => {
  const infoPosition = document.getElementById('pathExploreTab');
  if (infoPosition && selectedNode) {
    // 坐标系转化，用于dom元素定位

    const { x, y } = graph.getCanvasByPoint(selectedNode.x, selectedNode.y);

    infoPosition.style.left = `${x + 95}px`;
    infoPosition.style.top = `${y - 150}px`;
  }
};

// 关闭操作tip
const closeTip = () => {
  const op = document.querySelectorAll('#operation-tip span');

  op.forEach(node => {
    node.classList.remove('show');
  });
};

/**
 * 查找某节点所有关联的边和相邻节点
 * @param {String} nodeId 节点id
 * @param {Array} edges 所有边数据
 * @returns {Array} 查找到的数据id
 */
const getRelationByNode = (nodeId, edges) => {
  const data = edges.reduce(
    (res, { id, target, source }) => ([target, source].includes(nodeId) ? [...res, id, target, source] : res),
    [nodeId]
  );

  return [...new Set(data)];
};
const getEdgesByNode = (nodeId, edges) => {
  const data = edges.reduce(
    (res, { id, target, source }) => ([target, source].includes(nodeId) ? [...res, id] : res),
    [nodeId]
  );

  return [...new Set(data)];
};
/**
 *
 * @param nodes 画布中的点
 * @param edges 画布中的边
 * @param data 探索路径返回的数据
 */
const handleEXData = (nodes, edges, data) => {
  let openNodes = nodes;
  let openEdges = edges;

  const edgeHashMap = new Map();
  const nodeHashMap = new Map();

  _.forEach(edges, (item, index) => {
    edgeHashMap.set(item.id, index);
  });

  _.forEach(nodes, (item, index) => {
    nodeHashMap.set(item.id, index);
  });

  _.forEach(data, pathItem => {
    // 点
    _.forEach(pathItem?.vertices, item => {
      if (!nodeHashMap.has(item.id)) {
        openNodes = [
          ...openNodes,
          {
            data: { ...item },
            depth: 0,
            name: item.name,
            id: item.id,
            label: item?.name?.length < 20 ? item?.name : `${item?.name?.substring(0, 17)}...`,
            size: [40, 40],
            type: 'circle',
            labelCfg: {
              position: 'top',
              dist: 100
            },
            style: {
              fill: item.color,
              stroke: 'white'
            }
            // x: x + Math.random() * 100,
            // y: y + Math.random() * 100
          }
        ];
        nodeHashMap.set(item.id, openNodes.length);
      }
    });

    // 边
    _.forEach(pathItem?.edges, item => {
      if (!edgeHashMap.has(item.id)) {
        const type = item.in !== item.out ? 'line' : 'loop';
        openEdges = [
          ...openEdges,
          {
            ...item,
            source: item.out,
            target: item.in,
            start: getNodeFromId(openNodes, item.out),
            end: getNodeFromId(openNodes, item.in),
            label: item?.name?.length < 20 ? item?.name : `${item?.name.substring(0, 17)}...`,
            type,
            curveOffset: 40,
            curvePosition: 0.5,
            style: {
              startArrow: {
                fill: item.color,
                path: G6.Arrow.triangle(0, 0, 20),
                d: 20
              },
              endArrow: {
                fill: item.color,
                path: G6.Arrow.triangle(10, 12, 25),
                d: 25
              }
            }
          }
        ];
        edgeHashMap.set(item.id, openEdges.length);
      }
    });
  });

  return { openNodes, openEdges };
};

/**
 * @description 根据id获取点
 */
const getNodeFromId = (nodes, id) => {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      return nodes[i];
    }
  }
};

/**
 * 处理双击展开点的数据
 */
const getExpandHandleData = (data, selectedNode, nodes, edges) => {
  // 遇到无颜色的的问题
  const defaultColor = 'rgba(0,0,0,0)';
  // 展开边
  let openEdges = [...edges];

  //画布中已存在的边的id
  const openIds = openEdges.map(item => {
    return item.id;
  });

  let currentData = []; //暂存点的数据

  _.forEach(data, item => {
    const { id, color, name, expand, analysis, alias, properties } = item;

    // 处理点的数据
    const newItem = {
      ...item,
      data: { id, color, name, expand, analysis, alias, properties, class: item.class },
      label: item.name,
      style: {
        fill: item.color || defaultColor,
        stroke: 'white'
      }
    };
    currentData = [...currentData, newItem];
    // 处理该点的出边
    if (item.out_e) {
      _.forEach(item.out_e, outItem => {
        const outEdge = {
          ...outItem,
          source: item.id,
          target: selectedNode.id
          // start: {
          //   data: { id, color, name, expand, analysis, alias, properties, class: item.class },
          //   id: item.id,
          //   label: item.name.length < 20 ? item.name : `${item.name.substring(0, 17)}...`,
          //   style: {
          //     fill: item.color || defaultColor,
          //     stroke: item.color ? 'white' : 'rgba(0,0,0,0.15)'
          //   }
          // },
          // end: selectedNode
        };

        if (!openIds.includes(outItem.id)) {
          const addEdge = addCurveOffset(edges, outEdge);

          openEdges = [...openEdges, addEdge];
        }
      });
    }
    // 处理该点的进边
    if (item.in_e) {
      _.forEach(item.in_e, inItem => {
        const inEdge = {
          ...inItem,
          source: selectedNode.id,
          target: item.id
          // start: selectedNode,
          // end: {
          //   data: { id, color, name, expand, analysis, alias, properties, class: item.class },
          //   id: item.id,
          //   label: item.name.length < 20 ? item.name : `${item.name.substring(0, 17)}...`,
          //   style: {
          //     fill: item.color || defaultColor,
          //     stroke: 'white'
          //   }
          // }
        };
        // 判断画布中是否已存在这条边
        if (!openIds.includes(inItem.id)) {
          const addEdge = addCurveOffset(edges, inEdge);

          openEdges = [...openEdges, addEdge];
        }
      });
    }
  });
  const newNodes = getNodesFromEdges(currentData, nodes);
  return { newNodes, openEdges };
};

/**
 * @description 对于选择的边，是否添加偏移量
 */
const addCurveOffset = (openEdges, value) => {
  const addEdge = value;

  // 自己指向自己的边
  if (addEdge.source === addEdge.target) {
    addEdge.type = 'loop';
    addEdge.loopCfg = { position: 'top', dist: 100 };
    addEdge.style = {
      endArrow: {
        fill: addEdge.color,
        path: G6.Arrow.triangle(10, 12, 0),
        d: 0
      }
    };

    return addEdge;
  }

  for (let i = 0; i < openEdges.length; i++) {
    if (openEdges[i].source === addEdge.target && openEdges[i].target === addEdge.source) {
      openEdges[i].type = 'quadratic';
      openEdges[i].curveOffset = 40;
      openEdges[i].curvePosition = 0.5;
      // 与该边箭头方向相反的边在数组中的位置，便于取消选择的时候定位元素
      openEdges[i].reverse = openEdges.length;

      addEdge.type = 'quadratic';
      addEdge.curveOffset = 40;
      addEdge.curvePosition = 0.5;
      addEdge.reverse = i;

      break;
    }
  }

  addEdge.style = {
    startArrow: {
      fill: addEdge.color,
      path: G6.Arrow.triangle(0, 0, 20),
      d: 20
    },
    endArrow: {
      fill: addEdge.color,
      path: G6.Arrow.triangle(10, 12, 25),
      d: 25
    }
  };

  return addEdge;
};

/**
 * @description 从边中提取点,在与之前所有点进行合并去重
 */
const getNodesFromEdges = (data, nodes) => {
  // 利用hash存储已经有的点
  const allIdsSet = new Set();

  nodes.forEach(item => {
    allIdsSet.add(item.id);
  });

  data.forEach(item => {
    if (!allIdsSet.has(item.id)) {
      nodes = [...nodes, item];
      allIdsSet.add(item.id);
    }
  });

  return nodes;
};

/*
 * 绘制星星标记
 * @param graph G6实例
 * @param id 节点id
 * @param isDelete 是否删除
 */
const drawMark = (graph, id, isDelete = false, size = 16) => {
  const group = graph.findById(id).getContainer();
  const starShape = group.findById(`star-${id}`);

  // 已存在, 无需重新绘制或直接删除
  if (starShape || isDelete) {
    isDelete && group.removeChild(starShape);

    return;
  }

  group.addShape('image', {
    attrs: {
      x: -(size / 2),
      y: -(size / 2),
      width: size,
      height: size,
      img: five
    },
    id: `star-${id}`,
    name: `star-${id}`,
    draggable: true
  });
};

/**
 *
 * @param arr 数组去重
 */
const duplicateRemoval = arr => {
  const array = [];

  const obj = {};

  for (let i = 0; i < arr.length; i++) {
    if (!obj[arr[i]]) {
      array.push(arr[i]);

      obj[arr[i]] = true;
    }
  }

  return array;
};

export {
  hoverIn,
  hoverOut,
  addToolPanel,
  setInfoPosition,
  setInAndOutposition,
  getRelationByNode,
  handleEXData,
  getExpandHandleData,
  getEdgesByNode,
  setPathExplorePosition,
  drawMark,
  duplicateRemoval
};
