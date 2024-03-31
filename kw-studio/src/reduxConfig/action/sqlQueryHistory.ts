import { SQL_SEARCH_HISTORY } from '@/reduxConfig/actionType';

const sqlQueryHistory = (payload: object) => ({
  type: SQL_SEARCH_HISTORY,
  payload
});

export { sqlQueryHistory };
