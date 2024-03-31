import _ from 'lodash';
import { fuzzyMatch, getParam } from '@/utils/handleFunction';
import THESAURUS_TEXT from '@/enums/thesaurus_mode';

/**
 * 删除
 */
export const onDeleteTableData = (record: any, cloneTableData: any) => {
  const { id, graphNameSpan, prop, name, disable, entity_name, entitySpan } = record;

  // 没被删除的表格数据
  const filterData = _.filter(cloneTableData, (item: any) => item?.name === name && id !== item?.id);
  const currentLexicon: any = [];

  const { mode } = getParam(['mode']);
  // 更新知识图谱名称和实体类名的graphSpan和entitySpan值
  const updateData = _.map(filterData, (item: any, index: any) => {
    if (entity_name === item?.entity_name) {
      item.columns = _.filter(item?.columns, (i: any) => i !== prop);
      item.props = _.filter(item?.props, (n: any) => n !== prop);
      // 删除列表中rowSpan值不为0，则下一个数据变为第一个并更新rowSpan值，其余不变
      // if (graphNameSpan && !item?.graphNameSpan && index === 0 ) {
      if (graphNameSpan && !item?.graphNameSpan && index === 0) {
        item.graphNameSpan = item?.columns?.length;
        item.entitySpan = item?.props?.length;
        if (mode === 'std') {
          item.disable.lexicon = item.disable.lexicon === prop ? item.prop : disable?.lexicon;
          currentLexicon.push(item.disable.lexicon);
        }
      } else {
        item.entitySpan = item?.props?.length;
        if (mode === 'std') {
          if (item.disable.lexicon === prop) {
            currentLexicon.push(item?.prop);
          } else {
            currentLexicon.push(item?.disable.lexicon);
          }
        }
      }
      return item;
    }
    return item;
  });

  if (mode === 'std') {
    _.map(updateData, (item: any) => {
      if (entity_name === item?.entity_name) {
        item.disable.lexicon = currentLexicon[0];
      }
    });
  }

  const reduceData = onReduceGraphProps(cloneTableData);
  const result = onGetList(reduceData, updateData, name);
  return result;
};

/**
 * 数据根据{图谱：[属性集合]}分类
 */
const onReduceGraphProps = (cloneTableData: any) => {
  const cloneData = _.cloneDeep(cloneTableData);
  const reduceData = _.reduce(
    cloneData,
    (pre: any, key: any) => {
      pre[key.name] = [...(pre[key.name] || []), key];
      return pre;
    },
    {}
  );
  return reduceData;
};

/**
 * 数据{图谱：[属性集合]}格式改回列表形式
 */
const onGetList = (reduceData: any, filterData: any, name: any) => {
  reduceData[name] = filterData;
  const values = _.reduce(
    Object.values(reduceData),
    (pre: any, key: any) => {
      return pre.concat(key);
    },
    []
  );
  const result = _.map(values, (item: any, index: any) => {
    item.id = index;
    return item;
  });
  return result;
};

/**
 * 获取列表 (翻页 | 搜索 | 刷新)
 */
export const onGetListTable = (state: any, data: any) => {
  const { page, graph, query } = state;
  let pageData: any = data;
  // 表格没有数据
  if (_.isEmpty(pageData)) {
    return {
      res: {
        count: 0,
        df: []
      }
    };
  }
  /**
   * 资源类别搜索 目前只有一个 没做类别搜索 后续有别的资源补上
   */
  if (graph !== '-1') {
    pageData = _.filter(pageData, (item: any) => graph === item.graph_id);
  }

  /**
   * 名称搜索
   */
  if (query) {
    pageData = _.filter(pageData, (item: any) => fuzzyMatch(query, item.entity_name));
  }

  // 分页数据
  const dataCount = _.cloneDeep(pageData);
  const reduceData = onHandleReduce(dataCount);
  const result = onHandleTableFormat(reduceData, pageData);
  return {
    res: {
      count: dataCount?.length,
      df: result
    }
  };
};

/**
 * 按照{图谱名：{实体类名：{属性数据集合}}}格式处理
 * 同时去除多余的属性名
 */
const onHandleReduce = (pageData: any) => {
  const reduceData = _.reduce(
    _.cloneDeep(pageData),
    (pre: any, key: any) => {
      pre[key.name] = {};
      return pre;
    },
    {}
  );
  const cloneData = _.cloneDeep(reduceData);
  _.map(_.cloneDeep(pageData), (pre: any, key: any) => {
    reduceData[pre.name][pre.entity_name] = [...(reduceData[pre.name][pre.entity_name] || []), pre];
  });

  // 各个实体类下的属性总数
  _.map(_.cloneDeep(pageData), (item: any) => {
    cloneData[item.name][item.entity_name] = [...(cloneData[item.name][item.entity_name] || []), item.prop];
  });

  // 更新reduceData的columns
  _.map(reduceData, (item: any) => {
    _.map(item, (i: any) => {
      _.map(i, (n: any, index: any) => {
        n.props = cloneData[n.name][n.entity_name];
        n.columns = cloneData[n.name][n.entity_name];
      });
    });
  });

  return reduceData;
};

/**
 * 表格数据处理，设置rowSpan的值
 */
export const onHandleTableFormat = (selectAndTableData: any, values: any) => {
  const allData: any = [];
  const allName = Object.keys(selectAndTableData);

  // 各图谱下的所有属性数量集合{图谱名1：1，图谱名2：2}
  const reduceGraphToEntity = _.reduce(
    _.cloneDeep(values),
    (pre: any, key: any) => {
      pre[key.name] = (pre[key.name] || 0) + 1;
      return pre;
    },
    {}
  );

  // 同一图谱的同一实体类下，只有第一个entitySpan值不为0
  _.map(_.cloneDeep(selectAndTableData), (item: any) => {
    _.map(item, (i: any) => {
      _.map(i, (n: any, index: any) => {
        if (index === 0) {
          allData.push({
            ...n,
            entitySpan: n?.columns?.length
          });
        } else {
          allData.push({
            ...n,
            entitySpan: 0
          });
        }
      });
    });
  });

  // 图谱下所有属性集合 {图谱名:[同一图谱下的数据集合]}
  const allGraphToProp = _.reduce(
    _.cloneDeep(allData),
    (pre: any, key: any) => {
      pre[key.name] = [...(pre[key.name] || []), key];
      return pre;
    },
    {}
  );

  // 同一图谱的下，只有第一个graphNameSpan值不为0
  const result: any = [];
  _.map(allName, (item: any) => {
    _.map(allGraphToProp[item], (i: any, index: any) => {
      if (index === 0) {
        result.push({
          ...i,
          graphNameSpan: reduceGraphToEntity[i?.name]
        });
      } else {
        result.push({
          ...i,
          graphNameSpan: 0
        });
      }
    });
  });
  return result;
};
