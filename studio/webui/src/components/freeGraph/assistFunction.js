/* eslint-disable no-param-reassign */
const colorList = [
  '#54639C',
  '#5F81D8',
  '#5889C4',
  '#5C539B',
  '#805A9C',
  '#D770A1',
  '#D8707A',
  '#2A908F',
  '#50A06A',
  '#7BBAA0',
  '#91C073',
  '#BBD273',
  '#F0E34F',
  '#ECB763',
  '#E39640',
  '#D9704C',
  '#D9534C',
  '#C64F58',
  '#3A4673',
  '#68798E',
  '#C5C8CC'
];

/**
 * @description 处理外部导入的数据
 */
const handleExternalImport = ({ savedNodes, entity_id, edge_id, data }) => {
  let { edge } = data;
  let entity = handleInvalidData(data.entity);

  const freeGraphMain = document.getElementById('freeGraphMain');

  entity = entity.map((item, index) => {
    item.entity_id = entity_id;
    item.x = freeGraphMain && freeGraphMain.offsetWidth / 2 + Math.random() * 100;
    item.y = freeGraphMain && freeGraphMain.offsetHeight / 2 + Math.random() * 50;

    entity_id++;

    return item;
  });

  edge = edge.map((item, index) => {
    item.edge_id = edge_id;

    item.start = findNodeIndexFromName(item.relations[0], entity); // id
    item.end = findNodeIndexFromName(item.relations[2], entity); // id
    item.lineLength = 200;
    edge_id++;

    return item;
  });

  entity = [...savedNodes, ...entity];

  edge = edge.map((item, index) => {
    item.source = findNodeIndexFromId(item.start, entity);
    item.target = findNodeIndexFromId(item.end, entity);

    return item;
  });

  // 如果边重复，添加偏移量
  let edges = [];

  for (let i = 0; i < edge.length; i++) {
    edges = [...edges, handleEdge(edges, edge[i])];
  }

  return { nodes: entity, entity_id, edges, edge_id };
};

/**
 * @description 处理任务导入数据
 */
const handleTaskImport = ({ savedNodes, entity_id, edge_id, data }) => {
  let copyEntityId = entity_id;
  let copyEdgeId = edge_id;
  let copySavedNodes = savedNodes;
  let addEdges = [];

  for (let i = 0, { length } = data; i < length; i++) {
    const { entity, newEdges, newCopyEntityId, newCopyEdgeId } = handleAnyTaskData(
      copySavedNodes,
      copyEntityId,
      copyEdgeId,
      data[i]
    );

    copySavedNodes = entity;
    copyEntityId = newCopyEntityId;
    copyEdgeId = newCopyEdgeId;
    addEdges = [...addEdges, ...newEdges];
  }

  return { copySavedNodes, copyEntityId, copyEdgeId, addEdges };
};

/**
 * @description 处理每一项任务数据
 */
const handleAnyTaskData = (copySavedNodes, copyEntityId, copyEdgeId, taskData) => {
  // eslint-disable-next-line prefer-const
  let { nodes, edges } = taskData;
  let entity = handleInvalidData(nodes);

  const freeGraphMain = document.getElementById('freeGraphMain');

  entity = entity.map((item, index) => {
    item.entity_id = copyEntityId;
    item.x = freeGraphMain && freeGraphMain.offsetWidth / 2 + Math.random() * 100;
    item.y = freeGraphMain && freeGraphMain.offsetHeight / 2 + Math.random() * 50;

    copyEntityId++;

    return item;
  });

  edges = edges.map((item, index) => {
    item.edge_id = copyEdgeId;

    item.start = findNodeIndexFromName(item.relations[0], entity); // id
    item.end = findNodeIndexFromName(item.relations[2], entity); // id
    item.lineLength = 200;
    copyEdgeId++;

    return item;
  });

  entity = [...copySavedNodes, ...entity];

  edges = edges.map((item, index) => {
    item.source = findNodeIndexFromId(item.start, entity);
    item.target = findNodeIndexFromId(item.end, entity);

    return item;
  });

  // 如果边重复，添加偏移量
  let newEdges = [];

  for (let i = 0; i < edges.length; i++) {
    newEdges = [...newEdges, handleEdge(newEdges, edges[i])];
  }

  return { entity, newEdges, newCopyEntityId: copyEntityId, newCopyEdgeId: copyEdgeId };
};

