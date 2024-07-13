import React, { useState, useMemo } from 'react';
import { Tree } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';

import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';
import NoDataBox from '@/components/NoDataBox';
import UniversalModal from '@/components/UniversalModal';

import { parseToTreeData } from '../../utils';
import { CategoryItem, ProjectItem } from '../../types';
import './style.less';
import { fuzzyMatch } from '@/utils/handleFunction';

export interface MoveModalProps {
  className?: string;
  visible?: boolean;
  data: CategoryItem;
  projectList: ProjectItem[];
  onOk?: (data: any) => void;
  onCancel?: () => void;
}

const MoveModal = (props: MoveModalProps) => {
  const { className, visible, data, projectList = [], onOk, onCancel } = props;
  const [showData, setShowData] = useState(projectList);
  const treeData = useMemo(() => parseToTreeData(showData), [showData]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>(() => {
    return _.map(projectList, p => p.prompt_item_id);
  });
  const [selectedCategory, setSelectedCategory] = useState(data);

  const onSearch = _.debounce(e => {
    const { value } = e.target;
    const matchData: any = value ? _.filter(projectList, p => fuzzyMatch(value, p.prompt_item_name)) : projectList;
    setShowData(matchData);
  }, 200);

  const submit = () => {
    onOk?.(selectedCategory);
  };

  const expandProject = (key: string) => {
    setExpandedKeys(pre => (pre.includes(key) ? pre.filter(k => k !== key) : [...pre, key]));
  };

  const onSelect = (data: CategoryItem) => {
    setSelectedCategory(data);
  };

  const titleRender = (node: any) => {
    const { key, type, name, isLeaf, sourceData } = node;
    return (
      <div
        className={classNames('custom-tree-node kw-align-center kw-pl-2 kw-pr-3', {
          'leaf-node': isLeaf,
          checked: key === selectedCategory?.prompt_item_type_id
        })}
        onClick={() => (type === 'project' ? expandProject(key) : onSelect(sourceData))}
      >
        <IconFont type="icon-wenjianjia" className="kw-mr-2" />
        <div className="kw-flex-item-full-width kw-ellipsis" title={name}>
          {name}
        </div>
      </div>
    );
  };

  return (
    <UniversalModal
      className={classNames(className, 'manage-prompt-move-modal')}
      title={intl.get('prompt.moveTo')}
      zIndex={2000}
      open={visible}
      onCancel={onCancel}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        { label: intl.get('global.ok'), type: 'primary', onHandle: submit }
      ]}
    >
      <div className="kw-pb-3">
        <SearchInput
          autoWidth
          placeholder={intl.get('prompt.promptGroupPlace')}
          onChange={e => {
            e.persist();
            onSearch(e);
          }}
        />
      </div>
      <Tree
        blockNode
        showLine={{ showLeafIcon: false }}
        height={300}
        treeData={treeData}
        expandedKeys={expandedKeys}
        titleRender={titleRender}
        switcherIcon={<DownOutlined />}
        onExpand={(keys: any[]) => setExpandedKeys(keys)}
      />
      {!treeData.length && <NoDataBox type="NO_RESULT" className="kw-mt-8" />}
    </UniversalModal>
  );
};

export default (props: MoveModalProps) => (props.visible ? <MoveModal {...props} /> : null);
