import G6 from '@antv/g6';
import _ from 'lodash';
import { getIconCode } from './getIcon';

/**
 * 注册带icon的点
 * @param name 注册名
 */
export const registerIconNode = (name = 'icon-node') => {
  const configs = {
    afterDraw(cfg: any, group: any) {
      if (cfg.icon) {
        const text = getIconCode(cfg.icon);

        if (text) {
          const size = _.isNumber(cfg.size) ? cfg.size : _.isArray(cfg.size) ? _.min(cfg.size) : 14;
          group.addShape('text', {
            attrs: {
              x: 0,
              y: 0,
              fontFamily: 'iconfont', // 对应css里面的font-family: "iconfont";
              textAlign: 'center',
              textBaseline: 'middle',
              text,
              fontSize: size * 0.55,
              fill: '#fff',
              cursor: 'pointer'
            },
            name: 'text-shape1',
            draggable: true
          });
        }
      }
    },
    update: undefined
  };
  G6.registerNode(name, configs, 'circle');
};
