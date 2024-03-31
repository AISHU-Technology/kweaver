import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from 'antd';
import { LeftOutlined, DoubleRightOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import _ from 'lodash';
import { ANALYSIS_SERVICES } from '@/enums';
import HOOKS from '@/hooks';
import Format from '@/components/Format';
import { tipModalFunc } from '@/components/TipModal';
import { triggerEvent } from '@/utils/handleFunction';
import EmbedConfig from './EmbedConfig';
import UniversalModal from '@/components/UniversalModal';
import './style.less';

import { mockGraph } from './mock';

import Canvas from './Canvas';
import { DEFAULT_CANVAS } from './enum';
import { generateCanvasConfig, isCheckedTool } from './assistant';
import CustomSearchTool from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/CustomSearchTool';
import NeighborSearchTool from '@/pages/CognitiveService/ServiceSearchTool/NeighborSearchTool';
import { BasicData } from '../../types';

let domCache: HTMLDivElement | null = null;
const createContainer = () => {
  if (domCache) return domCache;
  const container = document.createElement('div');
  domCache = container;
  document.body.appendChild(container);
  return container;
};
const { SEARCH_TYPE } = ANALYSIS_SERVICES;

export interface PC_ConfigModalProps {
  className?: string;
  zIndex?: number;
  visible?: boolean;
  basicData: BasicData;
  configInfo: Record<string, any>;
  savedPCConfig: any[];
  onCancel: () => void;
  onSave?: (data: any[]) => void;
}

const PC_ConfigModal = (props: PC_ConfigModalProps) => {
  const { className, zIndex = 9, visible, savedPCConfig, basicData, configInfo, onCancel, onSave } = props;
  const container = useRef(createContainer()); // 在document.body渲染
  const PCRef = useRef<any>(); // PC配置组件ref
  const [isExpand, setIsExpand] = useState(true); // 是否展开配置面板
  const [canvasConfig, setCanvasConfig] = useState<Record<string, any>>({}); // 给画布使用的配置, 不是PC配置
  const [searchToolVisible, setSearchToolVisible] = useState(true); // 搜索工具栏是否展开
  const canvasRef = useRef<Record<string, any>>({
    ..._.cloneDeep(DEFAULT_CANVAS),
    faker: true,
    configReady: true,
    graphConfig: { hasLegend: false, color: 'white', image: 'point' }
  }); // 图实例
  const forceUpdate = HOOKS.useForceUpdate();

  useEffect(() => {
    insertMockData();
    return () => {
      domCache?.remove();
      domCache = null;
    };
  }, []);

  useEffect(() => {
    if (!basicData.kg_id) return;
    Object.assign(canvasRef.current.detail, {
      kg: {
        kg_id: basicData.kg_id,
        knw_id: basicData.knw_id,
        service_id: basicData.id,
        operation_type: basicData.operation_type
      }
    });
  }, [basicData.kg_id]);

  // 插入演示数据
  const insertMockData = () => {
    const graph = _.cloneDeep(mockGraph);
    updateGraph?.({
      type: 'graphData',
      data: graph
    });
  };

  /**
   * 插入子图
   */
  const insertSubGraph = () => {
    const graph = _.cloneDeep(mockGraph);
    setTimeout(() => {
      const ids = {
        nodes: _.map(graph.nodes, d => d.id),
        edges: _.map(graph.edges, d => d.id)
      };
      canvasRef.current?.graph?.current?.__createSubGroup({
        mode: 'dashed',
        id: 'subgraph-id',
        name: '子图',
        members: ids.nodes,
        info: { ...ids, groupType: 'subgraph' },
        from: 'sliced',
        style: { fill: 'rgba(18, 110, 227, 0.2)', stroke: 'rgba(18, 110, 227, 0.35)' }
      });
    }, 0);
  };

  /**
   * 移除子图
   */
  const removeSubGraph = () => {
    canvasRef.current?.graph?.current?.__removeSubGroups();
  };

  /**
   * 更新图数据
   * @param item
   */
  const updateGraph = (item: any) => {
    const { type = '', data = {} } = item;
    if (!type) return;
    if (type === 'selected') {
      data.nodes = _.filter(data?.nodes, item => item._cfg.id !== 'groupTreeNodeTemp');
      data.time = new Date().valueOf();
    }
    if (type === 'layoutConfig') {
      data.default = data[data?.key] || {};
    }
    if (type === 'isLoading' && !data) {
      updateGraph({ type: 'exploring', data: { isExploring: false } });
    }
    canvasRef.current[type] = data;
    forceUpdate();
  };

  /**
   * 侧边栏折叠/收起
   */
  const onExpand = (bool: boolean) => {
    setIsExpand(bool);
    setTimeout(() => {
      triggerEvent('resize');
    }, 0);
  };

  /**
   * 返回
   */
  const handleGoBack = async () => {
    const isOk = await tipModalFunc({
      title: intl.get('analysisService.existTitle'),
      content: intl.get('analysisService.existTip'),
      closable: false
    });
    if (!isOk) return;
    onCancel();
  };

  /**
   * 恢复默认
   */
  const onReset = async () => {
    const isOk = await tipModalFunc({
      title: intl.get('cognitiveSearch.defaultTip'),
      content: intl.get('analysisService.caution'),
      closable: false
    });
    if (!isOk) return;
    PCRef.current?.reset();
  };

  /**
   * 点击保存
   */
  const handleSave = () => {
    const pcConfigure = PCRef.current?.getConfig();
    if (!pcConfigure) return;
    onCancel();
    onSave?.(pcConfigure);
  };

  /**
   * PC配置变化回调
   * @param data PC配置
   */
  const onConfigChange = (data: any[]) => {
    const config = generateCanvasConfig(data);
    setCanvasConfig(config.options);
    // [bug 465236 子图没有勾选右键时，右侧画布中，子图不出现]
    const subgraphRightClick = _.find(data, d => d.key === 'subgraphRightClick');
    const hasConfig = _.some(subgraphRightClick?.children?.[0]?.children, c => c.checked);
    if (hasConfig && _.isEmpty(canvasRef.current?.graph?.current?.__getSubGroups())) {
      insertSubGraph();
    } else if (!hasConfig) {
      removeSubGraph();
    }
  };

  /**
   * @returns 是否展示工具栏
   */
  const toolbarVisible = () => {
    const hasTool = isCheckedTool(canvasConfig?.toolbar); // 查询是否有配置顶部工具
    return canvasConfig?.toolbar?.visible && hasTool;
  };

  /**
   * 是否渲染自定义查询面板
   */
  const isRenderCustomSearchTool = () => {
    if (basicData.operation_type !== SEARCH_TYPE.CUSTOM_SEARCH) return false;
    if (!canvasConfig?.features?.options?.paramsTool?.visible) return false;
    return !!configInfo?.params?.length;
  };

  /**
   * 是否渲染邻居查询面板
   */
  const isRenderNeighborSearchTool = () => {
    if (basicData.operation_type !== SEARCH_TYPE.NEIGHBOR) return false;
    if (!canvasConfig.features?.options?.paramsTool?.visible) return false;
    return true;
  };

  return (
    <UniversalModal
      visible={visible}
      title={intl.get('cognitiveSearch.canvasConfig')}
      destroyOnClose={true}
      maskClosable={false}
      mask={false}
      className="step-second-canvas-config-model-root kw-p-0"
      onCancel={onCancel}
      width={'100vw'}
      style={{ height: '100%', top: 0, maxWidth: '100vw' }}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        {
          label: intl.get('cognitiveSearch.default'),
          onHandle: onReset
        },
        { label: intl.get('analysisService.saveAndExist'), type: 'primary', onHandle: handleSave }
      ]}
    >
      <div className="pc_config-modal-root kw-h-100">
        <div className="c-body">
          <div className="c-main kw-flex kw-h-100">
            <div className="side-bar kw-flex-column kw-h-100 " style={{ width: isExpand ? 440 : 56 }}>
              <div
                className="menu-item kw-pointer"
                style={{ display: isExpand ? 'none' : undefined }}
                onClick={() => onExpand(true)}
              >
                <DoubleRightOutlined />
              </div>
              <div style={{ display: !isExpand ? 'none' : undefined }}>
                <div className="side-title kw-space-between kw-pl-6">
                  <Format.Title>{intl.get('analysisService.featureTitle')}</Format.Title>
                  <span className="close-mask kw-pointer" onClick={() => onExpand(false)}>
                    <DoubleRightOutlined rotate={180} />
                  </span>
                </div>
              </div>
              <div className="kw-flex-item-full-height" style={{ display: !isExpand ? 'none' : undefined }}>
                <EmbedConfig
                  ref={PCRef}
                  savedPCConfig={savedPCConfig}
                  basicData={basicData}
                  onChange={onConfigChange}
                />
              </div>
            </div>
            <div className="right-box kw-flex-column kw-flex-item-full-width kw-p-4">
              <div className="canvas-box kw-flex-item-full-height">
                {isRenderCustomSearchTool() && (
                  <CustomSearchTool
                    readOnly
                    zIndex={1}
                    myStyle={{
                      width: 440,
                      top: toolbarVisible()
                        ? configInfo.params?.length > 1
                          ? 39
                          : 55
                        : configInfo.params?.length > 1
                        ? 0
                        : 16
                    }}
                    visible={searchToolVisible}
                    data={{ code: configInfo.statements, parameters: configInfo.params }}
                    onVisibleChange={v => setSearchToolVisible(v)}
                  />
                )}

                {isRenderNeighborSearchTool() && (
                  <NeighborSearchTool
                    readOnly
                    zIndex={1}
                    visible={searchToolVisible}
                    data={configInfo}
                    myStyle={{ top: toolbarVisible() ? 40 : 0 }}
                    onVisibleChange={(v: any) => setSearchToolVisible(v)}
                  />
                )}

                <Canvas
                  canvasInstance={canvasRef.current}
                  operation_type={basicData.operation_type}
                  hideEmpty
                  toolbarVisible={toolbarVisible()}
                  configMenu={{
                    canvas: canvasConfig?.canvasRightClick?.options?.basic?.options || {},
                    node: {
                      click: {
                        ...(canvasConfig?.nodeRightClick?.options?.basic?.options || {}),
                        ...(canvasConfig?.nodeRightClick?.options?.extensions?.options || {})
                      },
                      dblClick: _.merge(
                        canvasConfig?.nodeDoubleClick?.options?.basic?.options || {},
                        _.pickBy(canvasConfig?.toolbar?.options?.search?.options, value => value.type === 'custom')
                      )
                    },
                    edge: canvasConfig?.edgeRightClick?.options?.basic?.options || {},
                    subgraph: canvasConfig?.subgraphRightClick?.options?.basic?.options || {}
                  }}
                  config={canvasConfig?.toolbar?.options?.search?.options || {}}
                  configOperate={canvasConfig?.toolbar?.options?.canvas?.options || {}}
                  configFeatures={canvasConfig?.features?.options || {}}
                  updateGraph={updateGraph}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </UniversalModal>
  );
};

export default (props: PC_ConfigModalProps) => (props.visible ? <PC_ConfigModal {...props} /> : null);
