import React, { Component } from 'react';
import OntoGraphG6 from '../../../OntologyLibrary/OntoCanvas/OntoG6';

class FlowCreateEntity extends Component {
  render() {
    return (
      <OntoGraphG6
        childRef={this.props.childRef}
        knData={this.props.knData}
        osId={this.props.osId}
        dbType={this.props.dbType}
        current={this.props.current}
        canShowCanvas={this.props.current === 2}
        graphId={this.props.graphId}
        ontoData={this.props.ontoData.length ? this.props.ontoData[0] : this.props.ontoData}
        ontologyId={this.props.ontologyId}
        setOntoData={this.props.setOntoData}
        ontoLibType={''}
        onExit={() => {}}
        next={this.props.next}
        prev={this.props.prev}
        onSave={this.props.onSave}
        defaultParsingRule={this.props.defaultParsingRule}
        setDefaultParsingRule={this.props.setDefaultParsingRule}
        sourceFileType={this.props.sourceFileType}
        setSourceFileType={this.props.setSourceFileType}
        parsingTreeChange={this.props.parsingTreeChange}
        setParsingTreeChange={this.props.setParsingTreeChange}
      />
    );
  }
}

export default FlowCreateEntity;
