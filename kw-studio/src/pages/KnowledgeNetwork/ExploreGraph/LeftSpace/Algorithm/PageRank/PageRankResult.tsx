import React, { useRef, useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Popover, Select, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { SelectProps } from 'antd';

import HOOKS from '@/hooks';
import HELPER from '@/utils/helper';
import { LeftDrawerTitle, OptionalColumTable, CustomColumns } from '../../components';
import PageRankResultTable from './PageRankResultTable';

const DEFAULT_COLUMNS_KEYS = ['pageRank', 'classAlias', 'defaultProperty'];
const SELECT_ALL_OPTION = { value: 'all', label: intl.get('exploreGraph.algorithm.all') };

const PageRankResult = (props: any) => {
  const { title, source, selectedItem } = props;
  const { onGoBack, onChangeData, onCloseLeftDrawer } = props;

  const statisticsRef = useRef<HTMLDivElement>(null);
  const { height: statisticsHeight } = HOOKS.useSize(statisticsRef);

  const [statisticsData, setStatisticsData] = useState<any>([]);
  const [optionsNodes, setOptionsNodes] = useState<any>([]); // 实体类选项
  const [selectValue, setSelectValue] = useState('all'); // 实体类筛选控制项
  const [resultData, setResultData] = useState<any>([]); // 图计算结果的数据
  const [resultDataPart, setResultDataPart] = useState<any>([]); // 图计算结果的筛选后数据
  const [columnsData, setColumnsData] = useState<any>({}); // 全部的可展示属性
  const [extendColumns, setExtendColumns] = useState([]); // 选中的自定义可拓展属性

  /** 统计面板 */
  useEffect(() => {
    if (_.isEmpty(source)) return;
    const nodes = selectedItem.graph?.current?.getNodes();
    const nodesKV = _.keyBy(nodes, '_cfg.model.id');
    const values = _.values(source);
    const length = values?.length;

    const max = Math.max(...values);
    const min = Math.min(...values);
    const average = values.reduce((a, b) => a + b) / length;
    let middle = 0;
    values.sort();
    if (length % 2 === 0) {
      middle = (values[length / 2] + values[length / 2 - 1]) / 2;
    } else {
      middle = values[(length - 1) / 2];
    }

    let maxLabel = '';
    let minLabel = '';
    let middleLabel = '';
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const item = source[key].toFixed(10);
        if (item === max.toFixed(10)) {
          maxLabel = nodesKV?.[key]?._cfg?.model?._sourceData?.default_property?.v || '';
        }
        if (item === min.toFixed(10)) {
          minLabel = nodesKV?.[key]?._cfg?.model?._sourceData?.default_property?.v || '';
        }
        if (item === middle.toFixed(10)) {
          middleLabel = nodesKV?.[key]?._cfg?.model?._sourceData?.default_property?.v || '';
        }
      }
    }

    const arr = [
      { title: intl.get('exploreGraph.algorithm.maximum'), number: max.toFixed(4), itemLabel: maxLabel },
      { title: intl.get('exploreGraph.algorithm.minimum'), number: min.toFixed(4), itemLabel: minLabel },
      { title: intl.get('exploreGraph.algorithm.mean'), number: average.toFixed(4), itemLabel: '' },
      { title: intl.get('exploreGraph.algorithm.median'), number: middle.toFixed(4), itemLabel: middleLabel }
    ];
    setStatisticsData(arr);
  }, []);

  /** table 数据计算 */
  useEffect(() => {
    const nodesData: any = [];
    _.forEach(selectedItem.graph?.current?.getNodes(), item => {
      const model = item?.getModel();
      if (!model) return;
      nodesData.push({ ...(model?._sourceData || {}), pageRank: source[model?.id] });
    });

    const newColumns = CustomColumns.BuildColumnsDataBasedOnNodes(nodesData, {
      defaultColumnKeys: DEFAULT_COLUMNS_KEYS
    });
    const children = OptionalColumTable.BuildSourceDataBasedOnNodes(nodesData, {
      extendProperties: ['pageRank'],
      defaultColumnKeys: DEFAULT_COLUMNS_KEYS
    });
    children.sort((a: any, b: any) => b.pageRank - a.pageRank);
    setColumnsData(newColumns);
    setResultData(children);
    const newOptionsNodes: SelectProps['options'] = [];
    _.forEach(_.values(newColumns), item => {
      newOptionsNodes.push({ value: item.class, label: item.label });
    });
    setOptionsNodes(newOptionsNodes);
  }, []);

  // 通过实体类筛选
  useEffect(() => {
    onFilterNodes(selectValue);
  }, [selectValue]);
  const onFilterNodes = (value: string) => {
    if (value === 'all') return setResultDataPart([]);

    const newItemsPart = _.filter(resultData, child => child.class === value);
    newItemsPart.sort((a: any, b: any) => b.pageRank - a.pageRank);
    setResultDataPart(newItemsPart);
  };

  // 选择展示属性的回调
  const onChangeColumns = (data: any) => {
    setExtendColumns(data);
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
  const _resultData = _.isEmpty(resultDataPart) ? resultData : resultDataPart;

  return (
    <div className="pageRankResultRoot">
      <LeftDrawerTitle title={title} onGoBack={onGoBack} onCloseLeftDrawer={onCloseLeftDrawer} />
      <div ref={statisticsRef} className="pageRankStatistics">
        {_.map(statisticsData, (item, index) => {
          const { title, number, itemLabel } = item;
          return (
            <div key={index} className="statisticsItem">
              <div className="statisticsItemTitle">{title}</div>
              <div className="statisticsItemNumber">
                <div>{number}</div>
                {itemLabel && '（'}
                {itemLabel && <div className="subTitle">{itemLabel}</div>}
                {itemLabel && '）'}
              </div>
            </div>
          );
        })}
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
          </div>
        </div>
      </div>
      <PageRankResultTable
        items={_resultData}
        extendColumns={extendColumns}
        statisticsHeight={statisticsHeight}
        onSelectedNodes={onSelectedNodes}
      />
    </div>
  );
};

export default PageRankResult;
