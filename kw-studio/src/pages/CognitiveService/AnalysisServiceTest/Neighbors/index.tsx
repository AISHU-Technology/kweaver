import React, { useState, useEffect, useRef, useMemo } from 'react';
import { message } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import snapshotsService from '@/services/snapshotsService';
import analysisService from '@/services/analysisService';
import visualAnalysis from '@/services/visualAnalysis';
import { GRAPH_LAYOUT, ANALYSIS_SERVICES, GRAPH_LAYOUT_PATTERN } from '@/enums';
import HOOKS from '@/hooks';
import LoadingMask from '@/components/LoadingMask';

// 引用 认知服务-图分析服务配置的组件
import NeighborSearchTool from '@/pages/CognitiveService/ServiceSearchTool/NeighborSearchTool';
import Canvas from '../../AnalysisServiceConfig/ConfigAndTest/Canvas';
import { BasicData } from '../../AnalysisServiceConfig/types';
import { ERROR, DEFAULT_CANVAS } from '../../AnalysisServiceConfig/ConfigAndTest/enum';
import { PARAM_TYPE } from '@/pages/CognitiveService/AnalysisServiceConfig/ConfigAndTest/ConfigPanel/ConfigureRules/enums';
import { getParam } from '@/utils/handleFunction';
import { isCheckedTool, generateCanvasConfig } from '../assistant';
import {
  getInitResState,
  parseCommonResult
} from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/ResultPanel';
import { graphPolyfill } from '@/pages/KnowledgeNetwork/ExploreGraph/polyfill';

const { ACCESS_METHOD } = ANALYSIS_SERVICES;

