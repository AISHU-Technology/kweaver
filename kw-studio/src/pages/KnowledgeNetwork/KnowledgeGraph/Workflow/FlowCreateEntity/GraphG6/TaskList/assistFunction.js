import store from 'store';
import { getCorrectColor } from '@/utils/handleFunction';

import csvImage from '@/assets/images/csv.svg';
import jsonImage from '@/assets/images/json.svg';
import DataSheet from '@/assets/images/DataSheet.svg';
import folderImage from '@/assets/images/Folder-blue.svg';
import arImage from '@/assets/images/arSheet.svg';

const getFileType = type => {
  if (type === 'table') {
    return DataSheet;
  }

  if (type === 'files') {
    return folderImage;
  }

  if (type === 'json') {
    return jsonImage;
  }

  if (type === 'csv') {
    return csvImage;
  }

  if (type === 'multi-files') {
    return folderImage;
  }

  if (type === 'mysql') {
    return DataSheet;
  }

  if (type === 'hive') {
    return DataSheet;
  }

  if (type === 'postgresql') {
    return DataSheet;
  }
  if (type === 'kingbasees') {
    return DataSheet;
  }
  if (type === 'sqlserver') {
    return DataSheet;
  }
  if (type === 'AnyRobot') {
    return arImage;
  }
};

/*

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

    if (result.entity_list[i][0] === result.entity_property_dict[i].entity) {
      for (let k = 0; k < result.entity_property_dict[i].property.length; k++) {
        properties = [
          ...properties,
          [result.entity_property_dict[i].property[k][0], result.entity_property_dict[i].property[k][1]]
        ];
      }
    } else {
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
    }

    if (result.entity_list[i][0] === result.entity_main_table_dict[i].entity) {
      source_table = result.entity_main_table_dict[i].main_table;
    } else {
      for (let q = 0; q < result.entity_main_table_dict.length; q++) {
        if (result.entity_list[i][0] === result.entity_main_table_dict[q].entity) {
          source_table = result.entity_main_table_dict[q].main_table;
        }
      }
    }

    if (properties.length && !properties_index.length) {
      properties_index.push(properties[0][0]);
    }

    nodes = [
      ...nodes,
      {
        name: result.entity_list[i][0],
        alias: result.entity_list[i][1],
        color: getCorrectColor(),
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
        task_id,
        icon: '',
        default_tag: properties.length ? properties[0][0] : ''
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

    if (result.entity_list[i][1] === result.entity_property_dict[i].entity) {
      for (let k = 0; k < result.entity_property_dict[i].property.length; k++) {
        properties = [
          ...properties,
          [result.entity_property_dict[i].property[k][0], result.entity_property_dict[i].property[k][1]]
        ];
      }
    } else {
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
    }

    if (result.entity_list[i][1] === result.entity_main_table_dict[i].entity) {
      source_table = result.relation_main_table_dict[i].main_table;
    } else {
      for (let q = 0; q < result.relation_main_table_dict.length; q++) {
        if (result.entity_relation_set[i][1] === result.relation_main_table_dict[q].edge) {
          source_table = result.relation_main_table_dict[q].main_table;
        }
      }
    }

    // for (let j = 0; j < result.relation_property_dict.length; j++) {
    //   if (result.entity_relation_set[i][1] === result.relation_property_dict[j].edge) {
    //     for (let k = 0; k < result.relation_property_dict[j].property.length; k++) {
    //       properties = [
    //         ...properties,
    //         [result.relation_property_dict[j].property[k][0], result.relation_property_dict[j].property[k][1]]
    //       ];
    //     }
    //   }
    // }

    // for (let q = 0; q < result.relation_main_table_dic.length; q++) {
    //   if (result.entity_relation_set[i][1] === result.relation_main_table_dic[q].edge) {
    //     source_table = result.relation_main_table_dic[q].main_table;
    //   }
    // }

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

export { handleTaskData, getFileType };
