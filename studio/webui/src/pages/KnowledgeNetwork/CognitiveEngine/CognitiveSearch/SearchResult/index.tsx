/**
 * 认知搜索结果
 */

import React, { memo, useState, useRef, useEffect } from 'react';
import { Pagination } from 'antd';
import intl from 'react-intl-universal';
import ScrollBar from '@/components/ScrollBar';
import HOOKS from '@/hooks';
import { numToThousand } from '@/utils/handleFunction';
import PathGraph, { handlePathData, filterClass } from './PathGraph';
import ListResult from './ListResult';
import JsonResult from './JsonResult';
import './style.less';

export interface ResData {
  number?: number;
  res?: { search: any[]; [key: string]: any };
  time?: string;
  [key: string]: any;
}

export interface SearchResultProps {
  className?: string; // 类名
  resData: ResData; // 搜索结果数据
  page: number; // 页码
  view?: 'list' | 'json' | string; // 结果展现形式
  onPageChange: (page: number) => void; // 翻页
  onReport?: (rowData: Record<string, any>) => void; // 查看分析报告
  onTitleClick?: (rowData: Record<string, any>) => void; // 点击结果名称
  onViewChange?: (type: 'json' | 'list' | string) => void; // 列表和json视图切换
  onCanvasClick?: (rowData: Record<string, any>) => void; // 点击路径图回调
}

const PAGE_SIZE = 20; // 分页数

const SearchResult: React.FC<SearchResultProps> = props => {
  const { className, resData, page, onPageChange, onReport, onTitleClick, onCanvasClick } = props;
  const resScrollRef = useRef<any>(null); // 搜索结果滚动容器ref
  const pathScrollRef = useRef<any>(null); // 搜索路径滚动容器ref
  const preScrollTop = useRef(0); // 切换视图滚动条复位
  const [selectedRow, setSelectedRow] = useState<Record<string, any>>({}); // 选中的行
  const [pathGraph, setPathGraph] = useState<{ nodes?: any[]; edges?: any[] }>({}); // 路径图谱
  const [pathClass, setPathClass] = useState<any[]>([]); // 路径类图例
  const [viewType, setViewType] = HOOKS.useControllableValue(props, {
    defaultValue: 'list',
    defaultPropName: 'view',
    valuePropName: 'view',
    trigger: 'onViewChange'
  }); // 结果展现形式

  // 重置滚动条到顶部
  useEffect(() => {
    resScrollRef.current?.scrollbars?.scrollToTop();
    pathScrollRef.current?.scrollbars?.scrollToTop();
    preScrollTop.current = 0;
    resData.res?.search?.length ? handleRowClick(resData.res.search[0]) : setSelectedRow({});
  }, [resData]);

  /**
   * 切换显示类型, 切换时复位滚动条
   */
  const onViewTypeChange = (value: string) => {
    const scrollTop = resScrollRef.current.scrollbars.getScrollTop();

    setViewType(value);
    setTimeout(() => {
      resScrollRef.current.scrollbars.scrollTop(preScrollTop.current);
      preScrollTop.current = scrollTop;
    }, 0);
  };

  /**
   * 点击行
   * @param rowData 行数据
   */
  const handleRowClick = (rowData: Record<string, any>) => {
    const graph = handlePathData(rowData.search_path);
    const classArr = filterClass(graph.nodes);
    setPathGraph(graph);
    setPathClass(classArr);
    setSelectedRow(rowData);
  };

  /**
   * 点击画布
   */
  const handleCanvasClick = () => {
    onCanvasClick?.(selectedRow);
  };

  return (
    <div className={`kg-search-res-content ${className}`}>
      <div className={`res-scroll-wrap ${viewType}`}>
        <div className="res-info">
          <div className="res-count">
            {!!resData.time && (
              <>
                <span>{intl.get('searchConfig.find1')}</span>
                <span className="number">{numToThousand(resData.number!)}</span>
                <span>{intl.get('searchConfig.find2', { time: resData.time })}</span>
              </>
            )}
          </div>

          <div className="view-btn" onClick={() => onViewTypeChange(viewType === 'list' ? 'json' : 'list')}>
            <span className="label-text">
              {viewType === 'list' ? intl.get('searchConfig.switchJson') : intl.get('searchConfig.switchDoc')}
            </span>
          </div>
        </div>

        {resData.res?.search && (
          <div className="res-wrapper">
            <ScrollBar isshowx="false" className="res-scroll" ref={resScrollRef}>
              {viewType === 'list' ? (
                <ListResult
                  resData={resData.res.search}
                  selectedRow={selectedRow}
                  onReport={onReport}
                  onTitleClick={onTitleClick}
                  onRowClick={handleRowClick}
                />
              ) : (
                <JsonResult resData={resData} />
              )}

              <div className={'pagination-box'}>
                <Pagination
                  className="controlled-pagination infinite"
                  current={page}
                  total={resData.number}
                  onChange={onPageChange}
                  pageSize={PAGE_SIZE}
                  showTitle={false}
                  showSizeChanger={false}
                />
              </div>
            </ScrollBar>
          </div>
        )}
      </div>

      {/* 路径画布 */}
      <div className={`path-seize ${viewType !== 'list' && 'hide'}`}>
        <div className="search-path">
          <h2 className="path-title">{intl.get('searchConfig.searchPath')}</h2>

          <div className="path-scroll-wrap">
            <ScrollBar isshowx="false" className="res-scroll" ref={pathScrollRef}>
              <div className="path-canvas">
                <PathGraph graphData={pathGraph} markData={[selectedRow.id]} onSingleClick={handleCanvasClick} />
              </div>

              <div className="node-legend">
                {pathClass.map(item => {
                  const { tag, color } = item;
                  return (
                    <div key={tag} className="legend-item" title={tag}>
                      <span className="node-icon" style={{ background: color || '#126ee3' }} />
                      <span className="node-name ellipsis-one">{tag}</span>
                    </div>
                  );
                })}
              </div>
            </ScrollBar>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(SearchResult);
