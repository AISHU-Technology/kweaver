import _ from 'lodash';

/**
 * 默认初始值设置
 */
export const onDefaultData = (configEntity: any, graphName: any, sourceName: any, mode: any, checkedTreeKeys: any) => {
  const graphAllName = _.map(configEntity, (item: any) => item?.name);
  const defaultConfig = {
    prop: '',
    props: [],
    name: graphName,
    separator: '',
    graph_id: sourceName,
    entity_name: '',
    entitySpan: 0,
    disable: {},
    errorTip: ''
  };
  // mode为近义词时不包含标准词
  // 设置初始值
  const reduceData = _.reduce(
    graphAllName,
    (pre: any, key: any) => {
      if (mode !== 'std') {
        pre[key] = {
          ...defaultConfig,
          columns: [],
          entity_name: key,
          disable: { name: graphName, entity_name: key }
        };
      } else {
        pre[key] = {
          ...defaultConfig,
          columns: [],
          entity_name: key,
          disable: { name: graphName, entity_name: key, lexicon: '' }
        };
      }
      return pre;
    },
    {}
  );

  const cloneData = _.cloneDeep(checkedTreeKeys);
  // 将近义词属性和标准词填充进去
  _.map(cloneData, (item: any) => {
    if (graphAllName.includes(item?.split('|')?.[1])) {
      // reduceData[item?.split('|')?.[1]].props = [...reduceData[item?.split('|')?.[1]].props, item?.split('|')?.[0]];
      reduceData[item?.split('|')?.[1]].props = [item?.split('|')?.[0], ...reduceData[item?.split('|')?.[1]].props];
      reduceData[item?.split('|')?.[1]].columns = [...reduceData[item?.split('|')?.[1]].columns, item?.split('|')?.[0]];
      if (mode === 'std') {
        reduceData[item?.split('|')?.[1]].disable.lexicon = reduceData[item?.split('|')?.[1]].columns?.[0];
        // reduceData[item?.split('|')?.[1]].disable.lexicon = reduceData[item?.split('|')?.[1]].props?.[0];
      }
    }
  });
  return reduceData;
};

/**
 * 表格与选择的数据处理
 */
export const onSelectAndTableFormat = (
  reduceData: any,
  checkedTreeKeys: any, // 勾选的key值
  tableData: any, // 表格的数据
  mode: any, // 选择的模板的类型
  sourceName: any // 图谱id
) => {
  const allTableData = _.cloneDeep(tableData);
  const filterTable = _.filter(_.cloneDeep(allTableData), (item: any) => item?.graph_id === sourceName);
  // 根据已选的数据和表格中已有的数据，更新标准词(lexicon)和各实体类下的属性总数
  const handleTableData = _.map(filterTable, (item: any) => {
    if (reduceData[item?.entity_name]) {
      reduceData[item?.entity_name].props = [...new Set([...item?.props, ...reduceData?.[item?.entity_name]?.props])];
      // reduceData[item?.entity_name].props = [...reduceData?.[item?.entity_name]?.props, ...item?.props];
      item.props = reduceData?.[item?.entity_name]?.props;
      reduceData[item?.entity_name].columns = [...new Set([...item.columns, ...reduceData[item?.entity_name].columns])];
      // reduceData[item?.entity_name].columns = [...reduceData[item?.entity_name].columns, ...item.columns];
      item.columns = reduceData[item?.entity_name].columns;
      if (mode === 'std') {
        reduceData[item?.entity_name].disable.lexicon = item?.disable?.lexicon;
      }
      return item;
    }
    return item;
  });

  return onTableAndSelect(handleTableData, reduceData, checkedTreeKeys, sourceName, allTableData);
};

/**
 * 表格数据和选择的数据合并到一起
 * 先将同一图谱下的表格数据按照实体类进行分组，放到一起
 * 再将选择的数据根据属性转变成表格需要的数据
 * 最后将两者的数据和到一起，新选择的实体类的数据在前，表格原先的数据在后
 * @param selectAndTableData
 * @returns
 */
