import intl from 'react-intl-universal';

export const getRenderTemplate = () => {
  return [
    // 顶部工具栏
    {
      key: 'toolbar',
      level: 'h1',
      title: intl.get('canvas.toolbar'), // 顶部工具栏
      children: [
        {
          key: 'toolbar_canvas',
          title: intl.get('canvas.canvasT'), // 画布功能
          level: 'h2',
          allowCheck: true,
          renderConfigs: true
        },
        {
          key: 'toolbar_search',
          title: intl.get('canvas.searchT'), // 添加搜索工具
          level: 'h2',
          allowCheck: true,
          allowAdd: true,
          renderConfigs: true
        },
        {
          key: 'toolbar_algorithm',
          title: intl.get('canvas.algorithm'), // 图计算
          level: 'h2',
          allowCheck: true,
          renderConfigs: true
        }
      ]
    },
    // 右键功能
    {
      key: 'rightClick',
      title: intl.get('canvas.rightClick'), // 右键功能
      level: 'h1',
      children: [
        {
          key: 'canvasRightClick_basic',
          title: intl.get('canvas.canvasRightClick'), // 画布右键
          level: 'h2',
          allowCheck: true,
          renderConfigs: true
        },

        {
          key: 'subgraphRightClick_basic',
          title: intl.get('canvas.subgraphRightClick'), // 子图右键
          level: 'h2',
          allowCheck: true,
          renderConfigs: true
        },
        {
          key: 'edgeRightClick_basic',
          title: intl.get('canvas.edgeRightClick'), // 边类右键
          level: 'h2',
          allowCheck: true,
          renderConfigs: true
        },
        {
          key: 'nodeRightClick',
          title: intl.get('canvas.nodeRightClick'), // 点类右键
          level: 'h2',
          allowCheck: true,
          renderConfigs: true,
          children: [
            {
              key: 'nodeRightClick_basic',
              title: intl.get('canvas.basicT') // 基础功能
            },
            {
              key: 'nodeRightClick_extensions',
              title: intl.get('canvas.extensionsT'), // 拓展功能
              allowAdd: true
            }
          ]
        }
      ]
    },
    {
      key: 'nodeDoubleClick_basic',
      level: 'h1',
      title: intl.get('canvas.nodeDoubleClick'), // 实体双击功能
      renderConfigs: true
    }
  ];
};
