import React, { useState, useEffect, useRef, useMemo } from 'react';
import { message } from 'antd';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import _ from 'lodash';
import snapshotsService from '@/services/snapshotsService';
import analysisService from '@/services/analysisService';
import { GRAPH_LAYOUT, ANALYSIS_SERVICES, GRAPH_LAYOUT_PATTERN } from '@/enums';
import HOOKS from '@/hooks';
import HELPER from '@/utils/helper';
import LoadingMask from '@/components/LoadingMask';

// 引用 认知服务-图分析服务配置的组件
import CustomSearchTool from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/CustomSearchTool';
import Canvas from '../../AnalysisServiceConfig/ConfigAndTest/Canvas';
import { BasicData } from '../../AnalysisServiceConfig/types';
import { formatStatements } from '../../AnalysisServiceConfig/ConfigAndTest/assistant';
import { ERROR, DEFAULT_CANVAS } from '../../AnalysisServiceConfig/ConfigAndTest/enum';
import { getParam } from '@/utils/handleFunction';
import { isCheckedTool, generateCanvasConfig } from '../assistant';
import { getInitResState } from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/ResultPanel';
import { parseStatementResult } from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/ResultPanel/parse';
import { graphPolyfill } from '@/pages/KnowledgeNetwork/ExploreGraph/polyfill';

const { ACCESS_METHOD } = ANALYSIS_SERVICES;

