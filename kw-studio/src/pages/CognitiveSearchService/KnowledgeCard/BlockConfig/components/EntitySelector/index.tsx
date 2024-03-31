/**
 * 实体选择下拉框, antd 的 Select 存在诸多限制, 所以单独封装
 */
import React, { useState, useEffect, useRef } from 'react';
import { Dropdown } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';
import exploreServices from '@/services/explore';
import HOOKS from '@/hooks';
import InputSelector from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/EntitySelector/InputSelector';
import './style.less';

export interface EntitySelectorProps {
  className?: string;
  overlayClassName?: string;
  placeholder?: React.ReactNode;
  tags?: string | string[]; // 限制返回的实体类型
  graphId: number;
  value?: Record<string, any>;
  onSearch?: (value: string) => void;
  onChange?: (data: { input?: string; node?: Record<string, any> }) => void;
}
const SIZE = 8;
const onPreventMouseDown = (event?: any) => {
  event?.preventDefault();
  event?.stopPropagation();
};

const EntitySelector = (props: EntitySelectorProps) => {
  const { className, overlayClassName, placeholder, tags, graphId, value, onSearch, onChange } = props;
  const timer = useRef<any>(null);
  const requestId = useRef(0); // 标记网络请求
  const curInputValue = useRef(''); // 缓存搜索值
  const isFocus = useRef(false); // 聚焦状态
  const { height: windowHeight } = HOOKS.useWindowSize();
  const [selectorDOM, setSelectorDOM] = useState<HTMLDivElement | null>(null); // 输入框DOM, 用于计算下拉列表宽度
  const [visible, setVisible] = useState(false); // 下拉是否可见
  const [graphResult, setGraphResult] = useState<any[]>([]); // 图谱搜索列表
  const [searchValue, setSearchValue] = useState(''); // 搜索值
  const [dropdownSize, setDropdownSize] = useState('L'); // 下拉框大小 L, M, S
  const scrollBarRef = useRef<any>(null); // 监听滚动
  const paginationRef = useRef<any>({ current: { page: 1, count: 0 } });
  const [loading, setLoading] = useState(false);

  // 卸载时清除防抖计时器
  useEffect(() => {
    getListByGraph(); // 默认先搜索一次
    return () => {
      clearTimeout(timer.current);
      timer.current = null;
    };
  }, []);

  useEffect(() => {
    if (!selectorDOM) return;
    const { top, bottom } = selectorDOM.getBoundingClientRect();
    const bottomHeight = windowHeight - bottom;
    const availableHeight = Math.max(top, bottomHeight);
    const count = Math.floor(availableHeight / 56);
    const size = count > 9 ? 'L' : count > 6 ? 'M' : 'S';
    setDropdownSize(size);
  }, [windowHeight]);

  // 单选同步searchValue值
  useEffect(() => {
    if (!_.isEmpty(value)) {
      const text = (value as any)?.default_property?.value || '';
      text !== curInputValue.current && getListByGraph(text);
      setSearchValue(text);
      curInputValue.current = text;
    }
  }, [JSON.stringify(value)]);

  /**
   * 联想查询图谱中的实体
   * @param keyword 关键词
   */
  const getListByGraph = async (keyword?: string, page = 1) => {
    if (!graphId) return;
    const size = page * SIZE;
    try {
      setLoading(true);
      const signId = ++requestId.current;
      const { res, count } =
        (await exploreServices.quickSearch({
          kg_id: graphId,
          query: keyword || '',
          size,
          page: 1,
          entity_classes: tags ? (typeof tags === 'string' ? [tags] : tags) : []
        })) || {};
      if (signId < requestId.current || !res) return;
      setLoading(false);
      paginationRef.current = { page, count };
      setGraphResult(res);
    } catch (err) {
      setGraphResult([]);
    }
  };

  /**
   * 防抖查询
   */
  const debounceQuery = (keyword: string) => {
    return new Promise(resolve => {
      if (timer.current) {
        return resolve(false);
      }
      timer.current = setTimeout(() => {
        clearTimeout(timer.current);
        timer.current = null;
        getListByGraph(keyword);
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
    onChange?.({ input: text, node: {} });
    setLoading(true);
    const isFinish = await debounceQuery(text);
    // 防抖可能会错误的把最终值过滤, 这里重新触发最终值的查询
    if (isFinish && curInputValue.current !== text) {
      getListByGraph(curInputValue.current);
    }
  };

  /**
   * 点击行, 直接搜索, 并触发`选中`将值回填到输入框
   * @param data
   */
  const onRowClick = (data: any) => {
    const input = data.id;
    onChange?.({ input, node: data });
    onSearch?.(input);
    handleClose();
  };

  /**
   * 打开下拉
   */
  const handleOpen = () => {
    isFocus.current = true;
    setVisible(true);
    if (searchValue) {
      getListByGraph(searchValue);
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
   * 渲染列表
   * @param dataList
   */
  const renderList = (dataList: any[], isLoad = false) => {
    const { page, count } = paginationRef?.current;

    return (
      <>
        {_.map(dataList, item => {
          const { id, default_property, name, alias } = item;
          const text = default_property?.value;
          const checked = (value as any)?.id === id;
          return (
            <div
              key={id}
              className={classNames('entity-row kw-align-center kw-pointer', { checked })}
              onClick={() => onRowClick(item)}
            >
              <div className="e-name">
                <div className="kw-c-header kw-w-100 kw-ellipsis" title={text}>
                  {text}
                </div>
                <div className="kw-c-subtext kw-align-center">
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
        {loading ? '...' : searchValue ? intl.get('global.noResult') : intl.get('global.noContent')}
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
      overlayClassName={classNames(overlayClassName, 'knw-card-entity-selector-overlay', {
        [dropdownSize]: true,
        forceHidden: !visible
      })}
      overlayStyle={{ width: selectorDOM?.clientWidth }}
      trigger={['click']}
      // visible
      visible={visible}
      overlay={
        <div className="dropdown-content" onMouseDown={onPreventMouseDown}>
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
        </div>
      }
    >
      <div ref={setSelectorDOM} className={classNames(className, 'knw-card-entity-selector')}>
        <InputSelector
          placeholder={placeholder}
          value={searchValue}
          onInputChange={onInputChange}
          onFocus={handleOpen}
          onBlur={handleClose}
        />
      </div>
    </Dropdown>
  );
};

export default EntitySelector;
