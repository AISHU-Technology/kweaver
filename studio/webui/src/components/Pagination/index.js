/* eslint-disable */
import React, { Component } from 'react';
import intl from 'react-intl-universal';
import { Pagination } from 'antd';

import './style.less';

class BottomPagination extends Component {
  onChange = (page, pageSize) => {
    this.props.onChange(page, pageSize);
  };

  render() {
    const { total, noLastPage, current, showTotal, pageSize = 20, hideOnSinglePage, showLessItems } = this.props;

    return (
      <Pagination
        className={`pagination ${noLastPage ? 'noLastPage' : ''}`}
        total={total}
        current={current}
        showTitle={false}
        pageSize={pageSize}
        showSizeChanger={false}
        showLessItems={showLessItems}
        hideOnSinglePage={hideOnSinglePage}
        showTotal={showTotal ? total => intl.get('userManagement.total', { total: total }) : null}
        onChange={this.onChange}
      />
    );
  }
}

BottomPagination.defaultProps = {
  total: 0,
  current: 1,
  showLessItems: false,
  hideOnSinglePage: false,
  onChange: () => {}
};

export default BottomPagination;
