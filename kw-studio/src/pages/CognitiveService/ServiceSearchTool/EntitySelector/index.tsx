/**
 * 实体选择下拉框, antd 的 Select 存在诸多限制, 所以单独封装
 * 限制显示10条数据, 不考虑大数据量的问题
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Tabs, Checkbox, Dropdown, Popconfirm, message } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';
import exploreServices from '@/services/explore';
import HOOKS from '@/hooks';
import { fuzzyMatch } from '@/utils/handleFunction';
import IconFont from '@/components/IconFont';
import InputSelector from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/EntitySelector/InputSelector';
import { onPreventMouseDown } from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/EntitySelector/assistant';
import './styles/index.less';
import './styles/selector.less';

export interface EntitySelectorProps {
  readOnly?: boolean;
  tags?: any; // 快速搜索给定实体类
  initQuery: boolean;
  excludeNode?: any; // 下拉框需要排除的点
  className?: string;
  overlayClassName?: string;
  placeholder?: React.ReactNode;
  multiple?: boolean; // 是否多选
  value?: Record<string, any> | Record<string, any>[]; // 多选时为数组
  canvasInstance?: any; // 画布实例
  footer?: boolean; // multiple是否展示底部按钮
  onSearch?: (action: 'add' | 'cover', value: string | string[]) => void;
  onChange?: (data: { input?: string | string[]; nodes?: Record<string, any>[] }) => void;
  updateGraph?: (data: any) => void;
}
const CANVAS = 'canvas';
const GRAPH = 'graph';
const SELECTED = 'selected';
const SIZE = 8;

const EntitySelector = (props: EntitySelectorProps) => {
  const {
    className,
    overlayClassName,
    readOnly,
    tags,
    initQuery = false,
    placeholder,
    multiple,
    value,
    canvasInstance,
    excludeNode,
    onChange
  } = props;
  const timer = useRef<any>(null);
  const requestId = useRef(0); // 标记网络请求
  const curInputValue = useRef(''); // 缓存搜索值
  const isFocus = useRef(false); // 聚焦状态
  const { height: windowHeight } = HOOKS.useWindowSize();
  const [selectorDOM, setSelectorDOM] = useState<HTMLDivElement | null>(null); // 输入框DOM, 用于计算下拉列表宽度
  const [tabKey, setTabKey] = useState(CANVAS); // 面板key
  const [visible, setVisible] = useState(false); // 下拉是否可见
  const { nodes, selectedNodes } = useMemo(() => {
    const nodes = canvasInstance?.graphData?.nodes || [];
    let selectedNodes = [];
    try {
      selectedNodes = _.map(canvasInstance?.selected?.nodes, n => n?.getModel()?._sourceData);
    } catch {
      //
    }
    if (!nodes.length) setTabKey(key => (key === CANVAS ? GRAPH : key));
    return { nodes, selectedNodes };
  }, [canvasInstance?.add, canvasInstance?.graphData, canvasInstance?.selected]);
  const [graphResult, setGraphResult] = useState<any[]>([]); // 图谱搜索列表
  const [canvasResult, setCanvasResult] = useState<any[]>([]); // 画布搜索列表
  const [selectedResult, setSelectedResult] = useState<any[]>([]); // 已选的列表
  const [searchValue, setSearchValue] = useState(''); // 搜索值
  const [dropdownSize, setDropdownSize] = useState('L'); // 下拉框大小 L, M, S
  const scrollBarRef = useRef<any>(null); // 监听滚动
  const paginationRef = useRef<any>({ current: { page: 1, count: 0 } });

  useEffect(() => {
    query(curInputValue.current, nodes);
  }, [excludeNode]);

  useEffect(() => {
    if (initQuery) {
      setSearchValue('');
    }
  }, [initQuery]);

  useEffect(() => {
    if (canvasInstance?.detail?.kg) query('', nodes);
  }, [canvasInstance?.detail?.kg]);

  // 卸载时清除防抖计时器
  useEffect(() => {
    return () => {
      clearTimeout(timer.current);
      timer.current = null;
    };
  }, []);

  useEffect(() => {
    if (tabKey === CANVAS) {
      query(curInputValue.current, nodes);
    }
  }, [tabKey]);

  useEffect(() => {
    if (!selectorDOM) return;
    const { top, bottom } = selectorDOM.getBoundingClientRect();
    const bottomHeight = windowHeight - bottom;
    const availableHeight = Math.max(top, bottomHeight);
    const count = Math.floor(availableHeight / 56);
    const size = count > 9 ? 'L' : count > 6 ? 'M' : 'S';
    setDropdownSize(size);
  }, [windowHeight]);

  /**
   * 自动填充
   */
  useEffect(() => {
    if (!isFocus.current) return;
    if (_.isEmpty(selectedNodes)) return;
    const nodes = !multiple && selectedNodes[0] ? [selectedNodes[0]] : [...selectedNodes];
    const input = !multiple ? nodes[0]?.id : _.map(selectedNodes, n => n.id);
    const filterNodes = _.filter(nodes, n => _.includes(tags, n?.class) && n.id !== excludeNode?.id);
    onChange?.({ input, nodes: filterNodes });
  }, [selectedNodes, multiple]);

  // 单选同步searchValue值
  useEffect(() => {
    let text = initQuery ? '' : searchValue;
    if (!multiple && value) {
      text = (value as any)?.default_property?.value;
      if (text) {
        setSearchValue(text);
        curInputValue.current = text;
      }
    }
    query(text, nodes);
  }, [JSON.stringify(value), multiple, nodes]);

  /**
   * 联想查询图谱中的实体
   * @param keyword 关键词
   */
  const getListByGraph = async (keyword?: string, page = 1) => {
    const { kg_id } = canvasInstance?.detail?.kg || {};
    if (!kg_id) return;
    const size = page * SIZE;
    try {
      const signId = ++requestId.current;
      const { res, count } =
        (await exploreServices.quickSearch({
          kg_id,
          query: keyword || '',
          size,
          page: 1,
          entity_classes: tags
        })) || {};
      if (signId < requestId.current || !res) return;
      paginationRef.current = { page, count };
      const filterData = _.filter(res, item => item?.id !== excludeNode?.id);

      setGraphResult(filterData);
    } catch (err) {
      const { Description, ErrorCode } = err.response || err.data || {};
      if (ErrorCode === 'Gateway.Common.NoDataPermissionError') {
        return message.error(intl.get('analysisService.noGraphAuth'));
      }
      setGraphResult([]);
    }
  };

  /**
   * 搜索画布中的实体
   * @param keyword 关键词
   * @param nodeList 所有实体
   */
  const getListByCanvas = (keyword: string, nodeList: any[]) => {
    // 先筛选符合起点类的点。再筛选关键字
    const filterTags = _.filter(nodeList, node => _.includes(tags, node?.class));
    const result = keyword
      ? _.filter(filterTags, node => fuzzyMatch(keyword, node.default_property?.value))
      : filterTags;

    const filterData = _.filter(result, item => item?.id !== excludeNode?.id);

    // 匹配度排序
    const sortedData = _.sortBy(filterData, item => {
      const formattedName = _.deburr(item.default_property?.value?.toLowerCase());
      const keywordIndex = formattedName.indexOf(_.deburr(keyword?.toLowerCase()));
      // 完全匹配的项，赋予更高的排序值（0）
      return keywordIndex === 0 ? 0 : 1;
    });

    setCanvasResult(sortedData);
  };

  /**
   * 查询
   */
  const query = (keyword: string, nodeList: any[]) => {
    getListByGraph(keyword);
    getListByCanvas(keyword, nodeList);
    if (keyword && !nodeList.length) {
      setTabKey(key => (key === CANVAS ? GRAPH : key));
    }
  };

  /**
   * 防抖查询
   */
  const debounceQuery = (keyword: string, nodeList: any[]) => {
    return new Promise(resolve => {
      if (timer.current) {
        return resolve(false);
      }
      timer.current = setTimeout(() => {
        clearTimeout(timer.current);
        timer.current = null;
        query(keyword, nodeList);
        resolve(true);
      }, 200);
    });
  };

  /**
   * 搜索框变化
   * @param text
   */
  const onInputChange = async (text: string) => {
    setSearchValue(text);
    curInputValue.current = text;
    if (!multiple) {
      onChange?.({ input: text, nodes: [] });
    }

    const isFinish = await debounceQuery(text, nodes);

    // 防抖可能会错误的把最终值过滤, 这里重新触发最终值的查询
    if (isFinish && curInputValue.current !== text) {
      query(curInputValue.current, nodes);
    }
  };

  /**
   * 多选框回调
   * @param checked 是否勾选
   * @param node 实体
   */
  const onCheckChange = (checked: boolean, node: Record<string, any>) => {
    const curValues = _.isArray(value) ? value : [];
    const nodes = checked ? [...curValues, node] : _.filter(curValues, v => v.id !== node.id);
    const input = _.map(nodes, n => n.id);
    onChange?.({ input, nodes });
  };

  /**
   * 点击行, 存在快捷查询时直接搜索, 否则触发`选中`将值回填到输入框
   * @param data
   */
  const onRowClick = (data: any) => {
    setVisible(false);
    const input = multiple ? [data.id] : data.id;
    onChange?.({ input, nodes: [data] });
  };

  /**
   * 打开下拉
   */
  const handleOpen = () => {
    isFocus.current = true;
    setVisible(true);
    if (searchValue) {
      query(searchValue, nodes);
    }
  };

  /**
   * 关闭下拉
   */
  const handleClose = (e?: any) => {
    isFocus.current = false;
    setVisible(false);
    (document.activeElement as HTMLElement)?.blur(); // 强制失焦, 否则 Dropdown 会闪烁
  };

  /**
   * 查看已选
   */
  const onChangeSelected = () => {
    if (!_.isArray(value) || tabKey === SELECTED) return;
    setSelectedResult([...(value || [])]);
    setTabKey(SELECTED);
  };

  /**
   * 渲染列表
   * @param dataList
   */
  const renderList = (dataList: any[], isLoad = false) => {
    const { page, count } = paginationRef?.current;

    return (
      <>
        {_.map(dataList, item => {
          const { id, default_property, name, color, alias } = item;
          const text = default_property?.value;
          const checked = multiple ? _.some(value, v => v.id === id) : (value as any)?.id === id;
          return (
            <div key={id} className={classNames('entity-row kw-align-center kw-pointer', { checked })}>
              {multiple && (
                <Checkbox
                  className="kw-mr-2"
                  checked={checked}
                  onClick={onPreventMouseDown}
                  onChange={e => onCheckChange(e.target.checked, item)}
                />
              )}
              <div className="e-name" onClick={() => onRowClick(item)}>
                <div className="kw-c-header kw-w-100 kw-ellipsis" title={text}>
                  {text}
                </div>
                <div className="kw-c-subtext kw-w-100 kw-align-center">
                  <span style={{ display: 'inline-block', minWidth: 42, maxWidth: 150 }}>
                    {intl.get('global.entityClass')}
                  </span>
                  {'：'}
                  <div className="kw-ellipsis" style={{ flex: 1, minWidth: 0 }} title={alias || name}>
                    {alias || name || '--'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {isLoad && page * SIZE >= count && (
          <div className="kw-center kw-c-watermark" style={{ height: 40 }}>
            {intl.get('cognitiveService.analysis.noMoredata')}
          </div>
        )}
      </>
    );
  };

  const Empty = () => {
    return (
      <div className="drown-empty kw-c-subtext">
        {searchValue ? intl.get('global.noResult') : intl.get('global.noContent')}
      </div>
    );
  };

  const handleScroll = (e: any) => {
    if (scrollBarRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      const query = curInputValue.current || searchValue;
      if (!query) return;
      if (scrollTop <= 5) {
        const { page, count } = paginationRef?.current;

        if (page > 1) {
          getListByGraph(query, page - 1);
        }
      }

      if (scrollTop + clientHeight >= scrollHeight - 5) {
        const { page, count } = paginationRef?.current;
        if (page * SIZE < count) {
          getListByGraph(query, page + 1);
        }
      }
    }
  };

  return (
    <Dropdown
      overlayClassName={classNames(overlayClassName, 'neighbor-entity-selector-overlay', {
        [dropdownSize]: true,
        forceHidden: readOnly ? true : !visible
      })}
      overlayStyle={{ width: selectorDOM?.clientWidth }}
      trigger={['click']}
      // visible
      open={visible}
      overlay={
        <div className="dropdown-content" onMouseDown={onPreventMouseDown}>
          <Tabs activeKey={tabKey} onChange={setTabKey}>
            <Tabs.TabPane tab={intl.get('analysisService.graphTab')} key={GRAPH}>
              <div
                className="overlay-list"
                ref={scrollBarRef}
                onScroll={e => {
                  onPreventMouseDown(e);
                  handleScroll(e);
                }}
              >
                {graphResult.length ? renderList(graphResult, true) : <Empty />}
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab={intl.get('analysisService.canvasTab')} key={CANVAS} disabled={!nodes.length}>
              <div className="overlay-list">{canvasResult.length ? renderList(canvasResult) : <Empty />}</div>
            </Tabs.TabPane>
            <Tabs.TabPane tab={null} key={SELECTED}>
              <div className="overlay-list">{selectedResult.length ? renderList(selectedResult) : <Empty />}</div>
            </Tabs.TabPane>
          </Tabs>
          {multiple && (
            <div className="count-bar kw-pointer" onClick={onChangeSelected}>
              {intl.get('global.selected')}：<span className="kw-c-primary">{value?.length || 0}</span>
              <Popconfirm
                title={intl.get('workflow.knowledge.emptyOper')}
                zIndex={1050}
                okText={intl.get('global.ok')}
                cancelText={intl.get('global.cancel')}
                onCancel={onPreventMouseDown}
                onConfirm={e => {
                  onPreventMouseDown(e);
                  onChange?.({ nodes: [] });
                }}
              >
                <IconFont
                  type="icon-lajitong"
                  className="kw-ml-2"
                  style={{ transform: 'translateY(-1px)' }}
                  onClick={onPreventMouseDown}
                />
              </Popconfirm>
            </div>
          )}
        </div>
      }
    >
      <div ref={setSelectorDOM} className={classNames(className, 'neighbor-canvas-entity-selector')}>
        <InputSelector
          placeholder={placeholder}
          readOnly={readOnly}
          value={searchValue}
          onClick={() => {
            setVisible(true);
          }}
          onInputChange={onInputChange}
          onFocus={handleOpen}
          onBlur={handleClose}
        />
      </div>
    </Dropdown>
  );
};

export default EntitySelector;
