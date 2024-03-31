import React, { useRef, useEffect, useState } from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';

import emptyImg from '@/assets/images/empty.svg';

import './style.less';
import ADTable from '@/components/ADTable';

type TypeTable = {
  className?: string;
  tableTitle: string[];
  tableData: any[];
  activeCol?: string;
  loading: boolean;
};
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

const MyTable = (props: TypeTable) => {
  const { className, tableTitle, tableData, activeCol, loading } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const [scrollSize, setScrollSize] = useState<{ x: number; y: number }>({ x: 1000, y: 400 });
  useEffect(() => {
    const width = (containerRef?.current?.clientWidth || 600) / tableTitle?.length - 10;
    const columns: any = _.map(tableTitle, item => {
      return {
        title: item,
        dataIndex: item,
        key: item,
        width: width < 200 ? 200 : width,
        ellipsis: true,
        render: (text: string, record: any) => (
          <div className={classNames('my-col kw-ellipsis', { selectRow: item === activeCol })}>{text || '--'}</div>
        )
      };
    });
    if (columns?.length > 0) {
      columns.push({ title: '', dataIndex: '.' }); // 用于收缩列自适应多余宽度
    }
    setColumns(columns);
  }, [tableTitle, activeCol]);

  useEffect(() => {
    if (activeCol) {
      handleColumnHeaderClick(activeCol);
    }
  }, [activeCol]);

  useEffect(() => {
    if (containerRef?.current) {
      const height = _.isEmpty(tableData) ? 0 : containerRef.current?.clientHeight;
      const width = containerRef.current?.clientWidth - 20;

      setScrollSize({ x: width, y: height });
    }
  }, [containerRef.current?.clientHeight, tableData]);

  /**
   * @param columnKey 点击的列名
   */
  const handleColumnHeaderClick = (columnKey: any) => {
    const columnWidths = columns.map((col: any) => col?.width || 130);
    const index = _.indexOf(tableTitle, columnKey);
    const targetScrollLeft = columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0);
    const v = document.getElementsByClassName('ant-table-body')[0];

    if (v) {
      v.scrollLeft = targetScrollLeft;
    }
  };

  return (
    <div className={classNames('dataTableRoot', className)} ref={containerRef}>
      {loading ? (
        <div className="kw-w-100 kw-h-100 kw-center">
          <Spin indicator={antIcon} />
        </div>
      ) : _.isEmpty(tableTitle) ? (
        <div className="emptyTable">
          <img src={emptyImg} />
          <div className="kw-c-text-lower">{intl.get('domainData.dataEmpty')}</div>
        </div>
      ) : (
        <ADTable
          showHeader={false}
          dataSource={tableData}
          columns={columns}
          rowKey={(record: any) => record?.rowId}
          tableLayout="fixed"
          // className="dataTable"
          // virtual={true}
          // tableHeight={scrollSize?.y}
          scroll={{ ...scrollSize }}
          pagination={false}
          locale={{
            emptyText: (
              <div className="kw-mt-9 kw-mb-9 a-h-100">
                <div className="kw-c-text">{''}</div>
              </div>
            )
          }}
        />
      )}
    </div>
  );
};
export default MyTable;
