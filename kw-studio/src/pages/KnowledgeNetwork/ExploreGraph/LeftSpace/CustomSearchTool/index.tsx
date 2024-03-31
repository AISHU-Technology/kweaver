/**
 * 画布上的自定义搜索工具面板
 */
import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { message } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { GRAPH_LAYOUT } from '@/enums';
import analysisService from '@/services/analysisService';
import Single from './Single';
import Multiple from './Multiple';
import { ParamItem } from '@/components/ParamCodeEditor/type';
import { formatStatements } from '@/pages/CognitiveService/AnalysisServiceConfig/ConfigAndTest/assistant';
import { ERROR } from '@/pages/CognitiveService/AnalysisServiceConfig/ConfigAndTest/enum';
import ResultPanel, {
  getInitResState,
  RESULT_TYPE
} from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/ResultPanel';
import { parseStatementResult } from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/ResultPanel/parse';
import { LeftDrawer } from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components';
import './style.less';

export interface CustomSearchToolProps {
  className?: string;
  title?: React.ReactNode;
  zIndex?: number; // 定位层级
  myStyle?: any; // 定义行间样式
  canvasInstance?: any; // 画布实例
  readOnly?: boolean; // 仅查看
  visible: boolean; // 开关状态
  data: { code: string; parameters: ParamItem[] } | Record<string, any>; // { code:函数语句, parameters:参数 }
  outerResults?: any; // 外部搜索结果数据
  autoSearch?: boolean; // 为true时在组件内调接口搜索
  forceMultiple?: boolean; // 强制以面板形式罗列参数
  hideExpandIcon?: boolean; // 隐藏右侧关闭展开按钮
  isShowResultPanel?: boolean; // 是否展示结果面板
  triggerHeight?: number; // 外层元素高度变化
  updateGraph?: (data: any) => void;
  onChange?: (parameters: ParamItem[], item: ParamItem) => void; // 修改参数搜索值
  onSearch?: (parameters: ParamItem[], action?: 'add' | 'cover' | string) => void; // 点击搜索的回调
  onVisibleChange?: (visible: boolean) => void; // 关闭面板
  onCloseResult?: () => void; // 关闭搜索结果
}

const CustomSearchTool: React.ForwardRefRenderFunction<any, CustomSearchToolProps> = (props, ref) => {
  const {
    title,
    triggerHeight,
    canvasInstance,
    data,
    outerResults,
    forceMultiple,
    autoSearch,
    isShowResultPanel = true
  } = props;
  const { onSearch, updateGraph, onVisibleChange, onCloseResult } = props;
  const [innerResults, setInnerResults] = useState(() => getInitResState()); // 组件内部触发的搜索结果面板数据

  useImperativeHandle(ref, () => ({
    search
  }));

  const handleSearch = async (params: ParamItem[], action?: 'add' | 'cover' | string) => {
    onSearch?.(params, action);
    // 直接搜索
    if (!autoSearch) return;
    search(params, action);
  };

  const search = async (params: ParamItem[], action?: 'add' | 'cover' | string, outStatement?: any) => {
    try {
      const statements = outStatement || formatStatements(data.code, params);
      const { knw_id, kg_id, operation_type } = canvasInstance?.detail?.kg || {};
      const body = {
        knw_id: String(knw_id),
        kg_id: String(kg_id),
        operation_type,
        config_info: { statements }
      };
      updateGraph?.({ type: 'exploring', data: { isExploring: true } });
      const response = await analysisService.analysisServiceTest(body);
      const { res } = response || {};

      if (res) {
        updateGraph?.({ type: 'add', data: { nodes: [], edges: [], length: 0 } });
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
          updateGraph?.({ type: 'exploring', data: { isExploring: false } });
          return;
        }
        updateGraph?.({
          type: 'add',
          data: { ...graph, length: graph.nodes.length + graph.edges.length, action }
        });
        isShowResultPanel &&
          setInnerResults({
            visible: true,
            data: result,
            originData: response?.res,
            checkable: false,
            params: body
          });
        // 树布局无法触发layout回调直接关闭loading,
        // 只返回text直接关闭
        if (canvasInstance.current.layoutConfig?.key === GRAPH_LAYOUT.TREE || (!graph.nodes.length && hasTexts)) {
          updateGraph?.({ type: 'exploring', data: { isExploring: false } });
        }
      }
    } catch (err) {
      updateGraph?.({ type: 'exploring', data: { isExploring: false } });
      const { ErrorCode, Description, ErrorDetails } = err?.response || err || {};
      if (ERROR[ErrorCode]) {
        return message.error(intl.get(ERROR[ErrorCode]));
      }
      // 格式错误
      if (['Cognitive.SyntaxErr', 'Cognitive.SemanticErr'].includes(ErrorCode)) {
        return message.error(ErrorDetails[0]?.detail || Description);
      }
      Description && message.error(Description);
    }
  };

  return (
    <>
      <div style={{ display: outerResults?.visible || innerResults.visible ? 'none' : undefined }}>
        {forceMultiple || data?.parameters?.length > 1 ? (
          <Multiple {...props} onSearch={handleSearch} />
        ) : (
          <Single {...props} onSearch={handleSearch} />
        )}
      </div>

      {(outerResults?.visible || innerResults.visible) && (
        <LeftDrawer className="custom-search-tool-res" scaling>
          <ResultPanel
            {...(outerResults || innerResults)}
            className="kw-pl-6 kw-pr-6"
            title={intl.get('function.query')}
            selectedItem={canvasInstance}
            from={RESULT_TYPE.graphQuery}
            hideStatement
            onBack={() => {
              onVisibleChange?.(true);
              onCloseResult?.();
              !outerResults && setInnerResults(getInitResState());
            }}
            onClose={() => {
              onCloseResult?.();
              !outerResults && setInnerResults(getInitResState());
            }}
          />
        </LeftDrawer>
      )}
    </>
  );
};

export default forwardRef(CustomSearchTool);
