import _ from 'lodash';
import intl from 'react-intl-universal';

/** 格式化图谱数据-数据来源接口：graph-search/kgs/${id}/vids */
export const formatGraphData_graphSearchVid = (items: any) => {
  const result: any = [];
  _.forEach(items, item => {
    const { id, icon, alias, color, class_name, properties, default_property } = item;
    const defaultProperties = [
      { name: '#id', alias: intl.get('exploreGraph.nodeId'), value: id, type: 'string' },
      { name: '#alias', alias: intl.get('exploreGraph.nodeShowName'), value: alias, type: 'string' },
      { name: '#entity_class', alias: intl.get('exploreGraph.nodeClass2'), value: class_name, type: 'string' }
    ];
    const _properties = defaultProperties.concat(_.filter(properties, d => d.tag === class_name)?.[0]?.props || []);

    result.push({ id, icon, alias, color, default_property, properties: _properties, _class: class_name });
  });

  return result;
};

/** 格式化图谱数据-数据来源接口：services/test */
export const formatGraphData_servicesTest = (data: any, rootId: string) => {
  const { nodes, edges } = data;
  const result: any = { nodes: [], edges: [] };
  const _node = _.filter(nodes, node => !(node.class_name === 'datacatalog' && node.id !== rootId));

  _.forEach(_node, item => {
    const { id, icon, alias, color, class_name, properties, default_property } = item;
    const defaultProperties = [
      { name: '#id', alias: intl.get('exploreGraph.nodeId'), value: id, type: 'string' },
      { name: '#alias', alias: intl.get('exploreGraph.nodeShowName'), value: alias, type: 'string' },
      { name: '#defaultTag', alias: intl.get('exploreGraph.nodeClass2'), value: class_name, type: 'string' }
    ];
    const _properties = defaultProperties.concat(_.filter(properties, d => d.tag === class_name)?.[0]?.props || []);

    result.nodes.push({ id, icon, alias, color, default_property, _class: class_name, properties: _properties });
  });
  _.forEach(edges, item => {
    const { id, alias, color, class_name, properties, source, target } = item;
    const defaultProperties = [
      { name: '#id', alias: intl.get('exploreGraph.edgeId'), value: id, type: 'string' },
      { name: '#alias', alias: intl.get('exploreGraph.edgeShowName'), value: alias, type: 'string' },
      { name: '#defaultTag', alias: intl.get('exploreGraph.edgeClass2'), value: class_name, type: 'string' }
    ];
    const _properties = defaultProperties.concat(properties);
    result.edges.push({ id, alias, color, source, target, _class: class_name, properties: _properties });
  });

  return result;
};
