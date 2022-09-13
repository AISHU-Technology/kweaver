/* eslint-disable */
import store from 'store';
import intl from 'react-intl-universal';
import { message } from 'antd';

const colorList = [
  '#45639C',
  '#E91F64',
  '#019688',
  '#FF9800',
  '#3E52B5',
  '#8BC34A',
  '#374047',
  '#673AB8',
  '#ED679F',
  '#0288D1',
  '#F44336',
  '#354675',
  '#9E9E9E',
  '#00BDD4',
  '#607D8B',
  '#448AFF',
  '#FFC106',
  '#B31ACC',
  '#CDDC39',
  '#795648',
  '#D5D5D5',
  '#4CAF51',
  '#FFEB3B'
];

/**
 * @description 处理数据源数据的节点
 */
const handleDataSourceData = (res, selectedValue) => {
  let nodes = [];
  let edges = [];

  let uniqueMarker = store.get('nodeUniqueMarker');

  for (let i = 0; i < res.entity_list.length; i++) {
    let addAttr = [];
    let source = [];

    for (let j = 0; j < res.entity_property_dict.length; j++) {
      if (res.entity_list[i] === res.entity_property_dict[j].entity) {
        for (let k = 0; k < res.entity_property_dict[j].property.length; k++) {
          if (res.entity_property_dict[j].property[k][0] !== 'name') {
            addAttr = [
              ...addAttr,
              {
                inputValue: res.entity_property_dict[j].property[k][0],
                selectValue: res.entity_property_dict[j].property[k][1]
              }
            ];
          }
        }
      }
    }

    for (let q = 0; q < res.entity_main_table_dict.length; q++) {
      if (res.entity_list[i] === res.entity_main_table_dict[q].entity) {
        source = res.entity_main_table_dict[q].main_table;
      }
    }

    nodes = [
      ...nodes,
      {
        name: res.entity_list[i],
        color: colorList[parseInt(Math.random() * 20)],
        uniqueMarker: uniqueMarker + 1,
        addAttr,
        source_type: 'automatic',
        dataType: selectedValue.dataType,
        extract_type: selectedValue.extract_type,
        source,
        ds_name: selectedValue.dsname,
        data_source: selectedValue.data_source,
        id: selectedValue.id,
        ds_path: selectedValue.ds_path,
        file_type:
          selectedValue.data_source === 'mysql' || selectedValue.data_source === 'hive'
            ? ''
            : selectedValue.fileTypeSelect
      }
    ];

    uniqueMarker++;

    store.set('nodeUniqueMarker', uniqueMarker);
  }

  for (let i = 0; i < res.entity_relation_set.length; i++) {
    const color = colorList[parseInt(Math.random() * 20)];
    // let properties = [['name', 'string']];
    let properties = [];
    let source = [];

    for (let j = 0; j < res.relation_property_dict.length; j++) {
      if (res.entity_relation_set[i][1] === res.relation_property_dict[j].edge) {
        for (let k = 0; k < res.relation_property_dict[j].property.length; k++) {
          if (res.relation_property_dict[j].property[k][0] !== 'name') {
            properties = [...properties, res.relation_property_dict[j].property[k]];
          }
        }
      }
    }

    for (let q = 0; q < res.relation_main_table_dic.length; q++) {
      if (res.entity_relation_set[i][1] === res.relation_main_table_dic[q].edge) {
        source = res.relation_main_table_dic[q].main_table;
      }
    }

    edges = [
      ...edges,
      {
        name: res.entity_relation_set[i][1],
        data: {
          start: nodes[findNodeIndex(res.entity_relation_set[i][0], nodes)].uniqueMarker,
          end: nodes[findNodeIndex(res.entity_relation_set[i][2], nodes)].uniqueMarker,
          dataType: selectedValue.dataType,
          name: res.entity_relation_set[i][1],
          colour: color,
          properties,
          relations: res.entity_relation_set[i],
          source,
          ds_name: selectedValue.dsname,
          file_type:
            selectedValue.data_source === 'mysql' || selectedValue.data_source === 'hive'
              ? ''
              : selectedValue.fileTypeSelect,
          source_type: 'automatic',
          extract_type: selectedValue.extract_type
        },
        colour: color,
        color
      }
    ];
  }

  return { nodes, edges };
};

/**
 * @description 处理数据源数据的节点
 */