/**
 * @description 清理脏数据避免影响布局
 */
const handleInvalidData = entity => {
  let newEntity = [];

  for (let i = 0, { length } = entity; i < length; i++) {
    newEntity = [
      ...newEntity,
      {
        colour: entity[i].colour,
        dataType: entity[i].dataType,
        data_source: entity[i].data_source,
        ds_name: entity[i].ds_name,
        ds_path: entity[i].ds_path,
        extract_type: entity[i].extract_type,
        file_type: entity[i].file_type,
        ds_id: entity[i].ds_id,
        index: entity[i].index,
        model: entity[i].model || '',
        name: entity[i].name,
        entity_id: entity[i].entity_id,
        properties: entity[i].properties,
        properties_index: entity[i].properties_index,
        source_table: entity[i].source_table,
        source_type: entity[i].source_type,
        task_id: entity[i].task_id || '',
        ds_address: entity[i].ds_address || '',
        alias: entity[i].alias || ''
      }
    ];
  }

  return newEntity;
};

/**
 * @description 处理起点与终点相同的边
 * @param {Array} edges 边集合
 * @param {object} newEdge 新增的边
 */

const handleEdge = (edges, newEdge) => {
  let shirft = 2;
  let radius = 50;
  const copyNewEdge = newEdge;
  let sigal = true;

  if (copyNewEdge.start === copyNewEdge.end) {
    for (let i = 0; i < edges.length; i++) {
      if (copyNewEdge.start === edges[i].start && copyNewEdge.start === edges[i].end) {
        radius += 50;
      }
    }

    copyNewEdge.radius = radius;

    return copyNewEdge;
  }

  for (let i = 0; i < edges.length; i++) {
    if (
      (copyNewEdge.start === edges[i].start && copyNewEdge.end === edges[i].end) ||
      (copyNewEdge.start === edges[i].end && copyNewEdge.end === edges[i].start && sigal)
    ) {
      shirft *= 0.8;
      sigal = false;

      // eslint-disable-next-line no-continue
      continue;
    }

    if (copyNewEdge.start === edges[i].start && copyNewEdge.end === edges[i].end) {
      shirft *= 0.8;
    }
  }

  copyNewEdge.shirft = shirft;

  return copyNewEdge;
};

/**
 * @description 通过name查找节点id
 */
const findNodeIndexFromName = (name, nodes) => {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].name === name) {
      return nodes[i].entity_id;
    }
  }
};

/**
 * @description 通过id查找节点下标
 */
const findNodeIndexFromId = (id, nodes) => {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].entity_id === id) {
      return i;
    }
  }
};

/**
 * @description 设置边的偏移量
 */
const setEdgeShift = (addEdge, edges) => {
  if (addEdge.start === addEdge.end) {
    let radius = 50;

    for (let i = 0, { length } = edges; i < length; i++) {
      if (edges[i].start === edges[i].end && edges[i].start === addEdge.start) {
        radius += 50;
      }
    }

    addEdge.radius = radius;

    return addEdge;
  }

  let shirft = 2;
  let sigal = true;
  let allShirft = [];

  for (let i = 0, { length } = edges; i < length; i++) {
    if (addEdge.start === edges[i].start && addEdge.end === edges[i].end && edges[i].shirft) {
      allShirft = [...allShirft, edges[i].shirft];
    }
  }

  for (let i = 0, { length } = edges; i < length; i++) {
    if (
      (addEdge.start === edges[i].start && addEdge.end === edges[i].end) ||
      (addEdge.start === edges[i].end && addEdge.end === edges[i].start && sigal)
    ) {
      shirft *= 0.8;
      sigal = false;

      if (!allShirft.includes(shirft)) {
        addEdge.shirft = shirft;

        return addEdge;
      }

      // eslint-disable-next-line no-continue
      continue;
    }

    if (addEdge.start === edges[i].start && addEdge.end === edges[i].end) {
      shirft *= 0.8;

      if (!allShirft.includes(shirft)) {
        addEdge.shirft = shirft;

        return addEdge;
      }
    }
  }

  addEdge.shirft = shirft;

  return addEdge;
};

