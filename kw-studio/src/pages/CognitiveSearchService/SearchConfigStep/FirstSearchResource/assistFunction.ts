import _ from 'lodash';
import { localStore, fuzzyMatch } from '@/utils/handleFunction';
import intl from 'react-intl-universal';
import { MODEL_TYPE } from '../../enum';
export const onHandleTree = (data: any) => {
  return {
    key: `${data.name}/`,
    id: data.name,
    title: data.name,
    name: data.name,
    checkable: false,
    value: data.name,
    isLeaf: false
  };
};

/**
 * 添加资源
 */
export const onAddGraph = (selectGraphShow: any, data: any) => {
  const userInfo = localStore.get('userInfo');
  const time = new Date().getTime();
  const tableData = data?.props?.data_source_scope;
  const tableAllData = data?.props?.data_all_source;

  const addTable = _.map(selectGraphShow, (item: any) => {
    return {
      kg_id: item.kg_id,
      id: item.kg_id,
      resource_type: 'kg', // 图谱类型
      description: item[`des_${item.key}`],
      creator: userInfo?.id,
      create_time: time,
      editor: userInfo?.id,
      edit_time: time,
      creater_email: userInfo?.email,
      editor_email: userInfo?.email,
      category: [],
      entities: item.entities,
      kg_name: item[`graph_${item.key}`],
      creater_name: userInfo?.username,
      editor_name: userInfo?.username,
      allEntities: item.allEntities
    };
  });

  // 更新流程一资源列表 以及 流程二中全部资源列表
  const addData = _.isEmpty(tableData) ? addTable : [...addTable, ...tableData];
  const addAllData = _.isEmpty(tableAllData) ? addTable : [...addTable, ...tableAllData];
  const newConfig = onAddGraphClassify(data, tableData, addTable);

  data.props.data_source_scope = addData;
  data.props.data_all_source = addAllData;
  data.props.full_text.search_config = newConfig;

  return data;
};

/**
 * 添加的图谱分类放置
 */
const onAddGraphClassify = (data: any, tableData: any, addTable: any) => {
  const searchConfig = data?.props?.full_text?.search_config;
  // 全部资源也算作一个分类
  let newConfig: any = [];
  if (_.isEmpty(tableData)) {
    const newAddTable = _.map(addTable, (item: any) => {
      item.id = `${1}_${item.kg_id}`;
      return item;
    });
    newConfig = [{ class_name: '全部资源', class_id: 1, kgs: newAddTable }];
  } else {
    newConfig = _.map(searchConfig, (item: any) => {
      if (item?.class_name === '全部资源') {
        item.kgs = [...addTable, ...item.kgs];
        return item;
      }
      return item;
    });
  }
  return newConfig;
};

/**
 * 添加资源（向量模型）
 */
export const onAddModel = (oriData: any, data: any) => {
  const userInfo = localStore.get('userInfo');
  const time = new Date().getTime();
  const device = data?.device === 'cpu' ? 'CPU' : 'GPU';
  const addData = [
    {
      resource_type: 'model', // 向量模型
      sub_type: data?.sub_type,
      model_name: `${intl.get('cognitiveSearch.resource.embeddingModelName', { device })}`,
      kg_id: '',
      model_conf: _.omit(data, 'sub_type'),
      description: '',
      creator: userInfo?.id,
      create_time: time,
      editor: userInfo?.id,
      edit_time: time,
      creater_email: userInfo?.email,
      editor_email: userInfo?.email,
      category: [],
      creater_name: userInfo?.username,
      editor_name: userInfo?.username
    }
  ];

  // 旧的
  // const isEdit = _.filter(oriData, item => item?.sub_type === data?.sub_type);
  // const result = !_.isEmpty(isEdit)
  //   ? _.map(oriData, item => {
  //       if (item?.sub_type === data?.sub_type) return addData[0];
  //       return item;
  //     })
  //   : [...oriData, ...addData];
  // return result;
  const allSourceData = _.cloneDeep(oriData);
  const cloneData = allSourceData?.props?.data_all_source || [];
  const isEdit = _.filter(cloneData, item => item?.sub_type === data?.sub_type);
  const result = !_.isEmpty(isEdit)
    ? _.map(_.cloneDeep(cloneData), item => {
        if (item?.sub_type === data?.sub_type) return addData[0];
        return item;
      })
    : [...cloneData, ...addData];
  allSourceData.props.data_all_source = result;
  return allSourceData;
};

/**
 * 添加-编辑大模型
 */
