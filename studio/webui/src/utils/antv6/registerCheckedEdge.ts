import G6 from '@antv/g6';
import _ from 'lodash';

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
      // const midPoint = edgeShape.getPoint(0.5);
      // group.addShape('circle', {
      //   attrs: {
      //     r: 9,
      //     ...midPoint,
      //     fill: '#126ee3'
      //   },
      //   name: 'edge-check-icon-wrap',
      //   draggable: true,
      //   capture: true
      // });
      // group.addShape('path', {
      //   attrs: {
      //     path: [
      //       ['M', midPoint.x - 4, midPoint.y - 1],
      //       ['L', midPoint.x - 1, midPoint.y + 3],
      //       ['L', midPoint.x + 4, midPoint.y - 3]
      //     ],
      //     stroke: '#fff',
      //     lineWidth: 2,
      //     lineCap: 'round'
      //   },
      //   name: 'edge-check-icon',
      //   draggable: true
      // });

      /**
       * G6未知bug, 箭头样式偶尔会丢失, 强行覆盖
       */
      if (cfg.style.endArrow?.fill !== '#4e4e4e') {
        Object.assign(cfg.style, { endArrow: { ...cfg.style.endArrow, fill: '#4e4e4e' } });
      }

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
