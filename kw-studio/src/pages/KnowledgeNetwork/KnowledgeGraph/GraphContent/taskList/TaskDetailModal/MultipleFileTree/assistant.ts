export const convertToList = (str: string) => {
  const parts = str.split('/');
  const resultList: string[] = [];
  parts.reduce((prev, curr) => {
    const path = `${prev}/${curr}`;
    resultList.push(path);
    return path;
  }, 'gns:/');
  return resultList;
};

export const flatToArray = (flatData: any) => {
  const tree: any = [];
  const map = new Map();

  flatData.forEach((node: any) => {
    map.set(node.key, { ...node, children: [] });
  });

  flatData.forEach((node: any) => {
    if (node.parentKey) {
      map.get(node.parentKey).children.push(map.get(node.key));
    } else {
      tree.push(map.get(node.key));
    }
  });

  return tree;
};

/**
 * 更新树数据源
 */
export const updateTreeData = ({ treeDataSource, childNode, parentKey }: any) => {
  const loop = (data: any[]) => {
    data.forEach((node, index) => {
      if (node.key === parentKey) {
        node.children = childNode;
      } else {
        if (node.children && node.children.length > 0) {
          loop(node.children);
        }
      }
    });
  };
  loop(treeDataSource);
  return treeDataSource;
};