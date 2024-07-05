/* eslint-disable max-lines */
import React, { useEffect, useMemo, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { InputNumber, Radio, Select, Button, message, Tooltip } from 'antd';
import { CloseOutlined, MoreOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { getParam } from '@/utils/handleFunction';
import servicesExplore from '@/services/explore';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import ExplainTip from '@/components/ExplainTip';
import NumberInput from '@/components/NumberInput';
import SearchRuleList from '../components/SearchRuleList';
import ConfigureRules from '../components/ConfigureRules';
import DisplayResult from '../components/DisplayResult';
import { getGraphData, getHasNumberAtrClass, getCheckedRules } from './assistant';
import { resetHided } from '../NeighborQuery/assistant';
import { ErrorTip, LeftDrawer } from '../components';
import { TYPE_OPTION, WEIGHT_OPTION, DIRECTION, DEFAULT_FILTER, SHORTEST, WEIGHT_PROPERTY, PATH_DEPTH } from './enums';
import { TypeFilter, TypePathProps } from './type';
import './style.less';
import SelectorClass from '@/components/ClassSelector';
import ResultPanel, { RESULT_TYPE, parseCommonResult, getInitResState } from '../components/ResultPanel';
import AddTypeSelector, { ADD_TYPES } from '../components/AddTypeSelector';

const { ADD_IMMEDIATELY, ADD_SELECT, COVER_IMMEDIATELY, COVER_SELECT } = ADD_TYPES;
const PathQuery = (props: TypePathProps) => {
  const { leftDrawerKey, selectedItem, classData } = props;
  const { onChangeData, onCloseLeftDrawer, setSelectNodes, onCloseRightDrawer } = props;
  const [startNode, setStartNode] = useState<any>();
  const [endNode, setEndNode] = useState<any>();
  const [results, setResults] = useState(() => getInitResState()); // 结果面板数据
  const [addType, setAddType] = useState(ADD_IMMEDIATELY); // 添加方式
  const [isError, setIsError] = useState<any>({ exploreing: false, defaultValue: false });
  const [edgesClass, setEdgesClass] = useState<any>([]); // 选择边类型
  const [rulesModalVisible, setRulesModalVisible] = useState<boolean>(false); // 配置搜索规则弹窗
  const [editRule, setEditRule] = useState<any>({});
  const [hasNumberAttrClass, setHasNumberClass] = useState<any>([]); // 筛选有number类型的属性的勾选的边类
  const [checkedRules, setCheckedRules] = useState<any>([]); // 勾选的规则
  const [filter, setFilter] = useState<TypeFilter>(DEFAULT_FILTER);
  const [resultPanelDisplay, setResultPanelDisplay] = useState(
    selectedItem?.configFeatures?.resultPanelDisplay?.value || 'notDisplayResult'
  );

  const optionalClass = useMemo(() => {
    return _.filter(edgesClass, e => {
      if (!_.isEmpty(filter?.edges)) return filter?.edges === e?.name;
      return true;
    });
  }, [filter?.edges, filter.searchScope, edgesClass]); // 可配规则的类

  const authorKgView = selectedItem?.detail?.authorKgView;
  useEffect(() => {
    onChangeFilter({ selectorProps: authorKgView ? 'graph' : 'canvas' });
  }, [authorKgView]);

  useEffect(() => {
    if (!selectedItem?.configFeatures?.resultPanelDisplay?.value) return;
    setResultPanelDisplay(selectedItem?.configFeatures?.resultPanelDisplay?.value);
  }, [selectedItem?.configFeatures?.resultPanelDisplay?.value]);
  const onChangeResultPanelDisplay = (value: string) => setResultPanelDisplay(value);

  useEffect(() => {
    if (leftDrawerKey) setResults(getInitResState());
  }, [leftDrawerKey]);

  useEffect(() => {
    setResults(getInitResState());
  }, [selectedItem?.key]);

  useEffect(() => {
    if (!selectedItem?.exploring?.isExploring) setIsError({ ...isError, exploreing: false });
  }, [selectedItem?.exploring?.isExploring]);

  useEffect(() => {
    // 边类型选项处理
    if (filter?.searchScope === 'canvas') {
      const edges = selectedItem?.apis?.getGraphShapes()?.edges;
      if (edges?.length > 0) {
        const edgeClassName = _.uniq(_.map(edges, edge => edge.getModel()?._sourceData?.class));
        const e_class = _.filter(classData?.edge || [], e => _.includes(edgeClassName, e?.name));
        setEdgesClass(e_class);
        // 筛选有数字类型的边
        const numberClass = getHasNumberAtrClass(classData, edgeClassName);
        const attr = _.find(numberClass, (item: any) => item.name === filter.edges); // 选择的边类是否已在画布
        if (!attr) onChangeFilter({ property: '', path_decision: PATH_DEPTH, edges: '', default_value: undefined });
        setHasNumberClass(numberClass);
      } else {
        setEdgesClass([]);
        setHasNumberClass([]);
        onChangeFilter({ property: '', path_decision: PATH_DEPTH, edges: '', default_value: undefined });
      }
    } else {
      const newEdgeClass = _.map(classData?.edge || [], e => e?.name);
      const numberClass = getHasNumberAtrClass(classData, newEdgeClass);
      setHasNumberClass(numberClass);
      setEdgesClass(classData?.edge);
    }
  }, [classData, filter?.searchScope, selectedItem.key, selectedItem?.apis?.getGraphShapes()?.edges?.length]);

  useEffect(() => {
    if (leftDrawerKey !== 'path') return;
    const select = selectedItem?.selected?.nodes;
    const graphShapes = selectedItem?.apis?.getGraphShapes();

    // 起点或终点被移除，清空选择框
    if (_.isEmpty(graphShapes?.nodes) || startNode || endNode) {
      if (!_.find(graphShapes?.nodes, d => d?._cfg?.id === startNode?.id)) setStartNode(undefined);
      if (!_.find(graphShapes?.nodes, d => d?._cfg?.id === endNode?.id)) setEndNode(undefined);
    }
    if (_.isEmpty(select)) return;
    if (select?.length === 1) {
      const node = select?.[0]?.getModel()?._sourceData;
      assignment(node);
      return;
    }
    const empty = _.isEmpty(startNode) && _.isEmpty(endNode);
    if (empty) {
      assignment(select, true);
    } else {
      const nodes = _.filter(
        select,
        item => item.getModel()?._sourceData?.id !== startNode?.id && item.getModel()?._sourceData?.id !== endNode?.id
      );
      const node = nodes?.[0]?.getModel()?._sourceData;
      assignment(node);
    }
  }, [selectedItem?.selected?.nodes, leftDrawerKey]);

  /**
   *  将画布选中的点填充到下拉框
   * @param node 选中的点
   * @param bothEmpty 起点终点是否都为空
   */
  const assignment = (node: any, bothEmpty?: boolean) => {
    if (_.isEmpty(node)) return;
    if (bothEmpty) {
      const start = node?.[0]?.getModel()?._sourceData;
      const end = node?.[1]?.getModel()?._sourceData;
      start && setStartNode({ ...start, value: start?.default_property?.value });
      end && setEndNode({ ...end, value: end?.default_property?.value });
    }
    if (_.isEmpty(startNode) && node?.id !== endNode?.id) {
      setStartNode({ ...node, value: node?.default_property?.value });
      return;
    }
    if (_.isEmpty(endNode) && node?.id !== startNode?.id) {
      setEndNode({ ...node, value: node?.default_property?.value });
    }
  };

  /** 配置搜索条件 */
  const onChangeFilter = (data: any) => {
    if (data?.searchScope === 'canvas' && filter?.path_type === 0) {
      // 搜索范围画布，路径类型默认无环
      data.path_type = 2;
    }
    if (data?.searchScope === 'graph') {
      // 搜索范围画布，路径类型默认全部
      data.path_type = 0;
    }
    // 选择权重属性，边类型默认
    if (data?.path_decision === WEIGHT_PROPERTY) {
      data.edges = hasNumberAttrClass?.[0]?.name;
      data.property = hasNumberAttrClass?.[0]?.properties?.[0]?.name;
    }
    if (data?.path_type === 0 || data?.path_type === 2 || data?.path_decision === PATH_DEPTH) {
      data.path_decision = PATH_DEPTH;
      data.property = '';
      data.edges = '';
      data.default_value = undefined;
    }
    if (data?.edges) {
      // 切换边类属性联动
      data.property = _.find(hasNumberAttrClass, item => item.name === data?.edges)?.properties?.[0]?.name;
    }
    setFilter({ ...filter, ...data });
  };

  /**
   * 路径搜索
   */
  const findPath = async () => {
    const { direction, path_type, steps, path_decision, edges, property, searchScope, default_value } = filter;
    if (selectedItem?.exploring?.isExploring) return setIsError({ ...isError, exploreing: true });
    if (path_decision === WEIGHT_PROPERTY && !default_value && default_value !== 0) {
      return setIsError({ ...isError, defaultValue: true });
    }

    const id = selectedItem?.detail?.kg?.kg_id || getParam('graphId'); // 图谱id
    if (!parseInt(id)) return;

    // 规则
    const filters = getCheckedRules(selectedItem?.rules?.path, checkedRules);
    try {
      const data = {
        kg_id: `${id}`,
        source: startNode.id || startNode?.uid,
        target: endNode.id || endNode?.uid,
        direction,
        path_type,
        steps,
        path_decision,
        edges: edges || undefined,
        property: property || undefined,
        filters,
        default_value: `${default_value}`
      };
      onChangeData({ type: 'exploring', data: { isExploring: true } });
      const result = await servicesExplore.explorePath(data, searchScope, selectedItem);
      onChangeData({ type: 'exploring', data: { isExploring: false } });
      if (result?.res === null || _.isEmpty(result?.res?.paths)) {
        return message.warning(intl.get('exploreGraph.noSearchRelation'));
      }
      const { graph, paths, groups } = parseCommonResult(result.res);
      if ([ADD_IMMEDIATELY, COVER_IMMEDIATELY].includes(addType)) addDataToGraph(graph, groups);
      if (resultPanelDisplay === 'displayResult' || [ADD_SELECT, COVER_SELECT].includes(addType)) {
        setResults({
          visible: true,
          data: paths,
          originData: result,
          checkable: [ADD_SELECT, COVER_SELECT].includes(addType),
          // checkable: true,
          params: data
        });
      }
      if (resultPanelDisplay === 'notDisplayPanel') {
        onCloseLeftDrawer();
      }
    } catch (err) {
      onChangeData({ type: 'exploring', data: { isExploring: false } });
      if (err?.type === 'message') {
        const { Description } = err?.response || {};
        Description && message.error(Description);
      } else {
        const { Description, ErrorCode, ErrorDetails } = err || {};
        if (ErrorCode === 'EngineServer.EClassErr') {
          const match = /\[(.*?)\]/.exec(ErrorDetails?.[0]?.detail);
          // const match = /\[(.*?)\]/.exec('tag [technique_2_reaction] does not exist');
          if (match) {
            const arrayStr = match[1];
            const errors = arrayStr.split(',').map(x => x.trim().replace(/'/g, ''));
            message.error(intl.get('exploreGraph.deletedRelation'));
            checkedRulesIsError(errors);

            return;
          }
        }
        Description && message.error(Description);
      }
    }
  };

  // 校验勾选的规则是否有误 暂时不用
  const checkedRulesIsError = (errorClass: string[]) => {
    const rules = _.map(_.cloneDeep(selectedItem?.rules?.path), item => {
      let error = false;
      _.forEach(item?.searchRules?.e_filters, filter => {
        if (_.includes(errorClass, filter.edge_class)) {
          filter.error = true;
          error = true;
        } else {
          filter.error = false;
        }
      });
      return { ...item, error };
    });

    onChangeData({ type: 'rules', data: { ...selectedItem?.rules, path: rules } });
  };

  /** 添加数据到画布 */
  const addDataToGraph = (graph: any, groups?: any) => {
    onChangeData({ type: 'path', data: { changeStyle: false } });
    if (filter?.searchScope === 'canvas') {
      const { nodes, edges } = getGraphData(graph, selectedItem?.graph);
      resetHided({ selectedItem, nodes, edges, onChangeData });
      onSelectAddCallback({ graph, groups });
      onChangeData({ type: 'path', data: { start: startNode, end: endNode, changeStyle: true, byCanvas: true } });
      return;
    }

    onSelectAddCallback({ graph, groups });
    onChangeData({ type: 'path', data: { start: startNode, end: endNode, changeStyle: true } });
  };

  /**
   * 选择添加的结果面板回调
   */
  const onSelectAddCallback = ({ graph, groups }: any) => {
    onChangeData({
      type: 'add',
      data: {
        ...graph,
        length: graph.nodes.length + graph.edges.length,
        action: [COVER_IMMEDIATELY, COVER_SELECT].includes(addType) ? 'cover' : 'add'
      }
    });
    selectedItem.graph?.current.__removeSubGroups();
    if (groups) {
      setTimeout(() => {
        _.forEach(groups, (g, i) => {
          selectedItem.graph.current.__createSubGroup({
            info: { ...g },
            members: [...g.nodes],
            name: intl.get('exploreGraph.path') + (i + 1),
            from: 'pathQuery'
          });
        });
      }, 0);
    }
  };

  // 处理下拉列表
  const getOptions = () => {
    const graphShapes = selectedItem?.apis?.getGraphShapes();
    const op = _.map(graphShapes?.nodes, item => {
      let data = _.cloneDeep(item.getModel()?._sourceData);
      data = _.omit(data, ['showLabels', 'class']);
      const key = data?.id || data?.uid;
      return { ...data, key, label: data?.default_property?.value, value: key };
    });

    return op;
  };

  // 交换终点起点
  const exchange = () => {
    const start = _.cloneDeep(startNode);
    const end = _.cloneDeep(endNode);
    setStartNode(end);
    setEndNode(start);
  };

  // 移除选中的实体
  const removeEntity = (id: any) => {
    const select = selectedItem?.selected?.nodes;
    const entities = _.filter(select, d => d.getModel()?.id !== id);
    setSelectNodes(entities);
    const nodes = _.filter(
      select,
      item => item.getModel()?._sourceData?.id !== startNode?.id && item.getModel()?._sourceData?.id !== endNode?.id
    );
    const node = nodes?.[0]?.getModel()?._sourceData;
    assignment(node);
  };

  const closeModal = () => {
    onCloseLeftDrawer();
    setResults(getInitResState());
  };

  /** 修改配置规则 */
  const onChangeConfigRules = (rules: any) => {
    let pathRules = _.cloneDeep(selectedItem?.rules?.path) || [];
    if (editRule?.name) {
      pathRules = _.map(pathRules, item => {
        if (item?.name === editRule?.name) return { ...item, ...rules };
        return item;
      });

      if (!_.includes(checkedRules, editRule?.name)) setCheckedRules([...checkedRules, rules?.name]); // 新建规则
      message.success(intl.get('graphList.editSuccess'));
    } else {
      setCheckedRules([...checkedRules, rules?.name]); // 新建规则
      pathRules.unshift(rules);
      message.success(intl.get('graphList.addSuccess'));
    }

    setEditRule({});
    onChangeData({ type: 'rules', data: { ...selectedItem?.rules, path: pathRules } });
  };

  //  打开配置rule弹窗
  const openRulesModal = () => {
    onCloseRightDrawer();
    setRulesModalVisible(true);
  };
  const closeRulesModal = () => setRulesModalVisible(false);

  // 编辑规则
  const onEditRule = (item: any) => {
    setEditRule(item);
    openRulesModal();
  };

  // 删除规则
  const onDeleteRule = (name: string) => {
    const rule = _.filter(selectedItem?.rules?.path, item => item?.name !== name);
    onChangeData({ type: 'rules', data: { ...selectedItem?.rules, path: rule } });
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

  const selectorProps = {
    showSearch: true,
    labelInValue: true,
    className: 'kw-w-100 kw-mt-4',
    allowClear: true,
    placeholder: intl.get('exploreGraph.clickEntity'),
    filterOption: (input: any, option: any) => option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
  };

  return (
    <LeftDrawer scaling={results.visible && leftDrawerKey === 'path'}>
      <div className="pathQueryRoot">
        <div className="header kw-space-between">
          <Format.Title level={22}>{intl.get('exploreGraph.pathQuery')}</Format.Title>
          <span>
            <DisplayResult value={resultPanelDisplay} onChange={onChangeResultPanelDisplay} />
            <CloseOutlined className="kw-pointer" onClick={onCloseLeftDrawer} />
          </span>
        </div>
        <div className="content kw-pt-4">
          {/* <KwScrollBar isShowX={false} > */}
          <div className="kw-align-center">
            <div className="kw-pt-3 kw-mr-3">
              <div className="circle-icon kw-mb-2" />
              <MoreOutlined style={{ fontSize: 10 }} />
              <div className="circle-icon kw-mt-2 red-bg" />
            </div>
            {/* 起点终点 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Select
                {...selectorProps}
                value={startNode}
                options={_.filter(getOptions(), op => op?.id !== endNode?.id)}
                onChange={(e: any, option: any) => setStartNode(option)}
                onClear={() => removeEntity(startNode?.id)}
              />
              <Select
                {...selectorProps}
                value={endNode}
                options={_.filter(getOptions(), op => op?.id !== startNode?.id)}
                onChange={(e: any, option: any) => setEndNode(option)}
                onClear={() => removeEntity(endNode?.id)}
              />
            </div>
            <IconFont type="icon-qiehuan1" className="kw-pointer kw-pt-3 kw-ml-3" onClick={exchange}></IconFont>
          </div>
          {/* 搜索范围 */}
          <div className="kw-mt-5">
            <Format.Text>{intl.get('exploreGraph.queryRange')}</Format.Text>
            <Select
              className="kw-mt-2 kw-w-100"
              value={filter?.searchScope}
              onChange={e => onChangeFilter({ searchScope: e })}
            >
              {authorKgView && <Select.Option value="graph">{intl.get('exploreGraph.currentGraph')}</Select.Option>}
              <Select.Option value="canvas">{intl.get('exploreGraph.currentCanvas')}</Select.Option>
            </Select>
          </div>
          {/* 路径类型 */}
          <div className="kw-mt-5">
            <Format.Text>{intl.get('exploreGraph.pathType')}</Format.Text>
            <Select
              className="kw-mt-2 kw-w-100"
              value={filter?.path_type}
              onChange={e => onChangeFilter({ path_type: e })}
            >
              {_.map(TYPE_OPTION?.[filter.searchScope], op => {
                return (
                  <Select.Option key={op?.value} value={op?.value}>
                    {intl.get(op?.label)}
                  </Select.Option>
                );
              })}
            </Select>
          </div>
          {/* 路径长度计算维度 最短路径才需要 */}
          {filter?.path_type === SHORTEST && (
            <div className="kw-mt-6">
              <Format.Text>{intl.get('exploreGraph.calculatePath')}</Format.Text>
              <ExplainTip title={intl.get('exploreGraph.weightAttrTip')} />
              <Select
                className="kw-mt-2 kw-w-100"
                value={filter?.path_decision}
                onChange={e => onChangeFilter({ path_decision: e })}
              >
                {_.map(WEIGHT_OPTION, op => {
                  // 关系类型都不含有数值类型的属性，则权重属性置灰展示
                  const disabled = op.value === WEIGHT_PROPERTY && _.isEmpty(hasNumberAttrClass);
                  return (
                    <Select.Option key={op?.value} value={op?.value} disabled={disabled}>
                      {intl.get(op?.label)}
                    </Select.Option>
                  );
                })}
              </Select>
            </div>
          )}
          {/* 边类型 */}
          {filter.path_decision === WEIGHT_PROPERTY && (
            <div className="kw-mt-6">
              <Format.Text className="kw-mb-2">{intl.get('exploreGraph.relationType')}</Format.Text>
              <div className="kw-w-100">
                <SelectorClass
                  className={classNames('tagSelector', {})}
                  data={_.find(hasNumberAttrClass, e => e?.name === filter?.edges)}
                  entities={classData?.entity}
                  type={'e_filters'}
                  classList={hasNumberAttrClass}
                  onChange={(data: any) => {
                    onChangeFilter({ edges: data?.name });
                  }}
                />
                <Format.Text className="kw-mt-5 kw-mb-2">{intl.get('exploreGraph.attr')}</Format.Text>
                <Select
                  className="kw-w-100"
                  value={filter?.property}
                  onChange={e => onChangeFilter({ property: e })}
                  placeholder={intl.get('global.pleaseSelect')}
                >
                  {_.map(hasNumberAttrClass.find((prop: any) => prop.name === filter?.edges)?.properties, pro => {
                    return (
                      <Select.Option key={pro.name} value={pro?.name}>
                        {pro?.alias || pro?.name}
                      </Select.Option>
                    );
                  })}
                </Select>
                <Format.Text className="kw-mt-5">{intl.get('exploreGraph.defProValue')}</Format.Text>
                <ExplainTip title={intl.get('exploreGraph.defProValueTip')} />
                <InputNumber
                  className="kw-w-100 kw-mt-2"
                  value={filter?.default_value}
                  placeholder={intl.get('exploreGraph.placeEnterNumber')}
                  onChange={v => {
                    onChangeFilter({ default_value: v });
                    setIsError({ ...isError, defaultValue: false });
                  }}
                />
                {isError?.defaultValue && <p className="kw-c-error">{intl.get('global.noNull')}</p>}
              </div>
            </div>
          )}
          {/* 方向 */}
          <div className="kw-mt-5">
            <Format.Text>{intl.get('exploreGraph.direction')}</Format.Text>
            <Radio.Group
              className="kw-w-100"
              onChange={e => onChangeFilter({ direction: e?.target?.value })}
              value={filter?.direction}
            >
              {_.map(DIRECTION, item => {
                return (
                  <Radio.Button key={item?.value} className="dire-btn" value={item.value}>
                    {intl.get(item?.label)}
                  </Radio.Button>
                );
              })}
            </Radio.Group>
          </div>
          {/* 路径深度 */}
          <div className="kw-mt-6">
            <div>{intl.get('exploreGraph.pathDepth')}</div>
            <NumberInput
              className="kw-mt-2 kw-w-100"
              min={1}
              defaultValue={filter?.steps}
              onChange={e => onChangeFilter({ steps: e })}
            />
          </div>
          <div className="kw-mt-6">
            <AddTypeSelector value={addType} onChange={setAddType} />
          </div>
          {/* 搜索规则 */}
          <div className="kw-mt-8">
            <div className="kw-space-between">
              <div>
                {intl.get('exploreGraph.searchRules')}
                <ExplainTip className="kw-ml-2 kw-pointer" title={intl.get('exploreGraph.rulesTip')} />
              </div>
              <div>
                <Tooltip title={intl.get('exploreGraph.addRulesTip')}>
                  <IconFont type="icon-Add" className={classNames('kw-pointer')} onClick={() => openRulesModal()} />
                </Tooltip>
              </div>
            </div>
            <div className="kw-mt-2">
              <SearchRuleList
                checkedRules={checkedRules}
                searchRules={selectedItem?.rules?.path}
                onEdit={item => onEditRule(item)}
                onDelete={name => onDeleteRule(name)}
                onCheckRule={(name, checked) => onCheckRule(name, checked)}
              />
            </div>
            {/* </KwScrollBar> */}
          </div>
        </div>

        <div className="kw-mt-6 searchBtn">
          <Button
            className="kw-w-100"
            type="primary"
            disabled={_.isEmpty(startNode) || _.isEmpty(endNode)}
            onClick={() => findPath()}
          >
            {intl.get('function.query')}
          </Button>
          {isError?.exploreing && <ErrorTip />}
        </div>
        <ResultPanel
          {...results}
          title={intl.get('exploreGraph.pathQuery')}
          selectedItem={selectedItem}
          from={RESULT_TYPE.path}
          updateGraph={onChangeData}
          onAdd={onSelectAddCallback}
          onBack={() => setResults(getInitResState())}
          onClose={closeModal}
        />
      </div>

      <ConfigureRules
        visible={rulesModalVisible}
        editRule={editRule}
        filterType="e_filters"
        ruleList={selectedItem?.rules?.path}
        ontoData={{ entity: classData?.entity, edge: optionalClass }}
        onCancel={() => {
          setEditRule({});
          closeRulesModal();
        }}
        onOk={onChangeConfigRules}
      />
    </LeftDrawer>
  );
};

export default PathQuery;
