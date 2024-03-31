import _ from 'lodash';

/** 获取图数据 */
export const getGraphData = (graphData: any, graph: any) => {
  const nodes: any = [];
  const edges: any = [];
  _.forEach(graphData?.nodes, d => {
    const node = graph?.current?.findById(d.id);
    node && nodes.push(node);
  });
  _.forEach(graphData?.edges, d => {
    const edge = graph?.current?.findById(d.id);
    edge && edges.push(edge);
  });
  return { nodes, edges };
};

/** 获取有数字类型属性的边类 */
export const getHasNumberAtrClass = (classData: any, checkedClass: any) => {
  const numberType = ['int', 'integer', 'double', 'float', 'decimal', 'int64'];
  const edgesClass = _.cloneDeep(classData?.edge);
  const numberClass = _.filter(edgesClass, e => {
    if (_.includes(checkedClass, e.name)) {
      const properties = _.filter(e?.properties, p => _.includes(numberType, p.type)) || [];
      if (properties?.length > 0) {
        e.properties = properties; // 筛选出只有number类型的属性
        return true;
      }
    }
    return false;
  });
  return numberClass;
};

/** 返回勾选的规则 */
export const getCheckedRules = (rules: any, checkedNames: any[]): any => {
  const checkedFilters = _.filter(rules, item => _.includes(checkedNames, item?.name));

  const filters = _.map(checkedFilters, item => {
    const e_filters = _.map(item?.searchRules?.e_filters, filter => {
      const { type, edge_class, relation } = filter;
      const property_filters = _.map(filter?.property_filters, f => {
        const { name, operation, op_value } = f;
        return { name, operation, op_value };
      });
      return { relation, edge_class, type, property_filters };
    });
    return { e_filters };
  });

  return filters?.length > 0 ? filters : undefined;
};
