const mockIQList = (() => {
  const data = Array.from({ length: 3 }, (_, i) => ({
    graph_id: i + 54,
    graph_config_id: i + 1,
    graph_name: `图谱${i + 1}`,
    calculate_status: i ? 'CALCULATED' : 'CALCULATED',
    last_task_message: '',
    last_task_time: '2022-01-01 00:00:00',
    data_repeat_C1: i - 1,
    data_missing_C2: i - 1,
    data_quality_B: i - 1,
    data_quality_score: i - 1
  }));
  return {
    res: {
      id: 1,
      color: '#123456',
      knw_name: '知识网络的名称',
      knw_description: '知识网络的描述',
      intelligence_score: 66.66,
      recent_calculate_time: '2022-01-01 00:00:00',
      creation_time: '2022-01-01 00:00:00',
      update_time: '2022-01-01 00:00:00',
      total: data.length,
      graph_intelligence_list: data
    }
  };
})();

export { mockIQList };
