// 添加数据
export type ItemAdd = {
  type: 'node' | 'edge' | string;
  items: Record<string, any>[];
  from?: 'entity' | 'edge' | 'model' | 'task' | string;
};

// 删除的数据
export type ItemDelete = {
  type: 'node' | 'edge' | string;
  items: string[];
};

// 更新点或边的数据
export type ItemUpdate = {
  type: 'node' | 'edge' | 'all' | string;
  items: any[];
};

// 更新图数据
export type UpdateGraphData = {
  operation: 'add' | 'update' | 'delete' | string;
  updateData: ItemUpdate;
};

// 选中数据
export type ItemSelected = Record<string, any> | undefined;
