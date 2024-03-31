/**
 * 画布二次封装, 整合图内部的交互
 */
import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';

// 引用可视化分析的组件、方法
import servicesExplore from '@/services/explore';
import GraphContainer from '@/pages/KnowledgeNetwork/ExploreGraph/GraphContainer';
import CanvasBasicInfo from '@/pages/KnowledgeNetwork/ExploreGraph/Drawer/BasicInfo';
import CanvasSummaryInfo from '@/pages/KnowledgeNetwork/ExploreGraph/Drawer/SummaryInfo';
import { parseCommonResult } from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/ResultPanel';

import emptyImg from '@/assets/images/configSearchTip.svg';
import TipModal from '@/pages/KnowledgeNetwork/ExploreGraph/components/TipModel';
import '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/SqlQuery/style.less';
import { TOOLBAR, SEARCH_MENU, FEATURES } from '../enum';

export interface CanvasProps {
  closeInfo?: boolean; // 是否收起基本信息栏
  openLeftKey?: string; // 外部控制打开左侧侧边栏
  toolbarVisible?: boolean; // 是否展示顶部操作条
  configMenu?: any; // 右键配置
  config?: any; // 画布搜索功能配置
  configOperate?: any; // 顶部工具栏配置
  configFeatures?: any; // 画布其他散碎功能配置(欢迎语、参数搜索工具)
  canvasInstance: any; // 画布实例
  hideEmpty?: boolean; // 是否隐藏空白缺醒图
  leftOffset?: number; // 走索结果抽屉左侧偏移量
  operation_type: string; // 服务类型
  resultModalInfo?: any;
  graphLayoutPattern?: string; // 图谱布局类型
  updateGraph: (data: any) => void;
  onCloseResultModal?: () => void; // 关闭搜索结果弹窗
  onSearchToolChange?: (key: string) => void; // 让外部监听到搜索工具变化
}

