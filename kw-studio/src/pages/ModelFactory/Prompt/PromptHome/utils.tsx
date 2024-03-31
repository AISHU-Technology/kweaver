import _ from 'lodash';

import HELPER from '@/utils/helper';
import { getParam } from '@/utils/handleFunction';
import { ProjectItem, PromptItem } from './types';

/**
 * 提示词项目列表数据转换成树组件数据
 * @param source 项目列表数据
 */
export const parseToTreeData = (source: ProjectItem[]) => {
  return _.map(source, item => {
    const { prompt_item_id, prompt_item_name, prompt_item_types } = item;
    const children = _.map(prompt_item_types, category => {
      const { id, name } = category;
      return {
        key: id,
        pKey: prompt_item_id,
        type: 'category',
        title: '', // 显示设置为空, 否则浏览器tip会显示 --
        name,
        isLeaf: true,
        sourceData: {
          prompt_item_id,
          prompt_item_name,
          prompt_item_type_id: id,
          prompt_item_type_name: name
        }
      };
    });
    return {
      key: prompt_item_id,
      type: 'project',
      title: '',
      name: prompt_item_name,
      isLeaf: false,
      selectable: false,
      children,
      sourceData: item
    };
  });
};

/**
 * 跳转时保留知识网络、项目、分组信息
 */
export const getRememberParams = (data: PromptItem) => {
  const _project = data.prompt_item_id || getParam('_project');
  const _category = data.prompt_item_type_id || getParam('_category');
  return HELPER.formatQueryString({ _project, _category });
};