export const onAddEditLargeModel = (values: any, data: any, editRecord?: any) => {
  const cloneStepFirstTableData = _.cloneDeep(data?.props?.data_all_source);

  let updateData: any = {};
  // 添加
  if (_.isEmpty(editRecord)) {
    updateData = onAddLargeModel(data, values);
  } else {
    // 编辑
    updateData = onEditLargeModalData(editRecord, values, cloneStepFirstTableData, data);
  }

  // 已存在，不允许再次添加
  if (_.isEmpty(updateData)) {
    return { errorExitName: values?.sub_type };
  }

  const filterData = _.filter(
    _.cloneDeep(cloneStepFirstTableData),
    (item: any) => item?.sub_type !== (editRecord ? editRecord?.sub_type : values?.sub_type)
  );
  data.props.data_all_source = [...filterData, ...[updateData]];
  return data;
};

/**
 * model_conf去除多余数据(resource_type和sub_type)
 */
const onFilterModelConf = (values: any) => {
  let result: any = {};
  _.map(_.cloneDeep(values), (item: any, index: any) => {
    if (!_.includes(['resource_type', 'sub_type'], index)) {
      result = { ...result, [index]: item };
    }
  });
  return result;
};

/**
 * 表格已有大模型数据
 */
export const onTableExitLargeData = (data: any) => {
  return _.filter(_.cloneDeep(data?.props?.data_all_source), (item: any) =>
    ['private_llm', 'openai'].includes(item?.sub_type)
  );
};

/**
 * 大模型添加数据处理
 */
const onAddLargeModel = (data: any, values: any) => {
  const userInfo = localStore.get('userInfo');
  const time = new Date().getTime();
  let result: any = {};
  if (onTableExitLargeData(data)?.[0]?.sub_type === values?.sub_type) {
    result = {};
  } else {
    const addTable = {
      kg_id: '',
      resource_type: 'model',
      sub_type: values?.sub_type,
      model_conf: onFilterModelConf(values),
      model_name: MODEL_TYPE[values?.sub_type],
      creator: userInfo?.id,
      create_time: time,
      editor: userInfo?.id,
      edit_time: time,
      creater_email: userInfo?.email,
      editor_email: userInfo?.email,
      category: [],
      creater_name: userInfo?.username,
      editor_name: userInfo?.username
    };
    result = addTable;
  }
  return result;
};

/**
 * 大模型编辑数据处理
 */
const onEditLargeModalData = (editRecord: any, values: any, cloneStepFirstTableData: any, data: any) => {
  let result: any = {};
  const time = new Date().getTime();
  // 在原有模型的基础上更改
  if (!_.isEmpty(editRecord) && editRecord?.sub_type === values?.sub_type) {
    _.map(_.cloneDeep(cloneStepFirstTableData), (item: any) => {
      if (item?.sub_type === editRecord?.sub_type) {
        item.model_conf = onFilterModelConf(values);
        item.edit_time = time;
        result = item;
      }
    });
  }

  // 改模型
  if (!_.isEmpty(editRecord) && editRecord?.sub_type !== values?.sub_type) {
    if (onTableExitLargeData(data)?.length === 1) {
      result = {
        ...onTableExitLargeData(data)?.[0],
        model_conf: onFilterModelConf(values),
        edit_time: time,
        sub_type: values?.sub_type,
        model_name: MODEL_TYPE[values?.sub_type]
      };
    }
  }

  return result;
};

/**
 * 编辑图谱描述
 */
export const onEditGraph = (values: any, testData: any) => {
  const dataAllSource = testData?.props?.data_all_source;
  const filterAllData = onUpdateGraph(dataAllSource, values);

  const dataSource = testData?.props?.data_source_scope;
  const filterData = onUpdateGraph(dataSource, values);

  // 分类中的随之资源更新
  const classifyUpdate = updateClassify(testData, values);

  testData.props.data_all_source = filterAllData;
  testData.props.data_source_scope = filterData;
  testData.props.full_text.search_config = classifyUpdate;
  return testData;
};

/**
 * 更新资源
 */
const onUpdateGraph = (dataSource: any, values: any) => {
  const { des, name } = values;
  const time = new Date().getTime();
  const userInfo = localStore.get('userInfo');
  const filterData = _.map(dataSource, (item: any) => {
    if (name === item.kg_name) {
      item.edit_time = time;
      item.description = des;
      item.editor = userInfo?.id;
      return item;
    }
    return item;
  });
  return filterData;
};

/**
 * 更新分类
 */
const updateClassify = (testData: any, values: any) => {
  const fullText = testData?.props?.full_text?.search_config;
  const time = new Date().getTime();
  const userInfo = localStore.get('userInfo');
  // 分类中的随之资源更新
  const result = _.map(fullText, (item: any) => {
    _.map(item?.kgs, (i: any) => {
      if (i?.kg_name === values?.name) {
        i.edit_time = time;
        i.description = values?.des;
        item.editor = userInfo?.id;
        return i;
      }
      return i;
    });
    return item;
  });
  return result;
};

