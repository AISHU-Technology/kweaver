import React, { useEffect, useState, useMemo } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { List, Collapse, Pagination, Input } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

import HOOKS from '@/hooks';
import HELPER from '@/utils/helper';
import { sessionStore } from '@/utils/handleFunction';

import Format from '@/components/Format';
import NoDataBox from '@/components/NoDataBox';
import PaginationCommon from '@/components/PaginationCommon';
import IconFont from '@/components/IconFont';
// import SearchInput from '@/components/SearchInput';
import { GraphIcon } from '@/utils/antv6';
const { Panel } = Collapse;

import './style.less';

type SummaryInfoProps = {
  style?: any;
  selectedItem: any;
  summaryOpenInfo: { openInfo: boolean; infoId?: any };
  onCloseRightDrawer: () => void;
  onChangeData: (item: any) => void;
  onOpenRightDrawer: (key: string, id?: string) => void;
};

type SummaryType = {
  type: 'node' | 'edge'; // 类型
  label: string; // class
  count: number; // 实体数量
  color: string; // 颜色
  icon: string; // 图标
  children: any[]; // 类下的实体点或边
  expand: boolean; // 是否展开
  page: number; // 实体当前页
};
const ITEM_SIZE = 50; // 每个类的实体按50分页
const SummaryInfo = (props: SummaryInfoProps) => {
  const { style = {}, selectedItem, summaryOpenInfo, onCloseRightDrawer, onChangeData, onOpenRightDrawer } = props;
  const { pagination, onUpdatePagination } = HOOKS.PaginationConfig({ pageSize: 100 });
  const [tabsKey, setTabsKey] = useState<'nodes' | 'edges'>('nodes');
  const [activeKey, setActiveKey] = useState<any>(''); // 展开类
  const [source, setSource] = useState<{ nodes: SummaryType[]; edges: SummaryType[] }>({ nodes: [], edges: [] });
  // 用于保存搜索之前的全部数据
  const [saveData, setSaveData] = useState<{ nodes: SummaryType[]; edges: SummaryType[] }>({ nodes: [], edges: [] });
  const [searchValue, setSearchValue] = useState<string>(''); // 搜索关键字
  const [focusId, setFocusId] = useState<string>(''); // 选中居中的id

  const counter = useMemo(() => {
    const nodeCount = _.reduce(source.nodes, (res, item) => res + item.count, 0);
    const edgeCount = _.reduce(source.edges, (res, item) => res + item.count, 0);
    return { node: nodeCount, edge: edgeCount };
  }, [source]);

  const { page, pageSize } = pagination;
  const items = source?.[tabsKey] || [];

  useEffect(() => {
    const graphShapes = selectedItem?.apis?.getGraphShapes();
    const nodes = _.map(graphShapes?.nodes, item => item.getModel());
    let edges = _.map(graphShapes?.edges, item => {
      return {
        ...item.getModel(),
        startNode: item?.getSource()?.getModel(),
        endNode: item?.getTarget()?.getModel()
      };
    });

    edges = _.uniqBy(edges, item => {
      if (item?._sourceData?.uid) return item?._sourceData?.uid;
      return '';
    });

    const nodesClass: Record<string, any> = {};
    const edgeClass: Record<string, any> = {};
    _.forEach(nodes, node => {
      if (node.isAgencyNode) return;
      const _sourceData = node?._sourceData;
      if (nodesClass?.[_sourceData?.class]) {
        nodesClass[_sourceData?.class].count += 1;
        nodesClass[_sourceData?.class].children.push(node);
      } else {
        nodesClass[_sourceData?.class] = {
          type: 'node',
          shape: _sourceData?.type,
          label: _sourceData?.class,
          count: 1,
          color: _sourceData?.fillColor || _sourceData?.strokeColor || _sourceData?.color,
          stroke: _sourceData?.strokeColor || _sourceData?.fillColor || _sourceData?.color,
          iconColor: _sourceData?.iconColor,
          icon: _sourceData?.icon,
          children: [node],
          expand: false,
          page: 1
        };
      }
    });

    _.forEach(edges, edge => {
      if (edge.isMore) return;
      if (selectedItem?.graph?.current?.__isGroup) return;
      const _sourceData = edge?._sourceData;
      const color = edge?._sourceData?.strokeColor || edge?._sourceData?.strokeColor;
      if (edgeClass?.[_sourceData?.class]) {
        edgeClass[_sourceData?.class].count += 1;
        edgeClass[_sourceData?.class].children.push(edge);
      } else {
        edgeClass[_sourceData?.class] = {
          type: 'edge',
          label: _sourceData?.class,
          count: 1,
          color,
          children: [edge],
          expand: false,
          page: 1
        };
      }
    });

    const newSource: any = { nodes: _.values(nodesClass), edges: _.values(edgeClass) };
    setSource(newSource);
    setSaveData(newSource);
    onUpdatePagination({ page: 1, count: newSource?.[tabsKey]?.length });
    let type: any = 'nodes'; // 默认显示实体
    if (summaryOpenInfo?.infoId) {
      // 从详情返回到统计，需选中之前点击的item
      const item = selectedItem?.graph?.current?.findById(summaryOpenInfo?.infoId);
      type = item?._cfg?.type === 'node' ? 'nodes' : 'edges';
      const className = item?.getModel()?._sourceData?.class;

      setFocusId(summaryOpenInfo?.infoId);
      setTabsKey(type);
      setActiveKey([className]);
    }
    // 跳转详情是否是有搜索
    if (sessionStore.get('exploreGraphSumary')) {
      const value = sessionStore.get('exploreGraphSumary');
      setSearchValue(value);
      onSearch({ target: { value } }, { source: newSource, key: type });
      sessionStore.remove('exploreGraphSumary');
    }
  }, [selectedItem?.graphData]);

  const onChangeTabsKey = (key: 'nodes' | 'edges') => {
    setTabsKey(key);
    setSearchValue('');
    onUpdatePagination({ page: 1, count: source?.[key]?.length });
  };

  const onChangePagination = (newPagination: any) => {
    onUpdatePagination(newPagination);
  };

  const getCurrentList = (items: any, page: number, size: number) => {
    return items.slice((page - 1) * size, (page - 1) * size + size) || [];
  };

  /**
   * @description 自定义结果空白页
   */
  const customizeRenderEmpty = () =>
    searchValue ? (
      <NoDataBox type="NO_RESULT" desc={intl.get('global.noResult')} />
    ) : (
      <NoDataBox
        type="NO_CONTENT"
        desc={
          selectedItem?.graph?.current?.__isGroup
            ? intl.get('exploreGraph.noClassStatistics')
            : intl.get('global.noContent')
        }
      />
    );

  // 点击选中全部类
  const onClickClass = (item: any) => {
    const graph = selectedItem.graph;
    const graphShapes = selectedItem?.apis?.getGraphShapes();
    const _temp = item.type === 'node' ? graphShapes.nodes : graphShapes.edges;
    const items = _.filter(_temp, d => {
      return d?.getModel()?._sourceData?.class === item.label;
    });
    let data: any = {};
    if (item.type === 'node') {
      data = { nodes: items, edges: [], length: item?.length };
    } else {
      data = { nodes: [], edges: items, length: item?.length };
    }
    graph.current.fitView(0, { onlyOutOfViewPort: true, direction: 'y' });
    graph.current.__onGetZoom();
    onChangeData({ type: 'selected', data });
  };

  // 点击跳转到详情
  const onClickDetail = (tabsKey: string, id: string) => {
    const item =
      tabsKey === 'edges'
        ? _.find(selectedItem?.graph?.current.getEdges(), item => item?._cfg?.model?.id === id)
        : selectedItem?.graph?.current?.findById(id);

    let data: any = { nodes: [item], edges: [], length: 1 };
    if (tabsKey === 'edges') data = { edges: [item], nodes: [], length: 1 };
    if (searchValue) sessionStore.set('exploreGraphSumary', searchValue);
    onChangeData({ type: 'selected', data });
    onOpenRightDrawer('info', id);
  };

  // 定位到元素
  const onFocusItem = (tabsKey: string, id: string) => {
    const item =
      tabsKey === 'edges'
        ? _.find(selectedItem?.graph?.current.getEdges(), item => item?._cfg?.model?.id === id)
        : selectedItem?.graph?.current?.findById(id);
    setFocusId(id);
    onChangeData({ type: 'focusItem', data: item });
  };

  // 实体分页
  const onChangeItemPage = (page: number, label: string) => {
    const data: any = _.map(source[tabsKey], item => {
      if (item.label === label) return { ...item, page };
      return item;
    });
    const newSource = _.cloneDeep(source);
    newSource[tabsKey] = data;

    setSource(newSource);
  };

  // 返回实体当前页数据
  const getCurrentItem = (children: any, page: number) => {
    return children.slice((page - 1) * ITEM_SIZE, (page - 1) * ITEM_SIZE + ITEM_SIZE) || [];
  };

  /**
   * 搜索  从详情返回 拿不到state更新数据，手动传入data
   */
  const onSearch = _.debounce((e, data?: any) => {
    const value = _.toLower(e.target.value);
    const newData: any = _.cloneDeep(data?.source || saveData);
    const result: any = [];
    const openKey: any = [];
    const key = data?.key || tabsKey;

    if (value) {
      _.forEach(newData[key], item => {
        // 筛选实体
        const filterChildren = _.filter(item?.children, child => {
          const { default_property, alias } = child?._sourceData;
          const searchKey = key === 'nodes' ? default_property?.value : alias;

          return _.includes(_.toLower(searchKey), value);
        });

        if (!_.isEmpty(filterChildren)) {
          openKey.push(item?.label);

          result.push({ ...item, children: filterChildren, count: filterChildren?.length, page: 1 });
        } else if (_.includes(_.toLower(item?.label), value)) {
          if (data) openKey.push(item?.label); // 从详情返回
          // 命中类
          return result.push(item);
        }
      });
      newData[key] = result;
    }

    setActiveKey(openKey);
    setSource(newData);
  }, 300);

  //
  const getNamesBySearch = (name: string) => {
    const value = _.toLower(searchValue);
    if (!value) return name;
    const names = _.split(_.toLower(name), value);
    return names;
  };

  return (
    <div className="graph-analysis-summary" style={style}>
      <div className="kw-c-header kw-space-between title">
        <Format.Title>{intl.get('exploreGraph.statistics')}</Format.Title>
        <CloseOutlined classID="kw-pointer" onClick={onCloseRightDrawer} />
      </div>

      <div className="kw-mt-5 kw-flex">
        <div
          className={classnames('border-box left-border kw-center ', { 'box-checked': tabsKey === 'nodes' })}
          onClick={() => onChangeTabsKey('nodes')}
        >
          {intl.get('atlasDetails.summaryInfo.vertex')}&nbsp; ({HELPER.formatNumberWithComma(counter.node)})
        </div>
        <div
          className={classnames('border-box right-border kw-center', { 'box-checked': tabsKey === 'edges' })}
          onClick={() => onChangeTabsKey('edges')}
        >
          {intl.get('atlasDetails.summaryInfo.edge')}&nbsp; ({HELPER.formatNumberWithComma(counter.edge)})
        </div>
      </div>

      <Input
        className="kw-mt-5"
        allowClear
        style={{ width: 354 }}
        value={searchValue}
        prefix={<IconFont type="icon-sousuo" className="kw-c-watermark" onClick={e => onSearch(e)} />}
        placeholder={tabsKey === 'nodes' ? intl.get('exploreGraph.searchNodes') : intl.get('exploreGraph.searchEdges')}
        onChange={e => {
          e.persist();
          setSearchValue(e?.target?.value);
          onSearch(e);
        }}
      />

      <div className="kw-mt-5 kw-border-t" style={{ height: 'calc(100% - 188px)', overflowY: 'auto' }}>
        {_.isEmpty(getCurrentList(items, page, pageSize)) ? (
          customizeRenderEmpty()
        ) : (
          <Collapse
            accordion
            bordered={false}
            activeKey={activeKey}
            onChange={key => setActiveKey(key)}
            expandIcon={({ isActive }) => (
              <IconFont type="icon-xiala" style={{ transform: isActive ? 'rotate(180deg)' : '' }} />
            )}
          >
            {_.map(getCurrentList(items, page, pageSize), item => {
              const { label, count, color, stroke, icon, iconColor, children, page, shape } = item;
              return (
                <Panel
                  header={
                    <div
                      className="kw-w-100 kw-align-center kw-pointer"
                      style={{ height: 54 }}
                      onClick={() => onClickClass(item)}
                    >
                      <div
                        className={classnames({
                          nodeIcon: tabsKey === 'nodes',
                          edgeIcon: tabsKey === 'edges'
                        })}
                        style={{ background: color, border: `1px solid ${stroke}` }}
                      >
                        <GraphIcon type={icon} className="icon-svg" style={{ color: iconColor }} />
                      </div>
                      <div className="text kw-w-90 kw-ml-3 kw-flex">
                        <div className="name kw-ellipsis" title={label}>
                          {label}
                        </div>
                        <div className="number kw-ml-8">{HELPER.formatNumberWithComma(count || 0)}</div>
                      </div>
                    </div>
                  }
                  key={label}
                  className="class-collapse"
                >
                  <List
                    dataSource={getCurrentItem(children, page)}
                    renderItem={(child: any) => {
                      const { default_property, uid, alias } = child?._sourceData || {};
                      const { startNode, endNode } = child;
                      // 搜索命中的字显示主题色
                      const name = getNamesBySearch(default_property?.value || alias);

                      return (
                        <List.Item>
                          <div
                            className={classnames('kw-w-100 kw-space-between kw-pointer kw-pr-2 kw-pl-2', {
                              selectBg: focusId === uid
                            })}
                            style={{ height: 54 }}
                            onClick={() => onFocusItem(tabsKey, uid)}
                          >
                            <div className="kw-w-80 name kw-ellipsis" title={default_property?.value || alias}>
                              {!searchValue ? (
                                <>{name}</>
                              ) : (
                                <>
                                  {_.map(name, (n, i) => {
                                    return (
                                      <React.Fragment key={i}>
                                        {n}
                                        {i !== name.length - 1 && <span className="kw-c-primary">{searchValue}</span>}
                                      </React.Fragment>
                                    );
                                  })}
                                </>
                              )}
                              {tabsKey === 'edges' && (
                                <div className="sub-name">
                                  <div className="sub1" title={startNode?._sourceData?.default_property?.value}>
                                    {startNode?._sourceData?.default_property?.value || ''}
                                  </div>
                                  <IconFont className="arrow" type="icon-fanye" />
                                  <div className="sub2" title={endNode?._sourceData?.default_property?.value}>
                                    {endNode?._sourceData?.default_property?.value || ''}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div>
                              <IconFont type="icon-dingwei1" onClick={() => onFocusItem(tabsKey, uid)} />
                              <IconFont
                                type="icon-jibenxinxi"
                                className="kw-ml-3"
                                onClick={e => {
                                  e.stopPropagation();
                                  onClickDetail(tabsKey, uid);
                                }}
                              />
                            </div>
                          </div>
                        </List.Item>
                      );
                    }}
                  />
                  {count > ITEM_SIZE && (
                    <Pagination
                      className="kw-pt-3 kw-mb-3 kw-border-t"
                      style={{ textAlign: 'right' }}
                      current={page}
                      pageSize={ITEM_SIZE}
                      total={count}
                      onChange={(page: number) => onChangeItemPage(page, label)}
                      simple
                    />
                  )}
                </Panel>
              );
            })}
          </Collapse>
        )}
      </div>
      {pagination?.count > 100 && (
        <PaginationCommon
          className={classnames('pagination', { hide: !items.length })}
          paginationData={pagination}
          onChange={onChangePagination}
        />
      )}
    </div>
  );
};

export default SummaryInfo;
