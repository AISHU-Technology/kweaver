import React, { Component } from 'react';
import G6Graph from './G6Graph';
import SideBar from './SideBar';
import './style.less';

class G6SearchGraph extends Component {
  state = {
    sideBarVisible: false,
    addE: false, // 是否探索边
    selectedNode: '', // 选中的节点
    count: 100, // 设置的探索数量, 1-200 默认100
    direction: 'inout', // 探索路径的方向
    lefSelect: 0, // 侧边信息
    showNodeProperty: {}, // 画布上实体的显示，同一类显示相同属性 默认显示的name属性
    showEdgeProperty: {}, // 画布上边的显示，同一类显示相同属性，默认显示name
    autoOpen: true // 是否自动展开侧边栏
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

  // 设置探索的数量
  setCount = count => {
    this.setState({
      count
    });
  };

  // 设置探索的实体间的方向
  setDirection = direction => {
    this.setState({
      direction
    });
  };

  // 修改类显示属性
  setShowNodeProperty = (item, type = 'node') => {
    const { showNodeProperty, showEdgeProperty } = this.state;
    const { nodes, edges } = this.props;

    if (type === 'node') {
      showNodeProperty[item.key] = item.value;
      this.setState({ showNodeProperty }, () => {
        this.props.G6GraphRef?.addNodes(nodes, edges, type);
      });
    }
    if (type === 'edge') {
      showEdgeProperty[item.key] = item.value;
      this.setState({ showEdgeProperty }, () => {
        this.props.G6GraphRef?.addNodes(nodes, edges, type);
      });
    }
  };

  // 更新显示
  changeLabel = (nodes, edges) => {
    const { nodeProperty, edgeProperty } = this.initShowProp(nodes, edges);
    const newNodes = nodes.map(item => {
      const classShowProp = nodeProperty[item.data.class];
      let label = item.data.name;
      let tag = 0;
      const { properties } = item.data;
      properties.forEach(i => {
        if (i.n === classShowProp) {
          label = i.v || '--';
          tag = 1;
        }
      });
      if (!tag) {
        label = item.data[classShowProp];
      }
      return {
        ...item,
        label: label?.length < 20 ? label : `${String(label)?.substring(0, 17)}...`
      };
    });

    const newEdges = edges.map(item => {
      const classShowProp = edgeProperty[item.class];
      let label = item.name;
      let tag = 0;
      item.properties.forEach(i => {
        if (i.n === classShowProp) {
          label = i.v || '--';
          tag = 1;
        }
      });
      if (!tag) {
        label = item[classShowProp];
      }

      return {
        ...item,
        label: label?.length < 20 ? label : `${String(label)?.substring(0, 17)}...`
      };
    });

    return { newNodes, newEdges };
  };

  // 初始化类的显示属性
  initShowProp = (nodes, edges) => {
    const { showNodeProperty, showEdgeProperty } = this.state;

    nodes.forEach(item => {
      const itemClass = item.class || item.data.class;

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
      autoOpen
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
      isCognitive
    } = this.props;
    return (
      <div className={`G6-search-graph ${className}`} id="newSeach#1">
        <div className="g6-graph-box">
          <G6Graph
            addE={addE} // 控制添加边
            setAddE={this.setAddE}
            G6GraphRef={G6GraphRef}
            setG6GraphRef={setG6GraphRef}
            nodes={nodes}
            edges={edges}
            selectGraph={selectGraph}
            updateGraphData={updateGraphData}
            selectedNode={selectedNode}
            sideBarVisible={sideBarVisible}
            setSelectedNode={this.setSelectedNode}
            setSearchVisible={setSearchVisible}
            reExplore={reExplore}
            isCognitive={isCognitive}
            changeLabel={this.changeLabel}
            count={count}
            setCount={this.setCount}
            direction={direction}
            setSideBarVisible={this.setSideBarVisible}
            setTabSelect={this.setTabSelect}
            autoOpen={autoOpen}
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
        />
      </div>
    );
  }
}

export default G6SearchGraph;
