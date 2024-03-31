import { getParam } from '@/utils/handleFunction';
import THESAURUS_TEXT from '@/enums/thesaurus_mode';
import _ from 'lodash';

/**
 * 格式处理，表格数据转换成接口需要的参数形式
 */
export const onFormatTableData = (tableData: any, thesaurusTableData: any) => {
  const { mode } = getParam(['mode']);
  const graphResult = onHandleGraphData(tableData, mode);
  let result: any = {};
  result = {
    extract_info: {
      graph: graphResult
    }
  };
  let lexiconResult: any = [];
  // 选择模板为分词时才传lexicon参数
  if (mode === 'custom') {
    lexiconResult = onHandleLexicon(thesaurusTableData);
    result.extract_info.lexicon = lexiconResult;
  }

  return result;
};

/**
 * 处理图谱格式
 */
const onHandleGraphData = (data: any, mode: any) => {
  const cloneGraphData = _.cloneDeep(data);
  const reduceOtherData = _.reduce(
    cloneGraphData,
    (pre: any, key: any) => {
      pre[key.name] = { ...(pre[key.name] || {}), name: key.name, id: key.graph_id, entities: [] };
      return pre;
    },
    {}
  );

  // 模板为近义词(std)时，prop第一个值为标准词，对应separator第一个值为空
  let reduceGraphData: any = {};
  if (mode === 'std') {
    reduceGraphData = _.reduce(
      _.cloneDeep(data),
      (pre: any, key: any) => {
        pre[key.name] = { ...(pre[key.name] || {}) };
        pre[key.name][key.entity_name] = {
          name: key.entity_name,
          prop: key.columns,
          // prop: [key?.disable?.lexicon, ..._.filter(key.columns, (item: any) => item !== key?.disable?.lexicon)],
          // prop: [key?.disable?.lexicon, ..._.filter(key.props, (item: any) => item !== key?.disable?.lexicon)],
          separator: [
            ...(pre[key.name][key.entity_name]?.separator || []),
            key?.separator
            // ...(pre[key.name][key.entity_name]?.separator || ['']),
            // key?.prop !== key?.disable?.lexicon ? key.separator : null
          ],
          std_prop: key?.disable?.lexicon
          // 保存后解析标准词时使用std_prop
        };
        return pre;
      },
      {}
    );
    // _.filter(
    //   [
    //     ...pre[key.name][key.entity_name]?.separator,
    //     key?.separator
    //     // ...(pre[key.name][key.entity_name]?.separator || ['']),
    //     // key?.prop !== key?.disable?.lexicon ? key.separator : null
    //   ],
    //   (i: any) => i !== null
    // );
  } else {
    reduceGraphData = _.reduce(
      _.cloneDeep(data),
      (pre: any, key: any) => {
        pre[key.name] = { ...(pre[key.name] || {}) };
        pre[key.name][key.entity_name] = {
          name: key.entity_name,
          prop: key.columns,
          // prop: key.props,
          separator: [...(pre[key.name][key.entity_name]?.separator || []), key.separator]
        };
        return pre;
      },
      {}
    );
  }

  _.map(reduceGraphData, (item: any, index: any) => {
    reduceOtherData[index].entities = [...reduceOtherData[index].entities, ...[]?.concat([], Object.values(item))];
  });
  return Object.values(reduceOtherData);
};

/**
 * 处理分词格式
 */
const onHandleLexicon = (data: any) => {
  const cloneThesaurusData = _.cloneDeep(data);
  const reduceSeparators = _.reduce(
    _.cloneDeep(data),
    (pre: any, key: any) => {
      pre[key.name] = [...(pre[key.name] || []), key.separator];
      return pre;
    },
    {}
  );
  const reduceThesaurusData = _.reduce(
    cloneThesaurusData,
    (pre: any, key: any) => {
      pre[key.name] = {
        ...(pre[key.name] || {}),
        id: key.thesaurus_id,
        name: key.name,
        columns: key.props,
        separator: reduceSeparators[key.name]
      };
      return pre;
    },
    {}
  );
  return Object.values(reduceThesaurusData);
};

/**
 * 将词库信息转换成表格需要的格式
 */
