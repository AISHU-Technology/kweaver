import G6 from '@antv/g6';

const registerRelationClassEdge = (name: string) => {
  G6.registerEdge(name, {
    draw(cfg, group) {
      const startPoint = cfg!.startPoint!;
      const endPoint = cfg!.endPoint!;
      const shape = group!.addShape('path', {
        attrs: {
          stroke: '#333',
          path: [
            ['M', startPoint.x, startPoint.y],
            ['L', endPoint.x + 50, endPoint.y]
          ],
          lineDash: [5]
        },
        name: 'edge-path',
        draggable: true
      });
      return shape;
    }
  });
};

export default registerRelationClassEdge;
