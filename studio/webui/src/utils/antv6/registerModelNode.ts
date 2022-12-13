import G6 from '@antv/g6';
import modelNodeIcon from '@/assets/images/modelNodeIcon.svg';

/**
 * 注册模型点
 * @param name 注册名
 */
export const registerModelNode = (name = 'model-circle') => {
  const configs = {
    afterDraw(cfg: any, group: any) {
      group.addShape('image', {
        attrs: {
          x: -8,
          y: -8,
          width: 16,
          height: 16,
          img: modelNodeIcon,
          cursor: 'pointer'
        },
        name,
        draggable: true
      });
    },
    update: undefined
  };
  G6.registerNode(name, configs, 'circle');
};
