import React, { useState, useEffect, useReducer, useRef } from 'react';
import { Tabs, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';
import Format from '@/components/Format';
import NoDataBox from '@/components/NoDataBox';
import { tipModalFunc } from '@/components/TipModal';
import { fuzzyMatch, numToThousand } from '@/utils/handleFunction';
import GraphNodeList, { ListRef } from './GraphNodeList';
import FooterTool from './FooterTool';
import { boolCheckStatus, handleGraphToSummary } from './assistFunction';
import { UpdateGraphData, ItemDelete } from '../types/update';
import './style.less';

const { TabPane } = Tabs;
const PAGE_SIZE = 100;
const initState = {
  nodeKw: '', // 实体类搜索关键字
  nodePage: 1, // 实体类页码
  nodeTotal: 0, // 实体类分页总数
  nodeCheckAll: false, // 实体类全选
  nodeCheckPart: false, // 实体类半选
  edgeKw: '', // 关系类搜索关键字
  edgePage: 1, // 关系类页码
  edgeTotal: 0, // 关系类分页总数
  edgeCheckAll: false, // 关系类全选
  edgeCheckPart: false // 关系类半选
};
type ReducerState = typeof initState;
const reducer = (state: ReducerState, action: Partial<ReducerState>) => ({ ...state, ...action });
const getPage = (data: any[], page = 1) => _.slice(data, (page - 1) * PAGE_SIZE, page * PAGE_SIZE);

type ErrorMark = {
  nodes: string[];
  edges: string[];
};

export interface SummaryInfoProps {
  graph: { nodes: any[]; edges: any[] };
  groupList: any[];
  onClose: () => void;
  onDelete: (data: ItemDelete) => void;
  onUpdateGraphData: (data: UpdateGraphData) => void;
  setSelectedElement: (data: any) => void;
  onCreateGroup: () => void;
  [key: string]: any;
}

const SummaryInfo = (props: SummaryInfoProps) => {
  const { graph, groupList, onClose, onDelete, onUpdateGraphData, setSelectedElement, onCreateGroup } = props;
  const nodeListRef = useRef<ListRef>();
  const edgeListRef = useRef<ListRef>();
  const [tabKey, setTabKey] = useState<'node' | 'edge'>('node'); // 面板key
  const [selectedNodes, setSelectedNodes] = useState<any[]>([]); // 已选的实体
  const [selectedEdges, setSelectedEdges] = useState<any[]>([]); // 已选的关系
  const [showNodes, setShowNodes] = useState<any[]>([]); // 显示的实体
  const [showEdges, setShowEdges] = useState<any[]>([]); // 显示的关系
  const [selfState, dispatchState] = useReducer(reducer, initState); // 各种状态标记
  const [errorMark, setErrorMark] = useState<ErrorMark>({ nodes: [], edges: [] }); // 重复数据标记

  // 改造、校验 图数据
  useEffect(() => {
    const { nodes, edges, firstNodeErr, firstEdgeErr } = handleGraphToSummary(graph);
    setErrorMark({ nodes, edges });

    if (firstNodeErr < 0 && firstEdgeErr >= 0) {
      setTabKey('edge');
    }

    setTimeout(() => {
      firstNodeErr >= 0 && scrollTo('node', firstNodeErr);
      firstEdgeErr >= 0 && scrollTo('edge', firstEdgeErr);
    }, 0);
  }, [graph]);

  // 搜索、翻页
  useEffect(() => {
    const origin = tabKey === 'node' ? graph.nodes : graph.edges;
    const value = tabKey === 'node' ? selfState.nodeKw : selfState.edgeKw;
    const page = tabKey === 'node' ? selfState.nodePage : selfState.edgePage;
    const matchData = _.filter(origin, item => fuzzyMatch(value, item.alias));

    // 避免数据被删除后页码溢出
    const maxPage = matchData.length ? Math.ceil(matchData.length / PAGE_SIZE) : 1;
    if (page > maxPage) {
      dispatchState({ [tabKey === 'node' ? 'nodePage' : 'edgePage']: maxPage });
      return;
    }

    const data = getPage(matchData, page);
    const updateFunc = tabKey === 'node' ? setShowNodes : setShowEdges;
    updateFunc(data);
    dispatchState({ [tabKey === 'node' ? 'nodeTotal' : 'edgeTotal']: matchData.length });
  }, [graph, tabKey, selfState.edgeKw, selfState.nodeKw, selfState.nodePage, selfState.edgePage]);

  // 自动判断底部全选状态
  useEffect(() => {
    const origin = tabKey === 'node' ? showNodes : showEdges;
    const keys = tabKey === 'node' ? selectedNodes : selectedEdges;
    const { isAll, isPart } = boolCheckStatus(origin, keys);
    dispatchState({
      [tabKey === 'node' ? 'nodeCheckAll' : 'edgeCheckAll']: isAll,
      [tabKey === 'node' ? 'nodeCheckPart' : 'edgeCheckPart']: isPart
    });
  }, [tabKey, showNodes, showEdges, selectedNodes, selectedEdges]);

  /**
   * 滚动到指定项
   * @param type 实体类列表 | 关系类列表
   * @param index 指定项索引
   */
  const scrollTo = (type: 'node' | 'edge', index: number) => {
    const ref = type === 'node' ? nodeListRef : edgeListRef;
    ref.current?.scrollTo(index);
  };

  /**
   * 关闭汇总信息
   */
  const onCloseMenus = () => {
    onClose();
  };

  const onSearch = (value: string) => {
    dispatchState({ [tabKey === 'node' ? 'nodeKw' : 'edgeKw']: value });
  };

  const onPageChange = (page: number) => {
    dispatchState({ [tabKey === 'node' ? 'nodePage' : 'edgePage']: page });
  };

  /**
   * 单个勾选
   * @param isChecked 是否勾选
   * @param item 勾选的数据
   */
  const onCheck = (isChecked: boolean, item: any) => {
    const origin = tabKey === 'node' ? selectedNodes : selectedEdges;
    const updateFunc = tabKey === 'node' ? setSelectedNodes : setSelectedEdges;
    const newData = isChecked ? [...origin, item.uid] : origin.filter(i => i !== item.uid);
    updateFunc(newData);
  };

  /**
   * 点击跳转详情
   */
  const onRowClick = (item: any) => {
    setSelectedElement?.(item);
    onClose();
  };

  /**
   * 全选
   * @param isChecked 是否勾选
   */
  const onCheckAll = (isChecked: boolean) => {
    const selected = tabKey === 'node' ? selectedNodes : selectedEdges;
    const total = tabKey === 'node' ? showNodes : showEdges;
    const totalIds = _.map(total, item => item.uid);
    const newCheck = isChecked
      ? [...new Set([...selected, ...totalIds])]
      : _.filter(selected, i => !totalIds.includes(i));
    const updateFunc = tabKey === 'node' ? setSelectedNodes : setSelectedEdges;
    updateFunc(newCheck);
  };

  /**
   * 删除
   * @param ids 删除的id
   * @param isBatch 是否批量
   */
  const onTriggerDelete = async (ids: string[], isBatch = false) => {
    const isOk = await tipModalFunc({
      title: intl.get('createEntity.sureDelete'),
      content: intl.get('createEntity.groupDelete')
    });
    if (!isOk) return;

    let delIds = [...ids];
    const origin = tabKey === 'node' ? showNodes : showEdges;
    const oldIds = tabKey === 'node' ? selectedNodes : selectedEdges;

    // 批量删除时仅删除当前可见的
    if (isBatch) {
      delIds = origin.filter(d => ids.includes(d.uid)).map(d => d.uid);
    }
    const newIds = oldIds.filter(id => !delIds.includes(id));
    const updateFunc = tabKey === 'node' ? setSelectedNodes : setSelectedEdges;
    updateFunc(newIds);
    onDelete({ type: tabKey, items: delIds });
    // message.success(intl.get('createEntity.deleteSuc'));
    message.success({
      content: intl.get('createEntity.deleteSuc'),
      className: 'custom-class',
      style: {
        marginTop: '6vh'
      }
    });
  };

  /**
   * 批量添加分组, 为空表示未分组，不为空则合并添加
   * @param ids 分组id
   * @param name 分组名
   */
  const onGroupChange = (ids: number[], name: string) => {
    const { nodes, edges } = graph;
    const selectedKeys = tabKey === 'node' ? selectedNodes : selectedEdges;
    const selectData = _.filter(tabKey === 'node' ? nodes : edges, d => selectedKeys.includes(d.uid));
    let relationNode = [];
    if (tabKey === 'edge') {
      const relationNodeIds = _.uniq(selectData.reduce((res, { source, target }) => [...res, source, target], []));
      relationNode = _.filter(nodes, ({ uid }) => relationNodeIds.includes(uid));
    }
    const newData = [...selectData, ...relationNode].map(item => {
      const { _group = [] } = item;
      const clone = { ...item };
      clone._group = ids.length ? _.uniq([..._group, ...ids]) : [];
      return clone;
    });
    onUpdateGraphData({
      operation: 'update',
      updateData: { type: tabKey === 'node' ? 'node' : 'all', items: newData }
    });
    // message.success(intl.get('createEntity.addGroupSuccess', { group: name }));
    message.success({
      content: intl.get('createEntity.addGroupSuccess', { group: name }),
      className: 'custom-class',
      style: {
        marginTop: '6vh'
      }
    });
  };

  return (
    <div className="right-menus-summary-root">
      <div className="header kw-space-between">
        <Format.Title style={{ fontSize: 16 }}>{intl.get('createEntity.summary')}</Format.Title>
        <span className="click-mask kw-pointer" onClick={onCloseMenus}>
          <CloseOutlined className="close-icon" />
        </span>
      </div>
      <div className="tabs-box">
        <Tabs centered activeKey={tabKey} onChange={key => setTabKey(key as 'node' | 'edge')}>
          <TabPane
            key={'node'}
            tab={
              <>
                <span>{intl.get('createEntity.ect')}</span>&nbsp;&nbsp;
                <span>{`(${numToThousand(graph.nodes?.length || 0)})`}</span>
              </>
            }
          >
            {graph.nodes?.length ? (
              <GraphNodeList
                key={'entity'}
                ref={nodeListRef as any}
                rowKey="uid"
                type={'node'}
                data={showNodes}
                selectedValues={selectedNodes}
                errorMark={errorMark.nodes}
                page={selfState.nodePage}
                total={selfState.nodeTotal}
                pageSize={PAGE_SIZE}
                onPageChange={onPageChange}
                onRowClick={onRowClick}
                onCheck={onCheck}
                onSearch={onSearch}
                onDelete={item => onTriggerDelete([item.uid])}
              />
            ) : (
              <NoDataBox type="NO_CONTENT" />
            )}
          </TabPane>
          <TabPane
            key={'edge'}
            tab={
              <>
                <span>{intl.get('createEntity.rct')}</span>&nbsp;&nbsp;
                <span>{`(${numToThousand(graph.edges?.length || 0)})`}</span>
              </>
            }
          >
            {graph.edges?.length ? (
              <GraphNodeList
                key={'edge'}
                ref={edgeListRef as any}
                rowKey="uid"
                type={'edge'}
                data={showEdges}
                selectedValues={selectedEdges}
                errorMark={errorMark.edges}
                page={selfState.edgePage}
                total={selfState.edgeTotal}
                pageSize={PAGE_SIZE}
                onPageChange={onPageChange}
                onRowClick={onRowClick}
                onCheck={onCheck}
                onSearch={onSearch}
                onDelete={item => onTriggerDelete([item.uid])}
              />
            ) : (
              <NoDataBox type="NO_CONTENT" />
            )}
          </TabPane>
        </Tabs>
      </div>

      <div
        className={classNames('footer', {
          hide: (tabKey === 'node' && !showNodes.length) || (tabKey === 'edge' && !showEdges.length)
        })}
      >
        <FooterTool
          disabled={(tabKey === 'node' && !selectedNodes.length) || (tabKey === 'edge' && !selectedEdges.length)}
          indeterminate={
            (tabKey === 'node' && selfState.nodeCheckPart) || (tabKey === 'edge' && selfState.edgeCheckPart)
          }
          checked={(tabKey === 'node' && selfState.nodeCheckAll) || (tabKey === 'edge' && selfState.edgeCheckAll)}
          groupList={groupList}
          onDelete={() => onTriggerDelete(tabKey === 'node' ? selectedNodes : selectedEdges, true)}
          onCheckAll={onCheckAll}
          onGroupChange={onGroupChange}
          onCreateGroup={onCreateGroup}
        />
      </div>
    </div>
  );
};

export default SummaryInfo;
