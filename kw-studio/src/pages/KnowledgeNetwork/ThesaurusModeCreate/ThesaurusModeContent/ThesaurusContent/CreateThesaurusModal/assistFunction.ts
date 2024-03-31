import _ from 'lodash';

/**
 * 选择的数据格式处理
 */
export const onDefaultData = (checkedList: any, thesaurusName: any, selectedThesaurusId: any, filterName: any) => {
  const defaultConfig = {
    name: thesaurusName,
    thesaurus_id: selectedThesaurusId,
    thesaurusSpan: 0,
    prop: '',
    props: checkedList,
    separator: '',
    errorTip: ''
  };

  // 设置初始值
  const reduceData = _.reduce(
    filterName,
    (pre: any, key: any) => {
      pre[key] = {
        ...defaultConfig,
        prop: key
      };
      return pre;
    },
    {}
  );

  return reduceData;
};

/**
 * 表格与选择的数据处理
 */
export const onSelectAndTableFormat = (
  reduceData: any,
  checkedList: any,
  thesaurusTableData: any,
  selectedThesaurusId: any,
  thesaurusName: any
) => {
  const allTableData = _.cloneDeep(thesaurusTableData);
  const filterData = _.filter(_.cloneDeep(allTableData), (item: any) => item?.thesaurus_id === selectedThesaurusId);
  // 根据已选的数据和表格中已有的数据，更新列名总数
  const handleTableData = _.map(filterData, (item: any) => {
    if (item?.thesaurus_id === selectedThesaurusId) {
      item.props = checkedList;
      return item;
    }
    return item;
  });

  return onTableAndSelect(handleTableData, reduceData, checkedList, selectedThesaurusId, allTableData, thesaurusName);
};

/**
 * 数据合并
 * @param selectAndTableData
 * @returns
 */
const onTableAndSelect = (
  handleTableData: any,
  reduceData: any,
  checkedList: any,
  selectedThesaurusId: any,
  allTableData: any,
  thesaurusName: any
) => {
  // 实体类名集合
  const filterTableName = _.map(_.cloneDeep(handleTableData), (item: any) => item?.name);

  // 实体类名集合
  const allName = [...new Set([thesaurusName, ...filterTableName])];
  // 表格已有
  const allGraphName = _.reduce(
    [thesaurusName],
    (pre: any, key: any) => {
      pre[key] = [];
      return pre;
    },
    {}
  );
  // 1.表格同一词库下的放到一起
  _.map(handleTableData, (item: any) => {
    if (allName.includes(item?.name)) {
      allGraphName[item?.name] = [...allGraphName[item?.name], item];
    }
  });

  // 2.最后将两者的数据和到一起，新选择的实体类的数据在后
  _.map(_.cloneDeep(Object.values(reduceData)), (item: any) => {
    if (allName.includes(item?.name)) {
      // allGraphName[item?.name] = [item, ...allGraphName[item?.name]];
      allGraphName[item?.name] = [...allGraphName[item?.name], item];
    }
  });

  return onHandleReduce(allGraphName, selectedThesaurusId, allTableData);
};

/**
 * 按照{图谱:{实体类集合:{属性集合}}格式整理
 * 并且当前图谱下的数据放在所有数据的最前面
 */
const onHandleReduce = (allGraphName: any, selectedThesaurusId: any, allTableData: any) => {
  const noEqualTable = _.filter(_.cloneDeep(allTableData), (item: any) => item?.thesaurus_id !== selectedThesaurusId);
  // 二维数组变为一维数组
  const reduceProp = _.reduce(
    Object.values(allGraphName),
    (pre: any, key: any) => {
      return pre.concat(key);
    },
    []
  );
  // 所有数据汇总，当前图谱的数据放在最前面
  const values = [...reduceProp, ...noEqualTable] || [];
  const reduceValues = _.reduce(
    _.cloneDeep(values),
    (pre: any, key: any) => {
      // pre[key.name] = [...(reduceValues[key.name] || []), key];
      pre[key.name] = [];
      return pre;
    },
    {}
  );
  _.map(_.cloneDeep(values), (item: any) => {
    if (reduceValues[item?.name]) {
      reduceValues[item?.name] = [...(reduceValues?.[item?.name] || []), item];
    }
  });
  return { reduceValues, values };
};

/**
 * 表格数据处理，设置thesaurusSpan的值
 */
export const onHandleTableFormat = (selectAndTableData: any, values: any) => {
  const result: any = [];

  // 同一图谱的同一实体类下，只有第一个entitySpan值不为0
  _.map(_.cloneDeep(selectAndTableData), (item: any) => {
    _.map(item, (i: any, index: any) => {
      if (index === 0) {
        result.push({
          ...i,
          thesaurusSpan: i?.props?.length
        });
      } else {
        result.push({
          ...i,
          thesaurusSpan: 0
        });
      }
    });
  });
  return result;
};
