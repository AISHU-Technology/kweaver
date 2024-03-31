import G6 from '@antv/g6';
import _ from 'lodash';

const handleEXData = (nodes: any[], edges: any[], data: any[]) => {
  let openNodes = nodes;
  let openEdges = edges;

  const edgeHashMap = new Map();
  const nodeHashMap = new Map();

  edges.forEach((item: { id: any }, index: any) => {
    edgeHashMap.set(item.id, index);
  });

  nodes.forEach((item: { id: any }, index: any) => {
    nodeHashMap.set(item.id, index);
  });

  data.forEach((pathItem: { vertices: any[]; edges: any[] }) => {
    // 点
    pathItem.vertices.forEach((item: any) => {
      if (!nodeHashMap.has(item.id)) {
        openNodes = [
          ...openNodes,
          {
            data: { ...item },
            depth: 0,
            name: item.name,
            id: item.id,
            label: item.name.length < 20 ? item.name : `${item.name.substring(0, 17)}...`,
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
          }
        ];
        nodeHashMap.set(item.id, openNodes.length);
      }
    });

    // 边
    pathItem.edges.forEach((item: any) => {
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
            label: item.name.length < 20 ? item.name : `${item.name.substring(0, 17)}...`,
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
const getNodeFromId = (nodes: any[], id: string) => {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      return nodes[i];
    }
  }
};

/**
 *
 * @param arr 数组去重
 */
const duplicateRemoval = (arr: Array<string>) => {
  const array = [];

  const obj: { [key: string]: boolean } = {};

  for (let i = 0; i < arr.length; i++) {
    if (!obj[arr[i]]) {
      array.push(arr[i]);

      obj[arr[i]] = true;
    }
  }

  return array;
};
export { handleEXData, duplicateRemoval };
