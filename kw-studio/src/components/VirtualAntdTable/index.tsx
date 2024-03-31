import type { TableProps } from 'antd';
import { Table } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import _ from 'lodash';

type VirtualOptions = {
  itemHeight: number;
  overscan: number;
};

const defaultOptions = {
  itemHeight: 48,
  overscan: 6 // 缓冲个数
};

const defaultScroll = {
  y: 300
};

const VirtualAntdTable = <RecordType extends object>(
  props: TableProps<RecordType> & { virtualOptions?: VirtualOptions }
) => {
  const { dataSource, scroll = defaultScroll, virtualOptions = defaultOptions, ...other } = props;
  const containerRef = useRef<any>();
  const tableRef = useRef<any>();
  const [wrapperStyle, setWrapperStyle] = useState<any>({ before: {}, after: {} });

  /**
   * TODO 虚拟列表的两种实现方法
   * 1.记录分割的索引, 在Table内部暴露出来的render children方法中截断, 不确定Table内部是否会有针对dataSource的计算性能消耗
   * 2.直接截断dataSource, 让Table不断rerender, dataSource很少, 有Table频繁更新的性能消耗
   */
  // const [list, setList] = useState<any[]>([]);
  const [points, setPoints] = useState<number[]>([0, 0]);

  useEffect(() => {
    const scrollDOM = tableRef.current?.querySelector('.ant-table-body');
    if (scrollDOM) {
      containerRef.current = scrollDOM;
      const listener = () => calculateRange();
      listener();
      containerRef.current.addEventListener('scroll', listener);
      return () => {
        containerRef.current.removeEventListener('scroll', listener);
      };
    }
  }, [dataSource?.length, scroll?.y]);

  const getVisibleCount = (containerHeight: number) => {
    return Math.ceil(containerHeight / virtualOptions.itemHeight);
  };

  const getOffset = (scrollTop: number) => {
    return Math.floor(scrollTop / virtualOptions.itemHeight) + 1;
  };

  // 获取上部高度
  const getDistance = (index: number) => {
    const height = index * virtualOptions.itemHeight;
    return height;
  };

  const calculateRange = () => {
    const container = containerRef.current;
    if (container) {
      const { scrollTop, clientHeight } = container;
      const offset = getOffset(scrollTop);
      const visibleCount = getVisibleCount(clientHeight);
      const start = Math.max(0, offset - virtualOptions.overscan);
      const end = Math.min(dataSource!.length, offset + visibleCount + virtualOptions.overscan);
      const offsetTop = getDistance(start);
      const offsetBottom = getDistance(dataSource!.length - end);

      setWrapperStyle({
        before: {
          height: offsetTop + 'px'
        },
        after: {
          height: offsetBottom + 'px'
        }
      });
      // setList(_.slice(dataSource, start, end));
      setPoints([start, end]);
    }
  };

  return (
    <Table
      ref={tableRef}
      {...other}
      className="virtual-table"
      dataSource={dataSource}
      // dataSource={list}
      scroll={scroll}
      pagination={false}
      components={{
        body: {
          wrapper: ({ className, children, ...o }: any, ...arg: any) => {
            return (
              <tbody className={className}>
                {children[0]}
                <tr {...wrapperStyle.before}></tr>
                {/* {children[1]} */}
                {_.slice(children[1], points[0], points[1])}
                <tr {...wrapperStyle.after}></tr>
              </tbody>
            );
          }
        }
      }}
    />
  );
};

export default VirtualAntdTable;
