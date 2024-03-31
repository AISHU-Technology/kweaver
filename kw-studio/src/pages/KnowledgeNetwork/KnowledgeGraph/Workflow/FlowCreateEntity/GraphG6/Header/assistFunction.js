import store from 'store';
import { message } from 'antd';
import intl from 'react-intl-universal';
import { getCorrectColor } from '@/utils/handleFunction';

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
    const properties_index = [];
    let source_table = [];

    for (let j = 0; j < result.entity_property_dict.length; j++) {
      if (result.entity_list[i][0] === result.entity_property_dict[j].entity) {
        for (let k = 0; k < result.entity_property_dict[j].property.length; k++) {
          properties = [
            ...properties,
            [result.entity_property_dict[j].property[k][0], result.entity_property_dict[j].property[k][1]]
          ];
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
        colour: getCorrectColor(),
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
    const color = getCorrectColor();
    let properties = [];
    const properties_index = [];
    let source_table = [];

    for (let j = 0; j < result.relation_property_dict.length; j++) {
      if (result.entity_relation_set[i][1] === result.relation_property_dict[j].edge) {
        for (let k = 0; k < result.relation_property_dict[j].property.length; k++) {
          properties = [
            ...properties,
            [result.relation_property_dict[j].property[k][0], result.relation_property_dict[j].property[k][1]]
          ];
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
    const properties_index = [];
    let source_table = [];

    for (let j = 0; j < result.entity_property_dict.length; j++) {
      if (result.entity_list[i] === result.entity_property_dict[j].entity) {
        for (let k = 0; k < result.entity_property_dict[j].property.length; k++) {
          properties = [
            ...properties,
            [result.entity_property_dict[j].property[k][0], result.entity_property_dict[j].property[k][1]]
          ];
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
        colour: getCorrectColor(),
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
    const color = getCorrectColor();
    let properties = [];
    const properties_index = [];
    let source_table = [];

    for (let j = 0; j < result.relation_property_dict.length; j++) {
      if (result.entity_relation_set[i][1] === result.relation_property_dict[j].edge) {
        for (let k = 0; k < result.relation_property_dict[j].property.length; k++) {
          properties = [
            ...properties,
            [result.relation_property_dict[j].property[k][0], result.relation_property_dict[j].property[k][1]]
          ];
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
      // message.warning(intl.get('createEntity.notPre'));
      message.warning({
        content: intl.get('createEntity.notPre'),
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
    }

    if (resData.Code === 500014) {
      // message.error(intl.get('createEntity.preFail'));
      message.error({
        content: intl.get('createEntity.preFail'),
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
    }

    if (resData.Code === 500002) {
      // message.error(intl.get('createEntity.sourceIncorrect'));
      message.error({
        content: intl.get('createEntity.sourceIncorrect'),
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
    }

    if (resData.Code === 500006) {
      // message.error(intl.get('createEntity.sourceNoexist'));
      message.error({
        content: intl.get('createEntity.sourceNoexist'),
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
    }

    if (resData.Code === 500009) {
      // message.error(intl.get('createEntity.fileNoExist'));
      message.error({
        content: intl.get('createEntity.fileNoExist'),
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
    }

    if (resData.Code === 500010) {
      // message.error(intl.get('createEntity.fileNotPre'));
      message.error({
        content: intl.get('createEntity.fileNotPre'),
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
    }

    if (resData.Code === 500011) {
      // message.error(intl.get('createEntity.someFileNotPre'));
      message.error({
        content: intl.get('createEntity.someFileNotPre'),
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
    }

    if (resData.Code === 500013) {
      // message.error(intl.get('createEntity.tokenError'));
      message.error({
        content: intl.get('createEntity.tokenError'),
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
    }
  }
};

/**
 * @description 是否在流程中
 */
const isFlow = () => {
  if (
    window.location.pathname === '/knowledge/workflow/edit' ||
    window.location.pathname === '/knowledge/workflow/create'
  ) {
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
    // message.error(intl.get('createEntity.taskError'));
    message.error({
      content: intl.get('createEntity.taskError'),
      className: 'custom-class',
      style: {
        marginTop: '6vh'
      }
    });

    return;
  }

  if (resStandData && resStandData.Code === 500002) {
    // message.error(intl.get('createEntity.sourceIncorrect'));
    message.error({
      content: intl.get('createEntity.sourceIncorrect'),
      className: 'custom-class',
      style: {
        marginTop: '6vh'
      }
    });
  }

  if (resStandData && resStandData.Code === 500006) {
    // message.error(intl.get('createEntity.sourceNoexist'));
    message.error({
      content: intl.get('createEntity.sourceNoexist'),
      className: 'custom-class',
      style: {
        marginTop: '6vh'
      }
    });
  }

  if (resStandData && resStandData.Code === 500009) {
    // message.error(intl.get('createEntity.fileNoExist'));
    message.error({
      content: intl.get('createEntity.fileNoExist'),
      className: 'custom-class',
      style: {
        marginTop: '6vh'
      }
    });
  }

  if (resStandData && resStandData.Code === 500010) {
    // message.error(intl.get('createEntity.fileNotPre'));
    message.error({
      content: intl.get('createEntity.fileNotPre'),
      className: 'custom-class',
      style: {
        marginTop: '6vh'
      }
    });
  }

  if (resStandData && resStandData.Code === 500011) {
    // message.error(intl.get('createEntity.someFileNotPre'));
    message.error({
      content: intl.get('createEntity.someFileNotPre'),
      className: 'custom-class',
      style: {
        marginTop: '6vh'
      }
    });
  }
};
export { handleTaskData, asError, handAsData, isFlow, analyUrl, handleAnyTaskData, ErrorShow };