const onTableAndSelect = (
  handleTableData: any,
  reduceData: any,
  checkedTreeKeys: any,
  sourceName: any,
  allTableData: any
) => {
  const filterSelect = _.filter(_.cloneDeep(reduceData), (item: any) => !_.isEmpty(item.props));
  const filterName = _.map(filterSelect, (item: any) => item?.entity_name);
  const filterTableName = _.map(handleTableData, (item: any) => {
    return item?.entity_name;
  });

  // 实体类名集合
  const allName = [...new Set([...filterName, ...filterTableName])];
  // 表格已有
  const allGraphName = _.reduce(
    allName,
    (pre: any, key: any) => {
      pre[key] = [];
      return pre;
    },
    {}
  );
  // 1.表格数据按照实体类进行分组
  _.map(handleTableData, (item: any) => {
    if (allName.includes(item?.entity_name)) {
      // allGraphName[item?.entity_name] = [item, ...allGraphName[item?.entity_name]];
      allGraphName[item?.entity_name] = [...allGraphName[item?.entity_name], item];
    }
  })

  // 2.选择的数据根据属性转变成表格需要的数据
  let filterChecked: any = [];
  _.map(_.cloneDeep(checkedTreeKeys), (n: any) => {
    if (n.includes('|')) {
      filterChecked = [...filterChecked, n];
      // filterChecked = [n, ...filterChecked];
    }
  });

  const handleProps = _.reduce(
    filterChecked,
    (pre: any, key: any) => {
      pre[key?.split('|')?.[1]] = [];
      return pre;
    },
    {}
  );

  _.map(filterChecked, (item: any, key: any) => {
    handleProps[item.split('|')[1]] = [...handleProps[item.split('|')[1]], item?.split('|')[0]];
    // handleProps[item.split('|')[1]] = [item?.split('|')[0], ...handleProps[item.split('|')[1]]];
  });

  // 所选属性单独成为一条表格数据
  const cloneFilterData = _.filter(_.cloneDeep(reduceData), (item: any) => !_.isEmpty(item?.props));
  let updatePropData: any = [];
  _.map(cloneFilterData, (item: any) => {
    if (handleProps[item.entity_name]) {
      _.map(item?.props, (i: any) => {
        if (handleProps[item.entity_name].includes(i)) {
          updatePropData = [{ ...item, prop: i }, ...updatePropData];
        }
      });
    }
  });

  // 3.合并，新选择的实体类的数据在前，表格原先的数据在后
  _.map(updatePropData, (item: any) => {
    if (allName.includes(item?.entity_name)) {
      allGraphName[item?.entity_name] = [...allGraphName[item?.entity_name], item];
      // allGraphName[item?.entity_name] = [item, ...allGraphName[item?.entity_name]];
    }
  });

  return onHandleReduce(allGraphName, sourceName, allTableData);
};

/**
 * 按照{图谱:{实体类集合:{属性集合}}格式整理
 * 并且当前图谱下的数据放在所有数据的最前面
 */
const onHandleReduce = (allGraphName: any, sourceName: any, allTableData: any) => {
  const noEqualTable = _.filter(_.cloneDeep(allTableData), (item: any) => item?.graph_id !== sourceName);
  // 二维数组变为一维数组
  const reduceProp = _.reduce(
    Object.values(allGraphName),
    (pre: any, key: any) => {
      return pre.concat(key);
    },
    []
  );
  // 所有数据汇总，当前图谱的数据放在最前面
  // const values = [...reduceProp, ...noEqualTable];
  const values = [...reduceProp, ...noEqualTable];
  const reduceValues = _.reduce(
    _.cloneDeep(values),
    (pre: any, key: any) => {
      pre[key.name] = {};
      return pre;
    },
    {}
  );
  _.map(_.cloneDeep(values), (item: any) => {
    reduceValues[item.name][item.entity_name] = [...(reduceValues[item.name][item.entity_name] || []), item];
    // reduceValues[item.name][item.entity_name] = [item, ...(reduceValues[item.name][item.entity_name] || [])];
  });
  return { reduceValues, values };
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
            entitySpan: n?.props?.length
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
      // pre[key.name] = [key, ...(pre[key.name] || [])];
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
