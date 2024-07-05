import G6 from '@antv/g6';

/**
 * 注册选中的边, 从3种内置边继承
 * line --> line-check
 * quadratic --> quadratic-check
 * loop --> loop-check
 */
export const registerCheckedEdge = () => {
  const configs = {
    afterDraw(cfg: any, group: any) {
      const edgeShape = group.get('children')[0];

      group.addShape({
        type: 'path',
        attrs: {
          path: edgeShape.attr('path'),
          stroke: '#dfdfdf',
          lineWidth: 14
        },
        name: 'edge-check-bg',
        zIndex: -1
      });
      group.sort();
    },
    /**
     * 必须显式指定为 undefined，每次更新将会重绘
     * 否则更新时执行了 继承的内置边 中的 update 方法，从而与自定义的边有出入
     */
    update: undefined
  };
  ['line', 'quadratic', 'loop'].forEach(edge => G6.registerEdge(`${edge}-check`, configs, edge));
};
