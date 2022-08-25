/* eslint-disable */
import React, { Component } from 'react';
import { Pagination } from 'antd';
import intl from 'react-intl-universal';
// import { CaretLeftOutlined, CaretRightOutlined } from '@ant-design/icons';
import './style.less';

class BottomPagination extends Component {
  onChange = (page, pageSize) => {
    this.props.onChange(page, pageSize);
  };

  render() {
    // liang.zhiqiang@aishu.cn
    // 增加noLastPage属性 true/false
    const { total, noLastPage, current, showTotal, pageSize = 20, hideOnSinglePage, showLessItems } = this.props;

    // const itemRender = (current, type, originalElement) => {
    //   if (type === 'prev') {
    //     return (
    //       <a>
    //         <CaretLeftOutlined />
    //       </a>
    //     );
    //   }
    //   if (type === 'next') {
    //     return (
    //       <a>
    //         <CaretRightOutlined />
    //       </a>
    //     );
    //   }
    //   return originalElement;
    // };

    return (
      <Pagination
        className={`pagination ${noLastPage ? 'noLastPage' : ''}`}
        current={current}
        // defaultCurrent={1}
        pageSize={pageSize}
        showTitle={false}
        showTotal={showTotal ? total => intl.get('userManagement.total', { total: total }) : null}
        total={total}
        showSizeChanger={false}
        // itemRender={itemRender}
        showLessItems={showLessItems}
        onChange={this.onChange}
        hideOnSinglePage={hideOnSinglePage}
      />
    );
  }
}

BottomPagination.defaultProps = {
  onChange: () => {},
  total: 0,
  current: 1,
  hideOnSinglePage: false,
  showLessItems: false
};

export default BottomPagination;
