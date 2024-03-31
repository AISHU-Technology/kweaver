import _ from 'lodash';
import cognitiveSearchService from '@/services/cognitiveSearch';
import { onHandleGraph } from '@/pages/CognitiveSearchService/SearchConfigStep/SecondSearchTest/assistFunction';
import { NodeConfigItem } from '../../../types';

export const buildConfig = async (
  type: 'card' | 'recommend' | string,
  graph: any,
  configs: Partial<NodeConfigItem>,
  externalModel: any
) => {
  const config = {
    switch: true,
    // weights: testOptions?.weights || [],
    // score_threshold: testOptions?.score_threshold || 0,
    entity_cards: [
      {
        kg_id: Number(graph.kg_id),
        entity: configs?.node?.name,
        components: [
          type === 'card' ? { type: 'entity_info' } : false,
          ..._.map(configs.components, c => _.omit(c, 'id', 'error'))
        ].filter(Boolean)
      }
    ]
  };
  const params: any = {
    knw_id: String(graph.knw_id),
    auto_wire: true,
    // data_source_scope: onHandleGraph([graph], externalModel),
    data_source_scope: onHandleGraph([graph]),
    nodes: [
      {
        props: {
          full_text: { switch: false },
          // query_understand: { switch: false },
          kgqa: { switch: false },
          knowledge_card: type === 'card' ? config : { switch: false },
          related_knowledge: type === 'recommend' ? config : { switch: false }
        }
      }
    ]
  };

  let id = '';
  let timer = 0;

  try {
    const { res } = (await cognitiveSearchService.getInitialization(params)) || {};
    res && (id = res);
  } catch (err) {
    return err;
  }

  // 轮询状态
  const pollingDetail = async (id: string) => {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const { res } = await cognitiveSearchService.getStatus(id);
          if (res) {
            resolve({ res: id });
          } else {
            timer = window.setTimeout(() => {
              clearTimeout(timer);
              timer = 0;
              poll();
            }, 1000);
          }
        } catch (err) {
          reject(err);
        }
      };

      poll();
    });
  };

  try {
    const finallyRes = await pollingDetail(id);
    return finallyRes;
  } catch (err) {
    return err;
  }
};
