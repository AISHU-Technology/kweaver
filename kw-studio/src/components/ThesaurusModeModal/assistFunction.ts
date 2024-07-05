import _ from 'lodash';

/**
 * 格式处理，表格数据转换成接口需要的参数形式
 */
export const onFormatTableData = (tableData: any, thesaurusTableData: any, mode: any) => {
  const graphResult = onHandleGraphData(tableData, mode);
  let result: any = {};
  result = {
    extract_info: {
      graph: graphResult
    }
  };
  let lexiconResult: any = [];
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

  let reduceGraphData: any = {};
  if (mode === 'std') {
    reduceGraphData = _.reduce(
      _.cloneDeep(data),
      (pre: any, key: any) => {
        pre[key.name] = { ...(pre[key.name] || {}) };
        pre[key.name][key.entity_name] = {
          name: key.entity_name,
          prop: [key?.disable?.lexicon, ..._.filter(key.props, (item: any) => item !== key?.disable?.lexicon)],
          separator: _.filter(
            [
              ...(pre[key.name][key.entity_name]?.separator || ['']),
              key?.prop !== key?.disable?.lexicon ? key.separator : null
            ],
            (i: any) => i !== null
          )
        };
        return pre;
      },
      {}
    );
  } else {
    reduceGraphData = _.reduce(
      _.cloneDeep(data),
      (pre: any, key: any) => {
        pre[key.name] = { ...(pre[key.name] || {}) };
        pre[key.name][key.entity_name] = {
          name: key.entity_name,
          prop: key.props,
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