/**
 * @description 与点集合相邻的边的edge_id
 */
const getNodesToEdgesId = (nodes, edges) => {
  let edges_id = [];

  for (let i = 0, { length } = edges; i < length; i++) {
    if (nodes.includes(edges[i].start) || nodes.includes(edges[i].end)) {
      edges_id = [...edges_id, edges[i].edge_id];
    }
  }

  return edges_id;
};

/**
 * @description 改变点的信息
 */
const changeNodeInfo = (data, nodes, selectedElement) => {
  const newNodes = nodes.map((item, index) => {
    if (item.entity_id === selectedElement.entity_id) {
      item.colour = data.color.hex;
      item.name = data.name;
      item.alias = data.alias;

      item.properties = data.property.map((item, index) => {
        return [item[0], item[1]];
      });

      item.properties_index = data.property.map((item, index) => {
        if (item[2]) {
          return item[0];
        }

        return '';
      });

      item.properties_index = item.properties_index.filter((item, index) => {
        return item !== '';
      });

      return item;
    }

    return item;
  });

  return newNodes;
};

/**
 * @description 改变边的信息
 */
const changeEdgeInfo = (data, edges, selectedElement) => {
  const newEdges = edges.map((item, index) => {
    if (item.edge_id === selectedElement.edge_id) {
      item.colour = data.color.hex;
      item.name = data.name;
      item.alias = data.alias;

      item.properties = data.property.map((item, index) => {
        return [item[0], item[1]];
      });

      item.properties_index = data.property.map((item, index) => {
        if (item[2]) {
          return item[0];
        }

        return '';
      });

      item.properties_index = item.properties_index.filter((item, index) => {
        return item !== '';
      });

      return item;
    }

    return item;
  });

  return newEdges;
};

/**
 * @description 处理批量添加边的数据
 */
const handleBatchAddEdges = (addEdges, edges, nodes, edge_id) => {
  let newAddEdges = [];
  let newEdges = edges;

  for (let i = 0, { length } = addEdges; i < length; i++) {
    let temp = {
      colour: addEdges[i].colour,
      dataType: '',
      ds_id: '',
      ds_name: '',
      edge_id,
      end: addEdges[i].endId,
      extract_type: '',
      file_type: '',
      lineLength: addEdges[i].lineLength,
      model: '',
      name: addEdges[i].name,
      alias: addEdges[i].alias || addEdges[i].name,
      properties: addEdges[i].properties || [['name', 'string']],
      properties_index: addEdges[i].properties_index || ['name'],
      shirft: 2,
      source: findNodeIndexFromId(addEdges[i].startId, nodes),
      source_type: 'manual',
      start: addEdges[i].startId,
      target: findNodeIndexFromId(addEdges[i].endId, nodes),
      task_id: '',
      source_table: [],
      ds_address: ''
    };

    temp = handleEdge(newEdges, temp);

    newAddEdges = [...newAddEdges, temp];
    newEdges = [...newEdges, temp];

    edge_id++;
  }

  return { newAddEdges, edge_id };
};

/**
 * @description 随机点的颜色
 */
const setColor = () => {
  const { length } = colorList;

  return colorList[parseInt(Math.random() * (length - 1))];
};

/**
 * @description 是否在流程中
 */
const isFlow = () => {
  if (window.location.pathname === '/home/workflow/edit' || window.location.pathname === '/home/workflow/create') {
    return true;
  }

  return false;
};

export {
  handleExternalImport,
  setColor,
  setEdgeShift,
  getNodesToEdgesId,
  changeNodeInfo,
  changeEdgeInfo,
  handleBatchAddEdges,
  handleTaskImport,
  isFlow,
  handleInvalidData
};
