import _ from 'lodash';

export enum RuleType {
  FROM_MODEL = 'from_model', // 抽取规则来自模型
  NOT_MODEL = 'not_model' // 抽取规则不来自模型
}

export enum SourceType {
  STRUCTURED = 'structured', // 结构化
  UNSTRUCTURED = 'unstructured' // 非结构化
}

export enum ExtractType {
  STANDARD = 'standardExtraction', // 标准抽取
  MODEL = 'modelExtraction', // 模型抽取
  LABEL = 'labelExtraction' // 标注抽取
}

export enum RuleKey {
  NAME = 'entity_type', // 抽取规则的实体名称
  PROPERTY = 'property_field' // 抽取规则的属性字段
}

const AUTOMATIC = 'automatic'; // 第三步标记自动预测的点

export const uniqueSourceId = () => _.uniqueId('source');
export const uniqueRuleId = () => _.uniqueId('rule');

/**
 * 构造抽取规则
 * @param param.ruleType 是否来自模型
 * @param param.name 抽取对象
 * @param param.property 属性字段
 */
const createRule = ({ ruleType, name, property }: { ruleType: string; name: string; property: string }) => ({
  id: uniqueRuleId(),
  is_model: ruleType,
  entity_type: name,
  property: {
    property_field: property,
    property_func: 'All'
  },
  errMsg: ['', ''],
  disabled: false
});

const NAME_OBJECT = {
  as7: 'AnyShare7',
  mysql: 'MySQL',
  hive: 'Hive',
  rabbitmq: 'RabbitMQ'
};

/**
 * 显示转化
 */
const dataSourceShow = (text: keyof typeof NAME_OBJECT) => NAME_OBJECT[text];

/**
 * 生成知识网络抽取规则数据
 */
const generateGraph = (dsList: any[]) => {
  const data = _.reduce(
    dsList,
    (res: any[], item) => {
      const { dsname, pId, file_id, name, extract_type, extract_model, extract_rules } = item;

      res.push({
        ...item,
        ds_name: dsname,
        ds_id: parseInt(pId),
        file_source: file_id,
        file_name: name,
        extract_type,
        extract_model: extract_model || undefined,
        extract_rules: extract_rules.map((rule: any) => ({
          is_model: rule.is_model,
          entity_type: rule.entity_type,
          property: {
            property_field: rule.property.property_field,
            property_func: rule.property.property_func
          }
        }))
      });

      return res;
    },
    []
  );

  return data;
};

/**
 * 转换后端返回的抽取数据
 */
const transExtractData = (data: any[]) =>
  _.map(data, item => {
    const { ds_name, ds_id, file_source, file_name, extract_rules } = item;

    return {
      ...item,
      selfId: uniqueSourceId(),
      name: file_name,
      file_name,
      file_id: file_source,
      file_source,
      pId: ds_id,
      dsname: ds_name,
      extract_rules: _.map(extract_rules, item => ({
        ...item,
        id: uniqueRuleId(),
        errMsg: ['', ''],
        disabled: false
      })),
      selectRules: [],
      isDsError: false,
      errorTip: ''
    };
  });

/**
 * 处理流程3带入的数据
 * @param step3Data 流程3数据
 * @param step4Data 流程4原有的数据
 */
const handleStep3Data = (step3Data: { entity: any[]; edge: any[] }, step4Data: any[]) => {
  // 自动预测和标准抽取的点和边才会带入
  const fcb = (item: any) => item.source_type === AUTOMATIC && item.extract_type === ExtractType.STANDARD;
  const nodes = _.filter(step3Data?.entity, fcb);
  const edges = _.filter(step3Data?.edge, fcb);

  // 某个点类来自多个文件, 只要有一个文件在流程四中没有包含, 则取出, 否则过滤掉
  const curNodes = _.filter(nodes, item => {
    const { source_table } = item;
    const repeatIndex: any[] = [];

    _.forEach(source_table, source => {
      const file_id = Array.isArray(source) ? source[0] : source;
      const index = step4Data.findIndex(ds => String(ds.pId) === String(item.ds_id) && ds.file_id === file_id);
      repeatIndex.push(index);
    });

    return repeatIndex.some(i => i === -1);
  });

  const dsList: any[] = [];
  const repeatSource: string[] = [];

  // 转换成流程四的数据结构
  _.forEach(curNodes, node => {
    const { ds_id, ds_name, extract_type, file_type, name, source_table, properties, model, ds_path, data_source } =
      node;

    source_table.forEach((source: any[]) => {
      const file_path = Array.isArray(source) ? source[2] : ds_path;
      const file_id = Array.isArray(source) ? source[0] : source;
      const file_name = file_type === '' ? source : source[1];

      if (step4Data.find(d => String(d.pId) === String(ds_id) && d.file_id === file_id)) return;

      // 构造取值规则
      const selectRules: any[] = [];
      let rules: string | any[] = [];

      _.forEach(properties, (pro: string[]) => {
        selectRules.push(pro[0]);
        rules = [...rules, createRule({ ruleType: RuleType.NOT_MODEL, name, property: pro[0] })];
      });

      // 合并重复来源的规则
      if (repeatSource.includes(file_id)) {
        const i = dsList.findIndex(d => d.file_id === file_id);
        dsList[i].extract_rules = [...dsList[i].extract_rules, ...rules];
        dsList[i].selectRules = _.uniq([...dsList[i].selectRules, ...selectRules]);
      } else {
        repeatSource.push(file_id);
        dsList.push({
          selfId: uniqueSourceId(),
          name: file_name,
          file_name,
          file_id,
          file_source: file_id,
          pId: ds_id,
          dsname: ds_name,
          data_source,
          ds_path,
          file_path,
          file_type: data_source.includes('as') ? 'file' : '',
          extract_type,
          extract_model: model,
          extract_rules: rules,
          selectRules: _.uniq(selectRules),
          isDsError: false,
          errorTip: ''
        });
      }
    });
  });

  // 取出边的数据
  _.forEach(edges, edge => {
    const fromSource = _.uniq(edge.source_table);
    const dsIndex = dsList.findIndex(d => fromSource.includes(d.file_id));

    if (dsIndex !== -1) {
      const { name, properties } = edge;
      const sRules = [...dsList[dsIndex].selectRules];
      const eRules = _.map(properties, (pro: any[]) => {
        sRules.push(pro[0]);
        return createRule({ ruleType: RuleType.NOT_MODEL, name, property: pro[0] });
      });

      dsList[dsIndex].extract_rules = dsList[dsIndex].extract_rules.concat(eRules);
      dsList[dsIndex].selectRules = _.uniq(sRules);
    }
  });

  return dsList;
};

