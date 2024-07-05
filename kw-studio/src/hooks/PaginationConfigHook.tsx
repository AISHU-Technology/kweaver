import { useEffect } from 'react';
import useLatestState from '@/hooks/useLatestState';

const InitPagination = { page: 1, pageSize: 10, count: 0 };
type PaginationConfigType = {
  page?: number;
  pageSize?: number;
  count?: number;
};
const PaginationConfig = (pageData: PaginationConfigType) => {
  const [pagination, setPagination, getPagination] = useLatestState({
    ...InitPagination,
    ...pageData
  });

  useEffect(() => {
    onUpdatePagination({ count: pageData?.count || 0 });
  }, [pageData?.count]);

  /** 切换分页条 */
  const onUpdatePagination = (data: PaginationConfigType) => {
    setPagination({ ...pagination, ...data });
  };

  return {
    pagination,
    setPagination,
    getPagination,
    onUpdatePagination
  };
};

export default PaginationConfig;
