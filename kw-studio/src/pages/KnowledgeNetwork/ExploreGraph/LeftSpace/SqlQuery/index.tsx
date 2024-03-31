import React, { useEffect, useRef, useState } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import { connect } from 'react-redux';
import intl from 'react-intl-universal';
import { Button, Tooltip, message } from 'antd';
import { CloseOutlined, HistoryOutlined } from '@ant-design/icons';

import { sqlQueryHistory } from '@/reduxConfig/action/sqlQueryHistory';

import { COLORS_CARD } from '@/enums';
import HELPER from '@/utils/helper';
import HOOKS from '@/hooks';
import visualAnalysis from '@/services/visualAnalysis';
import { localStore, getParam, copyToBoard } from '@/utils/handleFunction';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import ParamCodeEditor, { ParamEditorRef } from '@/components/ParamCodeEditor';
import DragLine from '@/components/DragLine';

import HistoryModal from './HistoryModel';
import ResultPanel, { RESULT_TYPE, getInitResState, parseStatementResult } from '../components/ResultPanel';
import AddTypeSelector, { ADD_TYPES } from '../components/AddTypeSelector';
import DisplayResult from '../components/DisplayResult';
import './style.less';

const COLORS_LENGTH = COLORS_CARD.SUB_GROUP_COLORS.length;
const { ADD_IMMEDIATELY, ADD_SELECT, COVER_IMMEDIATELY, COVER_SELECT } = ADD_TYPES;
const MAX_WIDTH = 1060;
const MIN_WIDTH = 440;

