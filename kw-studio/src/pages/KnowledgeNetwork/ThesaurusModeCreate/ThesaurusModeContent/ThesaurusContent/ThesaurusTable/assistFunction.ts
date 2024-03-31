import _ from 'lodash';
import { localStore, fuzzyMatch } from '@/utils/handleFunction';

/**
 * 删除
 */
export const onDeleteTableData = (record: any, cloneTableData: any) => {
  const { id, thesaurusSpan, prop, name } = record;
  const filterData = _.filter(cloneTableData, (item: any) => item?.name === name && id !== item?.id);

  // 每次删除后都更新知识图谱名称和实体类名的rowSpan值
  _.map(filterData, (item: any, index: any) => {
    // _.map(_.cloneDeep(cloneTableData), (item: any, index: any) => {
    item.props = _.filter(item?.props, (n: any) => n !== prop);
    // 删除列表中rowSpan值不为0，则下一个数据变为第一个并更新rowSpan值，其余不变
    if (thesaurusSpan && !item?.graphNameSpan && index === 0) {
      item.thesaurusSpan = item?.props?.length;
    } else if (!thesaurusSpan && item?.thesaurusSpan) {
      item.thesaurusSpan = item?.props?.length;
    }
  });
  const reduceData = onReduceGraphProps(cloneTableData);
  const result = onGetList(reduceData, filterData, name);
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
    pageData = _.filter(pageData, (item: any) => graph === item.thesaurus_id);
  }

  /**
   * 名称搜索
   */
  if (query) {
    pageData = _.filter(pageData, (item: any) => fuzzyMatch(query, item.prop));
  }

  // 分页数据
  const dataCount = _.cloneDeep(pageData);
  const reduceData = onHandleReduce(pageData);
  const result = onHandleTableFormat(reduceData, pageData);
  return {
    res: {
      count: dataCount?.length,
      df: result
    }
  };
};

/**
 * 按照{词库名：{属性数据集合}}格式处理
 * 同时去除多余的属性名
 */
const onHandleReduce = (pageData: any) => {
  const reduceData = _.reduce(
    _.cloneDeep(pageData),
    (pre: any, key: any) => {
      pre[key.name] = [];
      return pre;
    },
    {}
  );
  const cloneData = _.cloneDeep(reduceData);
  _.map(_.cloneDeep(pageData), (pre: any, key: any) => {
    reduceData[pre.name] = [...(reduceData[pre.name] || []), pre];
  });

  // 更新props
  _.map(reduceData, (item: any) => {
    _.map(item, (i: any, index: any) => {
      i.props = cloneData[i.name];
    });
  });
  return reduceData;
};

/**
 * 表格数据处理，设置thesaurusSpan的值
 */
export const onHandleTableFormat = (selectAndTableData: any, values: any) => {
  const allData: any = [];
  const allName = Object.keys(selectAndTableData);

  // 各词库下的所有属性数量集合{词库1：1，词库2：2}
  const reduceGraphToEntity = _.reduce(
    _.cloneDeep(values),
    (pre: any, key: any) => {
      pre[key.name] = (pre[key.name] || 0) + 1;
      return pre;
    },
    {}
  );

  // 同一词库下，只有第一个thesaurusSpan值不为0
  _.map(_.cloneDeep(selectAndTableData), (item: any) => {
    _.map(item, (n: any, index: any) => {
      if (index === 0) {
        allData.push({
          ...n,
          thesaurusSpan: reduceGraphToEntity[n?.name]
        });
      } else {
        allData.push({
          ...n,
          thesaurusSpan: 0
        });
      }
    });
  });
  return allData;
};
