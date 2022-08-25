import { KNOWLEDGE_GRAPH_CHANGE_STATUS } from '@/reduxConfig/actionType';

const ad_onChangeGraphStatus = (payload: object) => ({
  type: KNOWLEDGE_GRAPH_CHANGE_STATUS,
  payload
});

export { ad_onChangeGraphStatus };
