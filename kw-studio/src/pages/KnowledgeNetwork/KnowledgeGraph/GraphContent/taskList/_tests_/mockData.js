const taskList = {
  res: {
    df: [
      {
        graph_name: '123',
        graph_id: 1,
        task_status: 'normal',
        task_id: 1,
        task_type: 'full',
        trigger_type: 1,
        effective_storage: true
      },
      {
        graph_name: '123',
        graph_id: 1,
        task_status: 'running',
        task_id: 2,
        task_type: 'full',
        trigger_type: 0,
        effective_storage: true
      },
      {
        graph_name: '123',
        graph_id: 1,
        task_status: 'waiting',
        task_id: 3,
        task_type: 'full',
        trigger_type: 2,
        effective_storage: true
      },
      {
        graph_name: '123',
        graph_id: 1,
        task_stgraph_graph_nameatus: 'failed',
        task_id: 4,
        task_type: 'full',
        trigger_type: 3,
        effective_storage: true
      },
      {
        graph_name: '123',
        graph_id: 1,
        task_status: 'stop',
        task_id: 5,
        task_type: 'increment',
        trigger_type: 3,
        effective_storage: true
      }
    ],
    count: 6
  }
};

export { taskList };