const Canvas = (props: CanvasProps) => {
  const {
    closeInfo,
    openLeftKey,
    toolbarVisible,
    configMenu,
    config = SEARCH_MENU,
    configOperate = TOOLBAR,
    configFeatures = FEATURES,
    canvasInstance,
    hideEmpty,
    graphLayoutPattern,
    updateGraph,
    onSearchToolChange
  } = props;
  const [rightDrawerKey, setRightDrawerKey] = useState(''); // 控制右侧抽屉 info 信息汇总，summary
  const [summaryOpenInfo, setSummaryOpenInfo] = useState<{ openInfo: boolean; infoId?: string }>({
    openInfo: false,
    infoId: ''
  }); // 保存汇总跳转到详情的数据
  const onCloseRightDrawer = () => setRightDrawerKey(''); // 关闭画布右侧信息栏
  const [leftDrawerKey, setLeftDrawerKey] = useState(''); // 搜索工具
  const onOpenLeftDrawer = (key: string) => setLeftDrawerKey(key);
  const onCloseLeftDrawer = () => setLeftDrawerKey('');

  useEffect(() => {
    if (closeInfo) onCloseRightDrawer();
  }, [closeInfo]);

  useEffect(() => {
    if (openLeftKey) setLeftDrawerKey(openLeftKey);
  }, [openLeftKey]);

  useEffect(() => {
    onSearchToolChange?.(leftDrawerKey);
  }, [leftDrawerKey]);

  useEffect(() => {
    onCloseLeftDrawer();
  }, [canvasInstance?.forceCloseLeftDrawer]);

  useEffect(() => {
    if (configMenu?.click?.information?.checked === false) return;
    if (canvasInstance?.selected?.length === 1) {
      if (!summaryOpenInfo?.openInfo) {
        setTimeout(() => {
          onOpenRightDrawer('info');
        }, 300);
      } else {
        setSummaryOpenInfo({ ...summaryOpenInfo, openInfo: false });
      }
    }
    if (canvasInstance?.selected?.length === 0) onCloseRightDrawer();
  }, [canvasInstance?.selected?.nodes?.[0]?._cfg?.id, canvasInstance?.selected?.edges?.[0]?._cfg?.id]);

  const handleUpdate = (item: any) => {
    updateGraph(item);
    const { type = '', data = {} } = item;

    if (type === 'path' && !data?.changeStyle) {
      getPointPath(data);
    }
  };

  const onOpenRightDrawer = (key: string, infoId?: any) => {
    if (infoId && key === 'info') setSummaryOpenInfo({ openInfo: true, infoId });
    setRightDrawerKey(key);
  };

  // 查询两点的路径
  const getPointPath = async (data: any) => {
    const { start, end, direction } = data;
    if (start?.id === end?.id) return;
    const id = canvasInstance.detail?.kg?.kg_id;
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

      updateGraph({ type: 'exploring', data: { isExploring: true } });
      const res = await servicesExplore.explorePath(params);
      updateGraph({ type: 'exploring', data: { isExploring: false } });

      if (_.isEmpty(res?.res?.paths)) {
        updateGraph({ type: 'exploring', data: { isExploring: false } });
        message.warning([intl.get('searchGraph.exploreNone')]);
        return;
      }

      let tipOk: any = true; // 数据量过大提示回调
      const { graph } = parseCommonResult(res.res);
      if (graph.nodes?.length > 500) {
        tipOk = await TipModal({});
      }
      if (!tipOk) return;
      updateGraph({
        type: 'add',
        data: { ...graph, length: graph.nodes?.length + graph.edges?.length }
      });
      updateGraph({ type: 'path', data: { start, end, changeStyle: true } });
    } catch (err) {
      if (err?.type === 'message') {
        const { Description } = err.response?.res || err.response;
        Description && message.error(Description);
      } else {
        const { Description } = err || {};
        Description && message.error(Description);
      }
      updateGraph({ type: 'exploring', data: { isExploring: false } });
    }
  };

  const configSearch = _.isEmpty(_.filter(config, item => item.checked)) ? {} : config;
  return (
    <>
      <GraphContainer
        toolbarVisible={toolbarVisible}
        configOperate={configOperate}
        configMenu={configMenu}
        configSearch={configSearch}
        configFeatures={configFeatures}
        selectedItem={canvasInstance}
        leftDrawerKey={leftDrawerKey}
        graphLayoutPattern={graphLayoutPattern}
        onChangeData={handleUpdate}
        onOpenRightDrawer={onOpenRightDrawer}
        onCloseLeftDrawer={onCloseLeftDrawer}
        onCloseRightDrawer={onCloseRightDrawer}
        onOpenLeftDrawer={onOpenLeftDrawer}
        empty={
          !hideEmpty ? (
            <div className="kw-center" style={{ height: 'calc(100% - 40px)', flexDirection: 'column' }}>
              <img src={emptyImg} />
              <div className="kw-c-text" style={{ maxWidth: 320, textAlign: 'center' }}>
                {intl.get('analysisService.canvasEmptyTip')}
              </div>
            </div>
          ) : (
            <></>
          )
        }
      />

      {rightDrawerKey === 'summary' && (
        <CanvasSummaryInfo
          style={toolbarVisible ? {} : { top: 0, height: '100%' }}
          selectedItem={canvasInstance}
          onCloseRightDrawer={onCloseRightDrawer}
          onChangeData={updateGraph}
          summaryOpenInfo={summaryOpenInfo}
          onOpenRightDrawer={onOpenRightDrawer}
        />
      )}

      {rightDrawerKey === 'info' && (
        <CanvasBasicInfo
          style={toolbarVisible ? {} : { top: 0, height: '100%' }}
          selectedNode={canvasInstance?.selected?.nodes?.[0] || canvasInstance?.selected?.edges?.[0]}
          summaryOpenInfo={summaryOpenInfo}
          onChangeDrawerKey={onCloseRightDrawer}
          onOpenRightDrawer={onOpenRightDrawer}
        />
      )}
    </>
  );
};

export default Canvas;
