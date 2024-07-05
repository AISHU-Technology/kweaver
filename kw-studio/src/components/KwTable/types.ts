import React, { ReactNode } from 'react';
import type { TableProps } from 'antd';

export type ButtonConfigProps = {
  key: string;
  label?: string;
  type?: 'add' | 'add-down' | 'delete' | 'filter' | 'order' | 'fresh' | string;
  position: 'left' | 'right';
  onHandle?: Function;
  orderMenu?: { id: string; intlText: string }[];
  orderField?: string;
  order?: 'asc' | 'desc' | string;
  onOrderMenuClick?: (params: any) => void;
  tip?: boolean;
  itemDom?: ReactNode;
};

export type FilterToolsOptionProps = {
  id: string | number;
  label?: string;
  optionList?: { key: string | number; value: string; text: string }[];
  onHandle?: Function;
  value?: any;
  itemDom?: ReactNode;
};

export interface TitleProps {
  children?: ReactNode;
  visible?: boolean;
  title?: any;
  className?: string;
}

export interface HeaderProps {
  children?: ReactNode;
  title?: any;
  className?: string;
  visible?: boolean;
  showFilter?: boolean;
  onFilterClick?: Function;
  filterConfig?: any;
  renderButtonConfig?: ButtonConfigProps[];
  onSearchChange?: Function;
  searchPlaceholder?: string;
  filterToolsOptions?: FilterToolsOptionProps[];
}

export interface FilterOperationContainerProps {
  children?: ReactNode;
  visible?: boolean;
  showSearch?: boolean;
  className?: string;
  filterConfig?: any;
  filterToolsOptions?: FilterToolsOptionProps[];
  onSearchChange?: Function;
  searchPlaceholder?: string;
  onClose?: Function;
}

export interface ITableProps extends TableProps<any> {
  width?: number | string;
  contextMenu?: {
    headerContextMenu: React.ReactElement<any>;
    bodyContextMenu: React.ReactElement<any>;
  };
  emptyImage?: any;
  emptyText?: string | ReactNode;
  lastColWidth?: number;
  persistenceID?: string | number;
}

export interface KwTableProps extends Omit<ITableProps, 'title'> {
  title?: ReactNode;
  showFilter?: boolean;
  showSearch?: boolean;
  onFilterClick?: Function;
  renderButtonConfig?: ButtonConfigProps[];
  onSearchChange?: Function;
  searchPlaceholder?: string;
  filterToolsOptions?: FilterToolsOptionProps[];
  onFiltersToolsClose?: Function;
}
