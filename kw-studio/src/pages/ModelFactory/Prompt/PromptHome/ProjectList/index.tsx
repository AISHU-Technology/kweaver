import React, { useState, useEffect, useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import { Tree, Dropdown, Menu } from 'antd';
import { DownOutlined, EllipsisOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';

import HOOKS from '@/hooks';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import NoDataBox from '@/components/NoDataBox';
import SearchInput from '@/components/SearchInput';
import noResultSvg from '@/assets/images/noResult.svg';

import { ProjectState, CategoryItem, ProjectItem } from '../types';
import { parseToTreeData } from '../utils';
import './style.less';

export interface ProjectListProps {
  className?: string;
  data: ProjectItem[];
  selectedCategory?: CategoryItem;
  projectState: ProjectState;
  operateType: any;
  onSelect?: (item: CategoryItem) => void;
  onOperate?: (type: 'project' | 'category', key: string, data?: any) => void;
  setSelectedCategory: (data: any) => void;
}

export interface ProjectListRef {
  scrollTo: (options: { key: string | number; align?: 'top' | 'bottom' | 'auto'; offset?: number }) => void;
}

const ProjectList = forwardRef<ProjectListRef, ProjectListProps>((props: ProjectListProps, ref) => {
  const { className, data, selectedCategory, setSelectedCategory, projectState, onSelect, onOperate, operateType } =
    props;
  const treeRef = useRef<any>(); // 树组件
  const oldExpandRef = useRef<any>(); // 搜索前展开的数据
  const oldSelectedRef = useRef<any>(); // 搜索前选中的数据
  const [treeContainerDOM, setTreeContainerDOM] = useState<HTMLDivElement | null>(null); // 用于获取高度设置Tree组件虚拟滚动高度
  const treeData = useMemo(() => parseToTreeData(data), [data]); // 数据转化
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]); // 展开的key
  const [visibleInfo, setVisibleInfo] = useState({ key: '', type: '' }); // Dropdown操作信息
  HOOKS.useWindowSize(); // 无意义, 只是为了在屏幕大小变化时触发更新, 重置Tree的虚拟滚动高度

  useImperativeHandle(ref, () => ({
    scrollTo: options => treeRef.current?.scrollTo?.(options)
  }));

  useEffect(() => {
    if (operateType.current === 'search' && projectState.name) {
      const expandKeys = _.map(_.cloneDeep(treeData), (item: any) => item?.key);
      setExpandedKeys(expandKeys);
    }
    if (!projectState.name) {
      setExpandedKeys(oldExpandRef?.current || []);
      setSelectedCategory(oldSelectedRef.current || selectedCategory);
    }
  }, [data]);

  // 选中分组时自动展开
  useEffect(() => {
    if (!_.isEmpty(selectedCategory)) {
      const { prompt_item_id, scroll } = selectedCategory!;
      const expandKeys = _.includes(expandedKeys, prompt_item_id) ? expandedKeys : [...expandedKeys, prompt_item_id];
      setExpandedKeys(expandKeys);
      if (!projectState?.name) {
        oldExpandRef.current = expandKeys;
      }

      if (scroll) {
        setTimeout(() => {
          treeRef.current?.scrollTo?.({ key: prompt_item_id, offset: 60 });
        }, 0);
      }
    }
  }, [selectedCategory?.prompt_item_id]);

  const onSearch = (e: any) => {
    operateType.current = 'search';
    onOperate?.('project', 'search', e.target.value);
  };

  const clickCreateProject = () => {
    onOperate?.('project', 'create', selectedCategory);
  };

  const expandProject = (key: string, node: ProjectItem) => {
    const expandKeys = _.includes(expandedKeys, key) ? expandedKeys.filter(k => k !== key) : [...expandedKeys, key];
    setExpandedKeys(expandKeys);
    oldExpandRef.current = expandKeys;
    // 空项目可以选中
    if (!node.prompt_item_types?.length) {
      onSelect?.({ ...(_.pick(node, 'prompt_item_id', 'prompt_item_name') as any) });
    }
  };

  const clickAddIconMenu = ({ key, domEvent }: any, data: ProjectItem) => {
    domEvent.stopPropagation();
    onOperate?.(key === 'create' ? 'category' : 'project', key, data);
  };

  const clickOpIconMenu = ({ key, domEvent }: any, type: any, data: CategoryItem) => {
    domEvent.stopPropagation();
    onOperate?.(type, key, data);
  };

  /**
   * 判断树节点是否选中
   * 当分组为空时选中项目
   */
  const isChecked = (node: any) => {
    if (projectState.name) return;
    if (selectedCategory?.prompt_item_type_id) {
      return node.key === selectedCategory?.prompt_item_type_id;
    }
    return node.key === selectedCategory?.prompt_item_id;
  };

  // 自定义树节点
  const titleRender = (node: any) => {
    const { key, type, name, isLeaf, sourceData } = node;
    const isShowOperateIcon = visibleInfo.key === key && visibleInfo.type === 'op';
    const isShowAddIcon = visibleInfo.key === key && visibleInfo.type === 'add';

    return (
      <div
        className={classNames('custom-tree-node kw-align-center kw-pl-2 kw-pr-4', {
          'leaf-node': isLeaf,
          checked: isChecked(node),
          hovered: key === visibleInfo.key
        })}
        onClick={() => (type === 'project' ? expandProject(key, sourceData) : onSelect?.(sourceData))}
      >
        <IconFont type="icon-wenjianjia" className="kw-mr-2" />
        <div className="kw-flex-item-full-width kw-ellipsis" title={name}>
          {name}
        </div>

        <Dropdown
          overlayClassName="prompt-op-dropdown"
          placement="bottomRight"
          destroyPopupOnHide
          visible={isShowOperateIcon}
          onVisibleChange={visible => setVisibleInfo({ key: visible ? key : '', type: visible ? 'op' : '' })}
          overlay={
            <Menu style={{ minWidth: 120 }} onClick={info => clickOpIconMenu(info, type, sourceData)}>
              <Menu.Item key="edit">{intl.get('global.edit')}</Menu.Item>
              <Menu.Item key="delete">{intl.get('global.delete')}</Menu.Item>
            </Menu>
          }
        >
          <div
            onClick={e => e.stopPropagation()}
            className={classNames('prompt-op-bar-root kw-ml-2 kw-center kw-pointer', {
              hovered: isShowOperateIcon
            })}
          >
            <EllipsisOutlined />
          </div>
        </Dropdown>

        {/* 提示词项目可以新增 */}
        {type === 'project' && (
          <Dropdown
            overlayClassName="prompt-op-dropdown"
            placement="bottomRight"
            destroyPopupOnHide
            visible={isShowAddIcon}
            onVisibleChange={visible => setVisibleInfo({ key: visible ? key : '', type: visible ? 'add' : '' })}
            overlay={
              <Menu style={{ minWidth: 120 }} onClick={info => clickAddIconMenu(info, sourceData)}>
                <Menu.Item key="create">{intl.get('prompt.createGroup')}</Menu.Item>
              </Menu>
            }
          >
            <div
              onClick={e => e.stopPropagation()}
              className={classNames('prompt-op-bar-root kw-center kw-pointer', {
                hovered: isShowAddIcon
              })}
            >
              <IconFont type="icon-Add" />
            </div>
          </Dropdown>
        )}
      </div>
    );
  };

  return (
    <div className={classNames(className, 'mf-prompt-project-list kw-flex-column')}>
      <div className="kw-pt-3 kw-pb-2 kw-pl-4 kw-pr-4">
        <SearchInput
          autoWidth
          placeholder={intl.get('createEntity.searchGroup')}
          onChange={e => {
            e.persist();
            onSearch(e);
          }}
          debounce
        />
      </div>
      <div className="mf-prompt-project-list-tool kw-align-center">
        <span className="kw-c-header" style={{ fontWeight: 600 }}>
          {intl.get('prompt.modelApply')}
        </span>
        <Format.Button onClick={clickCreateProject} type="icon" size="small" tip={intl.get('prompt.createProject')}>
          <IconFont type="icon-Add" style={{ fontSize: 14 }} />
        </Format.Button>
      </div>
      {projectState.name && !projectState.searchTotal ? (
        <NoDataBox style={{ marginTop: '80px' }} imgSrc={noResultSvg} desc={intl.get('global.noResult')} />
      ) : (
        <div ref={setTreeContainerDOM} className="kw-flex-item-full-height kw-pl-3">
          <Tree
            ref={treeRef}
            blockNode
            showLine={{ showLeafIcon: false }}
            height={treeContainerDOM?.clientHeight}
            treeData={treeData}
            expandedKeys={expandedKeys}
            titleRender={titleRender}
            switcherIcon={<DownOutlined />}
            onExpand={(keys: any[]) => {
              setExpandedKeys(keys);
              if (!projectState?.name) {
                oldExpandRef.current = keys;
              }
            }}
          />
        </div>
      )}
    </div>
  );
});

export default ProjectList;
