/* eslint-disable max-lines */
/**
 * 认知搜索配置弹窗
 * @author Jason.ji
 * @date 2022/06/06
 *
 */

import React, { memo, useState, useEffect, useRef, useReducer, forwardRef, useImperativeHandle } from 'react';
import { Button, Modal, ConfigProvider, Tabs, Switch, Pagination } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { fuzzyMatch } from '@/utils/handleFunction';
import SearchInput from '@/components/SearchInput';
import ScrollBar from '@/components/ScrollBar';
import { tipModalFunc } from '@/components/TipModal';
import ConfigGraph from '../ConfigGraph';
import BaseInfo from './BaseInfo';
import {
  mergeGraph,
  boolCheckStatus,
  sortData,
  handleHighlight,
  handleAbleEdge,
  compareConfig,
  onJudgment,
  onEdgeChange,
  onNodeChange
} from './assistFunction';
import noResult from '@/assets/images/noResult.svg';
import emptyImg from '@/assets/images/empty.svg';
import type { TGraphData, TConfigData } from '../types';
import './style.less';

export interface ConfigModalProps {
  viewOnly?: boolean; // 仅查看
  visible: boolean; // 弹窗是否可见
  setVisible: Function; // 控制弹窗是否可见
  baseInfo?: Record<string, any>; // 基本信息
  graphData: TGraphData; // 图谱数据
  defaultTab?: 'base' | 'node' | 'edge' | string; // 默认选中的tab
  defaultConfig?: TConfigData; // 原有的配置
  onOk?: (config: TConfigData) => void; // 点击确定回调
}

interface ReducerState {
  nodeKw: string;
  nodePage: number;
  nodeTotal: number;
  nodeScopeChecked: boolean;
  nodeResChecked: boolean;
  nodeResDisabled: boolean;
  edgeKw: string;
  edgePage: number;
  edgeTotal: number;
  edgeScopeChecked: boolean;
  edgeScopeDisabled: boolean;
  nodeScopeSearchChecked: boolean;
}

const initState: ReducerState = {
  nodeKw: '', // 实体类搜索关键字
  nodePage: 1, // 实体类页码
  nodeTotal: 0, // 实体类分页总数
  nodeScopeChecked: false, // 实体类搜索范围勾选
  nodeResChecked: false, // 实体类搜索结果勾选
  nodeResDisabled: true, // 实体类搜索结果禁用
  edgeKw: '', // 关系类搜索关键字
  edgePage: 1, // 关系类页码
  edgeTotal: 0, // 关系类分页总数
  edgeScopeChecked: true, // 关系类搜索结果勾选
  edgeScopeDisabled: true, // 关系类搜索结果禁用
  nodeScopeSearchChecked: false // 控制点的范围
};
const reducer = (state: ReducerState, action: Partial<ReducerState>) => ({ ...state, ...action });
const { TabPane } = Tabs;
const BASE = 'base';
const NODE = 'node';
const EDGE = 'edge';
const NODE_RES = 'node-result';
const NODE_SCOPE = 'node-scope';
const EDGE_SCOPE = 'edge-scope';
const NODE_SCOPE_SEARCH = 'node_scope_search';
const PAGE_SIZE = 50;
const getPageData = (data: any[], page: number) => data.slice(PAGE_SIZE * (page - 1), PAGE_SIZE * page);

