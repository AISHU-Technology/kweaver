import G6 from '@antv/g6';
import _ from 'lodash';

const cutName = (str = '', num = 5) => {
  return str.length <= num ? str : `${str.slice(0, num)}...`;
};

/**
 * 解析本体数据, 转换为画布数据
 * @param _ontoData 本体数据
 */
export const parseOntoToGraph = (_ontoData: any) => {
  const ontoData = _.cloneDeep(_ontoData);
  const nodes = _.map(ontoData?.entity, d => {
    const { name, alias, color, icon, x, y } = d;
    return {
      id: name,
      icon,
      label: cutName(alias, 15),
      style: { fill: color },
      x,
      y,
      _sourceData: d
    };
  });
  const edges = _.map(ontoData?.edge, d => {
    const { alias, color, relation } = d;
    const [source, __, target] = relation;
    const isLoop = source === target; // 是否是 自闭环
    return {
      id: String(relation),
      source,
      target,
      label: cutName(alias, 15),
      color,
      loopCfg: isLoop ? { position: 'top', dist: 100 } : undefined,
      style: {
        lineAppendWidth: 14,
        endArrow: {
          fill: color,
          path: isLoop ? G6.Arrow.triangle(10, 12, 0) : G6.Arrow.triangle(10, 12, 25),
          d: isLoop ? 0 : 25
        }
      },
      _sourceData: d
    };
  });
  const offsetDiff = 30;
  const multiEdgeType = 'quadratic';
  const singleEdgeType = 'line';
  const loopEdgeType = 'loop';
  G6.Util.processParallelEdges(edges, offsetDiff, multiEdgeType, singleEdgeType, loopEdgeType);
  return { nodes, edges };
};
