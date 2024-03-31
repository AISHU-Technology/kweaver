import store from 'store';
import _ from 'lodash';
import { getCorrectColor } from '@/utils/handleFunction';
import { EntityAttributesDataType } from '../NodeInfo/EntityClassAttributes/CreateAttributesModal';

import csvImage from '@/assets/images/csv.svg';
import jsonImage from '@/assets/images/json.svg';
import DataSheet from '@/assets/images/DataSheet.svg';
import folderImage from '@/assets/images/Folder-blue-new.svg';
import arImage from '@/assets/images/arSheet.svg';

const getFileType = (type: any) => {
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
  if (type === 'clickhouse') {
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
const handleTaskData = (data: any) => {
  let taskListData: any[] = [];
  let addUsedTask: any[] = [];

  for (let i = 0; i < data.length; i++) {
    taskListData = [...taskListData, handleAnyTaskData(data[i])];
    addUsedTask = [...addUsedTask, data[i].task_id];
  }

  return { taskListData, addUsedTask };
};

/**
 * @description 处理每一项任务的数据
 */
const handleAnyTaskData = (data: any) => {
  const { data_source, result, task_id } = data;

  let nodes: any[] = [];
  let edges: any[] = [];

  let uniqueMarker = store.get('nodeUniqueMarker');

  for (let i = 0; i < result.entity_list.length; i++) {
    let properties: any[] = [];
    const properties_index: any[] = [];
    const primary_key: any[] = [];
    const vector_generation: any[] = [];
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

    const thisProp = _.filter(result.entity_property_dict, item => {
      return item.entity === result.entity_list[i][0];
    })?.[0];
    if (properties.length && !properties_index.length) {
      properties_index.push(thisProp.property[0].name);
    }
    if (properties.length && !primary_key.length) {
      primary_key.push(thisProp.property[0].name);
    }
    if (properties.length && !vector_generation.length) {
      vector_generation.push(thisProp.property[0].name);
    }
    let attributes: any[] = [];
    let canvasProperties: any[] = [];
    _.map(thisProp.property, propertie => {
      const temp: EntityAttributesDataType = {
        attrName: propertie.name,
        attrDisplayName: propertie.alias,
        attrType: propertie.data_type,
        attrIndex: properties_index.includes(propertie.name),
        attrMerge: primary_key.includes(propertie.name),
        // attrVector: vector_generation.includes(propertie.name),
        attrVector: false,
        attrSynonyms: propertie.synonym?.split('|'),
        attrDescribe: propertie.description
      };
      attributes = [...attributes, temp];
      canvasProperties = [...canvasProperties, [propertie.name, propertie.data_type, propertie.alias]];
    });
    const randomColor = getCorrectColor();
    nodes = [
      ...nodes,
      {
        name: result.entity_list[i][0],
        alias: result.entity_list[i][1],
        color: randomColor,
        uniqueMarker: uniqueMarker + 1,
        // properties: result.entity_property_dict[i].property,
        properties: thisProp.property,
        attributes,
        properties_index,
        primary_key,
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
        default_tag: properties.length ? thisProp.property[0].name : '',
        type: 'customCircle',
        fillColor: randomColor,
        strokeColor: randomColor,
        showLabels: [
          {
            key: result.entity_list[i][0],
            alias: result.entity_list[i][1],
            value: result.entity_list[i][1],
            type: 'node',
            isChecked: true,
            isDisabled: false
          }
        ]
      }
    ];

    uniqueMarker++;

    store.set('nodeUniqueMarker', uniqueMarker);
  }

  for (let i = 0; i < result.entity_relation_set.length; i++) {
    const color = getCorrectColor();
    let properties: any[] = [];
    const properties_index: any[] = [];
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
const findNodeIndex = (name: string, arr: any) => {
  for (let i = 0; i < arr.length; i++) {
    if (name === arr[i].name) {
      return i;
    }
  }
  return 0;
};

export { handleTaskData, getFileType };
