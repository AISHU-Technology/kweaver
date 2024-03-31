import { getCorrectColor } from '@/utils/handleFunction';
import G6 from '@antv/g6';

const sliceName = (name: string, len = 6) => (name.length < len ? name : `${name.slice(0, len)}...`);

const handlePathData = (data: { vertexes?: any[]; edges?: any[] }, len?: number): { nodes: any[]; edges: any[] } => {
  const vertexes = data.vertexes || [];
  const originEdges = data.edges || [];

  const nodes = vertexes.reduce((res, item) => {
    const { name, tag, color, default_property, icon } = item;
    const curColor = getCorrectColor(color);
    const data = { ...item, class: tag, properties: [] };
    const node = {
      ...data,
      data,
      icon,
      class: tag,
      label: sliceName(default_property?.v || default_property?.value || name, len),
      color: curColor,
      style: {
        fill: curColor,
        stroke: 'white'
      }
    };

    res.push(node);

    return res;
  }, []);

  const edges = originEdges.reduce((res, item) => {
    const { from_id, to_id, tag, name, color } = item;
    const curColor = getCorrectColor(color);
    const id = `${from_id}-${name}-${to_id}`;
    const isLoop = from_id === to_id;
    const edge = {
      data: { ...item, class: tag },
      start: { data: { id: from_id } },
      end: { data: { id: to_id } },
      properties: [],
      id,
      class: tag,
      name,
      color: curColor,
      label: sliceName(name, len),
      source: from_id,
      target: to_id,
      type: isLoop ? 'loop' : undefined,
      loopCfg: isLoop ? { position: 'top', dist: 100 } : undefined,
      style: {
        lineAppendWidth: 14,
        endArrow: {
          fill: color,
          path: isLoop ? G6.Arrow.triangle(10, 12, 0) : G6.Arrow.triangle(10, 12, 25),
          d: isLoop ? 0 : 25
        }
      }
    };
    res.push(edge);

    return res;
  }, []);

  G6.Util.processParallelEdges(edges);

  return { nodes, edges };
};

export { handlePathData };
