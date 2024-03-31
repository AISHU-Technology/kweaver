export const getResult = () => {
  return {
    res: {
      full_text: null,
      kgqa: {
        count: 0,
        execute_time: 0.1243,
        openai_status: false,
        data: [
          {
            answer: 'whjgoiwrjg',
            score: 1,
            kg_id: '5',
            kg_name: 'test_2',
            subgraph: []
          }
        ]
      },
      query_understand: null,
      knowledge_card: null,
      related_knowlwdge: null
    }
  };
};
