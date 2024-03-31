import _ from 'lodash';

export const handleSelectData = (selectId: any, dataSource: any, searchType: string) => {
  const result: any = { v_result: [], e_result: [] };
  const nIds = `${_.values(selectId)}`.split(',');
  let eids: any[] = [];
  const nodes: any = [];
  const edges: any = [];

  _.forEach(dataSource?.v_result, item => {
    const vertexes = item?.vertexes || item?.vertexs; // 邻居和全文不一样
    _.forEach(vertexes, ver => {
      const entity = {
        ...ver,
        class: item?.tag || item?.tags[0],
        alias: item?.alias,
        color: item?.color,
        icon: item?.icon
      };
      nodes.push(entity);
    });
  });
  _.forEach(dataSource?.e_result, item => {
    _.forEach(item?.edges, ver => {
      const edge = { ...ver, class: item?.edge_class, alias: item?.alias, color: item?.color };
      edges.push(edge);
    });
  });

  _.forEach(nIds, item => {
    const { in_edges, out_edges } = _.find(nodes, (prop: any) => prop.id === item) || {};
    eids = eids.concat(eids, in_edges);
    eids = eids.concat(eids, out_edges);
  });

  result.e_result = _.filter(edges, (e: any) => {
    if (eids?.includes(e?.id)) {
      const source = e?.source || e?.src_id;
      const target = e?.target || e?.dst_id;
      nIds.push(source);
      nIds.push(target);
      return true;
    }
    return false;
  });

  result.v_result = _.filter(nodes, (n: any) => nIds.includes(n?.id));

  if (searchType === 'expandv') {
    return result;
  }
  return result.v_result;
};
