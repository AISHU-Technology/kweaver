/**
 * @description 搜索图谱页面
 * @author Eden
 * @date 2022/01/05
 */

import React, { Component } from 'react';
import G6Graph from './G6Graph';
import SideBar from './SideBar';
import './style.less';

class G6SearchGraph extends Component {
  state = {
    sideBarVisible: false,
    addE: false, // Whether to explore edges
    selectedNode: '', // selected node
    count: 100, // Set the number of explorations, 1-200 default 100
    direction: 'positive', // Explore the direction of the path
    lefSelect: 0, // sidebar information
    showNodeProperty: {}, // Display of entities on canvas，The same class displays the same properties，Display name by default
    showEdgeProperty: {}, // Display of edges on canvas，The same class displays the same properties，Display name by default
    autoOpen: true, // Whether to automatically expand the sidebar
    startNode: '',
    endNode: '',
    pathList: { data: [], count: 0 }, // Save path information
    pathType: 1, // shortest or longest path
    selectedPath: {}, // Select the highlighted path
    isExplorePath: false, // path exploration
    pathLoading: false
  };

  /**
   * @description 侧边栏展示
   */
  setSideBarVisible = sideBarVisible => {
    this.setState({
      sideBarVisible
    });
  };

  /**
   * 关闭自动打开的功能
   */
  setAutoOpen = () => {
    this.setState({
      autoOpen: false
    });
  };

  /**
   * 设置起点
   */
  setStartNode = startNode => {
    this.setState({
      startNode
    });
  };

  /**
   * 设置终点
   */
  setEndNode = endNode => {
    this.setState({
      endNode
    });
  };

  /**
   * 选择侧边板块
   */
  setTabSelect = e => {
    this.setState({
      lefSelect: e
    });
  };

  /**
   * @description 探索边状态
   */
  setAddE = addE => {
    this.setState({
      addE
    });
  };

  /**
   * @description 设置选中节点
   */
  setSelectedNode = selectedNode => {
    this.setState({
      selectedNode
    });
  };

  // Set the number of explorations
  setCount = count => {
    this.setState({
      count
    });
  };

  // Set the direction of exploration between entities
  setDirection = direction => {
    this.setState({
      direction
    });
  };

  // Modify class display properties
  setShowNodeProperty = (item, type = 'node') => {
    const { showNodeProperty, showEdgeProperty } = this.state;
    const { nodes, edges } = this.props;

    if (type === 'node') {
      showNodeProperty[item.key] = item.value;
      this.setState({ showNodeProperty }, () => {
        this.props.G6GraphRef?.addNodes(nodes, edges, true);
      });
    }
    if (type === 'edge') {
      showEdgeProperty[item.key] = item.value;
      this.setState({ showEdgeProperty }, () => {
        this.props.G6GraphRef?.addNodes(nodes, edges, true);
      });
    }
  };

  // Update display
  changeLabel = (nodes, edges) => {
    const { nodeProperty, edgeProperty } = this.initShowProp(nodes, edges);
    const newNodes = nodes.map(item => {
      const classShowProp = nodeProperty[item.data.class];
      let label = item?.data?.name;
      let tag = 0;
      const { properties } = item?.data;
      properties.forEach(i => {
        if (i.n === classShowProp) {
          label = i.v || '--';
          tag = 1;
        }
      });
      if (!tag) {
        label = item?.data[classShowProp];
      }
      return {
        ...item,
        label: label?.length < 20 ? label : `${String(label)?.substring(0, 17)}...`
      };
    });

    const newEdges = edges.map(item => {
      const classShowProp = edgeProperty[item.class];
      let label = item?.name;
      let tag = 0;
      item?.properties.forEach(i => {
        if (i.n === classShowProp) {
          label = i.v || '--';
          tag = 1;
        }
      });
      if (!tag) {
        label = item[classShowProp] || '--';
      }

      return {
        ...item,
        label: label?.length < 20 ? label : `${String(label)?.substring(0, 17)}...`
      };
    });

    return { newNodes, newEdges };
  };

