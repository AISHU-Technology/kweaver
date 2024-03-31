import _ from 'lodash';
import { fuzzyMatch } from '@/utils/handleFunction';

/**
 *
 * @param data
 * @param authDAta 有权限的图谱id
 * @returns
 */
export const onHandleTree = (data: any, authDAta: any) => {
  const { checked, data: kg_kds } = authDAta;

  const error = checked ? !_.every(data.kgs, kg => _.includes(kg_kds, String(kg?.kg_id))) : false;

  return {
    key: data?.class_name,
    id: data?.class_id,
    title: data?.class_name,
    name: data?.class_name,
    checkable: false,
    value: data?.class_name,
    isLeaf: false,
    isAuthError: error
  };
};

/**
 * 添加分类
 */
export const addList = (testData: any, values: any) => {
  const { resource, classify } = values;
  const tableClassifyData = _.cloneDeep(testData?.props?.data_source_scope);
  const fullTextData = _.cloneDeep(testData?.props?.full_text?.search_config);
  const allLength = _.map(fullTextData, (item: any) => parseInt(item?.class_id));
  // 检查名称是否重复
  let isRepeat = false;
  _.map(testData?.props?.full_text?.search_config, (item: any) => {
    if (item.class_name === values?.classify) {
      isRepeat = true;
    }
  });
  if (isRepeat) {
    return 'repeat';
  }

  // 为分类添加资源同时更新category
  const addData = _.filter(tableClassifyData, (item: any) => {
    if (resource?.includes(item.kg_name)) {
      item.category = [...new Set([...item.category, ...[String(classify)]])];
      item.id = `${Math.max.apply(0, allLength) + 1}_${item.kg_id}`;
      return item;
    }
  });

  // 全文检索{class_name:'分类名',kgs:[资源信息]}格式更新
  const selectFullData = [
    { class_name: classify, kgs: addData, class_id: Math.max.apply(0, allLength) + 1 },
    ...fullTextData
  ];

  // 全部资源category更新
  const sourceToClassify = _.map(tableClassifyData, (item: any) => {
    if (resource.includes(item?.kg_name)) {
      item.category = [...new Set([...item.category, ...[String(classify)]])];
      return item;
    }
    return item;
  });

  testData.props.data_source_scope = sourceToClassify;
  testData.props.full_text.search_config = selectFullData;
  return testData;
};

/**
 * 编辑分类
 */
export const onUpdateData = (testData: any, values: any, setSourceName: string, sourceId: any) => {
  // 检查名称是否重复
  let isRepeat = false;
  _.map(testData?.props?.full_text?.search_config, (item: any) => {
    if (item.class_name === values?.classify && values?.id !== item?.class_id) {
      isRepeat = true;
    }
  });
  if (isRepeat) {
    return 'repeat';
  }
  const allData = _.cloneDeep(testData);
  const { resource } = values;
  const tableClassifyData = allData?.props?.data_source_scope;
  const fullTextData = allData?.props?.full_text?.search_config;

  // 选出被选择的图谱 更新category
  const selectedGraph = _.filter(tableClassifyData, (item: any) => {
    if (resource.includes(item.kg_name)) {
      item.category = [..._.filter(item?.category, (i: any) => i !== setSourceName), ...[values?.classify]];
      return item;
    }
  });

  // 全文检索更新
  const updateFull = _.map(fullTextData, (item: any) => {
    if (item?.class_id === sourceId) {
      item.class_name = values?.classify;
      item.kgs = selectedGraph;
      return item;
    }
    return item;
  });

  // 全部资源这一分类也要更新
  const allResource = _.map(updateFull, (item: any) => {
    if (item?.class_name === '全部资源') {
      _.map(item?.kgs, (i: any) => {
        _.map(selectedGraph, (s: any) => {
          if (s?.kg_id === i?.kg_id) {
            i.category = s.category;
            return s;
          }
          return s;
        });
        return i;
      });
      return item;
    }
    return item;
  });

  const newAllData = [
    ...selectedGraph,
    ..._.filter(tableClassifyData, (item: any) => !resource.includes(item.kg_name))
  ];

  allData.props.data_source_scope = newAllData;
  allData.props.full_text.search_config = allResource;

  return allData;
};

/**
 * 删除分类(资源的所属分类也要相应去除)
 * @param node 删除分类的树信息
 */
export const onDeleteClassify = (testData: any, node: any) => {
  const classifyData = testData?.props?.data_source_scope;
  const fullTextData = testData?.props?.full_text?.search_config;
  const name = node?.name;
  // 流程二表格中除去被删除的分类
  const filterDelete = _.filter(fullTextData, (item: any) => item?.class_name !== name);

  // 全文检索
  const filterFull = _.filter(filterDelete, (item: any) => {
    _.map(item?.kgs, (i: any) => {
      if (i.category.includes(name)) {
        i.category = _.filter(i.category, (t: any) => t !== name);
        return i;
      }
      return i;
    });
    return item;
  });

  // 全部资源中也删除
  const updateAll = _.map(classifyData, (item: any) => {
    if (item?.category.includes(name)) {
      item.category = _.filter(item.category, (t: any) => t !== name);
      return item;
    }
    return item;
  });

  testData.props.data_source_scope = updateAll;
  testData.props.full_text.search_config = filterFull;
  return testData;
};

