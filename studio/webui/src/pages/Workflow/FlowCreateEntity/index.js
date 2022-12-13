import React, { Component } from 'react';
import GraphG6 from './GraphG6';
// import CreateEntity from '../FlowCreateEntity copy/CreateEntity';
import './style.less';

class FlowCreateEntity extends Component {
  render() {
    return (
      <div>
        {/* <CreateEntity
          next={this.props.next}
          prev={this.props.prev}
          dbType={this.props.dbType}
          osId={this.props.osId}
          useDs={this.props.useDs}
          setUseDs={this.props.setUseDs}
          ontoData={this.props.ontoData}
          current={this.props.current}
          graphId={this.props.graphId}
          ontologyId={this.props.ontologyId}
          getFlowCreateEntity={this.props.getFlowCreateEntity}
          childRef={this.props.childRef}
          setQuitVisible={this.props.setQuitVisible}
          graphName={this.props.graphName}
        />
        <div style={{ width: '100%', height: 1, backgroundColor: '#000' }} /> */}
        <GraphG6
          childRef={this.props.childRef}
          next={this.props.next}
          prev={this.props.prev}
          osId={this.props.osId}
          dbType={this.props.dbType}
          current={this.props.current}
          graphId={this.props.graphId}
          ontoData={this.props.ontoData}
          graphName={this.props.graphName}
          ontologyId={this.props.ontologyId}
        />
      </div>
    );
  }
}

export default FlowCreateEntity;