const ModalContent = forwardRef(
  (
    {
      viewOnly = false,
      setVisible,
      baseInfo,
      graphData,
      defaultTab = NODE,
      defaultConfig = { nodeScope: [], nodeRes: [], edgeScope: [] },
      onOk
    }: ConfigModalProps,
    ref
  ) => {
    const entityScrollRef = useRef<any>(); // 实体类列表滚动条
    const edgeScrollRef = useRef<any>(); // 关系类列表滚动条
    const entityInputRef = useRef<any>(); // 实体类搜索框
    const edgeInputRef = useRef<any>(); // 关系类搜索框
    const [tabKey, setTabKey] = useState(NODE); // tab key
    const [totalNodes, setTotalNodes] = useState<any[]>([]); // 全部实体类
    const [totalEdges, setTotalEdges] = useState<any[]>([]); // 全部关系类(去重)
    const [matchNodes, setMatchNodes] = useState<any[]>([]); // 搜索的实体类
    const [matchEdges, setMatchEdges] = useState<any[]>([]); // 搜索的关系类
    const [showNodes, setShowNodes] = useState<any[]>([]); // 显示的实体类列表
    const [showEdges, setShowEdges] = useState<any[]>([]); // 显示的关系类列表
    const [nodeScope, setNodeScope] = useState<string[]>([]); // 选择的点类搜索范围
    const [nodeRes, setNodeRes] = useState<string[]>([]); // 选择的点类搜索结果
    const [nodeAllScope, setNodeAllScope] = useState<any[]>([]); // 控制点的总范围
    const [edgeScope, setEdgeScope] = useState<string[]>([]); // 选择的关系类搜索范围
    const [ableEdges, setAbleEdges] = useState<any[]>([]); // 起点终点闭合的可配置的边
    const [highlight, setHighlight] = useState<any[]>([]); // 高亮数据
    const [switchEdge, setSwitchEdge] = useState<any[]>([]);
    const [highNodes, setHighNodes] = useState<any[]>([]); // 高亮的节点集合
    const [greyStart, setGreyStart] = useState<any[]>([]); // 灰置的起点集合
    const [endNodes, setEndNodes] = useState<any[]>([]); // 灰置的结果集合
    const [selfState, dispatchState] = useReducer(reducer, initState); // 分页、搜索关键字
    const [notHaveEdges, setNotHaveEdges] = useState<any>(); // 没有边的点集合
    const [graphMes, setGraphMes] = useState<any>(); // graph数据

    useImperativeHandle(ref, () => ({ onCancel }));
    useEffect(() => {}, []);

    // 初始化数据
    useEffect(() => {
      const newGraph = mergeGraph(graphData); // 合并同名边类
      const { nodes, edges } = sortData(newGraph, defaultConfig); // 排序

      const { nodeScope: nScope, nodeRes: nRes, edgeScope: eScope, nodeAllScope } = defaultConfig;

      const { allNot, lightAllNodes } = onJudgment(nodes, nScope, nRes, graphData, eScope);
      const pageNodes = getPageData(nodes, 1); // 分页
      const pageEdges = getPageData(edges, 1); // 分页
      const ableEdgeData = handleAbleEdge(nScope, nodes); // 可配置的边

      const { checked: nodeScopeChecked } = boolCheckStatus(nScope, pageNodes);
      const { checked: nodeResChecked } = boolCheckStatus(nRes, pageNodes);
      const { checked: nodeScopeSearchChecked } = boolCheckStatus(nodeAllScope || [...nRes, ...nScope], pageNodes);
      const { checked: edgeScopeChecked } = boolCheckStatus(eScope, pageEdges);

      setNodeAllScope(nodeAllScope || lightAllNodes || [...nRes, ...nScope]);
      setNotHaveEdges(allNot); // 没有边的节点 按钮禁止掉
      setTotalNodes(nodes);
      setTotalEdges(edges);
      setShowNodes(pageNodes);
      setShowEdges(pageEdges);
      setNodeScope(nScope); // 起点
      setNodeRes(nRes);
      setEdgeScope(eScope);
      setAbleEdges(ableEdgeData);
      setHighNodes(nodeAllScope || lightAllNodes || [...nScope, ...nRes]);
      dispatchState({
        nodeTotal: nodes.length,
        edgeTotal: edges.length,
        nodeScopeChecked,
        nodeResChecked,
        edgeScopeChecked,
        nodeScopeSearchChecked
      });
    }, [graphData, defaultConfig]);

    // 外部控制打开的tab
    useEffect(() => {
      setTabKey(defaultTab);
    }, [defaultTab]);

    // 高亮数据
    useEffect(() => {
      const data = handleHighlight(edgeScope, highNodes);
      setHighlight(data);
    }, [nodeScope, nodeRes, edgeScope, graphData.mapping, totalEdges, highNodes]);

    /**
     * 模糊搜索
     * @param type 实体类 | 关系类
     */
    const onSearch = (type: string) => {
      if (type === NODE) {
        const { value } = entityInputRef.current.input;
        const matchData = value ? totalNodes.filter(item => fuzzyMatch(value, item.alias)) : [...totalNodes];
        const pageData = getPageData(matchData, 1);
        const { checked: nodeScopeChecked } = boolCheckStatus(nodeScope, pageData);
        const { checked: nodeResChecked, disabled: nodeResDisabled } = boolCheckStatus(
          nodeRes,
          pageData.filter(item => nodeScope.includes(item.id))
        );
        setMatchNodes(matchData);
        setShowNodes(pageData);
        dispatchState({
          nodeKw: value,
          nodePage: 1,
          nodeTotal: matchData.length,
          nodeScopeChecked,
          nodeResChecked,
          nodeResDisabled
        });
      }

      if (type === EDGE) {
        const { value } = edgeInputRef.current.input;
        const matchData = value
          ? totalEdges.filter(item => fuzzyMatch(value, item.alias) || fuzzyMatch(value, item.name))
          : [...totalEdges];
        const pageData = getPageData(matchData, 1);
        const { checked: edgeScopeChecked, disabled: edgeScopeDisabled } = boolCheckStatus(
          edgeScope,
          pageData.filter(item => ableEdges.includes(item.name))
        );

        setMatchEdges(matchData);
        setShowEdges(pageData);
        dispatchState({ edgeKw: value, edgePage: 1, edgeTotal: matchData.length, edgeScopeChecked, edgeScopeDisabled });
      }
    };

    /**
     * 翻页
     * @param page 页码
     * @param type 实体类 | 关系类
     */
    const onPageChange = (page: number, type: string) => {
      if (type === NODE) {
        const data = getPageData(selfState.nodeKw ? matchNodes : totalNodes, page);
        const { checked: nodeScopeChecked } = boolCheckStatus(nodeScope, data);
        const { checked: nodeResChecked, disabled: nodeResDisabled } = boolCheckStatus(
          nodeRes,
          data.filter(item => nodeScope.includes(item.id))
        );

        setShowNodes(data);
        dispatchState({ nodePage: page, nodeScopeChecked, nodeResChecked, nodeResDisabled });
        entityScrollRef.current.scrollbars?.scrollToTop();
      }

      if (type === EDGE) {
        const data = getPageData(selfState.edgeKw ? matchEdges : totalEdges, page);
        const { checked: edgeScopeChecked, disabled: edgeScopeDisabled } = boolCheckStatus(
          edgeScope,
          data.filter(item => ableEdges.includes(item.name))
        );

        setShowEdges(data);
        dispatchState({ edgePage: page, edgeScopeChecked, edgeScopeDisabled });
        edgeScrollRef.current.scrollbars?.scrollToTop();
      }
    };

    /**
     * 批量开启、关闭
     * @param type 点类搜索范围 | 点类搜索结果 | 边类搜索范围
     */
    const onCheckAll = (type: string) => {
      const { nodeScopeChecked, nodeResChecked, edgeScopeChecked, nodeScopeSearchChecked } = selfState;
      if (type === NODE_SCOPE_SEARCH) {
        const ids = showNodes.map(item => item.id);
        onNodeSearchScope(!nodeScopeSearchChecked, ids);
      }
      if (type === NODE_SCOPE) {
        const ids = showNodes.map(item => item.id);
        onNodeScopeChange(!nodeScopeChecked, ids);
      }

      if (type === NODE_RES) {
        const ids = showNodes.map(item => item.id);
        onNodeResChange(!nodeResChecked, ids);
      }

      if (type === EDGE_SCOPE) {
        const ids = showEdges.map(edge => edge.name);
        onEdgeScopeChange(!edgeScopeChecked, ids);
      }
    };

    /**
     * 搜索范围
     */
    const onNodeSearchScope = (checked: boolean, id: string | string[], isOpen = false) => {
      const ids = Array.isArray(id) ? id : [id];
      const scopeSearch = checked ? [...nodeAllScope, ...ids] : nodeAllScope.filter((item: any) => !ids.includes(item));
      const { checked: nodeScopeSearchChecked } = boolCheckStatus(scopeSearch, showNodes);
      setHighNodes(scopeSearch);
      setNodeAllScope(scopeSearch);
      if (!checked) {
        const { hightNodeToGetIn, hightNodeToOut } = onNodeChange(graphMes, ids);
        onEdgeScopeChange(checked, [...hightNodeToGetIn, ...hightNodeToOut]);
      }
      if (!isOpen) {
        setNodeScope(scopeSearch);
        setNodeRes(scopeSearch);
        onNodeScopeChange(checked, id);
        onNodeResChange(checked, id);
      }
      dispatchState({ nodeScopeSearchChecked });
    };
    /**
     * 点类搜索范围变更
     * @param checked 是否选择
     * @param id 行数据id
     */
    const onNodeScopeChange = (checked: boolean, id: string | string[]) => {
      // 处理点类搜索范围
      const ids = Array.isArray(id) ? id : [id];
      const greyAllNodes = checked ? greyStart.filter(i => !ids.includes(i)) : [...greyStart, ...ids];
      setGreyStart(greyAllNodes);
      const scope = checked ? [...ids, ...nodeScope] : nodeScope.filter(i => !greyAllNodes.includes(i));
      if (checked) {
        setNodeAllScope([...nodeAllScope, ...scope]);
        setHighNodes([...nodeAllScope, ...scope]);
        const { checked: nodeScopeSearchChecked } = boolCheckStatus([...nodeAllScope, ...scope], showNodes);
        dispatchState({ nodeScopeSearchChecked });
      }

      const { checked: nodeScopeChecked } = boolCheckStatus(scope, showNodes);
      setNodeScope(scope);
      dispatchState({ nodeScopeChecked });
    };

    /**
     * 点类搜索结果变更
     * @param checked 是否选择
     * @param id 行数据id
     */
    const onNodeResChange = (checked: boolean, id: string | string[]) => {
      const ids = Array.isArray(id) ? id : [id];
      const greyAllNodes = checked ? endNodes.filter(i => !ids.includes(i)) : [...endNodes, ...ids];
      setEndNodes(greyAllNodes);
      const newData = checked ? [...ids, ...nodeRes] : nodeRes.filter(i => !greyAllNodes.includes(i));
      if (checked) {
        setNodeAllScope([...nodeAllScope, ...newData]);
        setHighNodes([...nodeAllScope, ...newData]);
        const { checked: nodeScopeSearchChecked } = boolCheckStatus([...nodeAllScope, ...newData], showNodes);
        dispatchState({ nodeScopeSearchChecked });
      }
      const { checked: isCheck } = boolCheckStatus(newData, showNodes);
      setNodeRes(newData);
      dispatchState({ nodeResChecked: isCheck });
    };

    /**
     * 边类搜索范围变更
     * @param checked 是否选择
     * @param id 行数据id
     * @param ableIds 可配置的边id
     */
    const onEdgeScopeChange = (checked: boolean, id: string | string[]) => {
      const ids = Array.isArray(id) ? id : [id];
      const greyAllEdges = checked ? switchEdge.filter(i => !ids.includes(i)) : [...switchEdge, ...ids];
      const lightAllEdges = edgeScope.filter(i => !greyAllEdges.includes(i));
      setSwitchEdge(greyAllEdges);
      const switchOpen = checked ? [...lightAllEdges, ...ids] : edgeScope.filter(i => !greyAllEdges.includes(i));
      const scope = switchOpen;
      const { hightEdgeToNodes } = onEdgeChange(graphMes, scope, nodeScope, nodeRes);
      const { checked: isCheck } = boolCheckStatus(scope, showEdges);
      checked && setHighNodes([...highNodes, ...hightEdgeToNodes]);
      // 掉用总的范围
      checked && onNodeSearchScope(checked, hightEdgeToNodes, true);
      setEdgeScope(scope);
      dispatchState({
        edgeScopeChecked: isCheck
      });
    };

    /**
     * @param data 操作的数据
     * @param type 点类搜索范围 | 点类搜索结果 | 边类搜索范围
     */
    const onCanvasChange = (checked: boolean, data: Record<string, any>, type: string) => {
      type === NODE_SCOPE && onNodeScopeChange(checked, data.id);
      type === NODE_RES && onNodeResChange(checked, data.id);
      type === EDGE_SCOPE && onEdgeScopeChange(checked, data.name);
    };

    /**
     * 点击立即测试
     */
    const handleOk = () => {
      onOk?.({
        nodeAllScope: [...new Set(nodeAllScope)],
        nodeScope: [...new Set(nodeScope)],
        nodeRes: [...new Set(nodeRes)],
        edgeScope: [...new Set(edgeScope)]
      });
    };

    /**
     * 取消操作, 关闭弹窗
     */
    const onCancel = () => {
      const isChange = compareConfig(defaultConfig, { nodeScope, nodeRes, edgeScope });
      !isChange
        ? setVisible(false)
        : tipModalFunc({
            title: intl.get('searchConfig.existTip'),
            content: intl.get('searchConfig.existContent'),
            closable: false,
            onOk: () => setVisible(false)
          });
    };

    return (
      <div className="m-body">
        <div className="m-title">
          <h1>{intl.get('searchConfig.searchRule')}</h1>
        </div>

        <div className="m-content">
          <div className="flex-wrap">
            <div className="flex-left">
              <Tabs centered activeKey={tabKey} onChange={key => setTabKey(key)}>
                {viewOnly && (
                  <TabPane key={BASE} tab={intl.get('searchConfig.tabBasic')}>
                    <BaseInfo data={baseInfo!} graphData={graphData} configData={defaultConfig} />
                  </TabPane>
                )}

                <TabPane key={NODE} tab={intl.get('global.entityClass')}>
                  <div className="pane-box">
                    <div className="tool-box">
                      <SearchInput
                        ref={entityInputRef}
                        className="search-input"
                        placeholder={intl.get('searchConfig.entityPlace')}
                        onPressEnter={() => onSearch(NODE)}
                      />
                    </div>

                    <div className="list-th">
                      <div className="th1">
                        <span className="th-text">{intl.get('global.all')}</span>
                      </div>
                      <div className="th2">
                        <Switch
                          size="small"
                          disabled={viewOnly || !showNodes.length}
                          checked={selfState.nodeScopeChecked}
                          onChange={() => onCheckAll(NODE_SCOPE)}
                        />
                        <span className="th-text">{intl.get('searchConfig.searchStart')}</span>
                      </div>
                      <div className="th2">
                        <Switch
                          size="small"
                          disabled={viewOnly || !showNodes.length}
                          checked={selfState.nodeScopeSearchChecked}
                          onChange={() => onCheckAll(NODE_SCOPE_SEARCH)}
                        />
                        <span className="th-text">{intl.get('searchConfig.searchScope')}</span>
                      </div>

                      <div className="th3">
                        <Switch
                          size="small"
                          disabled={viewOnly || !showNodes.length}
                          checked={selfState.nodeResChecked}
                          onChange={() => onCheckAll(NODE_RES)}
                        />
                        <span className="th-text">{intl.get('searchConfig.searchRes')}</span>
                      </div>
                    </div>

                    <div className="scroll-wrap">
                      <ScrollBar isshowx="false" className="list-scroll" ref={entityScrollRef}>
                        <div className="list-box">
                          {showNodes.length ? (
                            showNodes.map(item => {
                              const { id, alias, color } = item;

                              return (
                                <div className="list-item" key={id}>
                                  <span className="circle row-icon" style={{ background: color }} />
                                  <span className="show-name ellipsis-one" title={alias}>
                                    {alias}
                                  </span>
                                  {/* 搜索范围 */}
                                  <span className="switch-span">
                                    <Switch
                                      size="small"
                                      disabled={viewOnly}
                                      checked={nodeScope.includes(id)}
                                      onChange={isCheck => onNodeScopeChange(isCheck, id)}
                                    />
                                  </span>
                                  <span className="switch-span">
                                    <Switch
                                      size="small"
                                      disabled={viewOnly}
                                      checked={nodeAllScope.includes(id)}
                                      onChange={isCheck => onNodeSearchScope(isCheck, id)}
                                    />
                                  </span>

                                  <span className="switch-span">
                                    <Switch
                                      size="small"
                                      disabled={viewOnly}
                                      checked={nodeRes.includes(id)}
                                      onChange={isCheck => onNodeResChange(isCheck, id)}
                                    />
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <div className="no-data">
                              <img src={selfState.nodeKw ? noResult : emptyImg} alt="no data" />
                              <p className="no-des">
                                {selfState.nodeKw ? intl.get('global.noResult') : intl.get('global.noData')}
                              </p>
                            </div>
                          )}
                        </div>
                      </ScrollBar>
                    </div>

                    <div className={`footer-pagination ${!selfState.nodeTotal && 'hide'}`}>
                      <Pagination
                        current={selfState.nodePage}
                        total={selfState.nodeTotal}
                        pageSize={PAGE_SIZE}
                        onChange={page => onPageChange(page, NODE)}
                        showLessItems
                        showTitle={false}
                        showSizeChanger={false}
                      />
                    </div>
                  </div>
                </TabPane>

                <TabPane
                  key={EDGE}
                  disabled={!totalEdges.length}
                  tab={
                    <span title={!totalEdges.length ? intl.get('global.noContent') : ''}>
                      {intl.get('global.relationClass')}
                    </span>
                  }
                >
                  <div className="pane-box">
                    <div className="tool-box">
                      <SearchInput
                        ref={edgeInputRef}
                        className="search-input"
                        placeholder={intl.get('searchConfig.edgePlace')}
                        onPressEnter={() => onSearch(EDGE)}
                      />
                    </div>

                    <div className="list-th">
                      <div className="th1">
                        <span className="th-text">{intl.get('global.all')}</span>
                      </div>

                      {/* 控制边的全部开关 */}
                      <div className="th2">
                        <Switch
                          size="small"
                          disabled={viewOnly || !showEdges.length}
                          checked={selfState.edgeScopeChecked}
                          onChange={() => onCheckAll(EDGE_SCOPE)}
                        />
                        <span className="th-text">{intl.get('searchConfig.searchScope')}</span>
                      </div>
                    </div>

                    <div className="scroll-wrap">
                      <ScrollBar isshowx="false" className="list-scroll" ref={edgeScrollRef}>
                        <div className="list-box">
                          {showEdges.length ? (
                            showEdges.map(item => {
                              const { name, alias, color, id } = item;

                              return (
                                <div className="list-item" key={name}>
                                  <span className="row-icon" style={{ background: color }} />
                                  <div className="edge-info">
                                    <p className="e-name ellipsis-one" title={alias}>
                                      {alias}
                                    </p>
                                    <p className="sub-name ellipsis-one" title={name}>
                                      {intl.get('global.originalName')}：{name}
                                    </p>
                                  </div>
                                  <span className="switch-span">
                                    <Switch
                                      size="small"
                                      checked={edgeScope.includes(name)}
                                      onChange={isCheck => onEdgeScopeChange(isCheck, name)}
                                    />
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <div className="no-data">
                              <img src={selfState.edgeKw ? noResult : emptyImg} alt="no data" />
                              <p className="no-des">
                                {selfState.edgeKw ? intl.get('global.noResult') : intl.get('global.noData')}
                              </p>
                            </div>
                          )}
                        </div>
                      </ScrollBar>
                    </div>

                    <div className={`footer-pagination ${!selfState.edgeTotal && 'hide'}`}>
                      <Pagination
                        current={selfState.edgePage}
                        total={selfState.edgeTotal}
                        pageSize={PAGE_SIZE}
                        onChange={page => onPageChange(page, EDGE)}
                        showLessItems
                        showTitle={false}
                        showSizeChanger={false}
                      />
                    </div>
                  </div>
                </TabPane>
              </Tabs>
            </div>
            <div className="flex-right">
              <ConfigGraph
                viewOnly={viewOnly}
                graphData={graphData}
                markData={nodeRes}
                highlightData={highlight}
                nodeScope={nodeScope}
                nodeRes={nodeRes}
                edgeScope={edgeScope}
                ableEdges={ableEdges}
                onCheck={onCanvasChange}
                setNodeScope={setNodeScope}
                setNodeRes={setNodeRes}
                setEdgeScope={setEdgeScope}
                setHighlight={setHighlight}
                setHighNodes={setHighNodes}
                setGraphMes={setGraphMes}
                notHaveEdges={notHaveEdges}
              />

              {!viewOnly && (
                <div className="config-btn">
                  <ConfigProvider autoInsertSpaceInButton={false}>
                    <Button type="default" onClick={onCancel}>
                      {intl.get('global.cancel')}
                    </Button>
                    <Button type="primary" onClick={handleOk}>
                      {intl.get('searchConfig.toTest')}
                    </Button>
                  </ConfigProvider>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

const ConfigModal: React.FC<ConfigModalProps> = props => {
  const { visible, setVisible } = props;
  const contentRef = useRef<any>();

  return (
    <Modal
      className="kg-strategy-config-modal"
      destroyOnClose
      visible={visible}
      width={'auto'}
      footer={null}
      focusTriggerAfterClose={false}
      maskClosable={false}
      zIndex={520}
      onCancel={() => (contentRef.current ? contentRef.current.onCancel() : setVisible(false))}
    >
      <ModalContent ref={contentRef} {...props} />
    </Modal>
  );
};

export default memo(ConfigModal);
