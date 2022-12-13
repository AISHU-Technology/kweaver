/**
 * 类别汇总

 */

import React, { Component } from 'react';
import intl from 'react-intl-universal';
import Entity from './entity';
import Relation from './relation';
import './style.less';

class ClassMuster extends Component {
  state = {
    tabSelected: 'entity'
  };

  /**
   * @description 选择展示类别信息
   */
  selectTag = tabSelected => {
    this.setState({ tabSelected });
  };

  render() {
    const { tabSelected } = this.state;
    const { nodes, edges, current, selectedElement } = this.props;

    return (
      <div className="class-muster-content">
        <div className="title">{[intl.get('workflow.knowledge.configList')]}</div>

        <div className="change-tab">
          <div
            className={tabSelected === 'entity' ? 'entity tab-selected' : 'entity'}
            onClick={e => {
              e.stopPropagation();
              this.selectTag('entity');
            }}
          >
            <span>{[intl.get('createEntity.ect')]}</span>
            <span className="count">{`(${nodes.length})`}</span>
          </div>
          <div
            className={tabSelected === 'relation' ? 'relation tab-selected' : 'relation'}
            onClick={() => this.selectTag('relation')}
          >
            <span>{[intl.get('createEntity.rct')]}</span>
            <span className="count">{`(${edges.length})`}</span>
          </div>
        </div>

        <div className={tabSelected === 'entity' ? 'muster-info' : 'display-none'}>
          <Entity
            nodes={nodes}
            current={current}
            selectedElement={selectedElement}
            setSelectedElement={this.props.setSelectedElement}
          />
        </div>

        <div className={tabSelected === 'relation' ? 'muster-info' : 'display-none'}>
          <Relation
            nodes={nodes}
            edges={edges}
            current={current}
            selectedElement={selectedElement}
            setSelectedElement={this.props.setSelectedElement}
            saveInfo={this.props.saveInfo}
          />
        </div>
      </div>
    );
  }
}

export default ClassMuster;