const CanvasContainer = (props: { serviceInfo: Record<string, any>; sId?: any }) => {
  const { serviceInfo, sId } = props;
  const canvasRef = useRef<Record<string, any>>(_.cloneDeep(DEFAULT_CANVAS)); // 图数据
  const forceUpdate = HOOKS.useForceUpdate();

  const [isFirst, setIsFirst] = useState(true);
  const [serviceData, setServiceData] = useState<BasicData>({} as BasicData);
  const [searchToolVisible, setSearchToolVisible] = useState(true); // 搜索工具栏是否展开
  const [loading, setLoading] = useState(false); // 初始化的loading
  const [configInfo, setConfigInfo] = useState<Record<string, any>>({}); // 配置信息, 不同方式数据结构不同, 目前仅自定义搜索
  const [results, setResults] = useState(() => getInitResState()); // 搜索结果面板数据
  const [closeInfo, setIsCloseInfo] = useState<boolean>(false);
  const [graphLayoutPattern, setGraphLayoutPattern] = useState(GRAPH_LAYOUT_PATTERN.COMMON);
  // engine、builder字段转换
  const searParam = useMemo(() => ({ code: configInfo.statements, parameters: configInfo.params }), [configInfo]);
  const [iframeConfig, setIframeConfig] = useState<any>({}); // 画布配置
  const isShowResultPanel = useMemo(() => {
    return !!iframeConfig?.features?.options?.resultPanel?.visible;
  }, [iframeConfig?.features]);

  // 初始化
  useEffect(() => {
    serviceInfo.id && init(serviceInfo.id);
  }, [serviceInfo]);

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
          // 先执行快照
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
    const urlParams: any = getParam();
    let hasNull = false;
    _.forEach(data.config_info?.params, param => {
      const value = urlParams[param.name];
      if (!value) {
        hasNull = true;
        return;
      }
      if (param.param_type === 'string' || (param.param_type === 'entity' && param.options === 'single')) {
        param.input = value;
        param.nodes = [{ id: value, default_property: { value } }];
      }
      if (param.param_type === 'entity' && param.options === 'multiple') {
        const input = _.split(value, '$$');
        param.input = input;
        param.nodes = _.map(input, value => ({ id: value, default_property: { value } }));
      }
    });
    setConfigInfo(data.config_info);
    if (hasNull) {
      return;
    }
    data.config_info?.statements && getResult(data, undefined, undefined, showResult);
  };

  const nodeType: any = {
    circle: 'customCircle',
    rect: 'customRect'
  };
  const getLabelValues = (labels?: any[], limit?: number) => {
    if (!labels) return '';
    const checkedLabel = _.filter(labels, l => l?.isChecked);
    return _.map(checkedLabel, l => HELPER.stringEllipsis(l.value, limit || 15))?.join('\n');
  };
  /** bug 492488
   * 初次添加graphData。需要手动改showLabels
   */
  const handelData = ({ nodes, edges }: any) => {
    const rNodes = _.map(nodes, _item => {
      const item: any = {
        labelLength: 15,
        position: 'top',
        type: 'customCircle',
        iconColor: 'rgba(255,255,255,1)',
        fillColor: _item.color,
        strokeColor: _item.color,
        size: 36,
        ..._item
      };

      const data = canvasRef.current?.graphStyle?.node?.[item.class] || {};
      const { type, labelLength, showLabels: _showLabels } = data;

      let showLabelsKV = _.keyBy(item.showLabels, 'key');
      let showLabels = _.map(_showLabels, d => {
        if (!showLabelsKV?.[d?.key]) return d;
        const value = showLabelsKV[d.key]?.value;
        showLabelsKV = _.omit(showLabelsKV, d.key);

        return { ..._.cloneDeep(d), value };
      });
      // 本体添加新属性后构建再搜索新属性无法显示
      showLabels = _.concat(showLabels, _.values(showLabelsKV));
      return {
        ...item,
        ...data,
        type: nodeType[type] ? nodeType[type] : type,
        label: getLabelValues(showLabels, labelLength) || '',
        showLabels
      };
    });

    const rEdges = _.map(edges, _item => {
      const item: any = {
        strokeColor: _item.color,
        lineWidth: 0.75,
        // labelBackgroundColor: defaultStyle.edge.labelBackgroundColor,
        ..._item
      };
      const data = canvasRef.current?.graphStyle?.edge?.[item.class] || {};

      const { type, labelLength, showLabels: _showLabels } = data;

      let showLabelsKV = _.keyBy(item.showLabels, 'key');
      let showLabels = _.map(_showLabels, d => {
        if (!showLabelsKV?.[d?.key]) return d;
        const value = showLabelsKV[d.key]?.value;
        showLabelsKV = _.omit(showLabelsKV, d.key);
        return { ..._.cloneDeep(d), value };
      });
      // 本体添加新属性后构建再搜索新属性无法显示
      showLabels = _.concat(showLabels, _.values(showLabelsKV));

      return {
        ...item,
        ...data,
        lineWidth: data.size || item.size,
        type: nodeType[type] ? nodeType[type] : type,
        label: getLabelValues(showLabels, labelLength) || '',
        showLabels
      };
    });
    return { nodes: rNodes, edges: rEdges };
  };

  /**
   * 发起搜索请求
   * @param data 服务配置
   * @param params 参数
   * @param action 搜索方式
   * @param showResult 是否显示结果面板
   */
  const getResult = async (
    data?: Record<string, any>,
    params?: any[],
    action?: 'add' | 'cover' | string,
    showResult?: boolean
  ) => {
    try {
      const originData = data || serviceData;
      const config = data?.config_info || configInfo;
      const curParam = params || config.params;
      const statements = formatStatements(config.statements, curParam);
      const body = {
        knw_id: originData.knw_id,
        kg_id: originData.kg_id,
        operation_type: originData.operation_type,
        config_info: { statements }
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
        const { result, graph } = parseStatementResult(res);
        const hasTexts = _.some(result, d => d.data?.texts?.length);
        if (!graph.nodes.length && !hasTexts) {
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

        if (_.isEmpty(canvasRef.current.graphData)) {
          const { nodes, edges } = handelData({ ...graph });
          updateGraph?.({
            type: 'graphData',
            data: { nodes, edges, length: graph.nodes.length + graph.edges.length, action }
          });
        } else {
          updateGraph?.({
            type: 'add',
            data: { ...graph, length: graph.nodes.length + graph.edges.length, action }
          });
        }

        (showResult || isShowResultPanel) &&
          setResults({
            visible: true,
            data: result,
            originData: res,
            checkable: false,
            params: body
          });
        // 树布局无法触发layout回调直接关闭loading,
        // 只返回text直接关闭
        if (canvasRef.current.layoutConfig?.key === GRAPH_LAYOUT.TREE || (!graph.nodes.length && hasTexts)) {
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
  const onSearch = (params: any[], action?: 'add' | 'cover' | string) => {
    getResult(undefined, params, action);
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
    if (hasPcConfig() && !iframeConfig?.features?.options?.paramsTool?.visible) return false;
    return !!configInfo.params?.length || results.visible;
  };

  return (
    <>
      <LoadingMask loading={loading} />
      <div className={classNames('canvas-box kw-h-100', { 'has-toolbar': toolbarVisible() })}>
        {isRenderSearchTool() && (
          <CustomSearchTool
            className="service-test-custom-tool"
            zIndex={1}
            myStyle={{
              top: toolbarVisible() ? (configInfo.params?.length > 1 ? 39 : 55) : configInfo.params?.length > 1 ? 0 : 16
            }}
            canvasInstance={canvasRef.current}
            visible={searchToolVisible}
            data={searParam}
            outerResults={results}
            isShowResultPanel={isShowResultPanel}
            onSearch={onSearch}
            onVisibleChange={v => setSearchToolVisible(v)}
            onCloseResult={() => setResults(getInitResState())}
          />
        )}

        <Canvas
          closeInfo={closeInfo}
          toolbarVisible={toolbarVisible()}
          graphLayoutPattern={graphLayoutPattern}
          operation_type={serviceData?.operation_type || 'custom-search'}
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
                  edge: iframeConfig?.edgeRightClick?.options?.basic?.options || {},
                  subgraph: iframeConfig?.subgraphRightClick?.options?.basic?.options || {}
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

export default CanvasContainer;
