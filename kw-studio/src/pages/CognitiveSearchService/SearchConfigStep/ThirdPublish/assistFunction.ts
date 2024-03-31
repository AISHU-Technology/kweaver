import _ from 'lodash';
import cognitiveSearchService from '@/services/cognitiveSearch';

/**
 * 处理 fullContent search_config需要的参数
 */
export const onHandleConfig = (data: any) => {
  return _.map(data, (item: any) => ({
    class_name: item.class_name,
    class_id: item?.class_id,
    kgs: _.map(item?.kgs, (i: any) => ({
      kg_id: String(i?.kg_id),
      description: i?.description || '',
      creator: String(i?.creator),
      create_time: String(i?.create_time),
      editor: String(i?.editor),
      edit_time: String(i?.edit_time),
      category: i?.category,
      creater_email: String(i?.creater_email),
      editor_email: String(i?.editor_email),
      resource_type: String(i?.resource_type),
      entities: i?.entities || []
    }))
  }));
};

// export const onHandleGraph = (data: any, model: any) => {
export const onHandleGraph = (data: any) => {
  // const allData = _.concat(data, model);
  const allData = _.concat(data);
  return _.map(allData, (i: any) => {
    if (i?.resource_type === 'model') {
      return {
        sub_type: i?.sub_type,
        model_conf: i?.model_conf,
        description: i?.description || '',
        creator: String(i?.creator),
        create_time: String(i?.create_time),
        editor: String(i?.editor),
        edit_time: String(i?.edit_time),
        category: i?.category,
        creater_email: String(i?.creater_email),
        editor_email: String(i?.editor_email),
        resource_type: String(i?.resource_type),
      };
    }
    return {
      kg_id: String(i?.kg_id),
      description: i?.description || '',
      creator: String(i?.creator),
      create_time: String(i?.create_time),
      editor: String(i?.editor),
      edit_time: String(i?.edit_time),
      category: i?.category,
      creater_email: String(i?.creater_email),
      editor_email: String(i?.editor_email),
      resource_type: String(i?.resource_type)
    };
  });
};

/**
 * intention_recognition 挑选需要的参数
 */
export const onHandleIntention = (data: any) => {
  const recognition = data?.intention_recognition;
  const handleRecognition: any = {
    query_understand: {
      switch: data.switch
    }
  };
  if (recognition?.intent_pool_id) {
    handleRecognition.query_understand.intention_recognition = {
      intent_pool_id: recognition?.intent_pool_id
    };
  }
  return handleRecognition;
};
export const checkProperty = (graphQaConfs: any) => {
  let flag = true;
  for (let i = 0, lenI = graphQaConfs?.length; i < lenI; i++) {
    const { entity_name_props } = graphQaConfs[i];
    for (let j = 0, lenJ = entity_name_props?.length; j < lenJ; j++) {
      const entity_item = entity_name_props[j];
      if (entity_item.selected && !entity_item.std) {
        flag = false;
        break;
      }
    }
  }
  return flag;
};

export const removeEmptyProperty = (graphQaConfs: any) => {
  const confNew = _.map(graphQaConfs, confs_item => {
    const { entity_name_props } = confs_item;
    return {
      ...confs_item,
      entity_name_props: _.map(entity_name_props, entity_item => {
        const { synonyms } = entity_item;
        return {
          ...entity_item,
          synonyms: synonyms.filter((i: any) => i.property !== null)
        };
      })
    };
  });
  return confNew;
};

export const graphListChange = (graphQaConfs: any, graphList: any) => {
  let graphListArr: any = [];
  let graphListNew: any = [];
  _.forEach(graphQaConfs, confs_item => {
    const { entity_name_props, kg_id } = confs_item;
    _.forEach(entity_name_props, entity_item => {
      if (entity_item.selected && !entity_item.std) {
        graphListArr = [...graphListArr, { kg_id }];
      }
    });
  });
  graphListNew = _.map(graphList, graph_list_item => {
    const matchRes = graphListArr.filter((i: any) => i.kg_id === graph_list_item.kg_id);
    let res = { ...graph_list_item, error: false };
    if (matchRes.length > 0) {
      res = { ...graph_list_item, error: true };
    }
    return res;
  });

  return graphListNew;
};

export const getPropertyRes = async (data_source_scope: any) => {
  // 新建的触发
  const newDataSource = data_source_scope;
  let kgids: any = [];
  _.forEach(newDataSource, (item: any) => {
    const kg_id = item.kg_id;
    kgids = [...kgids, kg_id];
  });
  kgids = kgids.length ? kgids.join(',') : kgids;
  if (kgids.length === 0) return;
  const res = (await cognitiveSearchService.getPropertyRequest({ kg_id: kgids })) || {};
  return res;
};

export const initConfs = (kgqaData: any) => {
  const copyData = _.cloneDeep(kgqaData);
  const copyConfs = copyData?.props?.confs;
  const copySaveConfs = copyData?.props?.saveConfs?.confs || [];
  let uniqueCopyConfs: any = [];
  _.forEach(copyConfs, (conf_item: any) => {
    // 去重
    if (uniqueCopyConfs.every((item: any) => item.kg_id !== conf_item.kg_id)) {
      uniqueCopyConfs = [...uniqueCopyConfs, conf_item];
    }
  });
  const saveList: any = [];
  const unSaveList: any = [...uniqueCopyConfs];
  _.forEach(uniqueCopyConfs, (conf_item: any, index: number) => {
    // 如果有保存的需要保留
    const res = _.find(copySaveConfs, (item: any) => {
      return item.kg_id === conf_item.kg_id;
    });
    if (res) {
      saveList.push(res);
      unSaveList.splice(index, 1);
    }
  });
  let confsArr: any = [...saveList];
  _.forEach(unSaveList, (list_item: any) => {
    const { entities, kg_id } = list_item;
    const tmp: any = {
      kg_id,
      selected: true,
      entity_name_props: _.map(entities, (entities_item: any) => {
        const { default_property, type } = entities_item;
        return {
          selected: true,
          std: default_property || '',
          entity: type,
          synonyms: []
        };
      })
    };
    confsArr = [...confsArr, tmp];
  });
  return confsArr;
};
