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
          useDs={this.props.useDs}
          setUseDs={this.props.setUseDs}
          ontoData={this.props.ontoData}
          setOntoData={this.props.setOntoData}
          current={this.props.current}
          graphId={this.props.graphId}
          ontologyId={this.props.ontologyId}
          getFlowCreateEntity={this.props.getFlowCreateEntity}
          childRef={this.props.childRef}
          setQuitVisible={this.props.setQuitVisible}
          graphName={this.props.graphName}
          setOntologyDes={this.props.setOntologyDes}
          ontology_des={this.props.ontology_des}
        />
      </div>
    );
  }
}

export default FlowCreateEntity;
