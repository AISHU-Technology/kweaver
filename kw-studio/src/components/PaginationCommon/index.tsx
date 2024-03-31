import React from 'react';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Pagination } from 'antd';

const InitPageSizeOptions = ['10', '20', '30'];
const ROOT_STYLE = {
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center'
};

export type PaginationType = {
  page?: number;
  pageSize?: number;
};
/**
 * component 基础数据分页
 * @param {ReactNode?} expandNode - 分页条拓展节点, 选填
 * @param {Object} paginationData - 分页数据 { page, pageSize, count }
 * @param {Number|String} paginationData.page
 * @param {Number|String} paginationData.pageSize
 * @param {Number|String} paginationData.count
 * @param {Array} pageSizeOptions - page size 的可选项
 * @param {Function} onChange - 分页page或者pagesize变化时触发
 * @param {Function} onEmptySelectedRowKeys - 分页信息变动的时候清空选中项
 */
const PaginationCommon = React.memo((props: any) => {
  const {
    className,
    style = {},
    hide = false,
    expandNode = null,
    showTotal = true,
    paginationData,
    pageSizeOptions = InitPageSizeOptions,
    antProps = {}
  } = props;
  const { onChange, onEmptySelectedRowKeys } = props;
  const { page, pageSize, count } = paginationData;

  if (hide) return null;
  return (
    <div className={classnames(className)} style={{ ...ROOT_STYLE, ...style }}>
      {expandNode ? <div style={{ marginRight: 15 }}>{expandNode}</div> : null}
      <Pagination
        current={parseInt(page, 10)}
        total={count}
        showTitle={false}
        pageSize={parseInt(pageSize, 10)}
        pageSizeOptions={pageSizeOptions}
        showTotal={total => (showTotal ? intl.get('knowledge.total', { total }) : false)}
        onChange={(page, pageSize) => {
          if (onEmptySelectedRowKeys) onEmptySelectedRowKeys();
          if (onChange) onChange({ page, pageSize });
        }}
        onShowSizeChange={(current, pageSize) => {
          if (onEmptySelectedRowKeys) onEmptySelectedRowKeys();
          if (onChange) onChange({ page: 1, pageSize });
        }}
        {...{ ...antProps }}
      />
    </div>
  );
});

export default (props: any) => {
  const { isHide, ...other } = props;
  if (isHide) return null;
  return <PaginationCommon {...other} />;
};
