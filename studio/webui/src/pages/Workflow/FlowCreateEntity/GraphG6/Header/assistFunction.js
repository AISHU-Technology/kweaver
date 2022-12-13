import store from 'store';
import { message } from 'antd';
import intl from 'react-intl-universal';

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
 * @description 处理任务解析出来点数据
 */
const handleTaskData = data => {
  let taskListData = [];
  let addUsedTask = [];

  for (let i = 0; i < data.length; i++) {
    taskListData = [...taskListData, handleAnyTaskData(data[i])];
    addUsedTask = [...addUsedTask, data[i].task_id];
  }

  return { taskListData, addUsedTask };
};

/**
 * @description 处理每一项任务的数据
 */
const handleAnyTaskData = data => {
  const { data_source, result, task_id } = data;

  let nodes = [];
  let edges = [];

  let uniqueMarker = store.get('nodeUniqueMarker');

  for (let i = 0; i < result.entity_list.length; i++) {
    let properties = [];
    let properties_index = [];
    let source_table = [];

    for (let j = 0; j < result.entity_property_dict.length; j++) {
      if (result.entity_list[i][0] === result.entity_property_dict[j].entity) {
        for (let k = 0; k < result.entity_property_dict[j].property.length; k++) {
          properties = [
            ...properties,
            [result.entity_property_dict[j].property[k][0], result.entity_property_dict[j].property[k][1]]
          ];

          properties_index = ['name'];
        }
      }
    }

    for (let q = 0; q < result.entity_main_table_dict.length; q++) {
      if (result.entity_list[i][0] === result.entity_main_table_dict[q].entity) {
        source_table = result.entity_main_table_dict[q].main_table;
      }
    }

    nodes = [
      ...nodes,
      {
        name: result.entity_list[i][0],
        alias: result.entity_list[i][1],
        colour: colorList[parseInt(Math.random() * 20)],
        uniqueMarker: uniqueMarker + 1,
        properties,
        properties_index,
        source_type: 'automatic',
        dataType: data_source.dataType,
        extract_type: data_source.extract_type,
        source_table,
        ds_name: data_source.dsname,
        data_source: data_source.data_source,
        ds_id: data_source.id,
        ds_path: data_source.ds_path,
        file_type: data_source.file_type,
        ds_address: data_source.ds_address,
        task_id
      }
    ];

    uniqueMarker++;

    store.set('nodeUniqueMarker', uniqueMarker);
  }

  for (let i = 0; i < result.entity_relation_set.length; i++) {
    const color = colorList[parseInt(Math.random() * 20)];
    let properties = [];
    let properties_index = [];
    let source_table = [];

    for (let j = 0; j < result.relation_property_dict.length; j++) {
      if (result.entity_relation_set[i][1] === result.relation_property_dict[j].edge) {
        for (let k = 0; k < result.relation_property_dict[j].property.length; k++) {
          properties = [
            ...properties,
            [result.relation_property_dict[j].property[k][0], result.relation_property_dict[j].property[k][1]]
          ];

          properties_index = ['name'];
        }
      }
    }

    for (let q = 0; q < result.relation_main_table_dic.length; q++) {
      if (result.entity_relation_set[i][1] === result.relation_main_table_dic[q].edge) {
        source_table = result.relation_main_table_dic[q].main_table;
      }
    }

    edges = [
      ...edges,
      {
        start: nodes[findNodeIndex(result.entity_relation_set[i][0], nodes)].uniqueMarker,
        end: nodes[findNodeIndex(result.entity_relation_set[i][2], nodes)].uniqueMarker,
        dataType: data_source.dataType,
        name: result.entity_relation_set[i][1],
        properties,
        properties_index,
        relations: result.entity_relation_set[i],
        source_table,
        ds_name: data_source.dsname,
        file_type: data_source.file_type,
        source_type: 'automatic',
        extract_type: data_source.extract_type,
        ds_id: data_source.id,
        ds_address: data_source.ds_address,
        task_id,
        colour: color,
        color,
        model: '',
        alias: ''
      }
    ];
  }

  return { nodes, edges };
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
 * @description 处理每一项任务的数据
 */
const handAsData = (result, data_source) => {
  let nodes = [];
  let edges = [];

  let uniqueMarker = store.get('nodeUniqueMarker');

  for (let i = 0; i < result.entity_list.length; i++) {
    let properties = [];
    let properties_index = [];
    let source_table = [];

    for (let j = 0; j < result.entity_property_dict.length; j++) {
      if (result.entity_list[i] === result.entity_property_dict[j].entity) {
        for (let k = 0; k < result.entity_property_dict[j].property.length; k++) {
          properties = [
            ...properties,
            [result.entity_property_dict[j].property[k][0], result.entity_property_dict[j].property[k][1]]
          ];

          properties_index = ['name'];
        }
      }
    }

    for (let q = 0; q < result.entity_main_table_dict.length; q++) {
      if (result.entity_list[i] === result.entity_main_table_dict[q].entity) {
        source_table = result.entity_main_table_dict[q].main_table;
      }
    }

    nodes = [
      ...nodes,
      {
        name: result.entity_list[i],
        alias: result.entity_list[i] || '',
        colour: colorList[parseInt(Math.random() * 20)],
        uniqueMarker: uniqueMarker + 1,
        properties,
        properties_index,
        source_type: 'automatic',
        dataType: data_source.dataType,
        extract_type: data_source.extract_type,
        source_table,
        ds_name: data_source.dsname,
        data_source: data_source.data_source,
        ds_id: data_source.id,
        ds_path: data_source.ds_path,
        file_type: 'json',
        task_id: '',
        ds_address: data_source.ds_address
      }
    ];

    uniqueMarker++;

    store.set('nodeUniqueMarker', uniqueMarker);
  }

  for (let i = 0; i < result.entity_relation_set.length; i++) {
    const color = colorList[parseInt(Math.random() * 20)];
    let properties = [];
    let properties_index = [];
    let source_table = [];

    for (let j = 0; j < result.relation_property_dict.length; j++) {
      if (result.entity_relation_set[i][1] === result.relation_property_dict[j].edge) {
        for (let k = 0; k < result.relation_property_dict[j].property.length; k++) {
          properties = [
            ...properties,
            [result.relation_property_dict[j].property[k][0], result.relation_property_dict[j].property[k][1]]
          ];

          properties_index = ['name'];
        }
      }
    }

    for (let q = 0; q < result.relation_main_table_dict.length; q++) {
      if (result.entity_relation_set[i][1] === result.relation_main_table_dict[q].edge) {
        source_table = result.relation_main_table_dict[q].main_table;
      }
    }

    edges = [
      ...edges,
      {
        name: result.entity_relation_set[i][1],
        alias: result.entity_relation_set[i][1] || '',
        start: nodes[findNodeIndex(result.entity_relation_set[i][0], nodes)].uniqueMarker,
        end: nodes[findNodeIndex(result.entity_relation_set[i][2], nodes)].uniqueMarker,
        dataType: data_source.dataType,
        colour: color,
        properties,
        properties_index,
        relations: result.entity_relation_set[i],
        source_table,
        ds_name: data_source.dsname,
        file_type: 'json',
        source_type: 'automatic',
        extract_type: data_source.extract_type,
        ds_id: data_source.id,
        task_id: '',
        ds_address: data_source.ds_address,
        color,
        model: ''
      }
    ];
  }

  return { nodes, edges };
};

/**
 * @description 数据源预测报错
 */
const asError = resData => {
  if (resData && resData.Code) {
    if (resData.Code === 500001) {
      message.warning(intl.get('createEntity.notPre'));
    }

    if (resData.Code === 500014) {
      message.error(intl.get('createEntity.preFail'));
    }

    if (resData.Code === 500002) {
      message.error(intl.get('createEntity.sourceIncorrect'));
    }

    if (resData.Code === 500006) {
      message.error(intl.get('createEntity.sourceNoexist'));
    }

    if (resData.Code === 500009) {
      message.error(intl.get('createEntity.fileNoExist'));
    }

    if (resData.Code === 500010) {
      message.error(intl.get('createEntity.fileNotPre'));
    }

    if (resData.Code === 500011) {
      message.error(intl.get('createEntity.someFileNotPre'));
    }

    if (resData.Code === 500013) {
      message.error(intl.get('createEntity.tokenError'));
    }
  }
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

const analyUrl = url => {
  if (isFlow()) {
    return { name: '', type: '' };
  }

  if (url === '') {
    return { name: '', type: '' };
  }

  return { name: url.split('&')[0].substring(13), type: url.split('&')[1].substring(5) };
};

/**
 * @description 错误提示
 */
const ErrorShow = resStandData => {
  if (resStandData && resStandData.Code === 500026) {
    message.error(intl.get('createEntity.taskError'));

    return;
  }

  if (resStandData && resStandData.Code === 500002) {
    message.error(intl.get('createEntity.sourceIncorrect'));
  }

  if (resStandData && resStandData.Code === 500006) {
    message.error(intl.get('createEntity.sourceNoexist'));
  }

  if (resStandData && resStandData.Code === 500009) {
    message.error(intl.get('createEntity.fileNoExist'));
  }

  if (resStandData && resStandData.Code === 500010) {
    message.error(intl.get('createEntity.fileNotPre'));
  }

  if (resStandData && resStandData.Code === 500011) {
    message.error(intl.get('createEntity.someFileNotPre'));
  }
};
export { handleTaskData, asError, handAsData, isFlow, analyUrl, handleAnyTaskData, ErrorShow };
