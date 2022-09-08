/**
 * 汇总信息
 */

import React, { Component } from 'react';
import intl from 'react-intl-universal';
import { CloseOutlined } from '@ant-design/icons';

import NodeFamily from './nodeFamily';
import EdgeFamily from './edgeFamily';

import './style.less';

class GatherList extends Component {
  state = {
    selectedTag: 'node'
  };

  componentDidMount() {
    this.props.onGatherListRef(this);

    this.props.setTouch(true);
  }

  changeSelectedTag = selectedTag => {
    this.setState({
      selectedTag
    });
  };

  render() {
    const { selectedTag } = this.state;

    return (
      <div className="new-gather-List">
        <div className="title">
          <div className="word">{[intl.get('createEntity.summary')]}</div>
          <div
            className="icon"
            onClick={() => {
              this.props.selectRightTool();
            }}
          >
            <CloseOutlined className="closed-icon" />
          </div>
        </div>

        <div className="head">
          <div
            className={selectedTag === 'node' ? 'node selected-tab' : 'node'}
            onClick={() => {
              this.changeSelectedTag('node');
            }}
          >
            <span>{[intl.get('createEntity.ect')]}</span>
            <span className="number">({this.props.nodes.length})</span>
          </div>

          <div
            className={selectedTag === 'line' ? 'line selected-tab' : 'line'}
            onClick={() => {
              this.changeSelectedTag('line');
            }}
          >
            <span>{[intl.get('createEntity.rct')]}</span>
            <span className="number">({this.props.edges.length})</span>
          </div>
        </div>

        <div>
          {selectedTag === 'node' ? (
            <NodeFamily
              nodes={this.props.nodes}
              edges={this.props.edges}
              freeGraphRef={this.props.freeGraphRef}
              onNodeFamilyRef={this.props.onNodeFamilyRef}
              selectRightTool={this.props.selectRightTool}
              setSelectedElement={this.props.setSelectedElement}
            />
          ) : (
            <EdgeFamily
              nodes={this.props.nodes}
              edges={this.props.edges}
              freeGraphRef={this.props.freeGraphRef}
              onEdgeFamilyRef={this.props.onEdgeFamilyRef}
              selectRightTool={this.props.selectRightTool}
              setSelectedElement={this.props.setSelectedElement}
            />
          )}
        </div>
      </div>
    );
  }
}

GatherList.defaultProps = {
  nodes: [],
  edges: [],
  onGatherListRef: () => {},
  setTouch: () => {}
};

export default GatherList;
