// 界面--权限映射表
// viewId 界面标识
// authorities 准入权限
const authMapping = [
  {
    viewId: 'admin', // 一些公共组件, 只有admin就能看到
    authorities: ['0-0']
  },
  {
    viewId: 'graph', // 一些公共组件, 只要是知识网络管理员就能看到
    authorities: ['0-0', '2-1', '2-2', '2-3', '2-4']
  },
  {
    viewId: 'edit-graph', // 编辑图谱
    authorities: ['0-0', '2-1', '2-2', '2-3']
  },
  {
    viewId: 'delete-graph', // 删除图谱
    authorities: ['0-0', '2-1']
  },
  {
    viewId: 'member-manage', // 成员管理
    authorities: ['0-0', '2-1', '2-2']
  },
  {
    viewId: 'advanced-search-config', // 高级搜索配置 增删改
    authorities: ['0-0', '2-1', '2-2', '2-3']
  },
  {
    viewId: 'source-manage', // 数据源 删、改、测试链接
    authorities: ['0-0', '2-1']
  },
  {
    viewId: 'source-copy', // 数据源 复制
    authorities: ['0-0', '2-1', '2-2', '2-3', '2-4']
  },
  {
    viewId: 'edit-otl', // 编辑本体
    authorities: ['0-0', '2-1', '2-2', '2-3']
  },
  {
    viewId: 'copy-otl', // 复制本体
    authorities: ['0-0', '2-1', '2-2', '2-3', '2-4']
  },
  {
    viewId: 'delete-otl', // 删除本体
    authorities: ['0-0', '2-1']
  },
  {
    viewId: 'task-manage', // 任务管理 运行、中止、删除、历史记录、图谱详情、错误报告详情
    authorities: ['0-0', '2-1', '2-2', '2-3']
  },
  {
    viewId: 'time-task', // 定时任务
    authorities: ['0-0', '2-1', '2-2', '2-3']
  }
];

export default authMapping;
