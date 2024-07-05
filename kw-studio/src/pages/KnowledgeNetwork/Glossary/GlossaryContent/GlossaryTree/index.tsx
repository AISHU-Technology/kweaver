/* eslint-disable max-lines */
import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef, useMemo } from 'react';
import _ from 'lodash';
import { Button, Dropdown, Menu, message, Tooltip, Tree, Radio, Space } from 'antd';
import { CheckOutlined, CloseOutlined, DownOutlined, EllipsisOutlined } from '@ant-design/icons';

import IconFont from '@/components/IconFont';
import DropdownInput, { DropdownInputRefProps } from '../DropdownInput';
import LoadingMask from '@/components/LoadingMask';
import {
  updateTreeData,
  generateTreeNodeDataByTerm,
  addTreeNode,
  changeTreeNodeLevel,
  deleteTreeNode,
  getTermParentByTermId,
  getTermNameByLanguage,
  getTermTreeNodeByTermId
} from '../../assistant';

import './style.less';
import intl from 'react-intl-universal';
import {
  changeTermLevel,
  createTerm,
  deleteTerm,
  editTerm,
  EditTermParamType,
  getTermChildByTermIds,
  getTermDataByTermIds,
  getTermPath,
  getTermRootNode,
  searchTerm
} from '@/services/glossaryServices';
import { GlossaryDataType, TermLabelType, TermTreeNodeType, TermType } from '@/pages/KnowledgeNetwork/Glossary/types';
import { useGlossaryStore } from '@/pages/KnowledgeNetwork/Glossary/GlossaryContext';
import TipModal from '@/components/TipModal';
import SearchInput from '@/components/SearchInput';
import NoDataBox from '@/components/NoDataBox';
import Format from '@/components/Format';
import { languageOptions } from '@/pages/KnowledgeNetwork/Glossary/constants';
import useLatestState from '@/hooks/useLatestState';
import UniversalModal from '@/components/UniversalModal';
import { useUpdateEffect } from '@/hooks/useUpdateEffect';

