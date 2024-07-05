import React, { useEffect, useState, useMemo } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Select, Radio, Button, message, Tooltip, Checkbox } from 'antd';
import { CloseOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

import { GRAPH_LAYOUT_PATTERN } from '@/enums';
import { formatNumberWithComma } from '@/utils/helper/formatNumber';
import servicesExplore from '@/services/explore';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import ExplainTip from '@/components/ExplainTip';
import { getParam } from '@/utils/handleFunction';
import { GraphIcon } from '@/utils/antv6';
import NumberInput from '@/components/NumberInput';
import { resetHided } from './assistant';
import ConfigureRules from '../components/ConfigureRules';
import SearchRuleList from '../components/SearchRuleList';
import DisplayResult from '../components/DisplayResult';
import { ErrorTip, LeftDrawer } from '../components';
import './style.less';
import ResultPanel, { RESULT_TYPE, parseCommonResult, getInitResState } from '../components/ResultPanel';
import AddTypeSelector, { ADD_TYPES } from '../components/AddTypeSelector';

const { ADD_IMMEDIATELY, ADD_SELECT, COVER_IMMEDIATELY, COVER_SELECT } = ADD_TYPES;

type NeighborQueryProps = {
  selectedItem: any;
  classData: any;
  isLayoutTree: boolean;
  leftDrawerKey: any;
  onCloseLeftDrawer: any;
  setSelectNodes: (nodes: any) => void;
  onChangeData: (data: { type: string; data: any }) => void;
  onCloseRightDrawer: () => void;
};

type FilterType = {
  searchScope: string; // 搜索范围
  expandClass: string[]; // 选择展开的tag
  io: string; // 展开方向
  steps: number; // 深度
  final_step: boolean; // 严格深度。值为true, 仅返回=steps的邻居; 值为false, 返回深度<=steps的邻居
};

const NeighborQuery = (props: NeighborQueryProps) => {
  const { selectedItem, classData, isLayoutTree, leftDrawerKey } = props;
  const { setSelectNodes, onChangeData, onCloseLeftDrawer, onCloseRightDrawer } = props;
  const [filter, setFilter] = useState<FilterType>({
    searchScope: 'graph',
    expandClass: [],
    io: 'positive',
    steps: 1,
    final_step: false
  });
  const [results, setResults] = useState(() => getInitResState()); // 结果面板数据
  const [addType, setAddType] = useState(ADD_IMMEDIATELY); // 添加方式
  const [classList, setEntityList] = useState<any>([]); // 边类型初始值
  const [isError, setIsError] = useState<any>('');
  const [rulesModalVisible, setRulesModalVisible] = useState<boolean>(false); // 配置搜索规则弹窗
  const [editRule, setEditRule] = useState<any>({}); // 保存编辑规则
  const [checkedRules, setCheckedRules] = useState<any>([]); // 勾选的规则
  const [resultPanelDisplay, setResultPanelDisplay] = useState(
    selectedItem?.configFeatures?.resultPanelDisplay?.value || 'notDisplayResult'
  );

  const graphLayoutPattern = selectedItem.graphLayoutPattern;
  const isTree = selectedItem?.layoutConfig?.key === 'tree' && selectedItem?.layoutConfig?.default?.isGroup;
  useEffect(() => {
    if (!isTree) return;
    setFilter({ ...filter, io: 'positive' });
  }, [isTree]);

  useEffect(() => {
    if (!selectedItem?.configFeatures?.resultPanelDisplay?.value) return;
    setResultPanelDisplay(selectedItem?.configFeatures?.resultPanelDisplay?.value);
  }, [selectedItem?.configFeatures?.resultPanelDisplay?.value]);
  const onChangeResultPanelDisplay = (value: string) => setResultPanelDisplay(value);

  const { searchScope, expandClass, io, steps, final_step } = filter;
  const authorKgView = selectedItem?.detail?.authorKgView;
  // --start 树图有特殊的搜索功能
  const _isLayoutTree = isLayoutTree && filter.searchScope === 'graph';
  useEffect(() => {
    const newFilter = { ...filter };
    if (_isLayoutTree) newFilter.io = 'out';
    setFilter(newFilter);
  }, [_isLayoutTree]);
  // --end 树图有特殊的搜索功能

  const optionalClass = useMemo(() => {
    if (searchScope === 'canvas') return classList;
    return classData;
  }, [classData, filter.searchScope, classList]); // 可配规则的类

  useEffect(() => {
    onChangeFilter({ searchScope: authorKgView ? 'graph' : 'canvas' });
  }, [authorKgView]);

  useEffect(() => {
    if (!selectedItem?.isExploring) setIsError(false);
  }, [selectedItem?.exploring?.isExploring]);

  useEffect(() => {
    setResults(getInitResState());
  }, [selectedItem?.key]);

  useEffect(() => {
    if (leftDrawerKey) setResults(getInitResState());
  }, [leftDrawerKey]);

  // 关闭弹窗
  const onCloseResultModal = () => {
    onCloseLeftDrawer();
    setResults(getInitResState());
  };

  useEffect(() => {
    // 边类型选项处理
    if (searchScope === 'canvas') {
      const edges = selectedItem?.apis?.getGraphShapes()?.edges;
      const nodes = selectedItem?.apis?.getGraphShapes()?.nodes;

      if (edges?.length > 0 || nodes?.length) {
        const edgeClass = _.uniq(_.map(edges, edge => edge.getModel()?._sourceData?.class));
        const nodeClass = _.uniq(_.map(nodes, node => node.getModel()?._sourceData?.class));

        const e_class = _.filter(classData?.edge || [], e => _.includes(edgeClass, e?.name));
        const n_class = _.filter(classData?.entity || [], v => _.includes(nodeClass, v?.name));

        setEntityList({ entity: n_class, edge: e_class });
      } else {
        setEntityList({});
      }
    }
  }, [
    classData,
    searchScope,
    selectedItem.key,
    selectedItem?.apis?.getGraphShapes()?.edges?.length,
    selectedItem?.apis?.getGraphShapes()?.nodes?.length
  ]);

  /**
   * 筛选条件
   */
  const onChangeFilter = (values: Partial<FilterType>) => {
    setFilter({ ...filter, ...values });
  };

  /**
   * 搜索
   */
  const onSearch = async () => {
    const id = selectedItem?.detail?.kg?.kg_id || getParam('graphId'); // 图谱id
    if (!parseInt(id)) return;
    const selectedNodes = _.map(selectedItem?.selected?.nodes, d => {
      return d.getModel()?._sourceData;
    });
    if (selectedItem?.exploring?.isExploring) return setIsError(true);
    try {
      const filters = getCheckedRules(selectedItem?.rules?.neighbors);
      const vids = _.map(selectedNodes, d => d?.uid || d?.id);
      const params = { id: `${id}`, steps, final_step, direction: io, vids, page: 1, size: -1, filters };
      onChangeData({ type: 'exploring', data: { isExploring: true } });
      const response = await servicesExplore.getNeighbors(params, searchScope, selectedItem);
      onChangeData({ type: 'exploring', data: { isExploring: false } });
      if (!response?.res?.nodes?.length) {
        return message.warning(intl.get('searchGraph.expandLeftNull'));
      }
      const { graph } = parseCommonResult(response.res);
      const addedData = {
        nodes: _.uniqBy([...selectedNodes, ...graph.nodes], 'id'),
        edges: graph.edges
      };
      if ([ADD_IMMEDIATELY, COVER_IMMEDIATELY].includes(addType)) addDataToGraph(addedData);
      if (resultPanelDisplay === 'displayResult' || [ADD_SELECT, COVER_SELECT].includes(addType)) {
        setResults({
          visible: true,
          data: {
            ...(final_step ? graph : addedData),
            neighbor: { staticMode: final_step, queryNodes: [...selectedNodes] }
          },
          originData: response?.res,
          checkable: [ADD_SELECT, COVER_SELECT].includes(addType),
          params
        });
      }
      if (resultPanelDisplay === 'notDisplayPanel') {
        onCloseLeftDrawer();
      }
    } catch (error) {
      setIsError(false);
      onChangeData({ type: 'exploring', data: { isExploring: false } });
      if (error.type === 'message' && error?.response?.res?.Description) {
        message.error(error?.response?.res?.Description);
      }
      return { error };
    }
  };
  /** 获取勾选的规则 */
  const getCheckedRules = (rules: any) => {
    const checkedFilters = _.filter(rules, item => _.includes(checkedRules, item?.name));

    const filters = _.map(checkedFilters, item => {
      const e_filters = _.map(item?.searchRules?.e_filters, filter => {
        const { type, edge_class, relation } = filter;
        const property_filters = _.map(filter?.property_filters, f => {
          const { name, operation, op_value } = f;
          return { name, operation, op_value };
        });
        return { relation, edge_class, type, property_filters };
      });
      const v_filters = _.map(item?.searchRules?.v_filters, filter => {
        const { type, tag, relation } = filter;
        const property_filters = _.map(filter?.property_filters, f => {
          const { name, operation, op_value } = f;
          return { name, operation, op_value };
        });
        return { relation, tag, type, property_filters };
      });
      return { e_filters, v_filters };
    });
    return filters;
  };

  // 添加数据至画布
  const addDataToGraph = (graph: any) => {
    if (searchScope === 'canvas') {
      const nodesKV = _.keyBy(graph.nodes, 'id');
      let nodes = selectedItem.graph.current.getNodes();
      nodes = _.filter(nodes, item => nodesKV[item._cfg.id]);
      resetHided({ selectedItem, nodes, onChangeData });
      onSelectAddCallback({ graph });
      return;
    }
    onSelectAddCallback({ graph });
  };

  /**
   * 选择添加的结果面板回调
   */
  const onSelectAddCallback = ({ graph }: any) => {
    onChangeData({
      type: 'add',
      data: {
        ...graph,
        length: graph.nodes.length + graph.edges.length,
        action: [COVER_IMMEDIATELY, COVER_SELECT].includes(addType) ? 'cover' : 'add'
      }
    });
  };

  // 移除选中的实体
  const removeEntity = (id: any) => {
    const entities = _.filter(selectedItem?.selected?.nodes, d => d.getModel()?.id !== id);
    setSelectNodes(entities);
  };

  // 判断是否有选择点
  const isEmpty = () => {
    const graphShapes = selectedItem?.apis?.getGraphShapes();
    return _.isEmpty(graphShapes?.nodes) || _.isEmpty(selectedItem?.selected?.nodes);
  };

  // 获取选中的点
  const selectedNodes = () => {
    if (isEmpty()) return [];
    return _.filter(selectedItem?.selected?.nodes, item => item?._cfg !== null) || [];
  };

  /** 修改配置规则 */
  const onConfigRules = (rules: any) => {
    let neighbors = _.cloneDeep(selectedItem?.rules?.neighbors) || [];
    if (editRule?.name) {
      neighbors = _.map(neighbors, item => {
        if (item?.name === editRule?.name) return { ...item, ...rules };
        return item;
      });
      if (!_.includes(checkedRules, rules?.name)) setCheckedRules([...checkedRules, rules?.name]); // 新建规则
      message.success(intl.get('graphList.editSuccess'));
    } else {
      setCheckedRules([...checkedRules, rules?.name]); // 新建规则
      neighbors.unshift(rules);
      message.success(intl.get('graphList.addSuccess'));
    }

    setEditRule({});
    onChangeData({ type: 'rules', data: { ...selectedItem?.rules, neighbors } });
  };

  //  打开配置rule弹窗
  const openRulesModal = () => {
    setRulesModalVisible(true);
    onCloseRightDrawer();
  };

  const closeRulesModal = () => {
    setRulesModalVisible(false);
  };

  // 编辑规则
  const onEditRule = (item: any) => {
    setEditRule(item);
    openRulesModal();
  };

  // 删除规则
  const onDeleteRule = (name: string) => {
    const rule = _.filter(selectedItem?.rules?.neighbors, item => item?.name !== name);
    onChangeData({ type: 'rules', data: { ...selectedItem?.rules, neighbors: rule } });
    message.success(intl.get('global.deleteSuccess'));
  };

  // 勾选规则
  const onCheckRule = (name: string, checked: boolean) => {
    if (checked) setCheckedRules([name, ...checkedRules]);
    if (!checked) {
      const ruleNames = _.filter(checkedRules, e => e !== name);
      setCheckedRules(ruleNames);
    }
  };

  return (
    <LeftDrawer scaling={results.visible && leftDrawerKey === 'neighbors'}>
      <div className="neighborQueryRoot">
        <div className="header kw-space-between">
          <Format.Title level={22}>{intl.get('exploreGraph.neighbor')}</Format.Title>
          <span>
            <DisplayResult value={resultPanelDisplay} onChange={onChangeResultPanelDisplay} />
            <CloseOutlined className="kw-pointer" onClick={() => onCloseLeftDrawer()} />
          </span>
        </div>
        <div className="content kw-pt-6">
          {/* <KwScrollBar isShowX={false} style={{ maxHeight: '100%' }}> */}
          <Format.Title strong={4}>
            {intl.get('exploreGraph.selectEntity')}
            <span className="kw-c-primary kw-ml-2">{formatNumberWithComma(selectedNodes()?.length || 0)}</span>
          </Format.Title>
          <div className="expandEntityBox kw-mt-2">
            {isEmpty() ? (
              <div className="kw-c-subtext">{intl.get('exploreGraph.tip')}</div>
            ) : (
              _.map(selectedNodes() || [], (d, index) => {
                if (d?._cfg === null) return;
                const node = d.getModel()?._sourceData;
                const { type, icon, iconColor, fillColor } = node;
                return (
                  <div key={index} className="kw-mb-3 kw-border kw-align-center expandEntity">
                    <div className="entityIcon" style={{ background: fillColor }}>
                      <GraphIcon type={icon} className="node-svg" style={{ color: iconColor }} />
                    </div>
                    <div className="kw-ellipsis kw-ml-2 kw-w-85">{node?.default_property?.value}</div>
                    <CloseOutlined className="kw-pointer removeIcon" onClick={() => removeEntity(node?.uid)} />
                  </div>
                );
              })
            )}
          </div>
          <div className="kw-mt-6">
            <Format.Title strong={4}>{intl.get('exploreGraph.queryRange')}</Format.Title>
            <Select className="kw-mt-2 kw-w-100" value={searchScope} onChange={e => onChangeFilter({ searchScope: e })}>
              {authorKgView && <Select.Option value="graph">{intl.get('exploreGraph.currentGraph')}</Select.Option>}
              <Select.Option value="canvas">{intl.get('exploreGraph.currentCanvas')}</Select.Option>
            </Select>
          </div>
          <div className="kw-mt-6">
            <Format.Title strong={4}>{intl.get('exploreGraph.SearchDepth')}</Format.Title>
            <NumberInput
              className="kw-mt-2 kw-w-100"
              min={1}
              defaultValue={steps}
              onChange={e => onChangeFilter({ steps: e as number })}
            />
            <div style={{ height: 24 }} className={steps >= 3 ? 'kw-mb-2' : ''}>
              {steps >= 3 && (
                <>
                  <ExclamationCircleOutlined className="kw-c-warning" />
                  <span className="kw-ml-2">{intl.get('exploreGraph.moreStepTip')}</span>
                </>
              )}
            </div>
          </div>
          <div>
            <Format.Title block strong={4}>
              {intl.get('exploreGraph.direction')}
            </Format.Title>
            <Radio.Group className="kw-w-100" onChange={e => onChangeFilter({ io: e?.target?.value })} value={io}>
              <Radio.Button
                className="dire-btn"
                value="positive"
                disabled={graphLayoutPattern && graphLayoutPattern === GRAPH_LAYOUT_PATTERN.TREE}
                style={{
                  width: graphLayoutPattern && graphLayoutPattern === GRAPH_LAYOUT_PATTERN.TREE ? '100%' : '33.3%'
                }}
              >
                {intl.get('exploreGraph.positive')}
              </Radio.Button>
              {graphLayoutPattern && graphLayoutPattern === GRAPH_LAYOUT_PATTERN.TREE ? null : (
                <React.Fragment>
                  <Radio.Button className="dire-btn" value="reverse" disabled={isTree}>
                    {intl.get('exploreGraph.reverse')}
                  </Radio.Button>
                  <Radio.Button className="dire-btn" value="bidirect" disabled={isTree}>
                    {intl.get('exploreGraph.bidirectional')}
                  </Radio.Button>
                </React.Fragment>
              )}
            </Radio.Group>
          </div>
          <div className="kw-mt-6">
            <AddTypeSelector value={addType} onChange={setAddType} />
          </div>
          <div className="kw-mt-6">
            <Format.Title block strong={4} className="kw-mb-2">
              {intl.get('analysisService.result')}
            </Format.Title>
            <Checkbox checked={filter.final_step} onChange={e => onChangeFilter({ final_step: e.target.checked })}>
              {intl.get('analysisService.finalStepLabel').split('|')[0]}
              <span className="kw-c-primary">{filter.steps}</span>
              {intl.get('analysisService.finalStepLabel').split('|')[1]}
            </Checkbox>
          </div>
          <div className="kw-mt-7">
            <div className="kw-space-between">
              <div>
                {intl.get('exploreGraph.searchRules')}
                <ExplainTip className="kw-ml-2 kw-pointer" title={intl.get('exploreGraph.rulesTip')} />
              </div>
              <div>
                <Tooltip title={intl.get('exploreGraph.addRulesTip')}>
                  <IconFont
                    type="icon-Add"
                    className={classnames('kw-pointer', {
                      'kw-c-watermark': _.isEmpty(optionalClass)
                    })}
                    onClick={() => {
                      if (_.isEmpty(optionalClass)) return;
                      openRulesModal();
                    }}
                  />
                </Tooltip>
              </div>
            </div>
            <div className="kw-mt-2">
              <SearchRuleList
                searchRules={selectedItem?.rules?.neighbors}
                checkedRules={checkedRules}
                onEdit={item => onEditRule(item)}
                onDelete={name => onDeleteRule(name)}
                onCheckRule={(name, checked) => onCheckRule(name, checked)}
              />
            </div>
          </div>
          <ConfigureRules
            visible={rulesModalVisible}
            editRule={editRule}
            ruleList={selectedItem?.rules?.neighbors}
            selectedItem={selectedItem}
            ontoData={optionalClass}
            onCancel={() => {
              setEditRule({});
              closeRulesModal();
            }}
            onOk={onConfigRules}
          />
          {/* </KwScrollBar> */}
        </div>
        <div className="searchBtn">
          <Button className="kw-w-100" type="primary" disabled={isEmpty()} onClick={() => onSearch()}>
            {intl.get('function.query')}
          </Button>
          {isError && <ErrorTip />}
        </div>

        <ResultPanel
          {...results}
          title={intl.get('exploreGraph.neighbor')}
          selectedItem={selectedItem}
          from={RESULT_TYPE.neighbor}
          updateGraph={onChangeData}
          onAdd={onSelectAddCallback}
          onBack={() => setResults(getInitResState())}
          onClose={onCloseResultModal}
        />
      </div>
    </LeftDrawer>
  );
};

export default NeighborQuery;
