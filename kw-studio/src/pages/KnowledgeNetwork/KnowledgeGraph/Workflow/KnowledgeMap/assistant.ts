import _ from 'lodash';
import { EXTRACT_MODELS, EXTRACT_TYPE } from '@/enums';
import { G6NodeData } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/types';

/**
 * 后端数据转化成抽取规则
 * @param schema 后端预测数据
 * @param fileId 预测的文件 | 数据表 id
 * @param extract_type 抽取规则
 */
export const convertToRules = (schema: Record<string, any>, fileId: string, extract_type: string) => {
  try {
    const rules: any[] = [];
    const is_model = extract_type === EXTRACT_TYPE.MODEL ? 'from_model' : 'not_model';
    const { entity_main_table_dict, entity_property_dict, relation_property_dict } = schema;

    // 找到该文件预测出的点类
    const spots = _.filter(entity_main_table_dict, (item: any) => {
      const isExist = item.main_table.some((table: any, i: number, self: any[]) => {
        if (Array.isArray(table)) return table.includes(fileId);
        if (table?.docid) return table.docid === fileId;
        return self.includes(fileId);
      });

      return isExist;
    });

    // 找到点对应的属性
    _.forEach(spots, (spot: any) => {
      _.forEach(entity_property_dict, proObj => {
        if (spot.entity !== proObj.entity) return;
        rules.push(...createRule(proObj, is_model));
      });
    });

    // 取出边的属性
    _.forEach(relation_property_dict, proObj => {
      rules.push(...createRule(proObj, is_model));
    });

    return rules;
  } catch {
    return [];
  }
};

/**
 * 后端数据转化成抽取规则
 * @param schema 后端预测数据
 * @param fileId 预测的文件 | 数据表 id
 * @param extract_type 抽取规则
 */
export const convertToRulesForModel = (schema: Record<string, any>) => {
  try {
    const rules: any[] = [];
    const is_model = 'from_model';
    const { entity_main_table_dict, entity_property_dict, relation_property_dict } = schema;
    // 找到该文件预测出的点类
    const spots = entity_main_table_dict;

    // 找到点对应的属性
    _.forEach(spots, (spot: any) => {
      _.forEach(entity_property_dict, proObj => {
        if (spot.entity !== proObj.entity) return;
        rules.push(...createRule(proObj, is_model));
      });
    });

    // 取出边的属性
    _.forEach(relation_property_dict, proObj => {
      rules.push(...createRule(proObj, is_model));
    });

    return rules;
  } catch {
    return [];
  }
};

/**
 * 构造抽取规则
 * @param proObj 后端返回的属性
 * @param is_model 是否来自模型
 */
type ProObj = {
  entity: string;
  edge: string;
  property: any[];
  column_name: any[];
};
const createRule = (proObj: ProObj, is_model: string) => {
  const { entity, edge, property, column_name } = proObj;
  return _.map(column_name || property, (col, index) => ({
    is_model,
    entity_type: entity || edge,
    property: {
      property_field: Array.isArray(property[index]) ? property[index][0] : property[index].name,
      column_name:
        Object.prototype.toString.call(col) === '[object Object]' ? col.name : Array.isArray(col) ? col[0] : col,
      property_func: 'All'
    }
  }));
};

/**
 * 生成SQL 文件的抽取规则
 */
export const generateSqlExtractRule = (
  entityType: string,
  property: Array<{ column_name: string; field: string }> = []
) =>
  property.map(item => ({
    is_model: 'not_model',
    entity_type: entityType,
    property: {
      property_field: item.field,
      column_name: item.column_name,
      property_func: 'All'
    }
  }));

/**
 * 获取重复映射的属性
 */
export const getRepeatMapProps = (propertyMapData: any[]) => {
  const allEntityProps = propertyMapData.filter(attr => !!attr.entity_prop).map(attr => attr.entity_prop);
  const repeatEntityProps: any = [];
  allEntityProps.forEach(item => {
    if (allEntityProps.indexOf(item) !== allEntityProps.lastIndexOf(item) && repeatEntityProps.indexOf(item) === -1) {
      repeatEntityProps.push(item);
    }
  });
  return propertyMapData.filter(item => repeatEntityProps.includes(item.entity_prop));
};

/**
 * 获取X6中关系类起点和终点的节点ID
 */
export const getX6RelationClassStartEndNodeId = (startNodeG6Data: G6NodeData, endNodeG6Data: G6NodeData) => {
  const startNodeId = startNodeG6Data._sourceData.name;
  let endNodeId = endNodeG6Data._sourceData.name;
  if (startNodeG6Data._sourceData.name === endNodeG6Data._sourceData.name) {
    endNodeId = `${endNodeG6Data._sourceData.name}-${endNodeG6Data._sourceData.entity_id}`;
  }
  return {
    startNodeId,
    endNodeId
  };
};
