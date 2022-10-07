const knwIQGet = ({ knw_id, graph_id, page, size, graph_name }: any) => {
  const data = Array.from({ length: 55 }, (_, i) => ({
    graph_id: i + 1,
    graph_config_id: i + 1,
    graph_name: `图谱${i + 1}`,
    calculate_status: 'CALCULATED',
    last_task_message: '',
    last_task_time: '2022-09-23 10:11:11',
    data_repeat_C1: -1,
    data_missing_C2: -1,
    data_quality_B: -1,
    data_quality_score: -1
  }));

  return Promise.resolve({
    res: {
      id: 1,
      color: '#123456',
      knw_name: '知识网络的名称',
      knw_description: '知识网络的描述',
      knw_intelligence_score: 69.23,
      recent_calculate_time: '2022-09-27 09:09:09',
      creation_time: '2022-09-27 09:09:09',
      update_time: '2022-09-27 09:09:09',
      total: data.length,
      graph_intelligence_list: data.slice((page - 1) * size, page * size)
    }
  });
};

export { knwIQGet };
