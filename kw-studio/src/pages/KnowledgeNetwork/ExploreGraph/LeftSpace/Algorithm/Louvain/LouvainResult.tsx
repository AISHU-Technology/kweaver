import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Popover, Select, Tooltip } from 'antd';
import { SwapOutlined, PlusOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import type { SelectProps } from 'antd';

import { COLORS_CARD } from '@/enums';
import HELPER from '@/utils/helper';
import { LouvainResultType } from '../type';
import { LeftDrawerTitle, OptionalColumTable, CustomColumns } from '../../components';

import { ResultTile, ResultCommunity } from './LouvainResultTable';
import './style.less';

type ItemsType = {
  clusterId: string;
  label: string;
  children: any;
};

const COLORS_LENGTH = COLORS_CARD.SUB_GROUP_COLORS.length;
const DEFAULT_COLUMNS_KEYS = ['clusterId', 'classAlias', 'defaultProperty'];
const SELECT_ALL_OPTION = { value: 'all', label: intl.get('exploreGraph.algorithm.all') };
const VIEW_LAYOUT = { TILE: 'tile', COMMUNITY: 'community' };

const LouvainResult = (props: LouvainResultType) => {
  const { title, source, selectedItem, isFirstRender } = props;
  const { onGoBack, onChangeData, onCloseLeftDrawer, onChangeRenderIndex } = props;

  const [viewLayout, setViewLayout] = useState<string>(VIEW_LAYOUT.TILE);
  const [optionsNodes, setOptionsNodes] = useState<any>([]); // 实体类选项
  const [selectValue, setSelectValue] = useState('all'); // 实体类筛选控制项
  const [resultData, setResultData] = useState<any>({ tile: [], community: [] }); // 图计算结果的数据
  const [resultDataPart, setResultDataPart] = useState<ItemsType[]>([]); // 图计算结果的筛选后数据
  const [columnsData, setColumnsData] = useState<any>({}); // 全部的可展示属性
  const [extendColumns, setExtendColumns] = useState([]); // 选中的自定义可拓展属性

  // 构建表的数据
  useEffect(() => {
    const nodes = selectedItem.graph?.current?.getNodes();
    const nodesKV = _.keyBy(nodes, '_cfg.model.id');

    let newColumns: any = {};
    let itemsTile: any = [];
    const itemsCommunity: ItemsType[] = [];

    selectedItem.graph.current.__removeSubGroups();
    _.forEach(source.clusters, (item, index: number) => {
      const nodesData: any = [];
      const clustersHullNodes: any = [];
      const label = `${intl.get('exploreGraph.algorithm.community')}${item.id}`;

      _.forEach(item.nodes, node => {
        const data = nodesKV?.[node.id];
        if (!data) return;
        const model = data?.getModel();
        if (model) {
          nodesData.push({ ...(model?._sourceData || {}), clusterId: node.clusterId });
          clustersHullNodes.push(data);
        }
      });

      // 在画布上添加轮廓
      const i = index + 1 > COLORS_LENGTH ? (index + 1) % COLORS_LENGTH : index;
      const fill = HELPER.hexToRgba(COLORS_CARD.SUB_GROUP_COLORS[i], 0.04);
      const stroke = HELPER.hexToRgba(COLORS_CARD.SUB_GROUP_COLORS[i], 0.1);
      if (!_.isEmpty(clustersHullNodes) && isFirstRender) {
        selectedItem.graph.current.__createSubGroup({
          id: item.id,
          name: label,
          from: 'clusters',
          members: clustersHullNodes,
          info: { nodes: clustersHullNodes.map((d: any) => d._cfg.id), edges: [], groupType: 'subgraph' },
          style: { fill, stroke }
        });
      }

      const columns = CustomColumns.BuildColumnsDataBasedOnNodes(nodesData, {
        defaultColumnKeys: DEFAULT_COLUMNS_KEYS
      });
      newColumns = { ...newColumns, ...columns };

      const children = OptionalColumTable.BuildSourceDataBasedOnNodes(nodesData, {
        extendProperties: ['clusterId'],
        defaultColumnKeys: DEFAULT_COLUMNS_KEYS
      });

      const data = { label, clusterId: item.id, children };
      itemsTile = [...itemsTile, ...children];
      itemsCommunity.push(data);
    });

    setColumnsData(newColumns);
    setResultData({ tile: itemsTile, community: itemsCommunity });

    // 实体类选项
    const newOptionsNodes: SelectProps['options'] = [];
    _.forEach(_.values(newColumns), item => {
      newOptionsNodes.push({ value: item.class, label: item.label });
    });
    setOptionsNodes(newOptionsNodes);
    onChangeRenderIndex(false);
  }, []);

  // 通过实体类筛选
  useEffect(() => {
    onFilterNodes(selectValue, viewLayout);
  }, [selectValue]);

  const onFilterNodes = (value: string, layout: string) => {
    if (value === 'all') return setResultDataPart([]);

    let newItemsPart: any = [];
    if (layout === VIEW_LAYOUT.TILE) {
      newItemsPart = _.filter(resultData[VIEW_LAYOUT.TILE], child => child.class === value);
    }
    if (layout === VIEW_LAYOUT.COMMUNITY) {
      _.forEach(resultData[VIEW_LAYOUT.COMMUNITY], item => {
        const children = _.filter(item.children, child => child.class === value);
        if (_.isEmpty(children)) return;
        newItemsPart.push({ ...item, children });
      });
    }

    setResultDataPart(newItemsPart);
  };

  // 选择展示属性的回调
  const onChangeColumns = (data: any) => {
    setExtendColumns(data);
  };

  // 视图切换
  const onChangeViewLayout = () => {
    let newViewLayout = viewLayout;
    if (viewLayout === VIEW_LAYOUT.TILE) newViewLayout = VIEW_LAYOUT.COMMUNITY;
    if (viewLayout === VIEW_LAYOUT.COMMUNITY) newViewLayout = VIEW_LAYOUT.TILE;
    setViewLayout(newViewLayout);
    onFilterNodes(selectValue, newViewLayout);
  };

  // 选中图谱中的元素
  const onSelectedNodes = (nodes: any) => {
    const nodesKV = _.keyBy(nodes, 'id');
    const selected: any = [];
    let focusItem: any = null;
    _.forEach(selectedItem.graph?.current?.getNodes(), item => {
      if (nodesKV?.[item?._cfg?.model?.id]) {
        if (!focusItem) focusItem = item;
        selected.push(item);
      }
    });
    if (focusItem) {
      selectedItem.graph?.current?.focusItem(focusItem, true, { easing: 'easeCubic', duration: 800 });
    }

    if (_.isEmpty(selected)) return;
    onChangeData({ type: 'selected', data: { nodes: selected, edges: [], length: selected.length } });
  };

  // 结果展示数据
  const _resultData = _.isEmpty(resultDataPart) ? resultData[viewLayout] : resultDataPart;

  return (
    <div className="louvainResultRoot">
      <LeftDrawerTitle title={title} onGoBack={onGoBack} onCloseLeftDrawer={onCloseLeftDrawer} />
      <div className="tip">
        <ExclamationCircleFilled className="tipIcon" />
        <div>{intl.get('exploreGraph.algorithm.performingOperations')}</div>
      </div>
      <div className="kw-pb-4 kw-border-b">
        <div className="kw-pt-4 kw-space-between">
          <div className="kw-w-100 kw-align-center">
            <div className="kw-mr-2">{intl.get('exploreGraph.algorithm.entityClass')}</div>
            <Select
              value={selectValue}
              style={{ flex: 1, maxWidth: HELPER.getValueBasedOnLanguage({ 'zh-CN': 264, 'en-US': 236 }) }}
              options={[SELECT_ALL_OPTION, ...optionsNodes]}
              onChange={(value: string) => setSelectValue(value)}
            />
          </div>
          <div className="kw-align-center" style={{ justifyContent: 'flex-end' }}>
            <Tooltip title={intl.get('exploreGraph.algorithm.tableParameterSetting')}>
              <Popover
                overlayClassName="optionalColumTablePopover"
                trigger="click"
                placement="bottomRight"
                content={<CustomColumns source={columnsData} onChangeColumns={onChangeColumns} />}
                getPopupContainer={triggerNode => triggerNode?.parentElement || document.body}
              >
                <PlusOutlined className="operationIcon" />
              </Popover>
            </Tooltip>
            <Tooltip title={intl.get('exploreGraph.algorithm.viewSwitching')}>
              <SwapOutlined className="operationIcon" onClick={onChangeViewLayout} />
            </Tooltip>
          </div>
        </div>
      </div>

      {viewLayout === VIEW_LAYOUT.TILE && (
        <ResultTile items={_resultData} extendColumns={extendColumns} onSelectedNodes={onSelectedNodes} />
      )}
      {viewLayout === VIEW_LAYOUT.COMMUNITY && (
        <ResultCommunity items={_resultData} extendColumns={extendColumns} onSelectedNodes={onSelectedNodes} />
      )}
    </div>
  );
};

export default LouvainResult;