/**
 * 更新数据源名
 * @param ds 第四步中的文件列表数据
 * @param origin 第二步选择的数据源
 */
const updateDsName = (ds: any[], origin: any[]) => {
  const mapping = new Map();
  _.forEach(origin, o => mapping.set(String(o.id), o.dsname));

  return _.map(ds, d => {
    const newName = mapping.get(String(d.pId));
    return newName ? { ...d, dsname: newName } : d;
  });
};

/**
 * 后端数据转化成抽取规则
 * @param res 后端预测数据
 * @param fileId 预测的文件 | 数据表 id
 * @param extract_type 抽取规则
 */
const convertToRules = (res: Record<string, any>, fileId: string, extract_type: string) => {
  try {
    const rules: any[] = [];
    const selectRules: string[] = [];
    const is_model = extract_type === ExtractType.MODEL ? RuleType.FROM_MODEL : RuleType.NOT_MODEL;
    const { entity_main_table_dict, entity_property_dict, relation_property_dict } = res;

    // 找到该文件预测出的点类
    const spots = _.filter(entity_main_table_dict, (item: any) => {
      const isExist = item.main_table.some((table: any, i: number, self: any[]) => {
        if (Array.isArray(table)) return table[0].includes(fileId);
        if (table?.docid) return table.docid === fileId;
        return self.includes(fileId);
      });

      return isExist;
    });

    // 找到点对应的属性
    _.forEach(spots, (spot: any) => {
      const propertyList = _.filter(entity_property_dict, (pro: any) => spot.entity === pro.entity);
      _.forEach(propertyList, ({ property, entity }) => {
        _.forEach(property, (pro: string[]) => {
          selectRules.push(pro[0]);
          rules.push(createRule({ ruleType: is_model, name: entity, property: pro[0] }));
        });
      });
    });

    // 取出边的属性
    _.forEach(relation_property_dict, ({ edge, property }) => {
      _.forEach(property, (pro: string[]) => {
        selectRules.push(pro[0]);
        rules.push(createRule({ ruleType: is_model, name: edge, property: pro[0] }));
      });
    });

    return {
      extract_rules: rules,
      selectRules: _.uniq(selectRules)
    };
  } catch {
    return {
      extract_rules: [],
      selectRules: []
    };
  }
};

/**
 * 添加的文件和预测数据，转化为抽取规则
 * @param dsData 文件的数据源
 * @param isAs 是否是as
 * @param fileData 文件数据 | 数据表数据
 * @param res 预测结果
 */
const createSource = (dsData: Record<string, any>, fileData: any[], res: Record<string, any>, isAs: boolean) => {
  const { id, dsname, data_source, ds_path, extract_type, extract_model } = dsData;

  return _.map(fileData, item => {
    const source = {
      selfId: uniqueSourceId(),
      pId: id, // 所属数据源
      dsname, // 所属数据源名
      data_source, // 来源, 数据库或AS
      ds_path, // 数据源路径
      file_path: ds_path, // 文件路径, as需要额外拼接文件夹
      file_type: '', // 文件类型
      extract_type, // 抽取方式
      extract_rules: [], // 抽取规则
      extract_model, // 抽取模型
      selectRules: [], // 标准抽取时可选择的属性字段
      isDsError: false, // 是否错误
      errorTip: '' // 错误tip信息
    };
    let reset: Record<string, any> = {};

    if (isAs) {
      const { docid, name, file_path, type } = JSON.parse(item);
      reset = {
        name,
        file_name: name,
        file_id: docid,
        file_source: docid,
        file_path,
        file_type: type
      };
    } else {
      reset = {
        name: item,
        file_name: item,
        file_id: item,
        file_source: item
      };
    }

    const ruleData = convertToRules(res.res, reset.file_id, extract_type);
    return { ...source, ...reset, ...ruleData };
  });
};

/**
 * 新增数据源时覆盖已添加的数据源, 抽取规则不变
 * @param oldData 原有的数据
 * @param newData 新增的数据
 */
const removeRepeatDs = (oldData: any[], newData: any[]) => {
  const repeatIndex: number[] = [];

  _.forEach(newData, (n, nIndex) => {
    const index = oldData.findIndex(o => n.file_id === o.file_id && String(n.pId) === String(o.pId));
    if (index !== -1) {
      repeatIndex.push(index);
      if (newData[nIndex].extract_type === ExtractType.STANDARD || newData[nIndex].extract_type === ExtractType.LABEL) {
        newData[nIndex].extract_rules = oldData[index].extract_rules;
      }
    }
  });

  const ds = oldData.filter((_: any, i: number) => !repeatIndex.includes(i));
  return ds.concat(newData);
};

export {
  createRule,
  dataSourceShow,
  generateGraph,
  transExtractData,
  handleStep3Data,
  updateDsName,
  convertToRules,
  createSource,
  removeRepeatDs
};