/**
 * 获取资源列表
 */
export const getGraphListTable = async (data: any, state: any) => {
  // export const getGraphListTable = async (data: any, state: any, model: any) => {
  const { page, order, rule, name, type } = state;
  const allData: any = _.concat(data?.props?.data_all_source);
  // const allData: any = _.concat(data?.props?.data_source_scope, model);
  let pageData: any = _.filter(allData, item => !!item);
  // 表格没有数据
  if (!pageData || _.isElement(pageData)) {
    return {
      res: {
        count: 0,
        df: []
      }
    };
  }
  /**
   * 资源类别搜索
   */
  if (['kg', 'model', 'private'].includes(type)) {
    pageData = _.filter(pageData, (item: any) => {
      if (type === 'private') {
        return ['openai', 'private_llm'].includes(item?.sub_type);
      }
      if (type === 'model') {
        return item.resource_type === type && !['openai', 'private_llm'].includes(item?.sub_type);
      }
      return item.resource_type === type;
    });
  }

  /**
   * 名称搜索
   */
  if (name) {
    pageData = _.filter(pageData, (item: any) => fuzzyMatch(name, item.kg_name || item?.model_name));
  }

  /**
   * 排序 名称|创建时间|最后编辑时间
   */
  if (order === 'descend') {
    // 降序
    pageData?.sort((a: any, b: any) => {
      const aName = a?.kg_name || a?.model_name;
      const bName = b?.kg_name || b?.model_name;

      return (rule === 'create_time' ? a.create_time : rule === 'edit_time' ? a.edit_time : aName) <
        (rule === 'create_time' ? b.create_time : rule === 'edit_time' ? b.edit_time : bName)
        ? 1
        : -1;
    });
  }
  // 升序
  if (order === 'ascend') {
    pageData?.sort((a: any, b: any) => {
      const aName = a?.kg_name || a?.model_name;
      const bName = b?.kg_name || b?.model_name;

      return (rule === 'create_time' ? a.create_time : rule === 'edit_time' ? a.edit_time : aName) >
        (rule === 'create_time' ? b.create_time : rule === 'edit_time' ? b.edit_time : bName)
        ? 1
        : -1;
    });
  }

  // 分页数据
  const dataCount = _.cloneDeep(pageData);
  pageData = pageData?.slice((page - 1) * 10, page * 10 > dataCount.length ? dataCount.length : page * 10);

  return {
    res: {
      count: dataCount?.length,
      df: pageData
    }
  };
};

/**
 * 删除
 */
export const deleteGraphList = async (data: any, record: any, type: string) => {
  let result: any = {};
  if (type === 'single') {
    result = onSingleDelete(data.props.data_all_source, record, data);
  } else {
    result = onBatchDelete(data.props.data_all_source, record, data);
  }
  return result;
};

/**
 * 单个删除
 */
const onSingleDelete = (allData: any, record: any, data: any) => {
  const fullText = data?.props?.full_text?.search_config;
  const newTable = _.filter(_.cloneDeep(allData), (item: any) => {
    if (item?.resource_type === 'kg') {
      return item.kg_id !== record?.kg_id;
    }
    return item?.model_name !== record?.model_name;
  });
  const newFull = _.map(fullText, (item: any) => {
    item.kgs = _.filter(item?.kgs, (i: any) => i?.kg_id !== record?.kg_id);
    return item;
  });
  data.props.data_all_source = newTable;
  data.props.data_source_scope = _.filter(_.cloneDeep(newTable), (item: any) => item?.kg_id);
  data.props.full_text.search_config = newFull;
  return {
    res: {
      res: 'ok',
      df: data
    }
  };
};

/**
 * 批量删除
 */
const onBatchDelete = (allData: any, record: any, data: any) => {
  const fullText = data?.props?.full_text?.search_config;
  const newTable = _.filter(allData, (item: any) => {
    if (item?.resource_type === 'kg') {
      return !record.includes(String(item.kg_id));
    }
    return !record.includes(item?.model_name);
  });

  const newFull = _.map(fullText, (item: any) => {
    item.kgs = _.filter(item?.kgs, (i: any) => !record.includes(String(i.kg_id)));
    return item;
  });
  data.props.data_all_source = newTable;
  data.props.data_source_scope = _.filter(_.cloneDeep(newTable), (item: any) => item?.kg_id);
  data.props.full_text.search_config = newFull;
  return {
    res: {
      res: 'ok',
      df: data
    }
  };
};
