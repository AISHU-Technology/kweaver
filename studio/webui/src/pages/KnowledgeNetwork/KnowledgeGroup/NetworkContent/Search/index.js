import React, { Component } from 'react';
import { Drawer, Button } from 'antd';
import intl from 'react-intl-universal';

import IconFont from '@/components/IconFont';
import G6SearchGraph from '@/components/G6SearchGraph';

import SearchUI from './SearchUI';
import './style.less';

class Search extends Component {
  state = {
    searchVisible: true, // 搜索界面可见性
    nodes: [], // 已渲染的点
    edges: [], // 已渲染的边
    selectGraph: {}, // 选择的图谱
    selectClass: {}, // 选择的点类
    G6GraphRef: null // // G6组件模块
  };

  componentDidMount() {
    document.title = `${intl.get('search.exploreTitle')}_KWeaver`;
  }

  componentDidUpdate(preProps) {
    if (preProps.selectedGraph !== this.props.selectedGraph) {
      this.onGraphChange();
    }
  }

  /**
   * 点击加入探索
   * @param {Array} values 勾选的数据
   * @param {Boolean} isAdd 是否是新增, 若已存在则直接打开画布选择该节点
   */
  onToExplore = (values, isAdd = true) => {
    this.setState({ searchVisible: false });

    if (!isAdd) {
      this.state.G6GraphRef?.outSideSelect(values[0]);

      return;
    }

    const newValues = values.map(item => ({
      data: item,
      id: item.id,
      label: item.name.length < 20 ? item.name : `${item.name.substring(0, 17)}...`,
      x: this.state.G6GraphRef?.ref?.current.scrollWidth / 2 + Math.random() * 100,
      y: this.state.G6GraphRef?.ref?.current.scrollHeight / 2 + Math.random() * 100,
      style: {
        fill: item.expand ? item.color || '#126ee3' : '',
        stroke: 'white'
      }
    }));

    const newNodes = [...this.state.nodes, ...newValues];
    // 修改实体显示

    setTimeout(() => {
      // const updateNode = this.state.G6GraphRef?.props.changeLabel(newNodes, this.state.edges, 'node');
      this.state.G6GraphRef?.addNodes(newNodes, this.state.edges);
      this.updateGraphData({ nodes: newNodes });
    }, 300);
  };

  /**
   * 切换图谱后的回调
   * @param {Object} graph 图谱
   */
  onGraphChange = graph => {
    this.state.G6GraphRef?.clearAll();
  };

  // 搜索界面视图控制
  setSearchVisible = bool => this.setState({ searchVisible: bool });

  // 更新图谱
  setGraph = obj => this.setState({ selectGraph: obj });

  // 更新点类
  setClass = obj => this.setState({ selectClass: obj });

  /**
   * @description 获取G6组件
   */
  setG6GraphRef = ref => {
    this.setState({
      G6GraphRef: ref
    });
  };

  /**
   * @description 更新点边数据
   */
  updateGraphData = ({ nodes = this.state.nodes, edges = this.state.edges }, fuc) => {
    this.setState(
      {
        nodes,
        edges
      },
      () => {
        fuc && fuc();
      }
    );
  };

  render() {
    const { searchVisible, nodes, edges, selectGraph, selectClass, G6GraphRef } = this.state;
    const { history, selectedGraph } = this.props;

    return (
      <div className="new-search">
        <SearchUI
          history={history}
          visible={searchVisible}
          nodes={nodes}
          selectGraph={selectGraph}
          selectClass={selectClass}
          setVisible={this.setSearchVisible}
          setGraph={this.setGraph}
          setClass={this.setClass}
          onGraphChange={this.onGraphChange}
          onToExplore={this.onToExplore}
          selectedGraph={selectedGraph}
        />
        <Drawer
          visible={!searchVisible}
          closable={false}
          title={null}
          footer={null}
          mask={false}
          push={false}
          // zIndex={520}
          height={'100vh'}
          placement="bottom"
          onClose={() => this.setState({ searchVisible: true })}
          bodyStyle={{ padding: 0 }}
          // className={searchVisible ? 'hide-graph' : ''}
        >
          <div className="search-graph-head">
            <Button
              type="default"
              className="back-btn"
              onClick={() => {
                this.setSearchVisible(true);
              }}
            >
              <IconFont type="icon-shangfanye" className="back-icon" />
              <span className="back-btn-text">{intl.get('global.back')}</span>
            </Button>
          </div>
          <G6SearchGraph
            setSearchVisible={this.setSearchVisible} // 搜索模块展示
            setG6GraphRef={this.setG6GraphRef}
            G6GraphRef={G6GraphRef}
            nodes={nodes}
            edges={edges}
            selectGraph={selectGraph}
            selectedGraph={selectedGraph}
            updateGraphData={this.updateGraphData}
          />
        </Drawer>
      </div>
    );
  }
}

export default Search;
