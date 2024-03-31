interface Node {
  id: string;
  label?: string;
  // 其他节点属性...
}

interface Edge {
  source: string;
  target: string;
  id: string;
  label?: string;
  // 其他边属性...
}

interface GraphinData {
  nodes: Node[];
  edges: Edge[];
}

type IVisitedNode = {
  node: string;
  edge: string;
};

const localGetNeighbors = (
  nodeId: string,
  edges: any[] = [],
  type?: 'target' | 'source' | undefined
): IVisitedNode[] => {
  const currentEdges = edges.filter(edge => edge.source === nodeId || edge.target === nodeId);
  if (type === 'target') {
    // 当前节点为 source，它所指向的目标节点
    const neighborsConverter = (edge: any) => {
      return edge.source === nodeId;
    };
    return currentEdges.filter(neighborsConverter).map(edge => ({ node: edge.target, edge: edge.id }));
  }
  if (type === 'source') {
    // 当前节点为 target，它所指向的源节点
    const neighborsConverter = (edge: any) => {
      return edge.target === nodeId;
    };
    return currentEdges.filter(neighborsConverter).map(edge => ({ node: edge.source, edge: edge.id }));
  }

  // 若未指定 type ，则返回所有邻居
  const neighborsConverter = (edge: any) => {
    return edge.source === nodeId ? { node: edge.target, edge: edge.id } : { node: edge.source, edge: edge.id };
  };
  return currentEdges.map(neighborsConverter);
};

// ----------- 分隔线 antv/g6 findAllPath方法改造 返回点和边的路径id
const localFindAllPath = (graphData: GraphinData, start: string, end: string, directed?: boolean) => {
  if (start === end) {
    const edges = graphData.edges.filter(edge => edge?.source === start && edge?.target === end);
    const allNodePath = new Array(edges.length).fill([start, start]);
    const allEdgePath = edges.map(edge => [edge.id]);
    return {
      allNodePath,
      allEdgePath
    };
  }
  const { edges = [] } = graphData;
  // 与节点绑定的边
  const edgePath: string[] = [];

  const visited = [start];
  const isVisited = { [start]: true };
  const stack: IVisitedNode[][] = []; // 辅助栈，用于存储访问过的节点的邻居节点
  const allPath = [];
  const allEdgePath: string[][] = [];
  let neighbors = directed ? localGetNeighbors(start, edges, 'target') : localGetNeighbors(start, edges);
  stack.push(neighbors);

  while (visited.length > 0 && stack.length > 0) {
    const children = stack[stack.length - 1];
    if (children.length) {
      const child = children.shift();
      if (child) {
        visited.push(child.node);
        edgePath.push(child.edge);
        isVisited[child.node] = true;
        neighbors = directed ? localGetNeighbors(child.node, edges, 'target') : localGetNeighbors(child.node, edges);
        stack.push(neighbors.filter(neighbor => !isVisited[neighbor.node]));
      }
    } else {
      const node = visited.pop() as string;
      edgePath.pop();
      isVisited[node] = false;
      stack.pop();
      // eslint-disable-next-line no-continue
      continue;
    }

    if (visited[visited.length - 1] === end) {
      const path = visited.map(node => node);
      allPath.push(path);
      allEdgePath.push([...edgePath]);
      const node = visited.pop() as string;
      edgePath.pop();
      isVisited[node] = false;
      stack.pop();
    }
  }

  return { allNodePath: allPath, allEdgePath };
};

export { localFindAllPath };
