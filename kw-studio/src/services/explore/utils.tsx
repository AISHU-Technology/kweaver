interface Node {
  id: string;
  label?: string;
}

interface Edge {
  source: string;
  target: string;
  id: string;
  label?: string;
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
    const neighborsConverter = (edge: any) => {
      return edge.source === nodeId;
    };
    return currentEdges.filter(neighborsConverter).map(edge => ({ node: edge.target, edge: edge.id }));
  }
  if (type === 'source') {
    const neighborsConverter = (edge: any) => {
      return edge.target === nodeId;
    };
    return currentEdges.filter(neighborsConverter).map(edge => ({ node: edge.source, edge: edge.id }));
  }

  const neighborsConverter = (edge: any) => {
    return edge.source === nodeId ? { node: edge.target, edge: edge.id } : { node: edge.source, edge: edge.id };
  };
  return currentEdges.map(neighborsConverter);
};

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
  const edgePath: string[] = [];

  const visited = [start];
  const isVisited = { [start]: true };
  const stack: IVisitedNode[][] = [];
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
