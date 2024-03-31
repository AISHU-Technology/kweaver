import React, { useState, useEffect, useRef } from 'react';
import { message } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import snapshotsService from '@/services/snapshotsService';
import analysisService from '@/services/analysisService';
import serviceGraphDetail from '@/services/graphDetail';

import { GRAPH_LAYOUT, ANALYSIS_SERVICES, GRAPH_LAYOUT_PATTERN } from '@/enums';
import HOOKS from '@/hooks';
import LoadingMask from '@/components/LoadingMask';

// 引用 认知服务-图分析服务配置的组件
import PathSearchTool from '@/pages/CognitiveService/ServiceSearchTool/PathSearchTool';
import Canvas from '../../AnalysisServiceConfig/ConfigAndTest/Canvas';
import { BasicData } from '../../AnalysisServiceConfig/types';
import { ERROR, DEFAULT_CANVAS } from '../../AnalysisServiceConfig/ConfigAndTest/enum';
import { PARAM_TYPE } from '@/pages/CognitiveService/AnalysisServiceConfig/ConfigAndTest/ConfigPanel/ConfigureRules/enums';
import { getParam } from '@/utils/handleFunction';
import { generateCanvasConfig } from '../assistant';

import {
  getInitResState,
  parseCommonResult
} from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/ResultPanel';

