/**
 * 认知搜索
 */

import React, { memo, useState, useEffect, useRef, useReducer, useCallback } from 'react';
import { Button, Input, Tabs, ConfigProvider, Modal, message } from 'antd';
import { CloseOutlined, LeftOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import servicesSearchConfig from '@/services/searchConfig';
import servicesExplore from '@/services/explore';
import IconFont from '@/components/IconFont';
import AdSpin from '@/components/AdSpin';
import { tipModalFunc, knowModalFunc } from '@/components/TipModal';
import { getParam, updateUrl } from '@/utils/handleFunction';
import Analysis from '@/components/analysisInfo';
import G6SearchGraph from '@/components/G6SearchGraph';
import StrategyConfig, { ERROR_CODE } from './StrategyConfig';
import SavedConfig from './SavedConfig';
import SearchResult from './SearchResult';
import type { ResData } from './SearchResult';
import MountEmpty from './MountEmpty';
import { cutName, handleProperties } from './assistFunction';
import { handlePathData } from './SearchResult/PathGraph';
import noResult from '@/assets/images/noResult.svg';
import configEmpty from '@/assets/images/strategyEmpty.svg';
import configSearchTip from '@/assets/images/configSearchTip.svg';
import './style.less';

export interface CognitiveSearchProps {
  kgData: Record<string, any>; // 知识网络数据
}

const initState = {
  loading: false, // 搜索加载中
  query: '', // 搜索关键字
  inputValue: '', // 输入框文字, 仅展示
  page: 1, // 当前页码
  ids: '', // 前一次搜索选择的id
  isNotGraph: true, // 是否无图谱
  isNotConfig: true, // 是否无配置
  initLoading: true, // 初始化loading
  reportLoading: false, // 分析报告loading
  canvasVisible: false, // 探索分析画布
  reportVisible: false, // 分析报告弹窗
  isExplored: false // 是否已探索
};
type ReducerState = typeof initState;
const reducer = (state: ReducerState, action: Partial<ReducerState>) => ({ ...state, ...action });
const { TabPane } = Tabs;
const CONFIG = 'config tab'; // 搜索策略配置
const SAVED = 'saved tab'; // 已保存搜索策略
let requestId = 0; // 标记网络请求
const PAGE_SIZE = 20; // 每页数量
const REPORT_ERROR: Record<string, string> = {
  'EngineServer.ErrVClassErr': 'graphQL.e500500',
  'EngineServer.ErrRightsErr': 'graphList.authErr',
  'EngineServer.ErrInternalErr': 'graphList.hasBeenDel'
};

const CognitiveSearch: React.FC<CognitiveSearchProps> = ({ kgData }) => {
  const configRef = useRef<any>(); // 搜索策略配置组件
  const editConfigRef = useRef<any>(); // 编辑搜索策略配置组件
  const savedRef = useRef<any>(); // 已保存配置组件
  const G6GraphRef = useRef<any>(); // 探索分析画布
  const setG6GraphRef = useCallback((ref: any) => {
    G6GraphRef.current = ref;
  }, []);
  const [tabKey, setTabKey] = useState(CONFIG); // 左侧面板key
  const [selfState, dispatchState] = useReducer(reducer, initState); // 分页、loading、visible等状态变量
  const [resData, setResData] = useState<ResData>({}); // 结果数据
  const [reportData, setReportData] = useState({ title: '', data: {} }); // 分析报告数据
  const [exploreGraph, setExploreGraph] = useState<Record<string, any>>({}); // 探索图谱数据
  const [viewType, setViewType] = useState('list'); // 搜索结果展现形式
  const [editId, setEditId] = useState(0); // 编辑的配置id
  const [isTest, setIsTest] = useState(false); // 是否是测试
  const [testData, setTestData] = useState<Record<string, any>>({}); // 测试数据
  const [editVisible, setEditVisible] = useState(false); // 编辑配置界面

  useEffect(() => {
    return () => document.body.classList.remove('hidden-scroll');
  }, []);

  useEffect(() => {
    const { id } = kgData;

    if (!id) return;

    const init = async () => {
      const configRes = await savedRef.current?.getConfigs({ id });
      const graphRes = await configRef.current?.getGraphList(id, true);
      configRes?.length && dispatchState({ isNotConfig: false });
      graphRes?.length && dispatchState({ isNotGraph: false });
      dispatchState({ initLoading: false });
    };

    init();
  }, [kgData]);

  useEffect(() => {
    selfState.canvasVisible
      ? document.body.classList.add('hidden-scroll')
      : document.body.classList.remove('hidden-scroll');
  }, [selfState.canvasVisible]);

  /**
   * 刷新配置界面
   */
  const refreshConfig = () => {
    configRef.current?.reset();
    configRef.current?.getGraphList(kgData.id);
  };

  /**
   * 刷新已保存配置界面
   */
  const refreshSaved = () => {
    savedRef.current.refresh();
  };

  /**
   * 发送搜索请求
   * @param obj.ids 配置id
   * @param obj.query 搜索关键字
   * @param obj.page 页码
   */
  const getRes = async ({ ids, query = '', page = 1 }: { ids: string; query?: string; page?: number }) => {
    dispatchState({ ids, query, page, loading: true });
    const signId = ++requestId;
    const startTime: any = new Date();
    const res = await servicesSearchConfig.advSearchV2({ ids, query, page, size: PAGE_SIZE });

    if (signId < requestId) return;

    dispatchState({ loading: false });

    if (res?.res) {
      setResData(res);
      return;
    }

    const { ErrorCode, Description } = res || {};
    const endTime: any = new Date();
    const time = (endTime - startTime) / 1000;
    setResData({ number: 0, time: time.toFixed(2) });
    refreshSaved();
    ERROR_CODE[ErrorCode] ? message.error(intl.get(ERROR_CODE[ErrorCode])) : Description && message.error(Description);
  };

  /**
   * 搜索测试
   * @param obj.query 搜索关键字
   * @param obj.page 页码
   * @param obj.data 测试数据, 包含图谱id和配置
   */
  const getTestRes = async ({
    query = '',
    page = 1,
    data
  }: {
    query?: string;
    page?: number;
    data?: Record<string, any>;
  }) => {
    const configData = data || testData;
    const params = {
      query,
      page,
      size: PAGE_SIZE,
      ...configData
    };
    dispatchState({ query, page, loading: true });
    !editVisible && updateTestUrl(params);
    const signId = ++requestId;
    const startTime = +new Date();
    const res = await servicesSearchConfig.advSearchTestV2(params as any);

    if (signId < requestId) return;

    dispatchState({ loading: false });

    if (res?.res) {
      setResData(res);
      return;
    }

    const { ErrorCode, Description, ErrorDetails } = res || {};
    const transCode = ErrorDetails?.[0]?.err?.includes('not exist') ? 'EngineServer.ErrKGIDErr' : '';
    const endTime = +new Date();
    const time = (endTime - startTime) / 1000;
    setResData({ number: 0, time: time.toFixed(2) });

    if (ERROR_CODE[transCode || ErrorCode]) {
      knowModalFunc.open({
        content: intl.get(ERROR_CODE[transCode || ErrorCode]),
        onOk: () => {
          clearSearchUI();

          if (editVisible) {
            setEditVisible(false);
            refreshSaved();
          } else {
            refreshConfig();
          }
        }
      });

      return;
    }

    Description && message.error(Description);
  };

  /**
   * 更新测试搜索的url
   * @param params 搜索参数
   */
  const updateTestUrl = (params?: Record<string, any>) => {
    const id = kgData.id || getParam('id');

    if (!id) return;

    const test = params?.kg_ids ? `&test=${params.kg_ids}` : '';
    updateUrl(`${window.location.pathname}?id=${id}${test}`, false);
  };

  /**
   * 切换面板
   * @param key 面板key
   */
  const onTabsChange = async (key: string) => {
    // 已保存 --> 配置
    if (key !== SAVED) {
      setTabKey(key);
      clearSearchUI();

      return;
    }

    // 配置 --> 已保存
    if (configRef.current.isConfiguring()) {
      const isOk = await tipModalFunc({
        title: intl.get('global.tip'),
        content: intl.get('searchConfig.changeTip')
      });

      if (!isOk) return;
    }

    setTabKey(key);
    isTest && clearSearchUI();
  };

  /**
   * 点击搜索
   */
  const onSearch = () => {
    const { inputValue } = selfState;

    if (isTest) {
      const testContent = (editVisible ? editConfigRef : configRef).current.getTestContent();
      setTestData(testContent);
      getTestRes({ query: inputValue, data: testContent });
      return;
    }

    const configs = savedRef.current.getConfig();
    const ids = Object.values(configs)
      .map((item: any) => item.conf_id)
      .join(',');

    if (!ids.length) {
      message.error(intl.get('searchConfig.noSelectConfigErr'));
      return;
    }

    getRes({ ids, query: inputValue });
  };

  /**
   * 翻页
   * @param page 变化的页码
   */
  const onPageChange = useCallback(
    (page: number) => {
      isTest ? getTestRes({ ...selfState, page }) : getRes({ ...selfState, page });
    },
    [selfState, isTest, testData]
  );

  /**
   * 是否隐藏右侧界面
   */
  const isHideRightUI = () => {
    return tabKey === CONFIG && !resData.res && !selfState.loading;
  };

  /**
   * 清空搜索结果
   */
  const clearSearchUI = () => {
    dispatchState({ query: '', inputValue: '' });
    setResData({});
    setEditId(0);
    setIsTest(false);
    updateTestUrl({});
  };

  /**
   * 点击搜索结果标题加入探索
   * @param rowData 结果行数据
   * @param isAddPath 是否添加路径图数据
   */
  const onTitleClick = useCallback((rowData: Record<string, any>, isAddPath = false) => {
    dispatchState({ canvasVisible: true });

    const { id, kg_id, name, color, search_path, properties } = rowData;
    const kgId = `${kg_id}`;
    const curColor = color || '#126ee3';
    let newEdges: any[] = [];
    let newNodes = [
      {
        data: { ...rowData, color: curColor, properties: handleProperties(properties) },
        id,
        color: curColor,
        label: cutName(name, 17),
        style: {
          fill: curColor,
          stroke: 'white'
        }
      }
    ];

    if (isAddPath) {
      const { vertexes, edges } = search_path;
      const { nodes: pathNodes, edges: pathEdges } = handlePathData(
        {
          vertexes: vertexes.filter((v: any) => v.id !== id),
          edges
        },
        17
      );
      newNodes = [...newNodes, ...pathNodes];
      newEdges = pathEdges;
    }

    setExploreGraph({ id: kgId, kg_id: kgId, nodes: newNodes, edges: newEdges });
    G6GraphRef.current?.addNodesByConfig(newNodes, newEdges, [id]);
  }, []);

  /**
   * 探索更新点边数据回调
   */
  const updateGraphData = ({ nodes, edges }: any, func?: Function) => {
    dispatchState({ isExplored: true });
    setExploreGraph(pre => ({ ...pre, nodes: nodes || pre.nodes, edges: edges || pre.edges }));
    func &&
      setTimeout(() => {
        func();
      }, 0);
  };

  /**
   * 打开分析报告
   * @param rowData 结果行数据
   */
  const onReport = useCallback(async (rowData: Record<string, any>) => {
    setReportData({ title: rowData.name, data: {} });
    dispatchState({ reportLoading: true });
    const res = await servicesExplore.analysisReportGet({ id: rowData.kg_id, rid: rowData.id });
    dispatchState({ reportLoading: false });

    if (!res) return;

    if (REPORT_ERROR[res?.ErrorCode]) {
      message.error(intl.get(REPORT_ERROR[res.ErrorCode]));

      return;
    }

    setReportData(pre => ({ ...pre, data: res.res || res }));
    dispatchState({ reportVisible: true });
  }, []);

  /**
   * 编辑配置
   * @param config 配置数据
   */
  const onEdit = useCallback((config: Record<string, any>) => {
    const { conf_id = 0 } = config;
    setEditId(conf_id);
    setEditVisible(true);
  }, []);

  /**
   * 已保存配置为空回调
   */
  const notConfigCallback = useCallback((isNotConfig: boolean) => {
    isNotConfig && setTabKey(CONFIG);
    dispatchState({ isNotConfig });
  }, []);

  /**
   * 测试
   * @param data { kg_ids: string; conf_content: Record<string, any> }
   */
  const onTest = async (data: Record<string, any>) => {
    setIsTest(true);
    setTestData(data);
    getTestRes({ query: selfState.inputValue, data });
  };

  /**
   * 保存配置后的回调
   * @param savedId 保存的配置id
   */
  const onAfterSave = () => {
    refreshSaved();
    clearSearchUI();
    setEditVisible(false);
  };

  /**
   * 图谱为空回调
   */
  const notGraphCallback = (isEmpty: boolean, isClear?: boolean) => {
    isEmpty && dispatchState({ isNotGraph: true });
    (isEmpty || isClear) && clearSearchUI();
  };

  /**
   * 关闭分析画布
   */
  const onCloseCanvas = () => {
    if (!selfState.isExplored) {
      dispatchState({ canvasVisible: false });
      setExploreGraph({});
      return;
    }

    tipModalFunc({
      title: intl.get('searchConfig.existTip'),
      content: intl.get('searchConfig.existExploreTip'),
      onOk: () => {
        dispatchState({ canvasVisible: false, isExplored: false });
        setExploreGraph({});
      }
    });
  };

  /**
   * 点击路径图
   * @param data 行数据
   */
  const onPathCanvasClick = useCallback((data: Record<string, any>) => {
    onTitleClick(data, true);
  }, []);

  /**
   * 关闭编辑界面
   * @param needRefresh 是否需要刷新
   */
  const onCloseEdit = (needRefresh?: boolean) => {
    setEditVisible(false);
    isTest && clearSearchUI();
    (needRefresh || editConfigRef.current.needRefresh()) && refreshSaved();
  };

  return (
    <div className="kg-cognitive-search">
      {/* 空渲染 */}
      <MountEmpty
        initLoading={selfState.initLoading}
        isNotGraph={selfState.isNotGraph}
        isNotConfig={selfState.isNotConfig}
      />

      <div
        className={`content-flex-wrap ${
          selfState.initLoading || (selfState.isNotGraph && selfState.isNotConfig) ? 'hide' : ''
        }`}
      >
        <div className="left-tabs">
          <Tabs
            className={editVisible ? 'hide' : ''}
            centered
            animated={false}
            activeKey={tabKey}
            onChange={onTabsChange}
          >
            <TabPane key={CONFIG} forceRender tab={intl.get('searchConfig.configTab')}>
              <StrategyConfig
                ref={configRef}
                kgData={kgData}
                tabKey={tabKey}
                onTest={onTest}
                onAfterSave={onAfterSave}
                notGraphCallback={notGraphCallback}
              />
            </TabPane>

            <TabPane key={SAVED} disabled={selfState.isNotConfig} forceRender tab={intl.get('searchConfig.savedTab')}>
              <SavedConfig
                ref={savedRef}
                tabKey={tabKey}
                kgData={kgData}
                onEdit={onEdit}
                notConfigCallback={notConfigCallback}
              />
            </TabPane>
          </Tabs>

          {editVisible && (
            <div className="edit-pane">
              <div className="edit-pane-title">
                <h2 className="t-h2">{intl.get('searchConfig.editConfigTitle')}</h2>
                <div className="close-btn" onClick={() => onCloseEdit()}>
                  <CloseOutlined className="close-icon" />
                </div>
              </div>
              <div className="edit-content">
                <StrategyConfig
                  ref={editConfigRef}
                  type="edit"
                  editId={editId}
                  onClose={onCloseEdit}
                  onTest={onTest}
                  onAfterSave={onAfterSave}
                />
              </div>
            </div>
          )}
        </div>

        <div className="search-ui">
          {isHideRightUI() && (
            <div className="empty-content" style={{ paddingTop: 224 }}>
              <img src={configEmpty} alt="empty" />
              <p className="tip">{intl.get('searchConfig.noConfigTip1')}</p>
              <p className="tip">{intl.get('searchConfig.noConfigTip2')}</p>
            </div>
          )}

          <div className={`search-header ${isHideRightUI() && 'hide'}`}>
            <Input
              allowClear
              value={selfState.inputValue}
              placeholder={intl.get('searchConfig.pleaseInput')}
              onPressEnter={onSearch}
              onChange={e => dispatchState({ inputValue: e.target.value })}
            />
            <ConfigProvider autoInsertSpaceInButton={false}>
              <Button type="primary" onClick={onSearch}>
                <IconFont type="icon-sousuo" />
                {intl.get('global.search')}
              </Button>
            </ConfigProvider>
          </div>

          <div className={`result-main ${isHideRightUI() && 'hide'}`}>
            {/* 结果界面 */}
            {!!resData.number && (
              <SearchResult
                resData={resData}
                page={selfState.page}
                view={viewType}
                onPageChange={onPageChange}
                onTitleClick={onTitleClick}
                onReport={onReport}
                onViewChange={setViewType}
                onCanvasClick={onPathCanvasClick}
              />
            )}

            {/* 未触发搜索 */}
            {(!resData.number || !resData.res) && !selfState.loading && (
              <div className="empty-content" style={{ paddingTop: 140 }}>
                <img src={resData.res ? noResult : configSearchTip} alt="empty" />
                {resData.res ? (
                  <p className="tip">{intl.get('global.noResult')}</p>
                ) : (
                  <>
                    <p className="tip">{intl.get('searchConfig.searchTip1')}</p>
                    <p className="tip">{intl.get('searchConfig.searchTip2')}</p>
                  </>
                )}
              </div>
            )}

            {/* 搜索loading */}
            <div className={`loading-mask ${selfState.loading && 'spinning'}`}>
              <AdSpin />
            </div>
          </div>
        </div>
      </div>

      {/* 分析报告loading */}
      <div className={`loading-mask ${selfState.reportLoading && 'spinning'}`}>
        <AdSpin />
      </div>

      {/* 分析报告弹窗 */}
      <Modal
        title={
          <>
            <div className="left-title">{intl.get('searchGraph.report')}</div>
            <div className="right-title">{intl.get('searchGraph.Summary')}</div>
          </>
        }
        className="modal-multlist-anlys"
        width={'auto'}
        forceRender
        visible={selfState.reportVisible}
        maskClosable={false}
        onCancel={() => dispatchState({ reportVisible: false })}
        footer={null}
      >
        <Analysis reportData={reportData.data} anylysisTitle={reportData.title} />
      </Modal>

      {/* 探索式分析 */}
      <div className={`kg-search-explore-fixed ${selfState.canvasVisible && 'show-explore'}`}>
        <div className="explore-canvas-main">
          <div className="d-header">
            <div className="heder-wrap">
              <ConfigProvider autoInsertSpaceInButton={false}>
                <Button onClick={onCloseCanvas} icon={<LeftOutlined className="left-icon" />}>
                  {intl.get('global.back')}
                </Button>
              </ConfigProvider>
            </div>
          </div>

          <div className="d-content">
            <div className="canvas-scroll-wrap">
              <G6SearchGraph
                isCognitive
                className="kg-search-canvas"
                setSearchVisible={() => dispatchState({ canvasVisible: false })}
                setG6GraphRef={setG6GraphRef}
                G6GraphRef={G6GraphRef.current}
                nodes={exploreGraph.nodes || []}
                edges={exploreGraph.edges || []}
                selectGraph={exploreGraph}
                selectedGraph={exploreGraph}
                updateGraphData={updateGraphData}
                // reExplore={() => setReExploreVisible(true)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(CognitiveSearch);