/**
 * 流程二列表返回数据 模拟
 */
export const getList = async (tableAllData: any, selectMes: any, data?: any) => {
  const { page, order, rule, name, type } = data;

  let pageData: any = [];
  const fullText = tableAllData?.props?.full_text?.search_config;

  // 全部资源时数据处理
  if (!selectMes) {
    pageData = tableAllData?.props?.data_source_scope;
  } else {
    const sourceGraphAll = _.filter(fullText, (item: any) => item?.class_name === selectMes);
    const newData = _.map(sourceGraphAll, (item: any) => {
      return item.kgs;
    });
    pageData = _.concat([], newData)[0];
  }

  /**
   * 资源类别搜索 目前只有一个 没做类别搜索 后续有别的资源补上
   */
  if (type === '1') {
    pageData = _.filter(pageData, (item: any) => item.source === '知识图谱');
  }

  /**
   * 名称搜索
   */
  if (name) {
    pageData = _.filter(pageData, (item: any) => fuzzyMatch(name, item.kg_name));
  }

  /**
   * 排序 名称|创建时间|最后编辑时间
   */
  if (order === 'descend') {
    // 降序
    pageData?.sort((a: any, b: any) => {
      return (rule === 'create_time' ? a.create_time : rule === 'edit_time' ? a.edit_time : a.kg_name) <
        (rule === 'create_time' ? b.create_time : rule === 'edit_time' ? b.edit_time : b.kg_name)
        ? 1
        : -1;
    });
  }
  // 升序
  if (order === 'ascend') {
    pageData?.sort((a: any, b: any) => {
      return (rule === 'create_time' ? a.create_time : rule === 'edit_time' ? a.edit_time : a.kg_name) >
        (rule === 'create_time' ? b.create_time : rule === 'edit_time' ? b.edit_time : b.kg_name)
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
 * 移动至分类
 * @param values 选择的分类
 * @param selectedRows 所有选择的图谱，行元素
 * @param selectedGraph 所有选择的图谱名称
 */
export const classifyConfig = (testData: any, values: any, selectedRows: any, selectedGraph: any) => {
  const { source } = values;
  const dataScope = testData?.props?.data_source_scope;
  const fullTextData = _.cloneDeep(testData?.props?.full_text?.search_config);

  // 给选择的分类下增加选择的图谱
  const allClassify = _.map(dataScope, (item: any) => {
    _.map(selectedRows, (s: any) => {
      // 之前已经存在的更新分类
      if (s.kg_name === item?.kg_name) {
        item.category = [...new Set([...item?.category, ...source])];
        return s;
      }
      return s;
    });
    return item;
  });

  const kgIds = _.map(testData?.props?.full_text?.search_config, (item: any) => {
    const ids = _.map(item?.kgs, (i: any) => {
      return i?.kg_id;
    });
    return { class_name: item?.class_name, ids };
  });
  const idsArr = _.keyBy(kgIds, 'class_name');

  const fullUpdate = _.map(fullTextData, (item: any) => {
    _.map(allClassify, (i: any) => {
      _.map(item?.kgs, (s: any) => {
        // 已存在的资源更新所属分类
        if (s?.kg_name === i?.kg_name) {
          s.category = i.category;
          return s;
        }
        if (i.category.includes(item?.class_name) && !_.includes(idsArr[item?.class_name]?.ids, i?.kg_id)) {
          item.kgs = [...new Set([...[i], ...item?.kgs])];
        }
        return s;
      });
      return i;
    });
    return item;
  });

  testData.props.full_text.search_config = fullUpdate;
  testData.props.data_source_scope = allClassify;
  return testData;
};

/**
 * 分类配置
 * @param selectedNames 选择的所有分类名称
 * @param graphName 选择的图谱信息
 */
export const onClassifyConfig = (testData: any, selectedNames: any, configRecord: any) => {
  const graphName = configRecord?.kg_name;
  const data = testData?.props?.data_source_scope;
  const fullTextData = _.cloneDeep(testData?.props?.full_text?.search_config);

  // 全部资源的图谱category更新
  const handleAllSource = _.map(data, (item: any) => {
    if (graphName === item?.kg_name) {
      item.category = [...new Set([...item.category, ...selectedNames])];
      return item;
    }
    return item;
  });

  const kgIds = _.map(testData?.props?.full_text?.search_config, (item: any) => {
    const ids = _.map(item?.kgs, (i: any) => {
      return i?.kg_id;
    });
    return { class_name: item?.class_name, ids };
  });
  const idsArr = _.keyBy(kgIds, 'class_name');

  const fullUpdate = _.map(fullTextData, (item: any) => {
    _.map(handleAllSource, (i: any) => {
      _.map(item?.kgs, (s: any) => {
        if (s.kg_name === i?.kg_name) {
          s.category = i?.category;
          return s;
        }
        if (i.category.includes(item?.class_name) && !_.includes(idsArr[item?.class_name]?.ids, i?.kg_id)) {
          item.kgs = [...new Set([...[i], ...item.kgs])];
        }
        return s;
      });
      return i;
    });
    return item;
  });

  testData.props.data_source_scope = handleAllSource;
  testData.props.full_text.search_config = fullUpdate;
  return testData;
};
