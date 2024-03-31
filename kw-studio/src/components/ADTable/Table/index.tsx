import React, { useMemo, useEffect, useRef, useState, memo } from 'react';
import { Table, Dropdown } from 'antd';
import type { ColumnType } from 'antd/lib/table/interface';
import intl from 'react-intl-universal';
import _ from 'lodash';
import useATRH from './TableHooks';
import classnames from 'classnames';
import { v4 as generateUuid } from 'uuid';

import NoResult from '@/assets/images/empty.svg';

import { ITableProps } from '../types';
import './style.less';
import { useSize } from 'ahooks';
import { LoadingOutlined } from '@ant-design/icons';

const ITable: React.FC<ITableProps> = props => {
  const {
    loading,
    width = 'auto',
    contextMenu = {
      headerContextMenu: <></>,
      bodyContextMenu: <></>
    },
    title,
    columns = [],
    dataSource: data,
    onRow,
    onHeaderRow,
    locale,
    emptyImage = null,
    emptyText = '',
    className,
    scroll = { x: 'max-content' },
    pagination,
    lastColWidth = 120,
    persistenceID = '',
    ...resetProps
  } = props;
  const { headerContextMenu, bodyContextMenu } = contextMenu;
  const TableRef = useRef<any>(null);
  const TableContextMenuRef = useRef<any>(null); // Control the display and hiding of table context menu
  const [menuPos, setMenuPos] = useState<string>('BODY_MENU');
  const [tableSize, setTableSize] = useState(0);
  const [showShadow, setShowShadow] = useState(false);
  const [colsID, setColsID] = useState(persistenceID);

  const handleColumn = (cols: ColumnType<any>[]) => {
    delete cols[cols?.length - 1]?.width;
    const withWidthCols = cols.filter(col => typeof col.width === 'number' || typeof col.width === 'string');
    if (withWidthCols.length === cols.length) return;
    const hasWidth = withWidthCols.reduce((pre, cur) => {
      return pre + Number(cur.width);
    }, 0);
    const perColWidth = (tableSize - hasWidth) * Number((1 / (cols.length - withWidthCols.length)).toFixed(2));

    const newColumns = cols.map((col: any, _index: any) => {
      if (_index === cols.length - 1) {
        return {
          ...col,
          width: 0
        };
      }
      return {
        ...col,
        width: col.width || perColWidth
      };
    });
    return newColumns;
  };

  const newColumns = useMemo(() => handleColumn(columns), [columns, window, tableSize]);

  const {
    components,
    resizableColumns,
    tableWidth = 0,
    resetColumns
  } = useATRH({
    columns: useMemo(() => newColumns as any, [columns, newColumns]),
    minConstraints: 110,
    defaultWidth: resetProps.rowSelection
      ? lastColWidth + Number(resetProps.rowSelection.columnWidth ?? 32)
      : lastColWidth,
    columnsState: !colsID
      ? undefined
      : {
          persistenceKey: `ADTableCols-${colsID}`,
          persistenceType: 'sessionStorage'
        }
  });

  // Persistent form column width
  useEffect(() => {
    if (!colsID) {
      // Delete the ID saved in the last sessionStorage
      const length = sessionStorage.length;
      if (length > 0) {
        for (let i = 0; i < length; i++) {
          const key = sessionStorage.key(i);
          if (key?.includes('ADTableCols')) {
            sessionStorage.removeItem(key);
          }
        }
      }
      setColsID(generateUuid().replace(/-/g, '_'));
    }
    return () => {};
  }, [TableRef, columns, persistenceID]);

  useEffect(() => {
    setTableSize(TableRef.current.clientWidth);
    resetColumns();
    return () => {
      resetColumns();
    };
  }, [TableRef, columns, persistenceID]);

  useEffect(() => {
    if (tableWidth > tableSize) {
      setShowShadow(true);
    } else {
      setShowShadow(false);
    }
  }, [tableWidth, tableSize, persistenceID]);

  // Refresh browser to clear pull column width
  useEffect(() => {
    window.onbeforeunload = function () {
      setTableSize(TableRef.current.clientWidth);
      resetColumns();
      // Delete the ID saved in the last sessionStorage
      const length = sessionStorage.length;
      if (length > 0) {
        for (let i = 0; i < length; i++) {
          const key = sessionStorage.key(i);
          if (key?.includes('ADTableCols')) {
            sessionStorage.removeItem(key);
          }
        }
      }
    };
    return () => {
      window.onbeforeunload = null;
    };
  }, []);

  const paginationConfig = useMemo(() => {
    if (pagination) {
      return {
        showTotal: (total: number) => intl.get('knowledge.total', { total }),
        ...pagination
      };
    }
    return false;
  }, [pagination]);

  const prefixCls = 'kw-table';

  return (
    <div
      style={{ width }}
      onContextMenu={e => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <Dropdown
        placement="bottomLeft"
        overlay={() => {
          if (menuPos === 'BODY_MENU') {
            return bodyContextMenu;
          }
          return headerContextMenu;
        }}
        trigger={['contextMenu']}
      >
        <div>
          <Table
            title={title}
            className={classnames(prefixCls, { 'no-shadow': !showShadow }, className)}
            loading={
              loading
                ? {
                    indicator: <LoadingOutlined className="icon" style={{ fontSize: 24, top: '200px' }} spin />
                  }
                : false
            }
            ref={TableRef}
            columns={resizableColumns}
            components={components}
            dataSource={data}
            scroll={{ ...scroll, x: tableWidth }}
            rowKey="key"
            locale={
              locale || {
                emptyText: (
                  <div className={`${prefixCls}-nodata-box`}>
                    <img src={emptyImage || NoResult} alt="nodata" />
                    <div className={`${prefixCls}-nodata-text`}>{emptyText || intl.get('global.noResult2')}</div>
                  </div>
                )
              }
            }
            onRow={(record, index) => {
              const RowContextMenuObj = onRow?.(record, index);
              const RowcontextMenuCallBack = RowContextMenuObj?.onContextMenu || (() => {});

              return {
                ...RowContextMenuObj,
                onContextMenu: e => {
                  e.preventDefault();
                  setMenuPos('BODY_MENU');
                  RowcontextMenuCallBack(e);
                }
              };
            }}
            onHeaderRow={(columns, index) => {
              const headerRowContextMenuObj = onHeaderRow?.(columns, index);
              const headerRowContextMenuCallBack = headerRowContextMenuObj?.onContextMenu || (() => {});

              return {
                ...headerRowContextMenuObj,
                onContextMenu: e => {
                  e.preventDefault();
                  setMenuPos('HEADER_MENU');
                  headerRowContextMenuCallBack(e);
                }
              };
            }}
            pagination={paginationConfig}
            {...resetProps}
          />
        </div>
      </Dropdown>
    </div>
  );
};

export default ITable;