  // Initialize the display properties of the class
  initShowProp = (nodes, edges) => {
    const { showNodeProperty, showEdgeProperty } = this.state;

    nodes.forEach(item => {
      const itemClass = item?.class || item?.data?.class;

      if (!(itemClass in showNodeProperty)) {
        showNodeProperty[itemClass] = 'name';
      }
    });

    edges.forEach(item => {
      const itemClass = item.class;

      if (!(itemClass in showEdgeProperty)) {
        showEdgeProperty[itemClass] = 'name';
      }
    });

    this.setState({
      showNodeProperty,
      showEdgeProperty
    });

    return { nodeProperty: showNodeProperty, edgeProperty: showEdgeProperty };
  };

  // Setting type
  setType = type => {
    this.setState({
      pathType: type
    });
  };

  // Update path list
  setPathList = list => {
    this.setState({
      pathList: list
    });
  };

  // Add data to the canvas
  addGraphData = (nodes, edges) => {
    this.props.G6GraphRef?.addNodes(nodes, edges);
  };

  // Set selected highlighted path
  setSelectedPath = paths => {
    this.setState({
      selectedPath: paths
    });
  };

  // Change path exploration status
  setIsExplorePath = isExplorePath => {
    this.setState({
      isExplorePath
    });
  };

  /**
   * @description 设置路径探索loading状态
   */
  setPathLoading = pathLoading => {
    this.setState({
      pathLoading
    });
  };

  render() {
    const {
      sideBarVisible,
      addE,
      selectedNode,
      lefSelect,
      count,
      direction,
      showNodeProperty,
      showEdgeProperty,
      autoOpen,
      startNode,
      endNode,
      pathList,
      pathType,
      isExplorePath,
      pathLoading,
      selectedPath
    } = this.state;
    const {
      setSearchVisible,
      setG6GraphRef,
      G6GraphRef,
      nodes,
      edges,
      selectGraph,
      updateGraphData,
      className,
      reExplore,
      isCognitive,
      searchVisible
    } = this.props;
    return (
      <div className={`G6-search-graph ${className}`} id="newSeach#1">
        <div className="g6-graph-box">
          <G6Graph
            addE={addE}
            setAddE={this.setAddE}
            G6GraphRef={G6GraphRef}
            setG6GraphRef={setG6GraphRef}
            nodes={nodes}
            edges={edges}
            selectGraph={selectGraph}
            updateGraphData={updateGraphData}
            selectedNode={selectedNode}
            sideBarVisible={sideBarVisible}
            setSearchVisible={setSearchVisible}
            reExplore={reExplore}
            isCognitive={isCognitive}
            count={count}
            direction={direction}
            autoOpen={autoOpen}
            endNode={endNode}
            startNode={startNode}
            lefSelect={lefSelect}
            pathList={pathList}
            setSelectedNode={this.setSelectedNode}
            setCount={this.setCount}
            changeLabel={this.changeLabel}
            setTabSelect={this.setTabSelect}
            setSideBarVisible={this.setSideBarVisible}
            setStartNode={this.setStartNode}
            setEndNode={this.setEndNode}
            setDirection={this.setDirection}
            setPathList={this.setPathList}
            pathType={pathType}
            setType={this.setType}
            setIsExplorePath={this.setIsExplorePath}
            setPathLoading={this.setPathLoading}
            selectedPath={selectedPath}
          />
        </div>

        <SideBar
          sideBarVisible={sideBarVisible}
          setSideBarVisible={this.setSideBarVisible}
          nodes={nodes}
          edges={edges}
          G6GraphRef={G6GraphRef}
          selectedNode={selectedNode}
          showEdgeProperty={showEdgeProperty}
          showNodeProperty={showNodeProperty}
          setShowNodeProperty={this.setShowNodeProperty}
          setTabSelect={this.setTabSelect}
          lefSelect={lefSelect}
          setAutoOpen={this.setAutoOpen}
          endNode={endNode}
          startNode={startNode}
          setStartNode={this.setStartNode}
          setEndNode={this.setEndNode}
          setPathList={this.setPathList}
          selectGraph={selectGraph}
          addGraphData={this.addGraphData}
          pathList={pathList}
          direction={direction}
          setDirection={this.setDirection}
          pathType={pathType}
          setType={this.setType}
          setSelectedPath={this.setSelectedPath}
          isExplorePath={isExplorePath}
          setIsExplorePath={this.setIsExplorePath}
          setPathLoading={this.setPathLoading}
          pathLoading={pathLoading}
          isCognitive={isCognitive}
          searchVisible={searchVisible}
        />
      </div>
    );
  }
}

export default G6SearchGraph;
