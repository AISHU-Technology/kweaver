/* eslint-disable max-lines */
import React, { useEffect, useState } from 'react';
import './style.less';
import { Tabs, Button, Input, Avatar, Tree, Badge, Tooltip, Menu, Dropdown } from 'antd';
import classNames from 'classnames';
import {
  SwapOutlined,
  DownOutlined,
  ExclamationCircleOutlined,
  CheckOutlined,
  ExclamationCircleFilled,
  BarsOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { useKnowledgeMapContext } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KnowledgeMapContext';
import servicesCreateEntity from '@/services/createEntity';
import IconFont from '@/components/IconFont';
import Format from '@/components/Format';
import {
  DataFileErrorsProps,
  DataFileType,
  G6EdgeData,
  G6NodeData
} from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/types';
import _ from 'lodash';
import useDeepCompareEffect from '@/hooks/useDeepCompareEffect';
import intl from 'react-intl-universal';
import useLatestState from '@/hooks/useLatestState';
import NoDataBox from '@/components/NoDataBox';

const { TreeNode } = Tree;
const { Search } = Input;

interface OntologyListProps {
  onCancelSelected: () => void;
}

const OntologyList: React.FC<OntologyListProps> = ({ onCancelSelected }) => {
  const {
    knowledgeMapStore: {
      graphG6Data,
      g6RelationDataFileObj,
      currentStep,
      selectedG6Node,
      selectedG6Edge,
      selectedModel,
      selectedG6ModelNode,
      selectedG6ModelEdge,
      ontologyDisplayType,
      flow4ErrorList
    },
    setKnowledgeMapStore,
    getLatestStore
  } = useKnowledgeMapContext();
  const prefixLocale = 'workflow.knowledgeMap';
  const [allModel, setAllModel] = useState<Record<string, string>>({});
  const [tabProps, setTabProps] = useState({
    data: [
      { label: intl.get(`${prefixLocale}.ontoListTab1`), value: 'custom' },
      { label: intl.get(`${prefixLocale}.ontoListTab2`), value: 'model' }
    ],
    selectedKey: 'custom'
  });
  const [treeProps, setTreeProps, getLatestTreeProps] = useLatestState<any>({
    custom: {
      treeData: [], // 树原始数据源，用于渲染
      flatTreeData: [], // 树数据源扁平版，用于后续遍历
      expandedKeys: [],
      selectedKeys: [],
      searchValue: '',
      filterMenu: 'all'
    },
    model: {
      treeData: [],
      flatTreeData: [],
      expandedKeys: [],
      selectedKeys: [],
      searchValue: '',
      filterMenu: 'all'
    }
  });
  const prefixCls = 'ontology-list';

  useEffect(() => {
    getAllModel();
  }, []);

  useEffect(() => {
    generateTreeDataSource();
  }, [graphG6Data, allModel]);

  useDeepCompareEffect(() => {
    setTreeProps((preState: any) => ({ ...preState }));
  }, [g6RelationDataFileObj]);

  useEffect(() => {
    const { selectedModel, selectedG6Node, selectedG6Edge } = getLatestStore();
    let tabKey = tabProps.selectedKey;
    if (!selectedModel.length && !selectedG6Node.length && !selectedG6Edge.length) {
      const latestTreeProps = getLatestTreeProps();
      if (latestTreeProps.custom.treeData.length === 0) {
        tabKey = '';
      }
      if (latestTreeProps.model.treeData.length > 0) {
        if (!tabKey) {
          tabKey = 'model';
        }
      }
    }
    if (selectedG6Node.length > 0) {
      tabKey = 'custom';
    }
    if (selectedG6Edge.length > 0) {
      tabKey = 'custom';
    }
    if (selectedModel.length > 0) {
      tabKey = 'model';
    }
    if (!tabKey) return;
    setTabProps(prevState => ({
      ...prevState,
      selectedKey: tabKey
    }));
    selectedTreeNodeScrollIntoView();
  }, [ontologyDisplayType]);

  /**
   * 切换上一步，再返回后  恢复默认过滤条件
   */
  useEffect(() => {
    setTreeProps((preState: any) => ({
      ...preState,
      custom: {
        ...preState.custom,
        searchValue: '',
        filterMenu: 'all'
      },
      model: {
        ...preState.model,
        searchValue: '',
        filterMenu: 'all'
      }
    }));
  }, [currentStep]);

  /**
   * 根据selectedG6Edge 与 selectedG6Node设置树节点展开与选中状态
   */
  useEffect(() => {
    let key = '';
    const tabKey = tabProps.selectedKey;
    if (selectedG6Node.length > 0) {
      // tabKey = 'custom';
      key = selectedG6Node[0]._sourceData.name;
    }
    if (selectedG6Edge.length > 0) {
      // tabKey = 'custom';
      const { edgeData } = selectedG6Edge[0];
      key = edgeData._sourceData.edge_id.toString();
    }
    if (selectedModel.length > 0) {
      // tabKey = 'model';
      if (selectedG6ModelNode.length > 0) {
        key = selectedG6ModelNode[0]._sourceData.name;
      }
      if (selectedG6ModelEdge.length > 0) {
        const { edgeData } = selectedG6ModelEdge[0];
        key = edgeData._sourceData.edge_id.toString();
      }
    }
    if (!tabKey) return;
    // setTabProps(prevState => ({ ...prevState, selectedKey: tabKey }));
    const flatTreeData = treeProps[tabKey].flatTreeData;
    const matchedTreeNode = flatTreeData.filter((item: any) => {
      if (item._sourceData?.relations) {
        return item._sourceData?.edge_id.toString() === key;
      }
      return item._sourceData?.name === key;
    });
    let newExpandedKeys: string[] = treeProps[tabKey].expandedKeys;
    matchedTreeNode.forEach((item: any) => {
      newExpandedKeys = [...newExpandedKeys, ...item.parentKeyPath];
    });
    setTreeProps((preState: any) => ({
      ...preState,
      [tabKey]: {
        ...preState[tabKey],
        selectedKeys: key ? [key] : [],
        expandedKeys: Array.from(new Set(newExpandedKeys))
      }
    }));
  }, [selectedG6Edge, selectedG6Node, selectedModel, tabProps.selectedKey]);

  /**
   * 根据选中的tab，搜索的值和过滤菜单选中项，同时获取treeData
   */
  useDeepCompareEffect(() => {
    updateTreeData();
  }, [
    tabProps.selectedKey,
    treeProps[tabProps.selectedKey].searchValue,
    treeProps[tabProps.selectedKey].filterMenu,
    treeProps[tabProps.selectedKey].flatTreeData
  ]);

  /**
   * 选中的树节点滚动到视觉范围内
   */
  const selectedTreeNodeScrollIntoView = () => {
    const treeNodeDom = document.querySelector('.ontology-list .ant-tree-treenode.ant-tree-treenode-selected');
    if (treeNodeDom) {
      treeNodeDom.scrollIntoView();
    }
  };

  const updateTreeData = () => {
    const { g6RelationDataFileObj, flow4ErrorList } = getLatestStore();
    const flatTreeData = treeProps[tabProps.selectedKey].flatTreeData;
    const searchValue = treeProps[tabProps.selectedKey].searchValue;
    const filterMenu = treeProps[tabProps.selectedKey].filterMenu;
    let matchedTreeNode: any; // 匹配到的最终树节点数据
    let newExpandedKeys: string[] = [];
    // 先处理搜索的值
    if (!searchValue) {
      matchedTreeNode = flatTreeData;
    } else {
      matchedTreeNode = flatTreeData.filter(
        (item: any) => item.title?.includes(searchValue) || item.label?.includes(searchValue)
      );
      matchedTreeNode.forEach((item: any) => {
        newExpandedKeys = [...newExpandedKeys, ...item.parentKeyPath];
      });
    }

    // 再处理过滤菜单项
    const errorClassNames = flow4ErrorList.map(item => item.name);
    matchedTreeNode = matchedTreeNode.filter((item: any) => {
      if (item.modelTree) {
        return false;
      }
      const relations = item._sourceData.relations;
      const name = item.modelTree ? item.key : relations ? String(item._sourceData.edge_id) : item._sourceData.name;
      if (filterMenu === 'config') {
        return !!g6RelationDataFileObj[name] && !errorClassNames.includes(name);
      }
      if (filterMenu === 'unConfig') {
        return !g6RelationDataFileObj[name] || errorClassNames.includes(name);
      }
      return true;
    });

    if (tabProps.selectedKey === 'model') {
      const modelTreeNode = flatTreeData.filter((item: any) => item.modelTree);
      // 匹配到的树节点中是模型节点名称
      const modelName: string[] = [];
      matchedTreeNode.forEach((item: any) => {
        if (!item.modelTree && item._sourceData.model && !modelName.includes(item._sourceData.model)) {
          modelName.push(item._sourceData.model);
        }
      });
      if (modelName.length > 0) {
        const targetModelTreeNode = modelTreeNode.filter((item: any) => modelName.includes(item.key));
        targetModelTreeNode.forEach((item: any) => {
          const targetNode = matchedTreeNode.find((node: any) => node.modelTree && item.key === node.key);
          if (!targetNode) {
            matchedTreeNode.push(item);
          }
        });
      }
    }

    setTreeProps((prevState: any) => ({
      ...prevState,
      [tabProps.selectedKey]: {
        ...prevState[tabProps.selectedKey],
        expandedKeys: Array.from(new Set([...newExpandedKeys, ...prevState[tabProps.selectedKey].expandedKeys])),
        treeData: generateTreeDataFromFlatTree(_.cloneDeep(matchedTreeNode))
      }
    }));

    let isCancelSelected = true;

    if (selectedG6Node.length > 0) {
      // 根据matchedTreeNode 是否含有当前选中的节点或边判断是否取消选中
      const treeNode = matchedTreeNode.find((item: any) => {
        if (!item.modelTree && item._sourceData.name === selectedG6Node[0]._sourceData.name) {
          return true;
        }
        return false;
      });
      if (treeNode) {
        isCancelSelected = false;
      }
    }
    if (selectedG6Edge.length > 0) {
      const { edgeData } = selectedG6Edge[0];
      // 根据matchedTreeNode 是否含有当前选中的节点或边判断是否取消选中
      const treeNode = matchedTreeNode.find((item: any) => {
        if (!item.modelTree && item._sourceData.name === edgeData._sourceData.name) {
          return true;
        }
        return false;
      });
      if (treeNode) {
        isCancelSelected = false;
      }
    }
    if (selectedModel.length > 0) {
      // 根据matchedTreeNode 是否含有当前选中的节点或边判断是否取消选中
      const treeNode = matchedTreeNode.find((item: any) => {
        if (!item.modelTree && item._sourceData.model === selectedModel[0]) {
          return true;
        }
        return false;
      });
      if (treeNode) {
        isCancelSelected = false;
      }
    }
    if (isCancelSelected) {
      cancelSelect();
    }
  };

  /**
   * 生成树的数据源
   */
  const generateTreeDataSource = () => {
    const graphG6DataEdges = graphG6Data.edges?.map(edge => ({
      ...edge,
      sourceNodeLabel: (graphG6Data.nodes?.find(node => node.id === edge.source) as G6NodeData)?._sourceData.alias,
      targetNodeLabel: (graphG6Data.nodes?.find(node => node.id === edge.target) as G6NodeData)?._sourceData.alias
    }));
    const modelDataNodes = graphG6Data.nodes?.filter((node: any) => !!node._sourceData.model) as any;
    const modelDataEdges = graphG6DataEdges?.filter((edge: any) => !!edge._sourceData.model) as any;

    const newModelDataNodes = modelDataNodes.map((node: any) => {
      return {
        ...node,
        children: modelDataEdges.filter((edge: any) => edge.source === node.id),
        parentTreeNodeKeyPath: [] // 用于记录当前节点所在的父节点的key路径，用于后续获取tree的 expandedKeys
      };
    });

    const modelTreeData = Object.keys(allModel).map(modelKey => {
      return {
        modelTree: true,
        icon: <IconFont type="graph-model" style={{ fontSize: 20 }} />,
        title: allModel[modelKey],
        key: modelKey,
        children: newModelDataNodes.filter((node: any) => node._sourceData.model === modelKey)
      };
    });

    const customDataNodes = graphG6Data.nodes?.filter((node: any) => !node._sourceData.model) as any;
    const customDataEdges = graphG6DataEdges?.filter((edge: any) => !edge._sourceData.model) as any;

    const customTree = customDataNodes.map((node: any) => {
      return {
        ...node,
        children: customDataEdges.filter((edge: any) => edge.source === node.id)
      };
    });

    const modelTree = modelTreeData.filter(item => item.children.length > 0);
    setTreeProps((prevState: any) => ({
      ...prevState,
      custom: {
        ...prevState.custom,
        treeData: customTree,
        flatTreeData: flatTreeData(customTree)
      },
      model: {
        ...prevState.model,
        treeData: modelTree,
        flatTreeData: flatTreeData(modelTree)
      }
    }));
  };

  /**
   * 扁平树数据
   */
  const flatTreeData = (treeData: any[]) => {
    const result: any = [];
    const loop = (data: any, parentKeyPath: string[] = []) => {
      data.forEach((item: any) => {
        result.push({ ...item, parentKeyPath });
        if (item.children) {
          loop(item.children, [...parentKeyPath, item.modelTree ? item.key : item._sourceData.name]);
        }
      });
    };

    loop(treeData, []);
    return result;
  };

  /**
   * 从扁平树去生成树数据
   */
  const generateTreeDataFromFlatTree = (flatTreeData: any[]) => {
    const result: any = [];
    const cacheMap: any = {};
    // 先转成map存储
    for (const i of flatTreeData) {
      cacheMap[i.modelTree ? i.key : i.id] = { ...i, children: [] };
    }
    for (const i of flatTreeData) {
      const newItem = cacheMap[i.modelTree ? i.key : i.id];
      if (i.modelTree) {
        // 模型根节点
        result.push(newItem);
      } else if (_.isEmpty(i._sourceData.relations)) {
        // 实体作为子节点
        if (Object.prototype.hasOwnProperty.call(cacheMap, i._sourceData.model)) {
          cacheMap[i._sourceData.model].children.push(newItem);
        } else {
          // 实体作为根节点
          result.push(newItem);
        }
      } else {
        if (Object.prototype.hasOwnProperty.call(cacheMap, i.source)) {
          cacheMap[i.source].children.push(newItem);
        } else {
          if (i._sourceData.model) {
            cacheMap[i._sourceData.model].children.push(newItem);
          } else {
            result.push(newItem);
          }
        }
      }
    }
    return result;
  };

  const getAllModel = async () => {
    const { res } = (await servicesCreateEntity.fetchModelList()) || {};
    if (!res) return;
    setAllModel(res);
  };

  const getTreeNodeIcon = (treeNode: any) => {
    const relations = treeNode._sourceData.relations;
    const name = relations ? String(treeNode._sourceData.edge_id) : treeNode._sourceData.name;
    const dataFile = g6RelationDataFileObj[name];
    const targetError = flow4ErrorList.find(tips => tips.name === name);
    if (targetError) {
      return (
        <Tooltip placement="top" title={targetError.error}>
          <ExclamationCircleOutlined className={`${prefixCls}-error-sign`} />
        </Tooltip>
      );
    }
    if (dataFile) {
      return <CheckOutlined className={`${prefixCls}-pass-sign`} />;
    }
  };

  const renderTreeNode = (treeData: any, searchValue = '') => {
    const getTreeNodeTitle = (item: any) => {
      if (item.modelTree) {
        const strTitle = item.title as string;
        const index = strTitle.indexOf(searchValue);
        const beforeStr = strTitle.substring(0, index);
        const afterStr = strTitle.slice(index + searchValue.length);
        const title =
          index > -1 ? (
            <>
              {beforeStr}
              <span className={`${prefixCls}-tree-search-value`}>{searchValue}</span>
              {afterStr}
            </>
          ) : (
            strTitle
          );
        return (
          <span className="kw-align-center">
            {item.icon}
            <span className="kw-ml-1">{title}</span>
          </span>
        );
      }
      if (item.source) {
        // 说明是边
        const strTitle = item._sourceData.alias as string;
        const index = strTitle.indexOf(searchValue);
        const beforeStr = strTitle.substring(0, index);
        const afterStr = strTitle.slice(index + searchValue.length);
        const title =
          index > -1 ? (
            <>
              {beforeStr}
              <span className={`${prefixCls}-tree-search-value`}>{searchValue}</span>
              {afterStr}
            </>
          ) : (
            strTitle
          );
        const edgeLabelStr = `${item.sourceNodeLabel} > ${item.targetNodeLabel}`;
        return (
          <div className="kw-align-center" style={{ lineHeight: 1.2, height: 48 }}>
            <span className="kw-align-center kw-flex-item-full-width">
              <div className={`${prefixCls}-edge`} />
              <span className="kw-flex-item-full-width kw-flex-column kw-ml-2">
                <span className="kw-c-header kw-ellipsis" title={strTitle}>
                  {title}
                </span>
                <span
                  className="kw-c-subtext kw-align-center kw-ellipsis"
                  style={{ fontSize: 12 }}
                  title={edgeLabelStr}
                >
                  <Format.Text ellipsis subText style={{ maxWidth: '45%' }} title={item.sourceNodeLabel}>
                    {item.sourceNodeLabel}
                  </Format.Text>
                  <span>
                    <IconFont style={{ fontSize: 12 }} type="icon-fanye" />
                  </span>
                  <Format.Text
                    ellipsis
                    subText
                    style={{ maxWidth: '45%' }}
                    title={item.targetNodeLabel}
                    className={`${prefixCls}-endNodeEntity`}
                    onClick={e => {
                      e.stopPropagation();
                      const endNodeId = item.target;
                      const endNode: G6NodeData = graphG6Data.nodes!.find((node: G6NodeData) => node.id === endNodeId)!;
                      onTreeNodeSelect([endNode._sourceData.name], { node: { item: endNode } });
                    }}
                  >
                    {item.targetNodeLabel}
                  </Format.Text>
                </span>
              </span>
            </span>
            <span className="kw-ml-1">{getTreeNodeIcon(item)}</span>
          </div>
        );
      }
      const strTitle = item._sourceData.alias as string;
      const index = strTitle.indexOf(searchValue);
      const beforeStr = strTitle.substring(0, index);
      const afterStr = strTitle.slice(index + searchValue.length);
      const title =
        index > -1 ? (
          <>
            {beforeStr}
            <span className={`${prefixCls}-tree-search-value`}>{searchValue}</span>
            {afterStr}
          </>
        ) : (
          strTitle
        );
      return (
        <div className="kw-space-between">
          <span className="kw-align-center kw-flex-item-full-width">
            <Avatar size={14} style={{ background: item._sourceData.fillColor }} />
            <span className="kw-ml-1 kw-flex-item-full-width kw-ellipsis" title={strTitle}>
              {title}
            </span>
          </span>
          <span className="kw-ml-1">{getTreeNodeIcon(item)}</span>
        </div>
      );
    };
    return treeData.map((item: any) => (
      <TreeNode
        selectable={!item.modelTree}
        title={getTreeNodeTitle(item)}
        key={item.modelTree ? item.key : item._sourceData.relations ? item._sourceData.edge_id : item._sourceData.name}
        // @ts-ignore
        item={item}
      >
        {item.children?.length > 0 && renderTreeNode(item.children, searchValue)}
      </TreeNode>
    ));
  };

  const onTreeNodeSelect = (selectedKeys: React.Key[], e: any) => {
    if (selectedKeys.length === 0) {
      cancelSelect();
      return;
    }
    const data = e.node.item;
    if ('source' in data) {
      onEdgeClick(data);
    } else {
      onNodeClick(data);
    }
  };

  /**
   * 节点点击事件
   * @param evt
   */
  const onNodeClick = (nodeData: G6NodeData) => {
    // 对于从G6身上获取的数据，设置到store里面需要进行深拷贝一下，否则数据被冻结之后，G6内部不可以再自己添加属性导致报错
    // 详见官方回答：https://github.com/antvis/Graphin/issues/357
    const node = _.cloneDeep(nodeData);
    if (node._sourceData.model) {
      // 说明选中的是模型上面的实体
      setKnowledgeMapStore(prevState => {
        prevState.selectedModel = [node._sourceData.model];
        prevState.selectedG6ModelNode = [node];
        prevState.selectedG6ModelEdge = [];
        prevState.selectedG6Node = [];
        prevState.selectedG6Edge = [];
      });
    } else {
      setKnowledgeMapStore(prevState => {
        prevState.selectedModel = [];
        prevState.selectedG6ModelNode = [];
        prevState.selectedG6ModelEdge = [];
        prevState.selectedG6Node = [node as G6NodeData];
        prevState.selectedG6Edge = [];
      });
    }
  };

  /**
   * 边的点击事件
   * @param evt
   */
  const onEdgeClick = (edgeData: G6EdgeData) => {
    const selectedEdgeDataModel = _.cloneDeep(edgeData);
    const sourceNodeId = selectedEdgeDataModel?._sourceData?.startId;
    const targetNodeId = selectedEdgeDataModel?._sourceData?.endId;
    const startNode = graphG6Data.nodes!.find((node: G6NodeData) => node.id === sourceNodeId)!;
    const endNode = graphG6Data.nodes!.find((node: G6NodeData) => node.id === targetNodeId)!;
    if (selectedEdgeDataModel._sourceData.model) {
      // 说明选中的是模型上面的关系类
      setKnowledgeMapStore(prevState => {
        prevState.selectedModel = [selectedEdgeDataModel._sourceData.model];
        prevState.selectedG6ModelNode = [];
        prevState.selectedG6ModelEdge = [
          {
            edgeData: selectedEdgeDataModel,
            startNodeData: _.cloneDeep(startNode) as G6NodeData,
            endNodeData: _.cloneDeep(endNode) as G6NodeData
          }
        ];
        prevState.selectedG6Node = [];
        prevState.selectedG6Edge = [];
      });
    } else {
      setKnowledgeMapStore(prevState => ({
        ...prevState,
        selectedModel: [],
        selectedG6ModelNode: [],
        selectedG6ModelEdge: [],
        selectedG6Node: [],
        selectedG6Edge: [
          {
            edgeData: selectedEdgeDataModel,
            startNodeData: _.cloneDeep(startNode),
            endNodeData: _.cloneDeep(endNode)
          }
        ]
      }));
    }
  };

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // const flatTreeData = treeProps[tabProps.selectedKey].flatTreeData;
    // let matchedTreeNode: any;
    // let newExpandedKeys: string[] = [];
    // if (!value) {
    //   matchedTreeNode = flatTreeData;
    // } else {
    //   matchedTreeNode =
    // flatTreeData.filter((item: any) => item.title?.includes(value) || item.label?.includes(value));
    //   matchedTreeNode.forEach((item: any) => {
    //     newExpandedKeys = [...newExpandedKeys, ...item.parentKeyPath];
    //   });
    // }

    setTreeProps((prevState: any) => ({
      ...prevState,
      [tabProps.selectedKey]: {
        ...prevState[tabProps.selectedKey],
        // expandedKeys: Array.from(new Set([...newExpandedKeys, ...prevState[tabProps.selectedKey].expandedKeys])),
        searchValue: value
        // treeData: generateTreeDataFromFlatTree(_.cloneDeep(matchedTreeNode))
      }
    }));
  };

  const onTreeExpand = (expandedKeys: any) => {
    setTreeProps((prevState: any) => ({
      ...prevState,
      [tabProps.selectedKey]: {
        ...prevState[tabProps.selectedKey],
        expandedKeys
      }
    }));
  };

  const getTabText = (treeData: any, label: string) => {
    if (treeData.length === 0) {
      return (
        <Tooltip placement="top" title={intl.get(`${prefixLocale}.ontoListTabNoData`)}>
          <div className={`${prefixCls}-tab-text`}>
            <span>{label}</span>
          </div>
        </Tooltip>
      );
    }
    return label;
  };

  const cancelSelect = () => {
    const tabKey = tabProps.selectedKey;
    setTreeProps((preState: any) => ({
      ...preState,
      [tabKey]: {
        ...preState[tabKey],
        selectedKeys: []
      }
    }));
    onCancelSelected?.();
  };

  return (
    <div className={classNames(prefixCls, 'kw-w-100 kw-h-100 kw-border-r')}>
      <Tabs
        className={`${prefixCls}-tab`}
        size="small"
        tabBarExtraContent={
          <Tooltip title={intl.get('workflow.information.viewChange')} placement="top">
            <Format.Button
              type="icon"
              onClick={() => {
                setKnowledgeMapStore(preStore => ({
                  ...preStore,
                  ontologyDisplayType: 'g6'
                }));
              }}
            >
              <SwapOutlined />
            </Format.Button>
          </Tooltip>
        }
        activeKey={tabProps.selectedKey}
        onChange={(activeKey: string) => {
          setTabProps(prevState => ({ ...prevState, selectedKey: activeKey }));
        }}
      >
        {tabProps.data.map(item => (
          <Tabs.TabPane
            tab={getTabText(treeProps[item.value].treeData, item.label)}
            key={item.value}
            disabled={treeProps[item.value].treeData.length === 0}
          >
            <div className="kw-mb-2 kw-space-between kw-pl-5 kw-pr-5">
              <Input
                value={treeProps[item.value].searchValue}
                allowClear
                placeholder={intl.get(`${prefixLocale}.searchPlaceholder`)}
                onChange={onSearchChange}
                prefix={<IconFont style={{ color: 'rgba(0,0,0,0.25)' }} type="icon-sousuo" />}
              />
              <Dropdown
                placement="bottomLeft"
                overlay={
                  <Menu
                    selectedKeys={[treeProps[item.value].filterMenu]}
                    onClick={({ key }) => {
                      if (treeProps[item.value].filterMenu !== key) {
                        setTreeProps((prevState: any) => ({
                          ...prevState,
                          [item.value]: {
                            ...prevState[item.value],
                            filterMenu: key
                          }
                        }));
                      }
                    }}
                  >
                    <Menu.Item key="all">{intl.get(`${prefixLocale}.filterItemAll`)}</Menu.Item>
                    <Menu.Item key="config">{intl.get(`${prefixLocale}.filterItemConfig`)}</Menu.Item>
                    <Menu.Item key="unConfig">{intl.get(`${prefixLocale}.filterItemNoConfig`)}</Menu.Item>
                  </Menu>
                }
              >
                <Format.Button type="icon">
                  <IconFont type="icon-shaixuan" />
                </Format.Button>
              </Dropdown>
            </div>
            <Tree
              // className="kw-flex-item-full-height"
              onSelect={onTreeNodeSelect}
              onExpand={onTreeExpand}
              expandedKeys={treeProps[item.value].expandedKeys}
              selectedKeys={treeProps[item.value].selectedKeys}
              blockNode
              switcherIcon={<DownOutlined />}
              treeData={renderTreeNode(treeProps[item.value].treeData, treeProps[item.value].searchValue)}
            />
            {/* {renderTreeNode(treeProps[item.value].treeData, treeProps[item.value].searchValue)}
            </Tree> */}
            <div onClick={cancelSelect} className={`${prefixCls}-placeholder`}>
              {treeProps[item.value].treeData.length === 0 && (
                <div className="kw-w-100 kw-h-100 kw-center">
                  <NoDataBox
                    imgSrc={require('@/assets/images/empty.svg').default}
                    desc={intl.get(`${prefixLocale}.treeNoDataTip`)}
                    className="kw-m-0"
                  />
                </div>
              )}
            </div>
          </Tabs.TabPane>
        ))}
      </Tabs>
    </div>
  );
};

export default OntologyList;