export const onHandleInfoToTable = (data: any) => {
  let result: any = [];
  const { mode } = getParam(['mode']);
  if (mode === 'custom') {
    result = onThesaurusData(data.lexicon);
  }
  const values = onTableData(data.graph);
  return { values, result };
};

/**
 * 后端返回词库数据转化成表格所需格式
 */
const onThesaurusData = (data: any) => {
  const cloneDataReduce = _.cloneDeep(onReduce(data));

  _.map(_.cloneDeep(data), (item: any) => {
    _.map(item?.columns, (i: any, index: any) => {
      cloneDataReduce[item.name] = [
        ...(cloneDataReduce[item.name] || []),
        {
          name: item.name,
          thesaurus_id: item.id,
          prop: i,
          props: item?.columns,
          separator: item?.separator[index],
          thesaurusSpan: 0,
          id: 0,
          errorTip: ''
        }
      ];
    });
  });

  const values = onHandleConcat(cloneDataReduce);
  const result = onHandleAddKey(values);

  return result;
};

/**
 * 将数据按照图谱名称 | 词库名称进行分类
 */
const onReduce = (data: any) => {
  const cloneData = _.cloneDeep(data);
  const result = _.reduce(
    cloneData,
    (pre: any, key: any) => {
      pre[key.name] = [];
      return pre;
    },
    {}
  );
  return result;
};

/**
 * 二维数组变成一维数组
 */
const onHandleConcat = (data: any) => {
  const result = _.reduce(
    Object.values(data),
    (pre: any, key: any) => {
      return [...(pre || []), ...[]?.concat([], key)];
    },
    []
  );
  return result;
};

/**
 * 后端返回数据转换成表格所需格式(每个实体类属性为一条表格数据)
 */
const onTableData = (data: any) => {
  const cloneDataEntity = _.cloneDeep(onReduce(data));

  const { mode } = getParam(['mode']);
  // 选择的模板为std(近义词)时，prop第一个数据为标准词，
  // 同时separator第一个词为空，在循环赋值时应当分开
  _.map(_.cloneDeep(data), (item: any, index) => {
    _.map(item?.entities, (i: any) => {
      _.map(i.prop, (pre: any, index: any) => {
        if (mode === 'std') {
          cloneDataEntity[item.name] = [
            ...(cloneDataEntity[item.name] || []),
            {
              prop: pre,
              props: i?.prop,
              columns: i?.prop,
              entity_name: i?.name,
              name: item?.name,
              graph_id: item.id,
              graphNameSpan: 0,
              entitySpan: 0,
              id: 0,
              separator: i?.separator[index],
              errorTip: '',
              disable: { name: item?.name, entity_name: i?.name, lexicon: i?.std_prop }
              // disable: { name: item?.name, entity_name: i?.name, lexicon: i?.prop?.[0] }
            }
          ];
        } else {
          cloneDataEntity[item.name] = [
            ...(cloneDataEntity[item.name] || []),
            {
              prop: pre,
              props: i.prop,
              columns: i?.prop,
              entity_name: i?.name,
              name: item?.name,
              graph_id: item.id,
              graphNameSpan: 0,
              entitySpan: 0,
              id: 0,
              errorTip: '',
              separator: i?.separator[index],
              disable: { name: item?.name, entity_name: i?.name }
            }
          ];
        }
      });
    });
  });

  const values = onHandleConcat(cloneDataEntity);
  const result = onHandleAddKey(values);

  return result;
};

/**
 * 添加唯一id值
 */
const onHandleAddKey = (values: any) => {
  const result = _.map(_.cloneDeep(values), (item: any, index: any) => {
    item.id = index;
    return item;
  });
  return result;
};

/**
 * 将表格数据根据{图谱:{实体类:{属性集合}}分组
 */
const onHandleReduce = (data: any, values: any) => {
  const cloneDataEntity = _.cloneDeep(onReduce(data));
  _.map(_.cloneDeep(values), (item: any) => {
    cloneDataEntity[item.name][item.entity_name] = [...(cloneDataEntity[item.name][item.entity_name] || []), item];
  });

  return cloneDataEntity;
};

/**
 * 表格数据处理，设置rowSpan的值
 * @param selectAndTableData 所有属性数组根据{图谱:{实体类：{属性集合}}}进行划分
 * @param values 所有属性数组
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
