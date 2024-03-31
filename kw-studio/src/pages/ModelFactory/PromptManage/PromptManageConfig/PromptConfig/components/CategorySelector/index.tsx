import React, { useState, useEffect, useMemo } from 'react';
import { TreeSelect } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import { DownOutlined } from '@ant-design/icons';

import { ProjectItem } from '../../../types';
import './style.less';

export interface CategorySelectorProps {
  className?: string;
  projectList: ProjectItem[];
  value?: string;
  onChange?: (value: string) => void;
  onProjectChange?: (value: string) => void;
}

const CategorySelector = (props: CategorySelectorProps) => {
  const { className, projectList, value, onChange, onProjectChange } = props;
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const handleExpand = (id: string) => {
    setExpandedKeys(pre => (pre.includes(id) ? pre.filter(k => k !== id) : [...pre, id]));
  };

  const treeData = useMemo(() => {
    return _.map(projectList, project => {
      const { prompt_item_id, prompt_item_name, prompt_item_types } = project;
      const children = _.map(prompt_item_types, category => {
        const { id, name } = category;
        return {
          value: id,
          projectId: prompt_item_id,
          title: name,
          selectable: true
        };
      });
      return {
        value: prompt_item_id,
        title: (
          <span className="project-node-wrap" onClick={() => handleExpand(prompt_item_id)}>
            {prompt_item_name}
          </span>
        ),
        selectable: false,
        children
      };
    });
  }, [projectList]);

  // TODO 4.18.7不支持点击节点展开, 手动控制
  useEffect(() => {
    setExpandedKeys(_.map(projectList, d => d.prompt_item_id));
  }, [projectList.length]);

  const handleSelect = (value: string, node: any) => {
    onChange?.(value);
    onProjectChange?.(node.projectId);
  };

  const onTreeExpand = (keys: any[]) => {
    setExpandedKeys(keys);
  };

  return (
    <TreeSelect
      className={classNames(className)}
      dropdownClassName="prompt-category-selector-menu"
      getPopupContainer={triggerNode => triggerNode.parentElement}
      treeExpandedKeys={expandedKeys}
      onTreeExpand={onTreeExpand}
      treeData={treeData}
      value={value}
      onSelect={handleSelect}
      switcherIcon={<DownOutlined />}
    />
  );
};

export default CategorySelector;
