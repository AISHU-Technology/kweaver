/**
 * 触发子图选中
 * @param groupShape 子图类实例
 * @param graph 图谱实例
 */
export const triggerSelect = (groupShape: any, graph: any) => {
  // 路径直接点击其中的任意 点、边 元素
  if (groupShape.cfg?.info?.groupType === 'path') {
    const shape = graph?.current?.__selectedNode;
    return graph?.current?.emit(`${shape?.get('type')}:click`, { item: shape, targetPath: groupShape });
  }

  const pathShape = groupShape.group?.get('children')?.[0];
  if (!pathShape) return;
  graph?.current?.emit('click', { target: pathShape });
};

/**
 * 触发子图悬停
 * @param groupShape 子图类实例
 * @param graph 图谱实例
 */
export const triggerHover = (groupShape: any, graph: any, isHover: boolean) => {
  // 路径直接悬停其中的任意 点、边 元素
  if (groupShape.cfg?.info?.groupType === 'path') {
    const shape = graph?.current?.__selectedNode;
    if (!isHover) {
      return graph?.current?.emit(`${shape?.get('type')}:mouseleave`, { item: shape });
    }
    return graph?.current?.emit(`${shape?.get('type')}:mouseenter`, { item: shape, targetPath: groupShape });
  }

  if (!isHover) return graph?.current?.emit('mousemove', { target: {} });
  const pathShape = groupShape.group?.get('children')?.[0];
  if (!pathShape) return;
  graph?.current?.emit('mousemove', { target: pathShape });
};
