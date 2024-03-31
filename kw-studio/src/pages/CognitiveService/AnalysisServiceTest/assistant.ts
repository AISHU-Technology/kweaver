import _ from 'lodash';
/**
 * 在配置展示工具栏但未勾选任何配置。不显示画布顶部toolBar
 * @param toolbarData 工具栏配置数据
 * @returns 返回是否勾选配置
 */
export const isCheckedTool = (toolbarData: any) => {
  const { canvas, algorithm, search } = toolbarData?.options || {};
  if (algorithm?.checked) return true;

  const canvasChecked = _.some(_.keys(canvas?.options), item => {
    return canvas?.options?.[item]?.checked;
  });
  const searchChecked = _.some(_.keys(search?.options), item => {
    return search?.options?.[item]?.checked;
  });
  return canvasChecked || searchChecked;
};

/**
 * 生成画布使用的配置数据结构
 * @param _pcConfigs 图服务的pc配置
 */
export const generateCanvasConfig = (_pcConfigs: any[]) => {
  try {
    const pcConfigs = _.cloneDeep(_pcConfigs);
    const config: any = {};
    const getConfig = (arr: any, parent: any) => {
      if (!Array.isArray(arr)) return;
      _.forEach(arr, item => {
        if (item.children) {
          getConfig(item.children, item);
        }
        delete item.children;
        if (!parent.options) parent.options = {};
        parent.options[item.key] = item;
      });
    };

    // 兼容2.0.1.8新增的配置
    if (!_.find(pcConfigs, c => c.key === 'features')) {
      pcConfigs.push({
        key: 'features',
        level: 1,
        children: [
          {
            key: 'paramsTool',
            visible: true
          },
          {
            key: 'welcomeMessage',
            visible: false,
            content: ''
          },
          {
            key: 'resultPanel',
            visible: false
          }
        ]
      });
    }

    getConfig(pcConfigs, config);

    // 兼容一下 图计算
    if (config?.options?.toolbar?.options?.algorithm) {
      const algorithm = _.cloneDeep(config.options.toolbar.options.algorithm);
      algorithm.checked = false;
      const algorithmOptions = _.values(algorithm.options);
      if (_.find(algorithmOptions, item => item.checked === true)) algorithm.checked = true;
      delete algorithm.options;

      config.options.toolbar.options.canvas.options = {
        ...config.options.toolbar.options.canvas.options,
        algorithm,
        ...config.options.toolbar.options.algorithm.options
      };
    }
    return config;
  } catch (err) {
    //
  }
};
