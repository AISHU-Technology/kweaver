import React from 'react';
import { Pagination } from 'antd';
import intl from 'react-intl-universal';
import './style.less';

const BottomPagination = (props: any) => {
  const { total, noLastPage, current, showTotal, pageSize = 20, hideOnSinglePage, showLessItems, onChange } = props;

  const onChangeFunc = (page: number, pageSize: number) => {
    onChange(page, pageSize);
  };

  return (
    <Pagination
      className={`pagination ${noLastPage ? 'noLastPage' : ''}`}
      current={current}
      pageSize={pageSize}
      showTitle={false}
      showTotal={showTotal ? total => intl.get('userManagement.total', { total: total }) : undefined}
      total={total}
      showSizeChanger={false}
      showLessItems={showLessItems}
      onChange={onChangeFunc}
      hideOnSinglePage={hideOnSinglePage}
    />
  );
};

export default BottomPagination;
