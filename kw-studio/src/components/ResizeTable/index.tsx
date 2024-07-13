import React, { useEffect, useRef, useState } from 'react';
import { Table } from 'antd';
import type { TableProps } from 'antd';

import _ from 'lodash';
import { Resizable } from 'react-resizable';
import './style.less';

interface CustomTableProps {
  initCol: any[];
  dataSource: any[];
  itemHeight?: number;
  tableHeight?: number;
  virtual?: boolean;
}

const ResizeableTitle = (props: any) => {
  const { onResize, width, ...restProps } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  return (
    <Resizable width={width} height={0} onResize={onResize} draggableOpts={{ enableUserSelectHack: false }}>
      <th {...restProps} />
    </Resizable>
  );
};

/**
 * 支持虚拟滚动加列拖拽
 */
const ResizeTable: React.FC<CustomTableProps & TableProps<any>> = props => {
  const { initCol, virtual = false, dataSource, ...otherProps } = props;
  const { itemHeight = 48, tableHeight = 540 } = props;
  const [cols, setCols] = useState(initCol);
  const [columns, setColumns] = useState<any>([]);

  const [point, setPoint] = useState<any>([0, 0]);
  const [offset, setOffset] = useState<any>({ top: 0, bottom: 0 });

  const tabRef = useRef<any>(null);
  const containRef = useRef<any>();
  const visibleCount = Math.ceil(tableHeight / itemHeight);

  useEffect(() => {
    if (!virtual) return;
    const bottom = (dataSource?.length - visibleCount) * itemHeight;
    setOffset({ bottom });
    setPoint([0, visibleCount]);
    const scrollDom = tabRef?.current?.querySelector('.ant-table-body');

    if (scrollDom) {
      containRef.current = scrollDom;
      containRef.current.addEventListener('scroll', onScroll);

      return () => {
        containRef.current.removeEventListener('scroll', onScroll);
      };
    }
  }, [dataSource]);

  const onScroll = (e: any) => {
    const startIdx = Math.floor(e?.target?.scrollTop / itemHeight);
    const endIdx = startIdx + visibleCount;
    const bottom = (dataSource?.length - endIdx) * itemHeight;
    const top = startIdx * itemHeight;
    setOffset({ top, bottom });
    setPoint([startIdx, endIdx]);
  };

  useEffect(() => {
    if (!_.isEmpty(initCol)) {
      onChangeColumns(initCol);
    }
  }, [initCol]);

  useEffect(() => {
    if (!_.isEmpty(cols)) {
      onChangeColumns(cols);
    }
  }, [cols]);

  const onChangeColumns = (cols: any) => {
    const column = _.map(cols, (col, index) => ({
      ...col,
      onHeaderCell: (column: any) => ({
        width: column.width,
        onResize: handleResize(index)
      })
    }));
    setColumns(column);
  };

  const handleResize =
    (index: any) =>
    (e: any, { size }: any) => {
      const column = _.isEmpty(cols) ? initCol : cols;
      const nextColumns = [...column];
      nextColumns[index] = { ...nextColumns[index], width: size.width };
      setCols(nextColumns);
    };

  return (
    <div className="components-table-resizable-column">
      {virtual ? (
        <Table
          ref={tabRef}
          className="tableRoot"
          pagination={false}
          columns={columns}
          dataSource={dataSource}
          components={{
            body: {
              wrapper: ({ className, children }: any) => {
                return (
                  <tbody className={className}>
                    {children?.[0]}
                    <tr style={{ height: offset.top }} />
                    {_.slice(children?.[1], point?.[0], point?.[1])}
                    <tr style={{ height: offset.bottom }}></tr>
                  </tbody>
                );
              }
            },
            header: { cell: ResizeableTitle }
          }}
          {...otherProps}
        />
      ) : (
        <Table
          className="tableRoot"
          components={{
            header: { cell: ResizeableTitle }
          }}
          columns={columns}
          dataSource={dataSource}
          {...otherProps}
        />
      )}
    </div>
  );
};

export default ResizeTable;