type GlossaryTreeType = {
  headerVisible?: boolean; // 切换语言按钮是否显示
  readOnly?: boolean; // 是否处于只读模式
  selectedLanguage: string;
  showSearch?: boolean; // 是否展示搜索框
  checkable?: boolean; // 是否展示复选框
  onTreeNodeSelect?: (nodes: TermTreeNodeType[]) => void; // 树节点选中事件
  onCheck?: (keys: string[]) => void; // 树节点check选中事件
  checkedKeys?: string[]; // 树节点选中的key，传入该属性，则代表树节点的选中受控
  onTermDataSourceChange?: (data: TermTreeNodeType[]) => void; // 术语数据源值变化事件
};
export type GlossaryTreeRefType = {
  setSelectedNodeByTerm: (termId: string[]) => void;
  refreshTerm: (termId: string) => void;
};
const GlossaryTree = forwardRef<GlossaryTreeRefType, GlossaryTreeType>((props, ref) => {
  const {
    glossaryStore: { glossaryData, mode, selectedTerm },
    setGlossaryStore
  } = useGlossaryStore();
  const prefixCls = 'glossaryTree';
  const {
    selectedLanguage,
    onTreeNodeSelect,
    showSearch = false,
    checkable = false,
    readOnly = false,
    headerVisible = true,
    onCheck,
    checkedKeys = [],
    onTermDataSourceChange
  } = props;
  // 非受控模式下  存储的state
  const [treeProps, setTreeProps, getLatestTreeProps] = useLatestState({
    treeData: [] as TermTreeNodeType[], // 树结构数据源
    searchTreeData: [] as TermTreeNodeType[], // 搜索出來的树结构数据源
    expandedKeys: [] as string[],
    selectKeys: [] as string[],
    checkedKeys: [] as string[],
    loadedKeys: [] as string[], // 已经加载children的树节点key
    searchValue: '',
    loading: true,
    editing: false, // 是否处于编辑状态
    inputValue: ''
  });
  const [deleteModalProps, setDeleteModalProps] = useState({
    confirmVisible: false,
    tipsVisible: false,
    radioValue: 'delete_one',
    node: null as null | TermTreeNodeType
  });
  const dropdownInputRef = useRef<DropdownInputRefProps | null>(null);
  const errorRef = useRef<string>('');
  const haveCheck = useRef<boolean>(false);
  const checkedControl = 'checkedKeys' in props; // 复选框的选中状态是否受控
  const editingStatus = useRef<boolean>(false); // 是否处于编辑状态
  const operateBtnDisabledRef = useRef<boolean>(false); // 操作按钮是否禁用

  useImperativeHandle(ref, () => ({
    setSelectedNodeByTerm,
    refreshTerm: (termId: string) => {
      const treeDataSource = _.cloneDeep(treeProps.treeData);
      const parentKey = getTermParentByTermId(treeDataSource, termId);
      refreshTermTreeAfterAddUpdate(termId, termId, parentKey);
    }
  }));

  useUpdateEffect(() => {
    onTermDataSourceChange?.(treeProps.treeData);
  }, [treeProps.treeData]);

  useEffect(() => {
    if (glossaryData) {
      getTreeRootNode(glossaryData.id);
    }
  }, []);

  useEffect(() => {
    if (!haveCheck.current && checkable && checkedControl && checkedKeys.length > 0 && treeProps.treeData.length > 0) {
      haveCheck.current = true;
      setSelectedNodeByTerm(checkedKeys);
    }
  }, [checkedKeys, treeProps.treeData]);

  /**
   * 通过指定的术语id设置选中的树节点
   * @param termData
   */
  const setSelectedNodeByTerm = (termIds: string[]): any => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async resolve => {
      const { treeData } = getLatestTreeProps();
      const glossaryId = glossaryData!.id;
      let treeDataSource = _.cloneDeep(treeData);
      // 先获取术语所在的层级
      try {
        const allPathData: string[] = [];
        const reqArr = termIds.map(id => getTermPath(glossaryId, id));
        const data = await Promise.all(reqArr);
        data.forEach(dataItem => {
          const pathData = [...dataItem.res];
          pathData.shift();
          pathData.pop();
          pathData.forEach(pathItem => {
            if (!allPathData.includes(pathItem)) {
              allPathData.push(pathItem);
            }
          });
        });

        const needLoadTermIds = _.difference(allPathData, treeProps.loadedKeys); // 需要加载children的术语id

        if (needLoadTermIds.length > 0) {
          const needLoadTermIdsString = needLoadTermIds.join(',');
          const res = await getTermChildByTermIds(glossaryId, needLoadTermIdsString);
          needLoadTermIds.forEach((key: any, index) => {
            const term = res.res[key]; // 树节点对应的children
            const parentKey = key; // 自身就是父节点
            const termTreeNode = generateTreeNodeDataByTerm(term, selectedLanguage, parentKey);
            treeDataSource = addTreeNode({
              treeDataSource,
              treeNode: termTreeNode,
              parentKey,
              method: 'replace'
            });
          });
        }
        setTreeProps(prevState => ({
          ...prevState,
          expandedKeys: [...prevState.expandedKeys, ...needLoadTermIds],
          [checkable ? 'checkedKeys' : 'selectKeys']: termIds,
          treeData: treeDataSource,
          loadedKeys: [...prevState.loadedKeys, ...needLoadTermIds]
        }));
        resolve(true);
      } catch (error) {
        const errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
        message.error(errorTip);
      }
    });
  };

  /**
   * 获取术语树结构数据
   */
  const getTreeRootNode = async (id: number) => {
    setTreeProps(prevState => ({ ...prevState, loading: true }));
    try {
      const data = await getTermRootNode(id);
      if (data) {
        const treeDataSource = generateTreeNodeDataByTerm(data.res, selectedLanguage);
        if (treeDataSource.length === 0) {
          addItem();
        } else {
          setTreeProps(prevState => ({ ...prevState, treeData: treeDataSource, loading: false }));
        }
      }
    } catch (error) {
      setTreeProps(prevState => ({ ...prevState, loading: false }));
      const errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
      message.error(errorTip);
    }
  };

  /**
   * 新增或编辑节点之后，刷新术语树和选中的术语
   * @param termId 术语的id  用于通过接口重新获取术语的后端存储数据
   * @param replaceKey 替换树数据源中指定的树节点
   * @param parentKey 术语节点的父节点的key
   */
  const refreshTermTreeAfterAddUpdate = async (termId: string, replaceKey?: string, parentKey?: string) => {
    const { treeData } = getLatestTreeProps();
    const treeDataSource = _.cloneDeep(treeData);
    const glossaryId = glossaryData!.id;
    try {
      const ids = parentKey ? `${termId},${parentKey}` : termId;
      const data = await getTermDataByTermIds(glossaryId, ids);
      const termData = data.res[termId];
      const termNode = generateTreeNodeDataByTerm([termData], selectedLanguage, parentKey);
      let newTreeData = updateTreeData({
        treeDataSource,
        treeNode: termNode[0],
        replaceKey: replaceKey ?? termId
      });
      if (parentKey) {
        const oldParentTermNodeData = getTermTreeNodeByTermId(newTreeData, parentKey)!;
        const newParentTermData = data.res[parentKey];
        const newParentTermNodeData = generateTreeNodeDataByTerm(
          [newParentTermData],
          selectedLanguage,
          oldParentTermNodeData.parentKey
        );
        newTreeData = updateTreeData({
          treeDataSource: newTreeData,
          treeNode: newParentTermNodeData[0],
          replaceKey: parentKey
        });
      }
      setTreeProps(prevState => ({ ...prevState, treeData: newTreeData }));
      // 设置当前操作的术语节点为选中的节点
      closeEditingStatus();
      onSelect([termId], { selected: true, selectedNodes: termNode });
    } catch (error) {
      const errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
      message.error(errorTip);
      closeEditingStatus();
    }
  };

  /** 通过给定的术语id 刷新 术语树中 已存在的 术语节点 */
  const refreshTermNodeByTermId = async (
    treeData: TermTreeNodeType[],
    termId: string[]
  ): Promise<{ treeData: TermTreeNodeType[]; noChildrenNodeKeys: string[] }> => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async resolve => {
      try {
        const noChildrenNodeKeys: string[] = [];
        let newTreeData = _.cloneDeep(treeData);
        const glossaryId = glossaryData!.id;
        const keys = termId.join(',');
        const data = await getTermDataByTermIds(glossaryId, keys); // 调接口获取最新的术语数据
        termId.forEach(id => {
          const newTermData = data.res[id] as TermType;
          const oldTermNodeData = getTermTreeNodeByTermId(newTreeData, id)!;
          const newTermNodeData = generateTreeNodeDataByTerm(
            [newTermData],
            selectedLanguage,
            oldTermNodeData.parentKey
          );
          newTreeData = updateTreeData({
            treeDataSource: newTreeData,
            treeNode: newTermNodeData[0],
            replaceKey: id
          });
          if (newTermData.level.child_count === 0) {
            noChildrenNodeKeys.push(id);
          }
        });
        resolve({ treeData: newTreeData, noChildrenNodeKeys });
      } catch (error) {
        const errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
        message.error(errorTip);
      }
    });
  };

  const overlay = (node: TermTreeNodeType) => (
    <Menu
      onClick={({ key, domEvent }) => {
        domEvent.stopPropagation();
        if (key === 'add') addItem(node.key);
        if (key === 'edit') {
          openEditingStatus();
          renameTermNode(node, true);
        }
        if (key === 'del') {
          if (node.sourceData!.level.child_count === 0) {
            // 没有子级
            setDeleteModalProps(prevState => ({
              ...prevState,
              confirmVisible: false,
              tipsVisible: true,
              radioValue: 'delete_sub',
              node
            }));
          } else {
            setDeleteModalProps(prevState => ({
              ...prevState,
              confirmVisible: true,
              tipsVisible: false,
              radioValue: 'delete_one',
              node
            }));
          }
        }
      }}
    >
      <Menu.Item key="add">{intl.get('glossary.addTerm')}</Menu.Item>
      <Menu.Item key="edit">{intl.get('glossary.editTermName')}</Menu.Item>
      <Menu.Item key="del">{intl.get('glossary.deleteTerm')}</Menu.Item>
    </Menu>
  );

  /** 拖拽改变节点位置 */
  const handleDrop = async (info: any) => {
    const isRoot = info.dropToGap && !info.node.parentKey; // 是否是根节点
    const glossaryId = glossaryData!.id;
    const dropKey = info.node.key;
    const dragKey = info.dragNode.key;
    const dragNode = info.dragNode;
    const oldParentKey = info.dragNode.parentKey;
    let newTreeData = _.cloneDeep(treeProps.treeData);
    let parentKey = dropKey;
    if (isRoot) {
      // 说明拖动到根节点了
      parentKey = 'root';
    }
    if (info.node.parentKey) {
      if (info.dropToGap) {
        parentKey = info.node.parentKey;
      }
    }
    if (!parentKey) return;
    try {
      await changeTermLevel(glossaryId, dragKey, parentKey);
      newTreeData = changeTreeNodeLevel(newTreeData, info);
      // 看dropKey是否已经加载，如果没加载还需要去加载子节点`
      let loadedKeys: string[] = [...treeProps.loadedKeys];
      let expandedKeys: string[] = [...treeProps.expandedKeys];
      const isLoaded = loadedKeys.includes(parentKey);
      if (!isRoot) {
        if (!expandedKeys.includes(parentKey)) {
          expandedKeys.push(parentKey);
        }
        if (!isLoaded) {
          loadedKeys.push(parentKey);
          const res = await getTermChildByTermIds(glossaryId, parentKey);
          const term = res.res[parentKey];
          let termTreeNode = generateTreeNodeDataByTerm(term, selectedLanguage, parentKey);

          termTreeNode = addTreeNode({
            treeDataSource: termTreeNode,
            treeNode: dragNode.children,
            parentKey: dragKey,
            method: 'replace'
          });
          // eslint-disable-next-line require-atomic-updates
          newTreeData = addTreeNode({
            treeDataSource: newTreeData,
            treeNode: termTreeNode,
            parentKey,
            method: 'replace'
          });
        }
      }

      const refreshTermIds = [];
      if (oldParentKey) {
        refreshTermIds.push(oldParentKey);
      }
      if (parentKey !== 'root') {
        refreshTermIds.push(parentKey);
      }
      if (refreshTermIds.length > 0) {
        const { treeData, noChildrenNodeKeys } = await refreshTermNodeByTermId(newTreeData, refreshTermIds);
        // eslint-disable-next-line require-atomic-updates
        newTreeData = treeData;
        if (noChildrenNodeKeys.length > 0) {
          // eslint-disable-next-line require-atomic-updates
          loadedKeys = loadedKeys.filter((key: string) => !noChildrenNodeKeys.includes(key));
          // eslint-disable-next-line require-atomic-updates
          expandedKeys = expandedKeys.filter((key: string) => !noChildrenNodeKeys.includes(key));
        }
      }
      setTreeProps(prevState => ({
        ...prevState,
        treeData: newTreeData,
        expandedKeys,
        loadedKeys
      }));
    } catch (error) {
      const errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
      message.error(errorTip);
    }
  };

  /** 重命名按钮 */
  const renameTermNode = (node: TermTreeNodeType, isInput: boolean) => {
    const newTermNode: TermTreeNodeType = {
      ...node,
      isInput
    };
    const treeDataSource = _.cloneDeep(treeProps.treeData);
    const newTreeData = updateTreeData({
      treeDataSource,
      treeNode: newTermNode,
      replaceKey: node.key
    });
    setTreeProps(prevState => ({
      ...prevState,
      treeData: newTreeData
    }));
  };

  // 添加节点
  const addItem = _.debounce(async (parentNodeKey?: string) => {
    const { treeData, loadedKeys } = getLatestTreeProps();
    // if (errorRef.current || editingStatus.current) return;
    if (editingStatus.current) return;
    openEditingStatus();
    let treeDataSource = _.cloneDeep(treeData);
    const addNode: any = {
      isInput: true,
      key: 'temp',
      children: [],
      title: '',
      isLeaf: true
    };
    if (!parentNodeKey) {
      const newTreeData: any = addTreeNode({
        treeDataSource,
        treeNode: [addNode]
      });
      setTreeProps(prevState => ({
        ...prevState,
        treeData: newTreeData,
        loading: false
      }));
      return;
    }

    addNode.parentKey = parentNodeKey;

    if (!loadedKeys.includes(parentNodeKey)) {
      // 看选中的节点是否有children，有的话  需要先展开显示children
      const termTreeNodeData = getTermTreeNodeByTermId(treeDataSource, parentNodeKey!)!;
      const termData = termTreeNodeData.sourceData!;
      if (termData.level.child_count > 0) {
        treeDataSource = await onLoadTreeData({ key: parentNodeKey });
        if (!treeDataSource) return;
      }
    }
    const newTreeData = addTreeNode({
      treeDataSource,
      treeNode: [addNode],
      parentKey: parentNodeKey
    });
    const expands = treeProps.expandedKeys.includes(parentNodeKey)
      ? treeProps.expandedKeys
      : [parentNodeKey, ...treeProps.expandedKeys];
    const loaded = treeProps.loadedKeys.includes(parentNodeKey)
      ? treeProps.loadedKeys
      : [parentNodeKey, ...treeProps.loadedKeys];
    setTreeProps(prevState => ({
      ...prevState,
      treeData: newTreeData,
      expandedKeys: expands,
      loadedKeys: loaded,
      loading: false
    }));
  }, 250);

  /**
   * 非编辑模式下解除按钮禁用操作
   */
  useUpdateEffect(() => {
    if (!treeProps.editing) {
      operateBtnDisabledRef.current = false;
    }
  }, [treeProps.editing]);

  // 监听添加节点的输入
  const handleCreateTerm = _.debounce(async (value: any, node: TermTreeNodeType, error?: string) => {
    const inputValue = value.trim();
    if (!inputValue) {
      dropdownInputRef.current?.setError(intl.get('glossary.notNull'));
      operateBtnDisabledRef.current = false;
      return;
    }
    if (error) {
      operateBtnDisabledRef.current = false;
      return;
    }
    if (inputValue === node.title) {
      // 说明没有修改名字
      renameTermNode(node, false);
      closeEditingStatus();
      operateBtnDisabledRef.current = false;
      return;
    }
    if (node.key === 'temp') {
      // 说明是新增树节点
      try {
        const param: any = {
          name: inputValue,
          language: selectedLanguage
        };
        if (node.parentKey) {
          param.parent = node.parentKey;
        }
        const data = await createTerm(glossaryData!.id, param);
        if (data) {
          refreshTermTreeAfterAddUpdate(data.res, 'temp', node.parentKey);
        }
        operateBtnDisabledRef.current = false;
      } catch (error) {
        const { ErrorCode, ErrorDetails } = error.type === 'message' ? error.response : error.data;
        // eslint-disable-next-line require-atomic-updates
        errorRef.current = ErrorDetails;
        if (ErrorCode.includes('DuplicateName')) {
          dropdownInputRef.current?.setError(intl.get('glossary.glossaryDuplicateName'));
          // closeEditingStatus();
        } else {
          message.error(ErrorDetails);
          // 新增时 报错的话，移除新增的节点
          refreshTermTreeAfterDelete(node.key, 'delete_sub');
          closeEditingStatus();
        }
        operateBtnDisabledRef.current = false;
      }
    } else {
      try {
        const nodeLabelData = node.sourceData!.label.find(item => item.language === selectedLanguage);
        let param: EditTermParamType;
        if (nodeLabelData) {
          param = {
            action: 'update',
            language: selectedLanguage,
            label: {
              name: inputValue,
              description: nodeLabelData.description,
              synonym: nodeLabelData.synonym
            }
          };
        } else {
          param = {
            action: 'add',
            language: selectedLanguage,
            label: {
              name: inputValue,
              description: '',
              synonym: []
            }
          };
        }
        const data = await editTerm(glossaryData!.id, node.key, param);
        refreshTermTreeAfterAddUpdate(node.key, node.key, node.parentKey);
        operateBtnDisabledRef.current = false;
      } catch (error) {
        const { ErrorCode, ErrorDetails } = error.type === 'message' ? error.response : error.data;
        if (ErrorCode.includes('DuplicateName')) {
          dropdownInputRef.current?.setError(intl.get('glossary.glossaryDuplicateName'));
        } else {
          message.error(ErrorDetails);
          // closeEditingStatus();
        }
        operateBtnDisabledRef.current = false;
      }
    }
  }, 100);

  const openEditingStatus = () => {
    editingStatus.current = true;
    setTreeProps(prevState => ({
      ...prevState,
      editing: true
    }));
  };

  const closeEditingStatus = () => {
    editingStatus.current = false;
    setTreeProps(prevState => ({
      ...prevState,
      editing: false
    }));
  };

  // 自定义节点
  const titleRender = (node: TermTreeNodeType) => {
    const { title, key, isInput, sourceData } = node;
    const nodeTitle = sourceData ? getTermNameByLanguage(sourceData, selectedLanguage) : title;
    if (isInput) {
      return (
        <div key={key} className="kw-align-center kw-bg-white kw-pl-1" onClick={e => e.stopPropagation()}>
          <IconFont type="icon-shuyu" className="kw-mr-2" />
          <DropdownInput
            initValue={nodeTitle}
            ref={dropdownInputRef}
            size="small"
            onChange={() => {
              errorRef.current = '';
            }}
          />
          <span
            className="kw-pointer kw-pl-3 kw-pr-3"
            title={intl.get('global.save')}
            onClick={_.debounce(e => {
              if (operateBtnDisabledRef.current) return;
              operateBtnDisabledRef.current = true;
              e.stopPropagation();
              const value = dropdownInputRef.current?.getValue();
              const error = dropdownInputRef.current?.getError();
              handleCreateTerm(value, node, error);
            }, 300)}
          >
            <CheckOutlined style={{ fontSize: 14 }} className="kw-c-primary" />
          </span>
          <span
            className="kw-pointer"
            title={intl.get('global.cancel')}
            onClick={e => {
              e.stopPropagation();
              errorRef.current = '';
              if (node.key === 'temp') {
                refreshTermTreeAfterDelete(node.key, 'delete_sub');
              } else {
                renameTermNode(node, false);
                operateBtnDisabledRef.current = false;
              }
              closeEditingStatus();
            }}
          >
            <CloseOutlined style={{ fontSize: 14 }} />
          </span>
        </div>
      );
    }
    return (
      <div
        key={key}
        className={`${prefixCls}-nodeTitle kw-align-center kw-pl-1 kw-pr-1`}
        style={{ minWidth: 150, width: '100%' }}
      >
        <IconFont type="icon-shuyu" />
        <div className="kw-ellipsis kw-flex-item-full-width kw-pl-2" title={title}>
          {nodeTitle}
        </div>
        {!readOnly && !operateBtnDisabled && (
          <Dropdown
            overlay={() => overlay(node)}
            trigger={['click']}
            placement="bottomRight"
            // getPopupContainer={e => e?.parentElement || document.body}
          >
            <div
              className={`${prefixCls}-operate kw-center`}
              onClick={e => {
                e.stopPropagation();
              }}
            >
              <EllipsisOutlined />
              {/* <IconFont type="icon-caozuo1" /> */}
            </div>
          </Dropdown>
        )}
      </div>
    );
  };

  /** 选中节点 */
  const onSelect = (keys: any[], e: any) => {
    if (editingStatus.current) {
      return;
    }
    const { selectedNodes, selected, node } = e;
    if (checkable) {
      // 说明开启了复选框
      let checkedKeyArr = checkedControl ? checkedKeys : treeProps.checkedKeys;
      if (checkedKeyArr.includes(node.key)) {
        checkedKeyArr = checkedKeyArr.filter(item => item !== node.key);
      } else {
        checkedKeyArr.push(node.key);
      }
      onTreeNodeCheck({ checked: [...checkedKeyArr] });
      return;
    }
    if (selected) {
      const nodes = _.cloneDeep(selectedNodes);
      setTreeProps(prevState => ({
        ...prevState,
        selectKeys: [...keys]
      }));
      onTreeNodeSelect?.(nodes);
    } else {
      setTreeProps(prevState => ({
        ...prevState,
        selectKeys: []
      }));
      onTreeNodeSelect?.([]);
    }
  };

  const onLoadTreeData = (node: any) => {
    const { treeData } = getLatestTreeProps();
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<any>(async resolve => {
      try {
        const treeDataSource = _.cloneDeep(treeData);
        const data = await getTermChildByTermIds(glossaryData!.id, node.key);
        const termData = data.res[node.key];
        const termNode = generateTreeNodeDataByTerm(termData, selectedLanguage, node.key);
        const newTreeData = addTreeNode({
          treeDataSource,
          treeNode: termNode,
          parentKey: node.key
        });
        setTreeProps(prevState => ({
          ...prevState,
          treeData: newTreeData
        }));
        resolve(newTreeData);
      } catch (error) {
        const errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
        message.error(errorTip);
        resolve(false);
      }
    });
  };

  /** 删除术语 */
  const handleDeleteTerm = async () => {
    const { loadedKeys } = getLatestTreeProps();
    const deleteNodeKey = deleteModalProps.node!.key;
    let treeDataSource;
    // 删除之前保留被删除节点的子节点
    if (
      deleteModalProps.radioValue === 'delete_one' &&
      deleteNodeKey !== 'temp' &&
      !loadedKeys.includes(deleteNodeKey)
    ) {
      const termData = deleteModalProps.node!.sourceData!;
      if (termData.level.child_count > 0) {
        treeDataSource = await onLoadTreeData({ key: deleteNodeKey });
        if (!treeDataSource) return;
      }
    }
    try {
      await deleteTerm(glossaryData!.id, {
        word_ids: [deleteModalProps.node!.key],
        delete_option: deleteModalProps.radioValue as any
      });
      message.success(intl.get('global.deleteSuccess'));
      setDeleteModalProps(prevState => ({
        ...prevState,
        confirmVisible: false,
        tipsVisible: false,
        radioValue: 'delete_one'
      }));
      refreshTermTreeAfterDelete(deleteNodeKey, deleteModalProps.radioValue);
    } catch (error) {
      const errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
      message.error(errorTip);
    }
  };

  /** 删除术语树节点之后，刷新术语树 */
  const refreshTermTreeAfterDelete = async (deleteNodeKey: string, delete_option: string) => {
    const { treeData } = getLatestTreeProps();
    const treeDataSource = _.cloneDeep(treeData);
    const { newTreeDataSource, deleteExpandedKey, deleteLoadedKey, deleteNodeParentKey } = deleteTreeNode({
      treeDataSource,
      deleteNodeKey,
      delete_option
    });
    let newTreeData = newTreeDataSource;
    if (deleteNodeParentKey && deleteNodeKey !== 'temp') {
      const { treeData, noChildrenNodeKeys } = await refreshTermNodeByTermId(newTreeData, [deleteNodeParentKey]);
      // eslint-disable-next-line require-atomic-updates
      newTreeData = treeData;
    }
    setTreeProps(prevState => ({
      ...prevState,
      treeData: newTreeData,
      expandedKeys: prevState.expandedKeys.filter(item => item !== deleteExpandedKey),
      loadedKeys: prevState.loadedKeys.filter(item => item !== deleteLoadedKey)
    }));
    if (selectedTerm && selectedTerm.length > 0 && selectedTerm[0]) {
      const term = selectedTerm[0];
      if (deleteNodeKey === term.id) {
        // onTreeNodeSelect?.([]);
        onSelect([], { selected: false });
      }
    }
  };

  const onSearchName = _.debounce(async inputValue => {
    if (!inputValue) {
      setTreeProps(prevState => ({
        ...prevState,
        searchTreeData: [],
        searchValue: inputValue
      }));
      return;
    }
    try {
      setTreeProps(prevState => ({
        ...prevState,
        loading: true
      }));
      const data = await searchTerm(glossaryData!.id, {
        query: inputValue,
        field: 'displayed',
        language: selectedLanguage
      });
      const treeDataSource = generateTreeNodeDataByTerm(data.res, selectedLanguage);
      setTreeProps(prevState => ({
        ...prevState,
        searchTreeData: treeDataSource.map(item => ({ ...item, isLeaf: true })),
        searchValue: inputValue,
        loading: false
      }));
    } catch (error) {
      const errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
      message.error(errorTip);
      setTreeProps(prevState => ({
        ...prevState,
        loading: false
      }));
    }
  }, 300);

  const onTreeNodeCheck = ({ checked }: any) => {
    if (!checkedControl) {
      setTreeProps(prevState => ({
        ...prevState,
        checkedKeys: checked
      }));
    }
    onCheck?.(checked);
  };

  const operateBtnDisabled = useMemo(() => {
    let disdabled = false;
    const loop = (data: TermTreeNodeType[]) => {
      data.forEach(item => {
        if (item.isInput && !disdabled) {
          disdabled = true;
          // return disdabled;
        }
        if (item.children && item.children.length > 0) {
          loop(item.children);
        }
      });
    };
    loop(treeProps.treeData);
    return disdabled;
  }, [treeProps.treeData]);

  const renderContent = () => {
    if (treeProps.loading) {
      return <LoadingMask loading />;
    }
    if (treeProps.searchValue && treeProps.searchTreeData.length === 0) {
      return <NoDataBox imgSrc={require('@/assets/images/noResult.svg').default} desc={intl.get('global.noResult')} />;
    }
    if (treeProps.treeData.length > 0) {
      return (
        <Tree
          checkable={checkable}
          checkedKeys={checkedControl ? checkedKeys : treeProps.checkedKeys}
          checkStrictly
          loadedKeys={treeProps.loadedKeys}
          loadData={onLoadTreeData}
          draggable={!readOnly && !operateBtnDisabled}
          showLine={{
            showLeafIcon: false
          }}
          blockNode
          showIcon
          onDrop={handleDrop}
          treeData={treeProps.searchValue ? treeProps.searchTreeData : treeProps.treeData}
          expandedKeys={treeProps.expandedKeys}
          selectedKeys={treeProps.selectKeys}
          switcherIcon={<DownOutlined />}
          titleRender={titleRender}
          onSelect={onSelect}
          onExpand={(expandedKeys: any) => {
            setTreeProps(prevState => ({
              ...prevState,
              expandedKeys
            }));
          }}
          onLoad={(loadedKeys: any) => {
            setTreeProps(prevState => ({
              ...prevState,
              loadedKeys
            }));
          }}
          onCheck={onTreeNodeCheck}
        />
      );
    }

    const createTermTips = intl.get('glossary.createTermTips').split('|');

    return (
      <div className="kw-flex-item-full-height">
        <NoDataBox
          style={{ marginTop: 120 }}
          imgSrc={require('@/assets/images/addTerm.svg').default}
          desc={
            <div>
              {createTermTips[0]}
              <span className="kw-c-primary kw-pointer" onClick={() => addItem()}>
                {createTermTips[1]}
              </span>
              {createTermTips[2]}
            </div>
          }
        />
      </div>
    );
  };

  const overlayDrop = (
    <Menu
      selectedKeys={[selectedLanguage]}
      onClick={({ key }) => {
        setGlossaryStore(preStore => ({
          ...preStore,
          selectedLanguage: key
        }));
      }}
    >
      {languageOptions.map(item => (
        <Menu.Item key={item.value}>{item.label}</Menu.Item>
      ))}
    </Menu>
  );

  return (
    <div className={`${prefixCls} kw-w-100 kw-h-100 kw-flex-column`}>
      {showSearch && (
        <div className={`${prefixCls}-search`}>
          <SearchInput
            placeholder={intl.get('glossary.searchTermPlaceholder')}
            bordered={false}
            style={{ width: '100%', borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}
            onChange={(e: any) => {
              e?.stopPropagation();
              onSearchName(e.target.value);
            }}
          />
        </div>
      )}
      <div className={`${prefixCls}-tree kw-flex-item-full-height kw-flex-column`}>
        {headerVisible && (
          <div className="tree-list-title-box kw-mb-3 kw-space-between">
            <div className="tree-list-title">{intl.get('glossary.termList')}</div>
            <div className="kw-align-center">
              {!readOnly && (
                <Format.Button
                  className="add-btn kw-p-0"
                  disabled={operateBtnDisabled}
                  tip={intl.get('glossary.addTerm')}
                  type="icon"
                  onClick={() => addItem(treeProps.selectKeys[0] as string)}
                >
                  <IconFont type="icon-Add" />
                </Format.Button>
              )}
              <Dropdown overlay={overlayDrop} trigger={['click']} placement="bottomRight">
                <Format.Button className="kw-ml-1" type="icon">
                  <IconFont type="icon-yuyan2" />
                </Format.Button>
              </Dropdown>
            </div>
          </div>
        )}

        <div className="kw-flex-item-full-height kw-flex-column" style={{ overflow: 'auto' }}>
          {renderContent()}
          {treeProps.treeData.length > 0 && (
            <span
              className="kw-flex-item-full-height"
              onClick={() => {
                setTreeProps(prevState => ({
                  ...prevState,
                  selectKeys: []
                }));
                onTreeNodeSelect?.([]);
              }}
            />
          )}
        </div>
      </div>
      <UniversalModal
        title={intl.get('glossary.deleteTerm')}
        open={deleteModalProps.confirmVisible}
        onCancel={() => {
          setDeleteModalProps(prevState => ({
            ...prevState,
            confirmVisible: false
          }));
        }}
        footerData={[
          {
            label: intl.get('global.cancel'),
            type: 'default',
            onHandle: () => {
              setDeleteModalProps(prevState => ({
                ...prevState,
                confirmVisible: false
              }));
            }
          },
          {
            label: intl.get('global.ok'),
            type: 'primary',
            onHandle: _.debounce(handleDeleteTerm, 300)
          }
        ]}
      >
        <div className="kw-c-header kw-mb-2">{intl.get('glossary.deleteTermConfirmTitle')}</div>
        <Radio.Group
          value={deleteModalProps.radioValue}
          onChange={e => {
            setDeleteModalProps(prevState => ({
              ...prevState,
              radioValue: e.target.value
            }));
          }}
        >
          <Space direction="vertical">
            <Radio value="delete_one">{intl.get('glossary.deleteTermOption1')}</Radio>
            <Radio value="delete_sub">{intl.get('glossary.deleteTermOption2')}</Radio>
          </Space>
        </Radio.Group>
      </UniversalModal>
      <TipModal
        title={intl.get('glossary.deleteTermTipsTitle')}
        content={intl.get('glossary.deleteTermTipsContent')}
        open={deleteModalProps.tipsVisible}
        onCancel={() => {
          setDeleteModalProps(prevState => ({
            ...prevState,
            tipsVisible: false
          }));
        }}
        onOk={_.debounce(handleDeleteTerm, 300)}
      />
    </div>
  );
});
export default GlossaryTree;
