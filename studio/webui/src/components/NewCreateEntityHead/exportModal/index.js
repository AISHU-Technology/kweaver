import React, { Component } from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import EntityImport from './entityImport';
import ModelImport from './modelImport';
import SourceImport from './sourceImport';
import './style.less';

class ExportModal extends Component {
  state = {
    selectedTag: 'entity',
    selectLoadingTop: false
  };

  /**
   * @description 开启加载动画
   */
  openLoading = () => {
    this.setState({
      selectLoadingTop: true
    });
  };

  /**
   * @description 关闭
   */
  closedLoading = () => {
    this.setState({
      selectLoadingTop: false
    });
  };

  /**
   * @description  选择导入类型
   */
  getTabContent = type => {
    if (type === 'entity') {
      return (
        <EntityImport
          saveData={this.props.saveData}
          setSaveData={this.props.setSaveData}
          openLoading={this.openLoading}
          closedLoading={this.closedLoading}
        />
      );
    }

    if (type === 'source') {
      return (
        <SourceImport
          saveData={this.props.saveData}
          setSaveData={this.props.setSaveData}
          graphId={this.props.graphId}
          openLoading={this.openLoading}
          closedLoading={this.closedLoading}
        />
      );
    }

    if (type === 'model') {
      return <ModelImport saveData={this.props.saveData} setSaveData={this.props.setSaveData} />;
    }
  };

  setTitle = () => {
    const { selectedTag } = this.state;

    if (selectedTag === 'entity') {
      return [intl.get('createEntity.selectO')];
    }

    if (selectedTag === 'source') {
      return [intl.get('createEntity.dataName')];
    }

    if (selectedTag === 'model') {
      return [intl.get('createEntity.selectModel')];
    }
  };

  render() {
    const { selectedTag, selectLoadingTop } = this.state;

    return (
      <div className="export-modal">
        <div className="side-bar">
          <div
            className={selectedTag === 'entity' ? 'tag tag-selected' : 'tag'}
            onClick={() => {
              this.setState({
                selectedTag: 'entity'
              });
            }}
          >
            {selectedTag === 'entity' ? <div className="left-mark"></div> : null}
            {[intl.get('createEntity.ontologyImport')]}
          </div>

          <div
            className={selectedTag === 'source' ? 'tag tag-selected' : 'tag'}
            onClick={() => {
              this.setState({
                selectedTag: 'source'
              });
            }}
          >
            {selectedTag === 'source' ? <div className="left-mark"></div> : null}
            {[intl.get('createEntity.dataSourceImport')]}
          </div>

          <div
            className={selectedTag === 'model' ? 'tag tag-selected' : 'tag'}
            onClick={() => {
              this.setState({
                selectedTag: 'model'
              });
            }}
          >
            {selectedTag === 'model' ? <div className="left-mark"></div> : null}
            {[intl.get('createEntity.modelImport')]}
          </div>
        </div>

        <div className="content">
          <div className="title">{this.setTitle()}</div>
          <div className="srcoll-box">{this.getTabContent(selectedTag)}</div>
        </div>

        {selectLoadingTop ? (
          <div className="loading-4qwaqq">
            <LoadingOutlined className="icon" />
          </div>
        ) : null}
      </div>
    );
  }
}

export default ExportModal;
