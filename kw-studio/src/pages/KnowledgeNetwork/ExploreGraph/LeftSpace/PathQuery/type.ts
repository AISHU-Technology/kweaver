export type TypeFilter = {
  path_type: 0 | 1 | 2; // 是否为最短路径
  searchScope: 'graph' | 'canvas'; // 搜索范围
  steps: number; // 步长
  direction: string; // 路径方向
  path_decision?: string; // 权重维度
  edges?: any; // 边类
  property?: string; // 权重属性
  default_value?: number; // 属性值默认值
};

export type TypePathProps = {
  leftDrawerKey: string; // 侧边选中key
  selectedItem: any; // 画布数据
  classData: any; // 当前画布绑定图谱本体数据
  onChangeData: (data: any) => void; // 跟新画布数据
  onCloseLeftDrawer: (data?: any) => void; // 关闭左侧页面
  setSelectNodes: (data: any) => void; // 更新选中的数据
  onCloseRightDrawer: () => void; // 关闭右侧弹窗
};
