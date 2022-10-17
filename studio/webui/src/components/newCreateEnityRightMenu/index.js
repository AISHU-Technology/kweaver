import React, { Component } from 'react';
import TaskList from './taskList';
import GatherList from './gatherList';
import DataInfo from './dataInfo';
import './style.less';

class NewCreateEnityRightMenu extends Component {
  render() {
    const { rightSelect, selectedElement } = this.props;

    return (
      <div className="new-create-entity-right-menu">
        {rightSelect === 'taskList' ? (
          <TaskList
            selectRightTool={this.props.selectRightTool}
            ontology_id={this.props.ontology_id}
            ontologyId={this.props.ontologyId}
            nodes={this.props.nodes}
            edges={this.props.edges}
            freeGraphRef={this.props.freeGraphRef}
            selectedElement={this.props.selectedElement}
            setSelectedElement={this.props.setSelectedElement}
            onTaskListRef={this.props.onTaskListRef}
            used_task={this.props.used_task}
            setUsedTask={this.props.setUsedTask}
            setTouch={this.props.setTouch}
          />
        ) : null}

        {rightSelect === 'gatherList' ? (
          <GatherList
            nodes={this.props.nodes}
            edges={this.props.edges}
            freeGraphRef={this.props.freeGraphRef}
            selectRightTool={this.props.selectRightTool}
            onNodeFamilyRef={this.props.onNodeFamilyRef}
            onEdgeFamilyRef={this.props.onEdgeFamilyRef}
            onGatherListRef={this.props.onGatherListRef}
            setSelectedElement={this.props.setSelectedElement}
            setTouch={this.props.setTouch}
          />
        ) : null}

        {rightSelect === 'dataInfo' ? (
          <DataInfo
            nodes={this.props.nodes}
            edges={this.props.edges}
            dbType={this.props.dbType}
            selectRightTool={this.props.selectRightTool}
            freeGraphRef={this.props.freeGraphRef}
            selectedElement={selectedElement}
            setEdges={this.props.setEdges}
            onDataInfoRef={this.props.onDataInfoRef}
            setSelectedElement={this.props.setSelectedElement}
            checkSaveData={this.props.checkSaveData}
            cancelSource={this.props.cancelSource}
            setTouch={this.props.setTouch}
          />
        ) : null}
      </div>
    );
  }
}

export default NewCreateEnityRightMenu;