const handleUnStructDataSourceData = (res, model) => {
  let nodes = [];
  let edges = [];

  let uniqueMarker = store.get('nodeUniqueMarker');

  for (let i = 0; i < res.entity_list.length; i++) {
    let properties = [];
    let properties_index = [];

    for (let j = 0; j < res.entity_property_dict.length; j++) {
      if (res.entity_list[i][0] === res.entity_property_dict[j].entity) {
        for (let k = 0; k < res.entity_property_dict[j].property.length; k++) {
          properties = [
            ...properties,
            [res.entity_property_dict[j].property[k][0], res.entity_property_dict[j].property[k][1]]
          ];

          properties_index = res.entity_property_dict[j].property_index;
        }
      }
    }

    const color = colorList[parseInt(Math.random() * 20)];

    nodes = [
      ...nodes,
      {
        name: res.entity_list[i][0],
        alias: res.entity_list[i][1],
        color,
        colour: color,
        uniqueMarker: uniqueMarker + 1,
        properties,
        properties_index,
        source_type: 'automatic',
        extract_type: '',
        source_table: [],
        ds_name: '',
        data_source: '',
        ds_path: '',
        file_type: '',
        dataType: '',
        ds_id: '',
        task_id: '',
        model,
        ds_address: ''
      }
    ];

    uniqueMarker++;

    store.set('nodeUniqueMarker', uniqueMarker);
  }

  for (let i = 0; i < res.entity_relation_set.length; i++) {
    const color = colorList[parseInt(Math.random() * 20)];
    let properties = [];
    let properties_index = [];

    for (let j = 0; j < res.relation_property_dict.length; j++) {
      if (res.entity_relation_set[i][1][0] === res.relation_property_dict[j].edge) {
        properties = res.relation_property_dict[j].property;
        properties_index = res.relation_property_dict[j].property_index;
      }
    }

    const relations = [
      res.entity_relation_set[i][0][0],
      res.entity_relation_set[i][1][0],
      res.entity_relation_set[i][2][0]
    ];

    edges = [
      ...edges,
      {
        name: res.entity_relation_set[i][1][0],
        alias: res.entity_relation_set[i][1][1],
        data: {
          start: nodes[findNodeIndex(res.entity_relation_set[i][0][0], nodes)].uniqueMarker,
          end: nodes[findNodeIndex(res.entity_relation_set[i][2][0], nodes)].uniqueMarker,
          name: res.entity_relation_set[i][1][0],
          alias: res.entity_relation_set[i][1][1],
          colour: color,
          properties,
          properties_index,
          relations,
          source_table: [],
          ds_name: '',
          file_type: '',
          source_type: 'automatic',
          extract_type: '',
          data_source: '',
          ds_path: '',
          dataType: '',
          ds_id: '',
          task_id: '',
          model,
          ds_address: ''
        },
        colour: color,
        color,
        properties,
        properties_index
      }
    ];
  }

  return { nodes, edges };
};

/**
 * @description 设置数据源导入边的首尾节点
 */
const setSourceAndTarget = (nodes, edges) => {
  const copyEdges = edges;
  let returnEdges = [];

  for (let i = 0; i < copyEdges.length; i++) {
    copyEdges[i].source = findUniqueMarkerIndex(nodes, copyEdges[i].data.start);
    copyEdges[i].target = findUniqueMarkerIndex(nodes, copyEdges[i].data.end);
    copyEdges[i].lineLength = 200;
    copyEdges[i].relation = copyEdges[i].name;
    copyEdges[i].relations = copyEdges[i].data.relations;
  }

  for (let i = 0; i < copyEdges.length; i++) {
    returnEdges = [...returnEdges, handleEdge(returnEdges, copyEdges[i])];
  }

  return returnEdges;
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

  if (copyNewEdge.source === copyNewEdge.target) {
    for (let i = 0; i < edges.length; i++) {
      if (copyNewEdge.source === edges[i].source && copyNewEdge.source === edges[i].target) {
        radius += 50;
      }
    }

    copyNewEdge.radius = radius;

    return copyNewEdge;
  }

  for (let i = 0; i < edges.length; i++) {
    if (
      (copyNewEdge.source === edges[i].source && copyNewEdge.target === edges[i].target) ||
      (copyNewEdge.source === edges[i].target && copyNewEdge.target === edges[i].source)
    ) {
      shirft *= 0.8;
    }
  }

  copyNewEdge.shirft = shirft;

  return copyNewEdge;
};

/**
 * @description 按点的唯一标识返回点的下标，用于构建知识图谱
 * @param {array} entity 点集合
 * @param {number} uniqueMarker 点的唯一标识
 */
const findUniqueMarkerIndex = (entity, uniqueMarker) => {
  for (let i = 0; i < entity.length; i++) {
    if (entity[i].uniqueMarker === uniqueMarker) {
      return i;
    }
  }
};

/**
 * @description 查找输入节点在数组中的下标
 * @param {string} name 需要查找的名字
 */
const findNodeIndex = (name, arr) => {
  for (let i = 0; i < arr.length; i++) {
    if (name === arr[i].name) {
      return i;
    }
  }
};

/**
 * @description 解析url
 */
const analyUrl = url => {
  if (url === '') {
    return { name: '', type: '' };
  }

  return { name: url.split('&')[0].substring(13), type: url.split('&')[1].substring(5) };
};

/**
 * @description 输出错误
 */
const showError = code => {
  if (code === 500001) {
    message.warning(intl.get('createEntity.notPre'));
  }

  if (code === 500002) {
    message.error(intl.get('createEntity.sourceIncorrect'));
  }

  if (code === 500006) {
    message.error(intl.get('createEntity.sourceNoexist'));
  }

  if (code === 500009) {
    message.error(intl.get('createEntity.fileNoExist'));
  }

  if (code === 500010) {
    message.error(intl.get('createEntity.fileNotPre'));
  }

  if (code === 500011) {
    message.error(intl.get('createEntity.someFileNotPre'));
  }
};

export { handleEdge, handleDataSourceData, handleUnStructDataSourceData, setSourceAndTarget, analyUrl, showError };
