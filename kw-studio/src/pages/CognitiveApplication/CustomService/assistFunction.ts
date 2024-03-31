import _ from 'lodash';

/**
 * 列表获取参数
 */
export const paramBody = (dataBody: any, data: any) => {
  const { query, kg_id, status, operation_type } = data;
  if (query) {
    dataBody.query = query;
    dataBody.page = 1;
  }
  if (kg_id !== '-1' && kg_id !== '全部' && kg_id !== 'all') {
    dataBody.kg_id = kg_id;
    dataBody.page = 1;
  }
  if (status !== -1) {
    dataBody.status = status;
    dataBody.page = 1;
  }

  if (operation_type === '图语言查询' || operation_type?.slice(0, 1) === 'g') {
    dataBody.page = 1;
    dataBody.operation_type = 'custom-search';
  }
  return dataBody;
};
