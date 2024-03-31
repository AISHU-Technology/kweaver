import G6 from '@antv/g6';
import _ from 'lodash';

const registerFileNode = (name: string, option?: any) => {
  const getFileIcon = (fileType: string) => {
    if (fileType === 'sql') {
      return require('@/assets/graphColorIcon/DataSheet.svg');
    }
    return require('@/assets/graphColorIcon/DataSheet.svg');
  };
  G6.registerNode(name, {
    draw(cfg: any, group: any) {
      const { fileType, label, size } = cfg || {};

      const radius = size / 1.2; // 圆的半径
      const fileNode = group.addShape('circle', {
        zIndex: 100,
        name: 'node-halo',
        attrs: {
          r: radius,
          x: 0,
          y: 0,
          fill: '#000',
          lineWidth: 3,
          opacity: 0,
          cursor: 'pointer'
        }
      });

      group.addShape('image', {
        // id: icon,
        name: 'node-image',
        draggable: true,
        attrs: {
          x: -(size / 2),
          y: -(size / 2),
          width: size,
          height: size,
          img: getFileIcon(fileType),
          draggable: true,
          cursor: 'pointer'
        }
      });

      const _length = 15;
      const defaultLabelPosition = { x: 0, y: radius };
      group.addShape('text', {
        attrs: {
          x: defaultLabelPosition.x,
          y: defaultLabelPosition.y + 15,
          textAlign: 'center',
          text: label,
          fill: '#000',
          fontSize: 12
        },
        name: 'node-label'
      });

      return fileNode;
    },
    setState(name, value, node: any) {
      const state = _.filter(node?._cfg?.states, item => item !== 'normal')[0];
      const group: any = node.getContainer();
      const shapes = group?.get('children');
      let nodeHalo: any = null;
      let nodeImage: any = null;
      let nodeLabel: any = null;
      _.forEach(shapes, item => {
        if (item.cfg.name === 'node-halo') nodeHalo = item;
        if (item.cfg.name === 'node-image') nodeImage = item;
        if (item.cfg.name === 'node-label') nodeLabel = item;
      });
      switch (state) {
        case '_hover':
          nodeHalo && nodeHalo.attr({ opacity: 0.1 });
          break;
        case 'selected':
          nodeHalo && nodeHalo.attr({ opacity: 0.1, fill: '#000000' });
          break;
        case '_hide':
          nodeImage && nodeImage.attr({ opacity: 0.1 });
          nodeHalo && nodeHalo.attr({ opacity: 0 });
          nodeLabel && nodeLabel.attr({ opacity: 0.1 });
          break;
        default:
          nodeImage && nodeImage.attr({ opacity: 1 });
          nodeHalo && nodeHalo.attr({ opacity: 0 });
          nodeLabel && nodeLabel.attr({ opacity: 1 });
          break;
      }
    }
  });
};

export default registerFileNode;
