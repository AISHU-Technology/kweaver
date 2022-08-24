/**
 * 搜索结果展示列表
 * @author Jason.ji
 * @date 2022/01/10
 *
 */

import React, { memo, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Checkbox, Pagination } from 'antd';
import intl from 'react-intl-universal';
import ScrollBar from '@/components/ScrollBar';
import HOOKS from '@/hooks';
import { showHighLight, boolRowEllipsis } from './assistFunction';
import './style.less';

const PAGE_SIZE = 20; // 分页数

const SearchResult = props => {
  const {
    resData,
    resInfo,
    curPage,
    selectedValues,
    disabledValues,
    checkedRow,
    onPageChange,
    onCheckChange,
    onDetail,
    onReport,
    onTitleClick
  } = props;
  const scrollRef = useRef(null); // 滚动容器ref
  const selectKeys = useMemo(() => selectedValues.map(item => item.id), [selectedValues]); // 选中的id
  const disabledKeys = useMemo(() => disabledValues.map(item => item.id), [disabledValues]); // 禁用的id
  const [showEllipsis, setShowEllipsis] = useState([]);

  // 开启窗口监听
  useEffect(() => {
    window.addEventListener('resize', listenEllipsis);

    return () => window.removeEventListener('resize', listenEllipsis);
  }, []);

  // 重置滚动条到顶部
  useEffect(() => {
    scrollRef.current && (scrollRef.current.scrollTop = 0);

    setTimeout(() => {
      setShowEllipsis(boolRowEllipsis());
    }, 0);
  }, [resData]);

  /**
   * 窗口变化时判断标签是否过多, 展示省略号
   */
  const listenEllipsis = useCallback(
    HOOKS.useThrottle(() => {
      setShowEllipsis(boolRowEllipsis());
    }, 300),
    []
  );

  /**
   * 点击复选框
   * @param {Object} item 行数据
   */
  const onHandleCheck = item => {
    if (typeof onCheckChange !== 'function') return;

    const newData = selectKeys.includes(item.id)
      ? selectedValues.filter(v => v.id !== item.id)
      : [...selectedValues, { ...item }];

    onCheckChange(newData);
  };

  /**
   * 点击行打开右侧详情
   * @param {MouseEvent} e
   * @param {Object} item 行数据
   */
  const onRowClick = (e, item) => {
    e.stopPropagation();

    const checkbox = e.currentTarget.querySelector('.ant-checkbox-wrapper');

    // 点击复选框不触发
    if (checkbox && checkbox.contains(e.target)) {
      return;
    }

    onDetail(item, 'base');
  };

  return (
    <div className="normal-search-result-list" ref={scrollRef}>
      <ScrollBar isshowx="false" className="res-scroll">
        <div className="scroll-wrapper">
          {resData.map((item, index) => {
            const { id, name, hl: hlTitle, properties, alias, color, analysis } = item;

            return (
              <div
                className={`row ${checkedRow === id && 'checked'}`}
                key={`${index}`}
                onClick={e => onRowClick(e, item)}
              >
                <div className="check-col">
                  <Checkbox
                    checked={selectKeys.includes(id) || disabledKeys.includes(id)}
                    disabled={disabledKeys.includes(id)}
                    onChange={() => onHandleCheck(item)}
                  />
                </div>

                <div className="info-row">
                  <h2
                    className="title ellipsis-one"
                    title={name}
                    onClick={e => {
                      e.stopPropagation();
                      onTitleClick(item);
                    }}
                    dangerouslySetInnerHTML={{ __html: showHighLight(hlTitle) }}
                  />

                  <div className="pro-tags">
                    <span className="pro-tag ellipsis-one" title={`class：${alias || item.class}`}>
                      class：
                      <span className="circle-span" style={{ backgroundColor: color || '#126ee3' }} />
                      {alias || item.class}
                    </span>

                    {properties.map((proItem, proIndex) => {
                      const { n, v, hl } = proItem;
                      const proValue = showHighLight(hl);

                      return (
                        <span
                          key={`${proIndex}`}
                          className="pro-tag ellipsis-one"
                          title={`${n}：${v}`}
                          dangerouslySetInnerHTML={{ __html: `${n}：${proValue}` }}
                        />
                      );
                    })}
                  </div>

                  {showEllipsis[index] && <div className="pro-tags">...</div>}

                  <div className="operation-box">
                    {analysis && (
                      <span className="op-item">
                        {intl.get('searchGraph.report')}：
                        <span
                          className="detail-btn"
                          onClick={e => {
                            e.stopPropagation();
                            onReport(item);
                          }}
                        >
                          {intl.get('search.detail')}
                        </span>
                      </span>
                    )}

                    <span className="op-item">
                      {intl.get('search.in_out')}：
                      <span
                        className="detail-btn edge-detail"
                        onClick={e => {
                          e.stopPropagation();
                          onDetail(item, 'summary');
                        }}
                      >
                        {intl.get('search.detail')}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          <div className={'pagination-box'}>
            <Pagination
              className={`controlled-pagination infinite ${resData.length ? 'show' : 'hidden'}`}
              current={curPage}
              total={resInfo.count}
              onChange={onPageChange}
              pageSize={PAGE_SIZE}
              showTitle={false}
              showSizeChanger={false}
              hideOnSinglePage
            />
          </div>
        </div>
      </ScrollBar>
    </div>
  );
};

SearchResult.defaultProps = {
  resData: [],
  resInfo: {},
  curPage: 1,
  selectedValues: [],
  disabledValues: [],
  onCheckChange: () => {},
  onPageChange: () => {},
  onDetail: () => {},
  onReport: () => {},
  onTitleClick: () => {}
};

export default memo(SearchResult);