const NeighborContainer = (props: { serviceInfo: Record<string, any>; sId?: any }) => {
  const { serviceInfo, sId } = props;
  const canvasRef = useRef<Record<string, any>>(_.cloneDeep(DEFAULT_CANVAS)); // 图数据
  const forceUpdate = HOOKS.useForceUpdate();

  const [isFirst, setIsFirst] = useState(true);
  const [serviceData, setServiceData] = useState<BasicData>({} as BasicData);
  const [searchToolVisible, setSearchToolVisible] = useState(true); // 搜索工具栏是否展开
  const [loading, setLoading] = useState(false); // 初始化的loading
  const [configInfo, setConfigInfo] = useState<Record<string, any>>({}); //
  const [results, setResults] = useState(() => getInitResState()); // 搜索结果面板数据
  const [closeInfo, setIsCloseInfo] = useState<boolean>(false);
  const [graphLayoutPattern, setGraphLayoutPattern] = useState(GRAPH_LAYOUT_PATTERN.COMMON);
  const [iframeConfig, setIframeConfig] = useState<any>({}); // 画布配置
  const isShowResultPanel = useMemo(() => {
    return !!iframeConfig?.features?.options?.resultPanel?.visible;
  }, [iframeConfig?.features]);

  // 初始化
  useEffect(() => {
    serviceInfo.id && init(serviceInfo.id);
  }, [serviceInfo]);

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
        let showResult = false;

        try {
          const { graphStyle, graphConfig, layoutConfig, graphLayoutPattern } = JSON.parse(res?.canvas_body);
          const pc_configure_item = JSON.parse(res.pc_configure_item);
          const config = generateCanvasConfig(pc_configure_item);
          setIframeConfig(config.options);
          setGraphLayoutPattern(graphLayoutPattern);
          showResult = !!config.options.features?.options?.resultPanel?.visible;
          if (graphStyle) updateGraph({ type: 'graphStyle', data: graphStyle });
          if (graphConfig) updateGraph({ type: 'graphConfig', data: graphConfig });
          layoutConfig && updateGraph({ type: 'layoutConfig', data: layoutConfig });
        } catch (error) {
          setIframeConfig({});
          // console.warn(error);
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
        triggerSearchByInit(res, showResult);
      }
    } catch (err) {
      setLoading(false);
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
   * @param showResult 是否显示结果面板
   */
  const triggerSearchByInit = (data: any, showResult = false) => {
    const otherParams: any = getParam();
    const urlParam = new URLSearchParams(window.location.search);
    const vidsValues = _.filter(urlParam.getAll('vids'), v => !!v);
    const steps = Number(otherParams?.steps);
    // url 带有vids
    if (!vidsValues?.length) return;

    const filters = _.map(data?.config_info?.filters, filter => {
      const v_filters = _.map(filter?.v_filters, v => {
        let property_filters = _.map(v?.property_filters, p => {
          if (otherParams?.[p?.custom_param?.name]) {
            return { ...p, type: PARAM_TYPE?._CONSTANT, op_value: otherParams?.[p?.custom_param?.name] };
          }
          // 自定义变量且没输入参数值。过滤掉该属性
          if (p?.type === PARAM_TYPE?._CUSTOMVAR) return '';
          return p;
        });
        property_filters = _.filter(property_filters, p => !!p);
        return { ...v, property_filters };
      });
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
      return { v_filters, e_filters };
    });
    const configInfo = { filters, vids: vidsValues, direction: otherParams?.direction, steps };
    getResult({ ...data, config_info: configInfo }, undefined, showResult);
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
    if (sId === 'null' || !sId) return;
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
        graphPolyfill(graphData);
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
   * @param action 搜索方式
   */
  const getResult = async (data: Record<string, any>, action?: 'add' | 'cover', showResult?: boolean) => {
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
      if (res) {
        updateGraph({ type: 'add', data: { nodes: [], edges: [], length: 0 } });
        if (!res?.nodes?.length) {
          switch (true) {
            case ['add', 'cover'].includes(action!):
              message.warning(intl.get('analysisService.queryNullErr'));
              break;
            default:
              message.warning(intl.get('exploreGraph.noSearch'));
          }
          updateGraph({ type: 'exploring', data: { isExploring: false } });
          return;
        }

        const paramsNodes = await getNodesByParams(body.config_info?.vids, body.kg_id);
        const { graph } = parseCommonResult(res);
        const addedData = {
          nodes: _.uniqBy([...paramsNodes, ...graph.nodes], 'id'),
          edges: graph.edges
        };
        updateGraph({
          type: 'add',
          data: { ...addedData, length: addedData.nodes.length + addedData.edges.length, action }
        });
        (showResult || isShowResultPanel) &&
          setResults({
            visible: true,
            data: {
              ...(body.config_info?.final_step ? graph : addedData),
              neighbor: { staticMode: body.config_info?.final_step, queryNodes: [...paramsNodes] }
            },
            originData: res,
            checkable: false,
            params: body
          });
        // 树布局无法触发layout回调直接关闭loading
        if (canvasRef.current.layoutConfig?.key === GRAPH_LAYOUT.TREE) {
          updateGraph({ type: 'exploring', data: { isExploring: false } });
        }
      }
    } catch (err) {
      updateGraph({ type: 'exploring', data: { isExploring: false } });
      const { ErrorCode, Description, ErrorDetails } = err?.response || err?.data || err || {};
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
   * 邻居查询不会返回自身, 参数中的点需要额外查询
   * @param ids
   */
  const getNodesByParams = async (ids: any, kgId: number) => {
    try {
      const kg_id = String(kgId);
      const param = { kg_id, vids: ids, page: 1, size: ids?.length, search_config: [] };
      const response = await visualAnalysis.vidRetrieval(param);
      const { graph } = parseCommonResult(response?.res);
      return graph.nodes;
    } catch (err) {
      return [];
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
  const onSearch = (data: any, action?: any) => {
    getResult({ config_info: data }, action);
  };

  /**
   * 判断是否有pc配置
   */
  const hasPcConfig = () => _.includes(serviceData.access_method, ACCESS_METHOD.PC_EMBED);

  /**
   * @returns 是否展示工具栏
   */
  const toolbarVisible = () => {
    if (_.isEmpty(serviceData)) return false;
    if (hasPcConfig()) {
      const hasTool = isCheckedTool(iframeConfig?.toolbar); // 查询是否有配置顶部工具
      return iframeConfig?.toolbar?.visible && hasTool;
    }
    return true;
  };

  /**
   * @returns 是否展示参数查询
   */
  const isRenderSearchTool = () => {
    if (_.isEmpty(serviceData)) return false;
    if (hasPcConfig() && !iframeConfig?.features?.options?.paramsTool?.visible) return false;
    return true;
  };

  return (
    <>
      <LoadingMask loading={loading} />
      <div className="canvas-box kw-h-100">
        {isRenderSearchTool() && (
          <NeighborSearchTool
            zIndex={1}
            canvasInstance={canvasRef.current}
            visible={searchToolVisible}
            data={configInfo}
            outerResults={results}
            myStyle={{ top: toolbarVisible() ? 40 : 0 }}
            onSearch={onSearch}
            onVisibleChange={(v: any) => setSearchToolVisible(v)}
            onCloseResult={() => setResults(getInitResState())}
          />
        )}

        <Canvas
          closeInfo={closeInfo}
          toolbarVisible={toolbarVisible()}
          graphLayoutPattern={graphLayoutPattern}
          operation_type={serviceData?.operation_type || 'neighbors'}
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

export default NeighborContainer;
