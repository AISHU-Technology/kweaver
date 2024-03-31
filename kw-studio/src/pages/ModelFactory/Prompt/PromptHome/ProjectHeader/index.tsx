import React from 'react';
import { Button } from 'antd';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import _ from 'lodash';

import IconFont from '@/components/IconFont';

import { CategoryItem } from '../types';
import './style.less';

export interface ProjectHeaderProps {
  className?: string;
  selectedCategory: CategoryItem;
  onOperate?: (type: 'project' | 'category', key: string, data?: any) => void;
}

const ProjectHeader = (props: ProjectHeaderProps) => {
  const { className, selectedCategory, onOperate } = props;
  return (
    <div className={classNames(className, 'mf-prompt-project-header kw-space-between')}>
      <div className="kw-align-center kw-c-header">
        <IconFont type="icon-wenjianjia" className="kw-ml-4 kw-mr-3" />
        <div className="project-name kw-ellipsis" title={selectedCategory.prompt_item_name}>
          {selectedCategory.prompt_item_name}
        </div>
        &nbsp;<span className="kw-c-watermark">/</span>&nbsp;
        <div className="project-name kw-ellipsis" title={selectedCategory.prompt_item_type_name}>
          {selectedCategory.prompt_item_type_name}
        </div>
      </div>
      <div>
        <Button type="text" onClick={() => onOperate?.('category', 'edit', selectedCategory)}>
          <IconFont type="icon-edit" />
          {intl.get('global.edit')}
        </Button>
        <Button type="text" className="kw-mr-4" onClick={() => onOperate?.('category', 'delete', selectedCategory)}>
          <IconFont type="icon-lajitong" />
          {intl.get('global.delete')}
        </Button>
      </div>
    </div>
  );
};

export default ProjectHeader;