const SqlQuery = (props: any) => {
  const { leftDrawerKey, selectedItem, onChangeData, sqlHistory, ad_updateSqlHistory, onCloseLeftDrawer } = props;
  const [sqlList, setSqlList] = useState<any>('');
  const editorRef = useRef<ParamEditorRef>(null);
  const [historyVisible, setHistoryVisible] = useState(false);
  const sqlKey = `sqlHistory${selectedItem?.detail?.c_id}`;
  const [results, setResults] = useState(() => getInitResState()); // 结果面板数据
  const [addType, setAddType] = useState(ADD_IMMEDIATELY); // 添加方式
  const widthCache = useRef(0); // 显式结果页时缓存宽度, 关闭结果再恢复
  const [resultPanelDisplay, setResultPanelDisplay] = useState(
    selectedItem?.configFeatures?.resultPanelDisplay?.value || 'notDisplayResult'
  );
  useEffect(() => {
    if (!selectedItem?.configFeatures?.resultPanelDisplay?.value) return;
    setResultPanelDisplay(selectedItem?.configFeatures?.resultPanelDisplay?.value);
  }, [selectedItem?.configFeatures?.resultPanelDisplay?.value]);

  const onChangeResultPanelDisplay = (value: string) => setResultPanelDisplay(value);

  useEffect(() => {
    if (leftDrawerKey) {
      setResults(getInitResState());
    }
    if (leftDrawerKey === 'sql') {
      editorRef.current?.initMark(sqlList, []);
      setWidth(MAX_WIDTH);
    }
  }, [leftDrawerKey]);

  useEffect(() => {
    setResults(getInitResState());
    setWidth(MAX_WIDTH);
  }, [selectedItem?.key]);

  /**
   * 搜索
   * @param type 添加方式 选择添加和立即添加
   */
  const onSearch = async () => {
    // 查询语句以分号隔开
    const query = _.filter(_.split(sqlList, ';'), s => !!s && !!s.trim());

    // 保存历史记录
    if (_.isArray(sqlHistory?.[selectedItem?.key])) {
      updateHistory([sqlList, ...sqlHistory?.[selectedItem?.key]]);
    } else {
      const sqlHistoryStore = localStore.get('sqlHistory') || {};
      if (sqlHistoryStore?.[sqlKey]) {
        updateHistory([sqlList, ...sqlHistoryStore?.[sqlKey]]);
      } else {
        updateHistory([sqlList]);
      }
    }

    onChangeData({ type: 'exploring', data: { isExploring: true } });

    try {
      const id = selectedItem?.detail?.kg?.kg_id || getParam('graphId'); // 图谱id
      const params = { kg_id: id, statements: query };
      const response = await visualAnalysis.customSearch(params);
      onChangeData({ type: 'add', data: { nodes: [], edges: [], length: 0 } }); // 加入数据之前清空上次加入的数据
      onChangeData({ type: 'exploring', data: { isExploring: false } });

      if (response?.res) {
        const { graph, result: data, groups } = parseStatementResult(response?.res);
        if ([ADD_IMMEDIATELY, COVER_IMMEDIATELY].includes(addType)) {
          onSelectAddCallback({ graph, groups });
          const error = _.filter(data, item => item?.error);
          if (!_.isEmpty(error)) message.error(intl.get('exploreGraph.sqlErrorTip'));
        }
        if (resultPanelDisplay === 'displayResult' || [ADD_SELECT, COVER_SELECT].includes(addType)) {
          setResults({
            visible: true,
            data,
            originData: response?.res,
            checkable: [ADD_SELECT, COVER_SELECT].includes(addType),
            // checkable: true,
            params
          });
          widthCache.current = width;
        }
        if (resultPanelDisplay === 'notDisplayPanel') {
          onCloseLeftDrawer();
        }
        setWidth(MIN_WIDTH);
      }
    } catch (err) {
      if (err?.type === 'message') {
        const { Description } = err.response || {};
        Description && message.error(Description);
      } else {
        const { Description } = err || {};
        Description && message.error(Description);
      }
      onChangeData({ type: 'exploring', data: { isExploring: false } });
    }
  };
  // FIND SHORTEST  PATH FROM '0e4049177bc3064ab58ef89024ddfa52'
  // TO '050097b6be6115476bd20fa4a988bdad' OVER * YIELD path AS p
  // 更新历史缓存
  const updateHistory = (list: any) => {
    const lastTen = list.slice(0, 20);

    if (!selectedItem?.detail?.c_id) {
      const sql = _.cloneDeep(sqlHistory);
      sql[selectedItem?.key] = lastTen;
      ad_updateSqlHistory({ sqlHistory: sql });
    } else {
      // 以保存过的画布直接调用接口更改
      const sqlHistoryStore = localStore.get('sqlHistory') || {};
      sqlHistoryStore[sqlKey] = lastTen;
      localStore.set('sqlHistory', sqlHistoryStore);
    }
  };

  // 将历史语句填入输入框
  const onClickHistory = (list: any) => {
    const a = sqlList.trim();
    if (_.isEmpty(a)) {
      editorRef.current?.initMark(list, []);
      return setSqlList(list);
    }
    const sql = `${a}\n${list}`;
    setSqlList(sql);
    editorRef.current?.initMark(sql, []);
  };

  const deleteAll = () => {
    editorRef.current?.initMark('', []);
    setSqlList('');
  };

  const onChange = (value: string) => {
    setSqlList(value);
  };

  /**
   * 添加子图
   * @param groups 子图数据列表
   */
  const addSubGroups = (groups?: any[]) => {
    selectedItem.graph?.current.__removeSubGroups();
    if (groups) {
      setTimeout(() => {
        let maxNodes: any[] = []; // 取点最多的子图居中
        let subgraphIndex = 0;
        let pathIndex = 0;
        _.forEach(groups, (g, index) => {
          if (g.groupType === 'subgraph' && maxNodes.length < g.nodesDetail?.length) {
            maxNodes = g.nodesDetail;
          }
          g.groupType === 'path' ? (pathIndex += 1) : (subgraphIndex += 1);
          const i = index % COLORS_LENGTH;
          const fill = HELPER.hexToRgba(COLORS_CARD.SUB_GROUP_COLORS[i], 0.04);
          const stroke = HELPER.hexToRgba(COLORS_CARD.SUB_GROUP_COLORS[i], 0.1);
          selectedItem.graph.current.__createSubGroup({
            mode: 'dashed',
            members: [...g.nodes],
            info: { ...g },
            name:
              intl.get(`exploreGraph.${g.groupType === 'path' ? 'path' : 'subgraph'}`) +
              (g.groupType === 'path' ? pathIndex : subgraphIndex),
            from: 'sqlQuery',
            style: { fill, stroke }
          });
        });
        const centerNode = maxNodes[Math.floor(maxNodes.length / 2)];
        centerNode &&
          selectedItem.graph.current.focusItem(centerNode.id, true, {
            easing: 'easeCubic',
            duration: 800
          });
      }, 100);
    }
  };

  /**
   * 选择添加的结果面板回调
   */
  const onSelectAddCallback = ({ graph, groups }: any) => {
    onChangeData({ type: 'add', data: { nodes: [], edges: [], length: 0 } });
    onChangeData({
      type: 'add',
      data: {
        ...graph,
        length: graph.nodes.length + graph.edges.length,
        action: [COVER_IMMEDIATELY, COVER_SELECT].includes(addType) ? 'cover' : 'add'
      }
    });
    addSubGroups(groups);
  };

  const onCloseHistory = () => setHistoryVisible(false);
  const closeDrawer = () => {
    onCloseLeftDrawer();
    setResults(getInitResState());
    setWidth(MAX_WIDTH);
  };

  const onCopy = HOOKS.useDebounce(
    async (e: any) => {
      if (_.isEmpty(sqlList)) return;
      const isSuccess = await copyToBoard(sqlList);
      message.success(isSuccess ? intl.get('userManagement.copySuccess') : intl.get('userManagement.copyFail'));
    },
    1500,
    true
  );

  // 面板宽度拖拽
  const [width, setWidth] = useState(MAX_WIDTH);
  const onWidthDrag = (offset: number) => {
    const x = width + offset;
    const curWidth = x > MAX_WIDTH ? MAX_WIDTH : x < MIN_WIDTH ? MIN_WIDTH : x;
    setWidth(curWidth);
  };

  return (
    <div className="sqlQueryRoot leftResizeDrawer" style={{ width }}>
      <DragLine className="sql-query-drag-line" style={{ left: width - 5 }} onChange={onWidthDrag} />

      <div className="header kw-space-between">
        <Format.Title level={22}>{intl.get('exploreGraph.sqlQuery')}</Format.Title>
        <span>
          <DisplayResult value={resultPanelDisplay} onChange={onChangeResultPanelDisplay} />
          <CloseOutlined className="kw-pointer" onClick={onCloseLeftDrawer} />
        </span>
      </div>

      {leftDrawerKey === 'sql' && (
        <div className="kw-flex-column" style={{ height: 'calc(100% - 56px)' }}>
          <div className="sqlOperation">
            <div className="kw-flex" style={{ flex: 1, minWidth: 0 }}>
              <AddTypeSelector className="kw-mr-5" horizontal value={addType} onChange={setAddType} />
              <Button
                type="primary"
                style={{ minWidth: 96 }}
                onClick={() => onSearch()}
                disabled={_.isEmpty(sqlList) || sqlList === ' '}
              >
                运行
              </Button>
            </div>
            <div>
              <Tooltip title={intl.get('exploreGraph.clearTwo')}>
                <IconFont
                  className={classNames('kw-pointer kw-ml-2', {
                    'kw-c-watermark': _.isEmpty(sqlList) || sqlList === ' '
                  })}
                  type="icon-lajitong"
                  onClick={deleteAll}
                  style={{ fontSize: 16 }}
                />
              </Tooltip>
              <Tooltip title={intl.get('exploreGraph.copy')}>
                <IconFont
                  className={classNames('kw-pointer kw-ml-2', {
                    'kw-c-watermark': _.isEmpty(sqlList) || sqlList === ' '
                  })}
                  type="icon-copy"
                  onClick={onCopy}
                  style={{ fontSize: 16 }}
                />
              </Tooltip>
              <Tooltip title={intl.get('exploreGraph.history')}>
                <HistoryOutlined className="kw-pointer history-icon" onClick={() => setHistoryVisible(true)} />
              </Tooltip>
            </div>
          </div>
          <div className="kw-flex-item-full-height kw-pb-6">
            <ParamCodeEditor
              className="kw-h-100"
              ref={editorRef}
              options={{
                placeholder: intl.get('exploreGraph.sqlPlaces')
              }}
              height="100%"
              onChange={onChange}
            />
          </div>
        </div>
      )}
      <HistoryModal
        visible={historyVisible}
        sqlKey={sqlKey}
        selectedItem={selectedItem}
        onClose={onCloseHistory}
        updateHistory={updateHistory}
        onClickHistory={onClickHistory}
      />
      <ResultPanel
        {...results}
        className="kw-pl-6 kw-pr-6"
        title={intl.get('exploreGraph.sqlQuery')}
        selectedItem={selectedItem}
        from={RESULT_TYPE.sql}
        updateGraph={onChangeData}
        onAdd={onSelectAddCallback}
        onBack={() => {
          setResults(getInitResState());
          setWidth(widthCache.current);
        }}
        onClose={closeDrawer}
      />
    </div>
  );
};

const mapStateToProps = (state: any) => ({
  sqlHistory: state.getIn(['sqlQueryHistory'])?.toJS()?.sqlHistory || ''
});

const mapDispatchToProps = (dispatch: any) => ({
  ad_updateSqlHistory: (sqlHistory: any) => dispatch(sqlQueryHistory(sqlHistory))
});
export default connect(mapStateToProps, mapDispatchToProps)(SqlQuery);
