import { useState, useEffect } from 'react';

const InitPagination = { page: 1, pageSize: 10, count: 0 };
type PaginationConfigType = {
  page?: number;
  pageSize?: number;
  count?: number;
};
const PaginationConfig = (pageData: PaginationConfigType) => {
  const [pagination, setPagination] = useState({
    ...InitPagination,
    ...pageData
  });

  useEffect(() => {
    onUpdatePagination({ count: pageData?.count });
  }, [pageData?.count]);

  /** 切换分页条 */
  const onUpdatePagination = (data: PaginationConfigType) => {
    setPagination({ ...pagination, ...data });
  };

  return {
    pagination,
    setPagination,
    onUpdatePagination
  };
};

export default PaginationConfig;
