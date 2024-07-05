import React, { useState, memo } from 'react';

import Header from './Header';
import FilterOperationContainer from './FilterOperationContainer';
import ITable from './Table';

import { KwTableProps, FilterOperationContainerProps, HeaderProps, ITableProps } from './types';

/**
 * 表单模板, 包含标题，搜索框，过滤工具
 * @title --- null，不渲染标题
 * @showHeader --- false，不显示表头
 * @contextMenu --- 表头和表体的上下文菜单
 * @showFilter --- 是否显示筛选器, 默认不显示筛选器
 * @renderButtonConfig --- 渲染新建，刷新，排序等按钮，不配置时，默认显示搜索框或者筛选器
 * @FilterToolsOptions --- 渲染筛选器中的工具-下拉选择框，默认为空；不显示筛选器时，配置后只显示第一项
 * @onFilterClick --- 筛选按钮回调函数
 * @onSearchChange --- 搜索框回调函数
 * @searchText --- 搜索框placeholder
 * @onFiltersToolsClosee --- 过滤器关闭时的回调函数
 * @persistenceID --- 持久化列宽，使用不同列宽时改变persistenceID值，否则使用同一列宽
 */
const Kwtable: React.FC<KwTableProps> = props => {
  const {
    title = null,
    width = 'auto',
    showHeader = true,
    dataSource: data,
    contextMenu = {
      headerContextMenu: <></>,
      bodyContextMenu: <></>
    },
    showFilter = false,
    showSearch = true,
    renderButtonConfig,
    filterToolsOptions,
    onFilterClick = () => {},
    onSearchChange = () => {},
    searchPlaceholder = '',
    onFiltersToolsClose = () => {},
    persistenceID,
    children,
    ...resetProps
  } = props;

  const [isFilter, setIsFilter] = useState(showFilter);

  return (
    <div>
      {showHeader &&
        (children || (
          <>
            <Header
              title={title}
              showFilter={showFilter}
              filterConfig={{ isFilter, setIsFilter }}
              renderButtonConfig={renderButtonConfig}
              onFilterClick={onFilterClick}
              onSearchChange={onSearchChange}
              searchPlaceholder={searchPlaceholder}
              filterToolsOptions={filterToolsOptions}
            />
            <FilterOperationContainer
              showSearch={showSearch}
              visible={isFilter}
              filterConfig={{ isFilter, setIsFilter }}
              onSearchChange={onSearchChange}
              searchPlaceholder={searchPlaceholder}
              onClose={onFiltersToolsClose}
              filterToolsOptions={filterToolsOptions}
            />
          </>
        ))}
      <ITable
        persistenceID={persistenceID}
        width={width}
        title={() => {
          if (!showHeader) {
            return null;
          }
        }}
        dataSource={data}
        contextMenu={contextMenu}
        {...resetProps}
      />
    </div>
  );
};

export type KwTableCombineProps = React.FC<KwTableProps> & {
  Header: React.FC<HeaderProps>;
  FilterOperationContainer: React.FC<FilterOperationContainerProps>;
  ITable: React.FC<ITableProps>;
};

const KwTable = Kwtable as KwTableCombineProps;

KwTable.Header = Header;
KwTable.FilterOperationContainer = FilterOperationContainer;
KwTable.ITable = ITable;

KwTable.displayName = 'KwTable';
export { Header, FilterOperationContainer, ITable };
export default memo(KwTable);
