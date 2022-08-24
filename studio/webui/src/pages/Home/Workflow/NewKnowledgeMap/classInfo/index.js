/**
 * 类别配置信息
 */

import React, { Component } from 'react';

import NodeInfo from './nodeInfo';
import RalationInfo from './ralationInfo';
import './style.less';

class ClassInfo extends Component {
  state = {};

  /**
   * @description 选择点配置类型
   */
  selectedType = selectedElement => {
    if (selectedElement && typeof selectedElement.entity_id === 'number') return 'entity';
    if (selectedElement && typeof selectedElement.edge_id === 'number') return 'relation';
  };

  render() {
    const { selectedElement, mapEntity, nodes } = this.props;

    return (
      <div className="class-info">
        {this.selectedType(selectedElement) === 'entity' ? (
          <NodeInfo
            selectedElement={selectedElement}
            mapEntity={mapEntity}
            changeNodeInfo={this.props.changeNodeInfo}
            changeNodeType={this.props.changeNodeType}
            fromRelation={this.props.fromRelation}
            setSelectedElement={this.props.setSelectedElement}
            relationInfo={this.props.relationInfo}
            changeTab={this.props.changeTab}
          />
        ) : (
          <RalationInfo
            nodes={nodes}
            selectedElement={selectedElement}
            mapEntity={mapEntity}
            changeEdgeInfo={this.props.changeEdgeInfo}
            changeMoreFile={this.props.changeMoreFile}
            changeEdgeType={this.props.changeEdgeType}
            setSelectedElement={this.props.setSelectedElement}
            showButton={this.props.showButton}
            changeTab={this.props.changeTab}
          />
        )}
      </div>
    );
  }
}

export default ClassInfo;
