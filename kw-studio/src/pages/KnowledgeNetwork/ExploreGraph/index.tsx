/* eslint-disable max-lines */
import React, { useRef, useMemo, useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { useLocation } from 'react-router-dom';
import { message, Modal } from 'antd';
import { connect } from 'react-redux';
import { sqlQueryHistory } from '@/reduxConfig/action/sqlQueryHistory';

import HOOKS from '@/hooks';
import { getParam, localStore } from '@/utils/handleFunction';
import { PERMISSION_KEYS, GRAPH_CONFIG, GRAPH_LAYOUT, GRAPH_LAYOUT_DAGRE_DIR } from '@/enums';
import servicesExplore from '@/services/explore';
import servicesPermission from '@/services/rbacPermission';
import servicesVisualAnalysis from '@/services/visualAnalysis';

import TipModal from './components/TipModel';
import HeaderTabs from './HeaderTabs';
import BasicInfo from './Drawer/BasicInfo';
import SummaryInfo from './Drawer/SummaryInfo';
import SaveAnalysisGraph from './SaveAnalysisGraph';
import { parseCommonResult } from './LeftSpace/components/ResultPanel';

import './style.less';
import AdExitBar from '@/components/AdExitBar/AdExitBar';
import { ExclamationCircleFilled } from '@ant-design/icons';

type InitialItemsType = {
  onChangeHasUnsaved: (hasUnsaved: boolean) => void; // 是否有未保存的tabs
  ad_sqlHistory: any;
  ad_updateSqlHistory: any;
};
const isIframe = () => window.location.pathname.includes('iframe');
const ExploreGraph = (props: InitialItemsType) => {
  const forceUpdate = HOOKS.useForceUpdate();
  const { ad_sqlHistory, onChangeHasUnsaved, ad_updateSqlHistory } = props;
  const graphItems = useRef<any>([
    {
      key: '0',
      title: intl.get('exploreGraph.unnamed'),
      graph: null,
      source: null,
      legend: { hasLegend: true },
      graphConfig: GRAPH_CONFIG.DEFAULT,
      layoutConfig: {
        key: GRAPH_LAYOUT.FORCE,
        default: GRAPH_LAYOUT_DAGRE_DIR.DEFAULT_CONFIG,
        [GRAPH_LAYOUT.FORCE]: GRAPH_LAYOUT_DAGRE_DIR.DEFAULT_CONFIG
      }
    }
  ]);
  const cacheItem = useRef<any>({});
  const _activeKey = useRef<any>('0');
  const location = useLocation();
  const adHistory = HOOKS.useAdHistory();
  const [saveModalFields, setSaveModalFields] = useState<any>([]);
  const [activeKey, setActiveKey] = useState('0'); // 分析的 tabs 展示项
  const [saveModalOperation, setSaveModalOperation] = useState<any>(false); // 保存窗口的操作数据
  const [summaryOpenInfo, setSummaryOpenInfo] = useState<{ openInfo: boolean; infoId?: string }>({
    openInfo: false,
    infoId: ''
  });
  const { selectedItem } = useMemo(() => {
    const selectedItem = graphItems.current[0];
    // const selectedItem = _.filter(graphItems.current, item => item.key === activeKey)?.[0];
    cacheItem.current = selectedItem;
    return { selectedItem };
  }, [activeKey, graphItems.current]);
  useEffect(() => {
    _activeKey.current = activeKey;
  }, [activeKey]);

  const graphName = useMemo(() => getParam('kg_name'), []);

  useEffect(() => {
    clearHistory();
  }, [location?.pathname]);

  useEffect(() => {
    if (isIframe()) return;
    if (!selectedItem?.detail?.canvas_name) return;
    const getGraphPermission = async () => {
      // DATA-354277 dataPermission 入参dataIds kg_conf_id -> id
      const kgId = getParam('graphConfId'); // 图谱id
      // 查询图谱的权限
      let kgAuthor = { res: [{ codes: [] }] };
      try {
        // kgAuthor = await servicesPermission.dataPermission({
        //   dataType: PERMISSION_KEYS.TYPE_KG,
        //   dataIds: [String(kgId)]
        // });
      } catch (error) {
        //
      }

      // const authorKgView = _.includes(kgAuthor?.res?.[0]?.codes || [], PERMISSION_KEYS.KG_VIEW);
      const authorKgView = true;
      onChangeData({ type: 'detail', data: { ...selectedItem?.detail, authorKgView } });
    };
    getGraphPermission();
  }, [selectedItem?.detail?.canvas_name, selectedItem?.detail?.c_id]);

  useEffect(() => {
    getAnalysisList();
    return () => {
      onChangeHasUnsaved(false);
    };
  }, []);

  // 左侧抽屉操作
  const [leftDrawerKey, setLeftDrawerKey] = useState('');
  const onOpenLeftDrawer = (key: string) => {
    setLeftDrawerKey(key);
  };

  /**
   * @param isOpen // disable-上方栏部分按钮禁止使用 close-关闭抽屉上方栏按钮可用
   */
  const onCloseLeftDrawer = (isOpen?: any) => {
    // if (isOpen === 'disable') {
    //   setLeftDrawerKey('');
    //   setSelectDrawerOpen(true);
    //   return;
    // }
    // if (isOpen === 'close') {
    //   setSelectDrawerOpen(false);
    //   return;
    // }
    setLeftDrawerKey('');
  };

  // 右侧抽屉操作
  const [rightDrawerKey, setRightDrawerKey] = useState<any>(''); // 控制右侧抽屉 info 信息汇总，summary
  useEffect(() => {
    if (selectedItem?.selected?.length === 1 || selectedItem?.selected?.focusItem) {
      if (!summaryOpenInfo?.openInfo) {
        setTimeout(() => {
          onOpenRightDrawer('info');
        }, 300);
      } else {
        setSummaryOpenInfo({ ...summaryOpenInfo, openInfo: false });
      }
    }
    if (selectedItem?.selected?.length === 0) onCloseRightDrawer();
  }, [selectedItem?.selected?.nodes?.[0]?._cfg?.id, selectedItem?.selected?.edges?.[0]?._cfg?.id]);
  const onOpenRightDrawer = (key: string, infoId?: any) => {
    if (infoId && key === 'info') setSummaryOpenInfo({ openInfo: true, infoId });
    setRightDrawerKey(key);
  };
  const onCloseRightDrawer = () => setRightDrawerKey('');

  const getAnalysisList = async () => {
    const { knId: knw_id, graphId } = getParam(['knId', 'graphId']);
    try {
      const data = { page: 1, order_type: 'desc', kg_id: graphId, order_field: 'create_time' };
      const res = await servicesVisualAnalysis.visualAnalysisList(knw_id, data);
      if (res?.res) {
        const { canvases } = res?.res;
        if (canvases) {
          const targetGraphData = canvases[0];
          if (targetGraphData) {
            const tabItem = {
              key: targetGraphData.c_id,
              title: targetGraphData.canvas_name,
              graph: null,
              source: null,
              newTabData: { type: 'open', c_id: targetGraphData.c_id }
            };
            onChangeActive(targetGraphData.c_id);
            onChangeGraphItems([tabItem]);
          }
        }
      }
      if (res?.ErrorCode) message.error(res?.Description);
    } catch (err) {
      //
    }
  };

  // 其他换 tabs
  const onChangeActive = (key: string) => {
    setActiveKey(key);
  };

  // 添加 tabs 后强制更新
  const onChangeGraphItems = (items: any) => {
    if (typeof items === 'function') {
      items(graphItems.current);
    } else {
      graphItems.current = items;
    }
    forceUpdate();
  };

  // 更新 graph 后强制更新
  const onUpdateGraphItem = (data: any) => {
    const newItems = _.map(graphItems.current, item => {
      if (item?.key !== data?.key) return item;
      return { ...item, ...data };
    });
    graphItems.current = newItems;
    forceUpdate();
    /** 通知外部存在未保存的 tabs */
    let hasUnsaved = false;
    _.forEach(newItems, item => {
      if (item.isHaveChanged) hasUnsaved = true;
    });
    onChangeHasUnsaved(hasUnsaved);
  };

  /**
   * 当前操作分析数据更新
   * @param item 更新的某个字段数据
   * @param isBatch 批量更新, 例如 { graphData： {}, detail: {} } 同时更新 graphData 和 detail
   */
  const onChangeData: any = (item: { type: string; data: any }, isBatch = false) => {
    if (isBatch) {
      return Object.entries(item).forEach(([type, data]) => onChangeData({ type, data }));
    }
    const { type = '', data = {} } = item;

    if (data.tabKey) {
      const tabKey = data.tabKey;
      delete data.tabKey;
      if (_activeKey.current !== tabKey) return;
    }

    if (onUpdateGraphItem) {
      if (type === 'graphData') {
        // 图谱的数据
        cacheItem.current[type] = data;
        onUpdateGraphItem(cacheItem.current);
      }
      if (type === 'detail') {
        // 分析详情
        cacheItem.current[type] = data;
        cacheItem.current.title = data?.canvas_name || intl.get('exploreGraph.unnamed');
        onUpdateGraphItem(cacheItem.current);
      }
      if (type === 'graph') {
        // 图谱的 ref, 只做获取操作，不要做设值操作
        cacheItem.current[type] = data;
        onUpdateGraphItem(cacheItem.current);
      }
      if (type === 'isLoading') {
        cacheItem.current[type] = data;
        if (cacheItem.current?.graph) {
          cacheItem.current.graph.current.__isLoading = data;
        }
        onUpdateGraphItem(cacheItem.current);
      }
      if (type === 'selected') {
        // 选中的节点或边
        data.time = new Date().valueOf();
        cacheItem.current[type] = data;
        onUpdateGraphItem(cacheItem.current);
      }
      if (type === 'delete') {
        cacheItem.current[type] = data;
        onUpdateGraphItem(cacheItem.current);
      }
      if (type === 'layoutConfig') {
        // 布局参数
        cacheItem.current[type] = data;
        // 添加上默认布局
        if (data.isHaveChanged) {
          cacheItem.current.isHaveChanged = true;
          delete data.isHaveChanged;
        }
        cacheItem.current[type].default = data?.[data?.key] || {};
        onUpdateGraphItem(cacheItem.current);
      }
      if (type === 'graphConfig') {
        // 图谱配置
        cacheItem.current[type] = data;
        onUpdateGraphItem(cacheItem.current);
      }
      if (type === 'graphStyle') {
        // 图谱默认样式
        cacheItem.current[type] = data;
        onUpdateGraphItem(cacheItem.current);
      }
      if (type === 'stack') {
        // 栈数据
        cacheItem.current[type] = data;
        if (!_.isEmpty(data.redoStack) || !_.isEmpty(data.undoStack)) {
          cacheItem.current.isHaveChanged = true;
        }
        onUpdateGraphItem(cacheItem.current);
      }
      if (type === 'zoom') {
        // 图的缩放信息
        cacheItem.current[type] = data;
        onUpdateGraphItem(cacheItem.current);
      }
      if (type === 'path') {
        // 路径信息
        cacheItem.current[type] = data;
        if (!data?.changeStyle) {
          getPointPath(data);
        }
        onUpdateGraphItem(cacheItem.current);
      }
      if (type === 'config') {
        // 修改样式数据
        cacheItem.current[type] = data;
        onUpdateGraphItem(cacheItem.current);
      }
      if (type === 'add') {
        // 添加数据
        cacheItem.current[type] = _.omit(data, 'unClose');
        onUpdateGraphItem(cacheItem.current);
        // if (!data.unClose && !_.isEmpty(data.nodes)) {
        //   onCloseLeftDrawer();
        // }
      }
      if (type === 'exploring') {
        cacheItem.current[type] = data;
        onUpdateGraphItem(cacheItem.current);
      }
      if (type === 'focusItem') {
        // 居中某个元素
        cacheItem.current[type] = data;
        onUpdateGraphItem(cacheItem.current);
      }
      if (type === 'rules') {
        // 保存搜索规则（｛path，neighbors，fullText ｝）
        cacheItem.current[type] = data;
        onUpdateGraphItem(cacheItem.current);
      }
      if (type === 'sliced') {
        // 保存图切片
        cacheItem.current[type] = data;
        onUpdateGraphItem(cacheItem.current);
      }
      if (type === 'newCanvas') {
        // 新开画布
        cacheItem.current[type] = data;
        onUpdateGraphItem(cacheItem.current);
      }
      if (type === 'resultSelecting') {
        cacheItem.current[type] = data;
        onUpdateGraphItem(cacheItem.current);
      }
    }
  };

  // 查询两点的路径
  const getPointPath = async (data: any) => {
    const { start, end, direction } = data;
    if (start?.id === end?.id) return;
    const id = selectedItem?.detail?.kg?.kg_id || getParam('graphId'); // 图谱id
    if (!parseInt(id)) return;

    try {
      const params = {
        kg_id: `${id}`,
        source: start?.id,
        target: end?.id,
        direction,
        path_type: 1,
        path_decision: 'path_depth'
      };
      onChangeData({ type: 'exploring', data: { isExploring: true } });
      const res = await servicesExplore.explorePath(params);
      onChangeData({ type: 'exploring', data: { isExploring: false } });

      if (_.isEmpty(res?.res?.paths)) {
        onChangeData({ type: 'exploring', data: { isExploring: false } });
        message.warning([intl.get('searchGraph.exploreNone')]);
        return;
      }

      let tipOk: any = true; // 数据量过大提示回调
      const { graph } = parseCommonResult(res.res);
      if (graph.nodes?.length > 500) {
        tipOk = await TipModal({});
      }
      if (!tipOk) return;
      onChangeData({
        type: 'add',
        data: { ...graph, length: graph.nodes?.length + graph.edges?.length }
      });
      onChangeData({ type: 'path', data: { start, end, changeStyle: true } });
    } catch (err) {
      if (err?.type === 'message') {
        const { Description } = err.response?.res || err.response;
        Description && message.error(Description);
      } else {
        const { Description } = err || {};
        Description && message.error(Description);
      }
      onChangeData({ type: 'exploring', data: { isExploring: false } });
    }
  };

  // 保存分析操作
  const onOpenSaveModal = ({
    targetKey,
    callBack = () => {},
    isSkipPopup
  }: {
    targetKey?: string;
    callBack?: any;
    isCreate?: boolean;
    isSkipPopup?: boolean;
  }) => {
    onSaveOk({ name: '模板', description: '' }, targetKey);
    // return;
    // if (isSkipPopup && selectedItem?.isSaved) {
    //   const detail = _.filter(graphItems.current, item => item.key === targetKey)?.[0]?.detail;
    //   onSaveOk({ name: detail?.canvas_name, description: detail?.canvas_info }, targetKey);
    // } else {
    //   setSaveModalFields([]);
    //   setSaveModalOperation({ targetKey, callBack });
    // }
  };
  const onCloseSaveModal = () => setSaveModalOperation(false);
  const onSaveOk = async (values: any, targetKey?: string, _isCreate?: boolean) => {
    const { knId = '', graphId = '' }: any = getParam() || {};
    const { name, description } = values;
    const saveItem =
      _.filter(graphItems.current, item => item.key === (targetKey || saveModalOperation?.targetKey))?.[0] || {};

    const isCreate = saveItem?.detail?.isCreate || !saveItem?.detail?.c_id;
    onChangeData({ type: 'detail', data: { ...saveItem.detail, isCreate: false } }); // 回复覆盖的标记

    const graphData = saveItem.graphData;
    const nodesKV = _.keyBy(graphData?.nodes, 'id');
    const edgesKV = _.keyBy(graphData?.edges, 'id');

    _.forEach(saveItem.graph.current?.getNodes(), d => {
      const { x, y, id, isAgencyNode, _sourceData } = d.getModel();
      if (isAgencyNode) return;
      if (nodesKV[id]) {
        if (selectedItem?.layoutConfig?.key === GRAPH_LAYOUT.TREE) {
          nodesKV[id] = { ...nodesKV[id], ..._sourceData };
        } else {
          nodesKV[id] = { ...nodesKV[id], ..._sourceData, x, y };
        }
      } else {
        nodesKV[id] = { x, y, ..._sourceData };
      }
    });

    if (!saveItem?.layoutConfig?.default?.isGroup) {
      _.forEach(saveItem.graph.current?.getEdges(), d => {
        const { id, _sourceData } = d.getModel();
        if (!id) return;
        if (!_sourceData) return;
        if (edgesKV[id]) {
          edgesKV[id] = { ...edgesKV[id], ..._sourceData };
        } else {
          edgesKV[id] = _sourceData;
        }
      });
    }

    const nodes = _.values(nodesKV);
    const edges = _.values(edgesKV);

    try {
      const postData: any = {
        canvas_name: name,
        canvas_info: description,
        canvas_body: JSON.stringify({
          graphConfig: saveItem?.graphConfig,
          layoutConfig: saveItem?.layoutConfig,
          rules: saveItem?.rules,
          graphStyle: saveItem?.graphStyle,
          sliced: saveItem?.sliced,
          nodes: _.map(nodes, item => ({ ...item, id: item?.uid || item?.id })),
          edges: _.map(edges, item => ({ ...item, id: item?.uid || item?.id }))
        })
      };
      let result: any = {};
      if (isCreate) {
        postData.knw_id = Number(knId || saveItem?.detail?.knw_id);
        postData.kg_id = Number(graphId || saveItem?.detail?.kg?.kg_id);
        result = await servicesVisualAnalysis.visualAnalysisAdd(postData);
        if (result?.res) {
          // 以保存y语句查询历史记录
          const sqlHistoryStore = localStore.get('sqlHistory') || {};
          sqlHistoryStore[`sqlHistory${result?.res}`] = ad_sqlHistory?.[selectedItem?.key];
          localStore.set('sqlHistory', sqlHistoryStore);
          const sql = _.cloneDeep(ad_sqlHistory);
          _.omit(sql, [selectedItem?.key]);
          ad_updateSqlHistory({ sqlHistory: sql });
        }
      } else {
        postData.c_id = saveItem?.detail?.c_id;
        result = await servicesVisualAnalysis.visualAnalysisUpdate(postData);
      }

      if (result?.res) {
        message.success(intl.get('global.saveSuccess'));
        const detail = { ...(saveItem?.detail || {}), c_id: result?.res };
        detail.isCreate = false;
        detail.canvas_name = name;
        detail.description = description;
        detail.currentTime = new Date().valueOf();

        onUpdateGraphItem({ ...saveItem, detail, title: name, isHaveChanged: false, isSaved: true });
        if (saveModalOperation.callBack) saveModalOperation.callBack();
        onCloseSaveModal();
      }
    } catch (error) {
      const { ErrorCode, Description } = error || {};
      if (ErrorCode === 'EngineServer.AlreadyExists') {
        // 重复的名字
        setSaveModalFields([{ name: 'name', errors: [intl.get('global.repeatName')] }]);
        return;
      }
      Description && message.error(Description);
    }
  };

  const saveModalDetail = _.filter(graphItems.current, item => item.key === saveModalOperation?.targetKey)?.[0]?.detail;
  // 退出前清空redux记录
  const clearHistory = () => {
    ad_updateSqlHistory({ sqlHistory: {} });
  };

  const onExit = () => {
    const saveItem = graphItems.current[0];
    if (saveItem.isHaveChanged) {
      const modalConfirm = Modal.confirm({
        closable: true,
        zIndex: 1052,
        title: intl.get('exploreGraph.exit'),
        icon: <ExclamationCircleFilled style={{ color: 'red' }} />,
        content: intl.get('exploreGraph.exitContent'),
        okText: intl.get('exploreGraph.saveClose'),
        cancelText: intl.get('exploreGraph.abandon'),
        onOk: () => {
          onSaveOk({ name: '模板', description: '' }, saveItem.key);
          adHistory.goBack();
          modalConfirm.destroy();
        },
        onCancel: (e: any) => {
          adHistory.goBack();
          modalConfirm.destroy();
        }
      });
    } else {
      adHistory.goBack();
    }
  };

  return (
    <div className="exploreGraphRoot kw-flex-column">
      <AdExitBar onExit={onExit} title={`${intl.get('global.analysis')}：${graphName}`} />
      <div className="kw-w-100 kw-flex-item-full-height">
        <HeaderTabs
          selectedItem={selectedItem}
          activeKey={activeKey}
          leftDrawerKey={leftDrawerKey}
          graphItems={graphItems.current}
          onChangeData={onChangeData}
          onOpenLeftDrawer={onOpenLeftDrawer}
          onCloseLeftDrawer={onCloseLeftDrawer}
          onOpenRightDrawer={onOpenRightDrawer}
          onCloseRightDrawer={onCloseRightDrawer}
          onOpenSaveModal={onOpenSaveModal}
          onChangeActive={onChangeActive}
          onChangeHasUnsaved={onChangeHasUnsaved}
          onChangeGraphItems={onChangeGraphItems}
          clearHistory={clearHistory}
        />
      </div>
      {rightDrawerKey === 'summary' && (
        <SummaryInfo
          selectedItem={selectedItem}
          summaryOpenInfo={summaryOpenInfo}
          onCloseRightDrawer={onCloseRightDrawer}
          onChangeData={onChangeData}
          onOpenRightDrawer={onOpenRightDrawer}
        />
      )}
      {rightDrawerKey === 'info' &&
        (selectedItem?.selected?.nodes?.[0]?._cfg || selectedItem?.selected?.edges?.[0]?._cfg) && (
          <BasicInfo
            summaryOpenInfo={summaryOpenInfo}
            selectedNode={
              selectedItem?.selected?.focusItem ||
              selectedItem?.selected?.nodes?.[0] ||
              selectedItem?.selected?.edges?.[0]
            }
            onChangeDrawerKey={onCloseRightDrawer}
            onOpenRightDrawer={onOpenRightDrawer}
          />
        )}
      {!!saveModalOperation && (
        <SaveAnalysisGraph
          detail={saveModalDetail}
          selectedItem={selectedItem}
          saveModalFields={saveModalFields}
          onSaveOk={onSaveOk}
          onClose={onCloseSaveModal}
        />
      )}
    </div>
  );
};

const mapStateToProps = (state: any) => ({
  ad_sqlHistory: state.getIn(['sqlQueryHistory'])?.toJS()?.sqlHistory || ''
});

const mapDispatchToProps = (dispatch: any) => ({
  ad_updateSqlHistory: (sqlHistory: any) => dispatch(sqlQueryHistory(sqlHistory))
});
export default connect(mapStateToProps, mapDispatchToProps)(ExploreGraph);
