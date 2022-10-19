import React, { Component } from 'react';

import CreateEntity from './CreateEntity';

import './style.less';

class FlowCreateEntity extends Component {
  render() {
    return (
      <div>
        <CreateEntity
          next={this.props.next}
          prev={this.props.prev}
          dbType={this.props.dbType}
          osId={this.props.osId}
          useDs={this.props.useDs}
          setUseDs={this.props.setUseDs}
          ontoData={this.props.ontoData}
          setOntoData={this.props.setOntoData}
          current={this.props.current}
          graphId={this.props.graphId}
          getFlowCreateEntity={this.props.getFlowCreateEntity}
          childRef={this.props.childRef}
          setQuitVisible={this.props.setQuitVisible}
        />
      </div>
    );
  }
}

export default FlowCreateEntity;
