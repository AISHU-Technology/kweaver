import React, { memo, useState, useRef, useEffect } from 'react';
import { Pagination, Drawer } from 'antd';
import intl from 'react-intl-universal';
import KwScrollBar from '@/components/KwScrollBar';
import HOOKS from '@/hooks';
import { numToThousand } from '@/utils/handleFunction';
import PathGraph, { handlePathData } from '../PathGraph';
import IconFont from '@/components/IconFont';
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
  onViewChange?: (type: 'json' | 'list' | string) => void; // 列表和json视图切换
  onCanvasClick?: (rowData: Record<string, any>) => void; // 点击路径图回调
  isDrawer: boolean;
  setIsDrawer: (state: any) => void;
}

const PAGE_SIZE = 20; // 分页数

const SearchResult: React.FC<SearchResultProps> = props => {
  const { className, resData, isDrawer, setIsDrawer, page, onPageChange, onReport, onCanvasClick } = props;
  const resScrollRef = useRef<any>(null); // 搜索结果滚动容器ref
  const pathScrollRef = useRef<any>(null); // 搜索路径滚动容器ref
  const preScrollTop = useRef(0); // 切换视图滚动条复位
  const [selectedRow, setSelectedRow] = useState<Record<string, any>>({}); // 选中的行
  const [pathGraph, setPathGraph] = useState<{ nodes?: any[]; edges?: any[] }>({}); // 路径图谱
  const { width: widthScreen } = HOOKS.useWindowSize(); // 屏幕宽度
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
    resData.res?.search?.length ? setSelectedRow(resData.res.search[0]) : setSelectedRow({});
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
    setIsDrawer(true);
    const graph = handlePathData(rowData.search_path);
    setPathGraph(graph);
    setSelectedRow(rowData);
  };

  /**
   * 点击画布
   */
  const handleCanvasClick = () => {
    onCanvasClick?.(selectedRow);
  };

  return (
    <>
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
              <KwScrollBar isShowX={false} className="res-scroll" ref={resScrollRef}>
                {viewType === 'list' ? (
                  <ListResult resData={resData.res.search} selectedRow={selectedRow} onRowClick={handleRowClick} />
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
              </KwScrollBar>
            </div>
          )}
        </div>
      </div>
      <Drawer
        open={isDrawer}
        placement="right"
        width={widthScreen !== 0 && widthScreen <= 1335 ? 'calc(100% - 213px)' : '1100px'}
        className="search-result-drawer"
        onClose={() => setIsDrawer(false)}
        title={<div className="title-modal kw-ellipsis">{intl.get('searchConfig.searchPath')}</div>}
        mask={false}
        extra={
          <IconFont type="icon-guanbiquxiao" className="drawer-close" onClick={() => setIsDrawer(false)}></IconFont>
        }
        closable={false}
        footer={null}
      >
        <div className="drawer-line"></div>
        <PathGraph graphData={pathGraph} markData={[selectedRow.id]} onSingleClick={handleCanvasClick} />
      </Drawer>
    </>
  );
};

export default memo(SearchResult);
