import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Button, Select, message, Input } from 'antd';

import { getParam } from '@/utils/handleFunction';
import visualAnalysis from '@/services/visualAnalysis';

import IconFont from '@/components/IconFont';
import ExplainTip from '@/components/ExplainTip';

import { getSearchConfig } from '../assistant';
import FilterList from '../FilterList';
import { ErrorTip } from '../../components';
import ResultPanel, { RESULT_TYPE, parseCommonResult, getInitResState } from '../../components/ResultPanel';
import AddTypeSelector, { ADD_TYPES } from '../../components/AddTypeSelector';

const { ADD_IMMEDIATELY, ADD_SELECT, COVER_IMMEDIATELY, COVER_SELECT } = ADD_TYPES;
const ERROR: Record<string, string> = {
  'EngineServer.KGIDErr': 'exploreGraph.deleteGraph',
  'EngineServer.ConfigStatusErr': 'exploreGraph.noSearchable',
  'EngineServer.VClassErr': 'exploreGraph.notExist',
  'EngineServer.VProErr': 'exploreGraph.entityAttribute'
};

type FilterType = {
  searchScope: string; // 搜索范围
  rule: 'portion' | 'completeness'; // 匹配规则
  number: number; // 搜索数量
  query: string; // 搜索条件
};
// 是否是iframe页面
const isIframe = () => window.location.pathname.includes('iframe');
const Retrieval = (props: any) => {
  const { classData, searchConfig, selectedItem, isLayoutTree, leftDrawerKey, resultPanelDisplay } = props;
  const { onChangeData, onCloseLeftDrawer, setSearchConfig, onResultVisibleChange } = props;
  const [isError, setIsError] = useState<any>('');
  const [filter, setFilter] = useState<FilterType>({ searchScope: 'graph', rule: 'portion', number: 20, query: '' });
  const [results, setResults] = useState(() => getInitResState()); // 结果面板数据
  const [addType, setAddType] = useState(ADD_IMMEDIATELY); // 添加方式

  const { searchScope, rule, number, query } = filter;
  const authorKgView = isIframe() ? true : selectedItem?.detail?.authorKgView;
  // --start 树图有特殊的搜索功能
  const _isLayoutTree = isLayoutTree && searchScope === 'graph';
  useEffect(() => {
    const newFilter = { ...filter };
    if (_isLayoutTree) newFilter.number = 1;
    setFilter(newFilter);
  }, [_isLayoutTree]);
  // --end 树图有特殊的搜索功能

  useEffect(() => {
    onChangeFilter({ searchScope: authorKgView ? 'graph' : 'canvas' });
  }, [authorKgView]);

  useEffect(() => {
    if (!selectedItem?.exploring?.isExploring) setIsError(false);
  }, [selectedItem?.exploring?.isExploring]);

  useEffect(() => {
    if (leftDrawerKey) setResults(getInitResState());
  }, [leftDrawerKey]);

  useEffect(() => {
    setResults(getInitResState());
  }, [selectedItem?.key]);

  // 关闭搜索结果弹窗
  const onCloseResultModal = () => {
    onCloseLeftDrawer();
    setResults(getInitResState());
  };

  const onChangeFilter = (data: any) => {
    const newFilter = { ...filter, ...data };
    setFilter(newFilter);
  };

  // 获取结果
  const getResult = async ({ page = 1 }: { page?: number }) => {
    if (selectedItem?.exploring?.isExploring) return setIsError(true);
    const search_config = getSearchConfig(searchConfig);
    const id = selectedItem?.detail?.kg?.kg_id || getParam('graphId'); // 图谱id
    const params = { page, size: 0, query, search_config, kg_id: id, matching_rule: rule, matching_num: number };
    try {
      onChangeData({ type: 'exploring', data: { isExploring: true } });
      const res = await visualAnalysis.fullTestRetrieval(params, searchScope, selectedItem);
      onChangeData({ type: 'exploring', data: { isExploring: false } });

      if (res?.res === null || !res?.res?.nodes?.length) {
        message.warning(intl.get('exploreGraph.noSearch'));
      }
      if (res?.res?.nodes?.length) {
        setIsError(false);
        const { graph } = parseCommonResult(res.res);
        if ([ADD_IMMEDIATELY, COVER_IMMEDIATELY].includes(addType)) addToCanvas({ graph });
        if (resultPanelDisplay === 'displayResult' || [ADD_SELECT, COVER_SELECT].includes(addType)) {
          setResults({
            visible: true,
            data: graph.nodes,
            originData: res?.res,
            checkable: [ADD_SELECT, COVER_SELECT].includes(addType),
            params
          });
          onResultVisibleChange(true);
        }
        if (resultPanelDisplay === 'notDisplayPanel') {
          onCloseLeftDrawer();
        }
      }
    } catch (err) {
      if (err?.type === 'message') {
        const { ErrorCode, Description } = err.response || {};
        ERROR?.[ErrorCode] ? message.error(intl.get(ERROR[ErrorCode])) : message.error(Description);
      } else {
        const { ErrorCode, Description } = err?.data || err || {};
        ERROR?.[ErrorCode] ? message.error(intl.get(ERROR[ErrorCode])) : message.error(Description);
      }
      setIsError(false);
      onCloseLeftDrawer();
      onChangeData({ type: 'exploring', data: { isExploring: false } });
    }
  };

  /**
   * 选择添加的结果面板回调
   */
  const addToCanvas = ({ graph }: any) => {
    onChangeData({ type: 'add', data: { nodes: [], edges: [], length: 0 } });
    onChangeData({
      type: 'add',
      data: {
        ...graph,
        length: graph.nodes.length + graph.edges.length,
        action: [COVER_IMMEDIATELY, COVER_SELECT].includes(addType) ? 'cover' : 'add'
      }
    });
  };

  const onChangeNumber = (e: any) => {
    const value = e.target.value;
    if (!value) return onChangeFilter({ number: value });
    const reg = /^\d+(\.\d+)?$/;
    if (reg.test(value)) {
      const num = parseInt(value);
      if (num <= 1000) {
        onChangeFilter({ number: num });
      } else {
        onChangeFilter({ number: 1000 });
      }
    }
  };
  const onInputBlur = () => {
    if (!number) return onChangeFilter({ number: 1 });
  };

  return (
    <div className="kw-h-100">
      <div className="retrieval-scroll kw-pl-6">
        <div className="kw-pr-6">
          <div className="kw-w-100 kw-mt-6">
            {intl.get('exploreGraph.range')}
            <Select className="kw-mt-2 kw-w-100" value={searchScope} onChange={e => onChangeFilter({ searchScope: e })}>
              {authorKgView && <Select.Option value="graph">{intl.get('exploreGraph.currentGraph')}</Select.Option>}
              <Select.Option value="canvas">{intl.get('exploreGraph.currentCanvas')}</Select.Option>
            </Select>
          </div>
          <div className="kw-pt-5 kw-w-100">
            {intl.get('exploreGraph.matchRule')}
            <Select className="kw-mt-2 kw-w-100" value={rule} onChange={e => onChangeFilter({ rule: e })}>
              <Select.Option value="completeness">{intl.get('exploreGraph.perfectMatch')}</Select.Option>
              <Select.Option value="portion">{intl.get('exploreGraph.partial')}</Select.Option>
            </Select>
          </div>
          <div className="kw-pt-5 kw-w-100">
            {intl.get('exploreGraph.resultRestriction')}
            <ExplainTip title={intl.get('exploreGraph.afterSetting', { num: number })} />
            <Input
              className="kw-mt-2 kw-w-100"
              value={_isLayoutTree ? 1 : number}
              disabled={_isLayoutTree}
              placeholder={intl.get('exploreGraph.placeEnterNumber')}
              onBlur={onInputBlur}
              onChange={onChangeNumber}
            />
          </div>
          <div className="kw-pt-5 kw-w-100">
            <AddTypeSelector value={addType} onChange={setAddType} />
          </div>
          <div className="kw-pt-6 kw-w-100">
            <Input
              allowClear
              value={query}
              prefix={<IconFont type="icon-sousuo" />}
              placeholder={intl.get('exploreGraph.input')}
              onChange={e => onChangeFilter({ query: e?.target?.value })}
            />
          </div>
          <div style={{ padding: '0px 6px 0px 0' }}>
            <FilterList
              classData={classData?.entity}
              setSearchConfig={setSearchConfig}
              selectedItem={selectedItem}
              searchConfig={searchConfig}
            />
          </div>
        </div>
      </div>

      <div className="kw-p-6 kw-pt-3">
        <Button
          className="kw-w-100"
          type="primary"
          disabled={_isLayoutTree && selectedItem?.apis?.getGraphShapes()?.nodes?.length > 0}
          onClick={() => getResult({})}
        >
          {intl.get('global.search')}
        </Button>
        {isError && <ErrorTip />}
      </div>
      <ResultPanel
        {...results}
        className="kw-pl-6 kw-pr-6"
        title={intl.get('exploreGraph.search')}
        selectedItem={selectedItem}
        from={RESULT_TYPE.search}
        updateGraph={onChangeData}
        onAdd={addToCanvas}
        onBack={() => setResults(getInitResState())}
        onClose={onCloseResultModal}
      />
    </div>
  );
};

export default Retrieval;
