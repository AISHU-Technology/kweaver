const LAYOUT = {
  gForce: {
    name: '力导图',
    position: {},
    option: {
      type: 'gForce',
      minMovement: 0.9,
      nodeSpacing: 140,
      linkDistance: 400,
      nodeStrength: 2000,
      preventOverlap: true
    }
  },
  concentric: {
    name: '双圈图',
    position: {},
    option: {
      type: 'concentric',
      minNodeSpacing: 60,
      maxLevelDiff: 5,
      sortBy: 'mass',
      preventOverlap: true
    }
  },
  circular: {
    name: '环形图',
    position: {},
    option: {
      type: 'circular',
      ordering: 'degree'
    }
  },
  grid: {
    name: '矩阵图',
    position: {},
    option: {
      type: 'grid',
      begin: [20, 20],
      sortBy: 'color'
    }
  },
  dagreLR: {
    name: '横向图',
    position: {},
    option: {
      type: 'dagre',
      rankdir: 'LR',
      align: 'DL',
      nodesep: 20,
      ranksep: 50,
      controlPoints: true
    }
  },
  dagreTB: {
    name: '竖向图',
    position: {},
    option: {
      type: 'dagre',
      rankdir: 'TB',
      align: 'DL',
      nodesep: 20,
      ranksep: 50,
      controlPoints: true
    }
  }
  // comboForce: {
  //   name: '聚类图',
  //   position: {  },
  //   option: {
  //     type: 'comboForce',
  //     linkDistance: 100,
  //     nodeStrength: 100,
  //     edgeStrength: 0.1,
  //     nodeSpacing: 60,
  //     preventNodeOverlap: true,
  //     nodeCollideStrength: 1,
  //     comboSpacing: 100,
  //     preventComboOverlap: true,
  //     comboCollideStrength: 1
  //   }
  // }
};
export type LayoutKeyType = keyof typeof LAYOUT;

export { LAYOUT };