const { ACCESS_METHOD } = ANALYSIS_SERVICES;
const OTHERS = ['direction', 'steps', 'path_decision', 'edges', 'property', 'default_value', 'path_type'];
const PathContainer = (props: { serviceInfo: Record<string, any>; sId?: any }) => {
  const { serviceInfo, sId } = props;
  const canvasRef = useRef<Record<string, any>>(_.cloneDeep(DEFAULT_CANVAS)); // 图数据
  const forceUpdate = HOOKS.useForceUpdate();

  const [isFirst, setIsFirst] = useState(true);
  const [serviceData, setServiceData] = useState<BasicData>({} as BasicData);
  const [searchToolVisible, setSearchToolVisible] = useState(true); // 搜索工具栏是否展开
  const [loading, setLoading] = useState(false); // 初始化的loading
  const [configInfo, setConfigInfo] = useState<Record<string, any>>({}); //
  const [results, setResults] = useState(() => getInitResState()); // 搜索结果面板数据
  const [ontoData, setOntoData] = useState<any>({}); // 本体数据
  const [closeInfo, setIsCloseInfo] = useState<boolean>(false);
  const [graphLayoutPattern, setGraphLayoutPattern] = useState(GRAPH_LAYOUT_PATTERN.COMMON);
  // 画布配置
  const [iframeConfig, setIframeConfig] = useState<any>({});

  // 初始化
  useEffect(() => {
    serviceInfo.id && init(serviceInfo.id);
  }, [serviceInfo]);

  useEffect(() => {
    getClassData();
  }, [serviceData.kg_id]);

  /**
   * 初始化的逻辑
   * @param id 服务id
   */
  const init = async (id: number) => {
    if (!id) return;
    try {
      setLoading(true);
      const { res } = (await analysisService.analysisServiceGet(id)) || {};
      setLoading(false);
      if (res) {
        const { config_info, ...info } = res;
        setConfigInfo(config_info);
        setServiceData(res);

        try {
          const { graphStyle, graphConfig, layoutConfig, graphLayoutPattern } = JSON.parse(res?.canvas_body);
          const pc_configure_item = JSON.parse(res.pc_configure_item);
          const config = generateCanvasConfig(pc_configure_item);
          setIframeConfig(config.options);
          setGraphLayoutPattern(graphLayoutPattern);
          if (graphStyle) updateGraph({ type: 'graphStyle', data: graphStyle });
          if (graphConfig) updateGraph({ type: 'graphConfig', data: graphConfig });
          layoutConfig && updateGraph({ type: 'layoutConfig', data: layoutConfig });
        } catch (error) {
          setIframeConfig({});
        }
        updateGraph({ type: 'configReady', data: true }); // 给个获取配置完毕的标识

        updateGraph({
          type: 'detail',
          data: {
            ...(canvasRef.current?.detail || {}),
            kg: {
              ...(canvasRef.current?.detail?.kg || {}),
              kg_id: Number(info.kg_id),
              name: info.kg_name,
              service_id: info.id,
              knw_id: info.knw_id,
              operation_type: info.operation_type
            }
          }
        });
        if (sId) {
          await getSnapshots(sId, res?.kg_id);
        }
        triggerSearchByInit(res);
      }
    } catch (err) {
      setLoading(false);
      setSearchToolVisible(false);
      const { Description, ErrorCode } = err?.response || err?.data || err || {};
      if (ErrorCode === 'Cognitive.ServicePermissionDeniedErr') {
        return message.error(intl.get('license.serAuthError'));
      }
      if (ErrorCode === 'Cognitive.GraphPermissionDeniedErr') {
        return message.error(intl.get('analysisService.noGraphAuth'));
      }
      Description && message.error(Description);
    }
  };

  /**
   * 初始化触发搜索
   * @param data 分析服务数据
   */
  const triggerSearchByInit = (data: any) => {
    const otherParams: any = getParam();
    const source = otherParams.source;
    const target = otherParams.target;

    // url 带有vids
    if (!source || !target) return;

    const filters = _.map(data?.config_info?.filters, filter => {
      const e_filters = _.map(filter?.e_filters, e => {
        let property_filters = _.map(e?.property_filters, p => {
          if (otherParams?.[p?.custom_param?.name]) {
            return { ...p, type: PARAM_TYPE?._CONSTANT, op_value: otherParams?.[p?.custom_param?.name] };
          }
          if (p?.type === PARAM_TYPE?._CUSTOMVAR) return '';
          return p;
        });
        property_filters = _.filter(property_filters, p => !!p);
        return { ...e, property_filters };
      });
      return { e_filters };
    });
    // 其他参数
    const others = _.pick(otherParams, OTHERS);
    const configInfo = { filters, source, target, ...others };
    getResult({ ...data, config_info: configInfo });
  };

  /** sId 为-1展示的一个 */
  const getFirstSId = async (kgId: any, s_id: any) => {
    try {
      const { res } = await snapshotsService.snapshotsGetList({ kg_id: kgId, service_id: serviceInfo.id });
      if (!res) return 'null';
      const { count, snapshots } = res;
      if (count === 0) return 'null';
      if (s_id === -1 || s_id === '-1') {
        return snapshots?.[0]?.s_id;
      }
      const snapshot = _.find(snapshots, s => String(s?.s_id) === String(s_id));
      if (!snapshot?.s_id) {
        message.error(intl.get('exploreGraph.snapshots.snapshotsNotExist'));
        return 'null';
      }
      return snapshot?.s_id;
    } catch (err) {
      //
    }
  };
  /** 获取默认快照 */
  const getSnapshots = async (s_id: any, kgId: any) => {
    const sId = await getFirstSId(kgId, s_id);
    if (sId === 'null') return;
    try {
      const { res } = await snapshotsService.snapshotsGetById(sId, kgId);
      if (!res) return;
      const detail = JSON.parse(res.snapshot_body);
      const nodes = canvasRef.current?.graph.current.getNodes();
      const edges = canvasRef.current?.graph.current.getEdges();

      if (nodes.length === 0) {
        const graphData = {
          nodes: _.map(detail?.graphData?.nodes || [], item => ({ ...item, x: item.x, y: item.y, hide: false })),
          edges: _.map(detail?.graphData?.edges || [], item => ({ ...item, hide: false }))
        };
        updateGraph({ type: 'layoutConfig', data: detail.layoutConfig });
        updateGraph({ type: 'graphData', data: graphData });
        updateGraph({ type: 'sliced', data: detail.sliced || [] });
      } else {
        updateGraph({ type: 'delete', data: { nodes, edges, length: nodes.length + edges.length } });
        setTimeout(() => {
          const graphData = {
            nodes: _.map(detail?.graphData?.nodes || [], item => ({ ...item, x: item.x, y: item.y, hide: false })),
            edges: _.map(detail?.graphData?.edges || [], item => ({ ...item, hide: false }))
          };
          updateGraph({ type: 'layoutConfig', data: detail.layoutConfig });
          updateGraph({ type: 'graphData', data: graphData });
          updateGraph({ type: 'sliced', data: detail.sliced || [] });
        }, 1000);
      }
    } catch (error) {
      if (error.type !== 'message') return;
      if (error?.response?.ErrorDetails?.[0]?.detail) {
        message.error(error?.response?.ErrorDetails?.[0]?.detail);
      } else {
        message.error(error?.response?.ErrorCode);
      }
    }
  };

  /**
   * 发起搜索请求
   * @param data 服务配置
   * @param params 参数
   */
  const getResult = async (data: Record<string, any>, action?: 'add' | 'cover' | string) => {
    try {
      const originData = serviceData;
      const body = {
        knw_id: originData.knw_id || data?.knw_id,
        kg_id: originData.kg_id || data?.kg_id,
        operation_type: originData.operation_type || data?.operation_type,
        config_info: data?.config_info
      };
      if (isFirst) {
        updateGraph({ type: 'exploring', data: { isExploring: true, hasCancel: false } });
      } else {
        updateGraph({ type: 'exploring', data: { isExploring: true } });
      }
      setIsFirst(false);

      const { res } = await analysisService.analysisServiceTest(body);
      updateGraph({ type: 'exploring', data: { isExploring: false } });
      const { graph, paths } = parseCommonResult(res);
      if (!res || !paths?.length) {
        switch (true) {
          case ['add', 'cover'].includes(action!):
            message.warning(intl.get('analysisService.queryNullErr'));
            break;
          default:
            message.warning(intl.get('exploreGraph.noSearch'));
        }
        return;
      }
      if (res) {
        updateGraph({ type: 'add', data: { nodes: [], edges: [], length: 0 } });
        setResults({
          visible: true,
          data: paths,
          originData: { res },
          params: body
        } as any);
        updateGraph({
          type: 'add',
          data: {
            nodes: graph?.nodes,
            edges: graph?.edges,
            length: graph?.nodes?.length + graph?.edges?.length,
            action
          }
        });

        // 树布局无法触发layout回调直接关闭loading
        if (canvasRef.current.layoutConfig?.key === GRAPH_LAYOUT.TREE) {
          updateGraph({ type: 'exploring', data: { isExploring: false } });
        }
      }
    } catch (err) {
      updateGraph({ type: 'exploring', data: { isExploring: false } });
      const { ErrorCode, Description, ErrorDetails } = err?.response || err.data || err || {};
      if (ERROR[ErrorCode]) {
        return message.error(intl.get(ERROR[ErrorCode]));
      }
      // 格式错误
      if (['Cognitive.SyntaxErr', 'Cognitive.SemanticErr'].includes(ErrorCode)) {
        return message.error(ErrorDetails[0]?.detail || Description);
      }
      if (ErrorCode === 'EngineServer.PermissionDeniedErr') {
        return message.error(intl.get('analysisService.noGraphAuth'));
      }
      Description && message.error(Description);
    }
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
    setIsCloseInfo(false);

    // 搜索时关闭弹窗和结果
    if (type === 'exploring' && data.isExploring) {
      setSearchToolVisible(false);
      setIsCloseInfo(true);
    }
  };

  /**
   * 搜索
   */
  const onSearch = (data: any, action: any) => {
    getResult({ config_info: data }, action);
  };

  /**
   * 判断是否有pc配置
   */
  const hasPcConfig = () => _.includes(serviceData.access_method, ACCESS_METHOD.PC_EMBED);

  /**
   * @returns 是否展示工具栏
   */
  const isRenderSearchTool = () => {
    if (_.isEmpty(serviceData)) return false;
    if (hasPcConfig() && !iframeConfig?.features?.options?.paramsTool?.visible) return false;
    return true;
  };

  /** 获取本体信息 */
  const getClassData = async () => {
    const id: any = serviceData?.kg_id; // 图谱id
    // if (!parseInt(id) ) return;
    if (parseInt(id) <= 0 || typeof parseInt(id) === 'number') return;

    try {
      const resultOnto = await serviceGraphDetail.graphGetInfoOnto({ graph_id: id });
      const entityData = resultOnto?.res;
      setOntoData(entityData);
    } catch (err) {
      //
    }
  };

  return (
    <>
      <LoadingMask loading={loading} />
      <div className="canvas-box kw-h-100">
        {isRenderSearchTool() && (
          <PathSearchTool
            zIndex={1}
            serviceType={serviceData?.operation_type}
            canvasInstance={canvasRef.current}
            visible={searchToolVisible}
            data={configInfo}
            outerResults={results}
            ontoData={ontoData}
            myStyle={{ top: isRenderSearchTool() ? 40 : 0 }}
            onSearch={onSearch}
            onVisibleChange={(v: any) => setSearchToolVisible(v)}
            onCloseResult={() => setResults(getInitResState())}
          />
        )}

        <Canvas
          closeInfo={closeInfo}
          toolbarVisible={isRenderSearchTool()}
          graphLayoutPattern={graphLayoutPattern}
          operation_type={'paths'}
          configMenu={
            hasPcConfig()
              ? {
                  click: iframeConfig?.click?.options || {},
                  hover: iframeConfig?.hover?.options || {},
                  canvas: iframeConfig?.canvasRightClick?.options?.basic?.options || {},
                  node: {
                    click: {
                      ...(iframeConfig?.nodeRightClick?.options?.basic?.options || {}),
                      ...(iframeConfig?.nodeRightClick?.options?.extensions?.options || {})
                    },
                    dblClick: _.merge(
                      iframeConfig?.nodeDoubleClick?.options?.basic?.options || {},
                      _.pickBy(iframeConfig?.toolbar?.options?.search?.options, value => value.type === 'custom')
                    )
                  },
                  edge: iframeConfig?.edgeRightClick?.options?.basic?.options || {}
                }
              : undefined
          }
          config={hasPcConfig() ? iframeConfig?.toolbar?.options?.search?.options || {} : undefined}
          configOperate={hasPcConfig() ? iframeConfig?.toolbar?.options?.canvas?.options || {} : undefined}
          configFeatures={hasPcConfig() ? iframeConfig?.features?.options || {} : undefined}
          hideEmpty
          canvasInstance={canvasRef.current}
          leftOffset={0}
          updateGraph={updateGraph}
          onSearchToolChange={key => {
            if (key) {
              setSearchToolVisible(false);
              setResults(getInitResState());
            }
          }}
        />
      </div>
    </>
  );
};

export default PathContainer;
