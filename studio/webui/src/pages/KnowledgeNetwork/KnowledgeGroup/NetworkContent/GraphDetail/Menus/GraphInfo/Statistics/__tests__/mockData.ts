const intelligenceCalculate = ({ graph_id }: any) => {
  const isSuccess = Math.random() > 0.5;
  return Promise.resolve(
    isSuccess
      ? { res: 'success' }
      : {
          ErrorCode: 'bulder.controller.knowledgeNetwork_controller.intelligence_computer.celery_busy',
          Description: 'intelligence is calculating or celery is busing',
          ErrorDetails: 'celery max task reached',
          Solution: 'Please wait a moment'
        }
  );
};

const intelligenceGetByGraph = ({ graph_id }: any) => {
  return Promise.resolve({
    res: {
      graph_id: 4,
      graph_name: '图谱4，计算中，非首次计算',
      calculate_status: 'IN_CALCULATING',
      last_task_message: '',
      last_task_time: '2022-09-20 10:10:10',
      data_repeat_C1: 0.9,
      data_missing_C2: 0.89,
      data_quality_B: 70,
      data_quality_score: 62.65
    }
  });
};

export { intelligenceCalculate, intelligenceGetByGraph };
