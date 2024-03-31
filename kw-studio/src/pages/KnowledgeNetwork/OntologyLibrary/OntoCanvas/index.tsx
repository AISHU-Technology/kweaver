import _ from 'lodash';
import React, { Component } from 'react';
import OntoGraphG6 from './OntoG6';
import TopBar from './OntoG6/TopBar';
import intl from 'react-intl-universal';
import servicesCreateEntity from '@/services/createEntity';

import './style.less';

class OntoLibG6 extends Component<any> {
  state = {
    saveOntoData: { ontologyName: '', domainArray: [], ontologyDescribe: '' },
    otlId: ''
  };

  componentDidMount() {
    this.initData();
  }

  componentWillUnmount(): void {
    const { showQuitTip } = this.props;
    showQuitTip.current = false;
  }

  getOtls = async () => {
    const { knData } = this.props;
    const OntologyData = {
      knw_id: knData.id,
      page: -1,
      size: 10,
      rule: 'update',
      order: 'desc',
      search: '',
      filter: ''
    };
    const { filter, ...importData } = OntologyData;
    const { res } = (await servicesCreateEntity.getAllNoumenon(filter ? OntologyData : importData)) || [];
    if (res.count) {
      return res.otls;
    }
  };

  getCopyName = (name: string, otlsArr: any): any => {
    const filterArr = _.filter(otlsArr, otl => otl.ontology_name === name);
    if (filterArr.length) {
      return this.getCopyName(name + intl.get('ontoLib.areCopy'), otlsArr);
    }
    return name;
  };

  initData = async () => {
    const { ontoLibType, ontoLibData } = this.props;
    switch (ontoLibType) {
      // case 'create': {
      //   const temp = { ...ontoLibData, ontologyName: intl.get('ontoLib.unnamed') };
      //   this.setState({ saveOntoData: temp });
      //   break;
      // }
      case 'create':
      case 'edit':
      case 'import':
      case 'copy':
      case 'view': {
        const temp = { ...ontoLibData, ontologyName: ontoLibData.ontologyName };
        this.setState({ saveOntoData: temp });
        break;
      }
      // case 'copy': {
      //   const dataArr = await this.getOtls();
      //   const copyedName = this.getCopyName(`${ontoLibData.ontologyName}` + intl.get('ontoLib.areCopy'), dataArr);
      //   const temp = {
      //     ...ontoLibData,
      //     ontologyName: copyedName
      //   };
      //   this.setState({ saveOntoData: temp });
      //   break;
      // }
      default:
        break;
    }
  };

  setSaveOntoData = (data: any) => {
    this.setState({ saveOntoData: data });
  };

  setOtlId = (id: string) => {
    this.setState({ otlId: id });
  };

  render() {
    const {
      current,
      osId,
      dbType,
      graphId,
      ontoData,
      ontologyId,
      setOntoData,
      knData,
      onExit,
      canShowCanvas,
      ontoLibType,
      showQuitTip,
      defaultParsingRule,
      parsingTreeChange,
      setParsingTreeChange,
      sourceFileType,
      setSourceFileType,
      setDefaultParsingRule
    } = this.props;

    const { saveOntoData } = this.state;

    const onExitClick = () => {
      onExit();
    };

    return (
      <div className="canvasOntoRoot kw-flex-column" style={{ display: canShowCanvas ? 'inline-flex' : 'none' }}>
        <div className="onto-work-flow-header">
          {osId !== '' && (
            <TopBar
              current={current}
              onExit={onExitClick}
              saveOntoData={saveOntoData}
              setSaveOntoData={this.setSaveOntoData}
              ontoLibType={ontoLibType}
              otlId={this.state.otlId}
            />
          )}
        </div>

        {this.state.saveOntoData.ontologyName !== '' && (
          <OntoGraphG6
            knData={knData}
            osId={osId}
            dbType={dbType}
            current={current}
            canShowCanvas={canShowCanvas}
            graphId={graphId}
            ontoData={ontoData}
            ontologyId={ontologyId}
            setOntoData={setOntoData}
            ontoLibType={ontoLibType}
            onExit={onExitClick}
            saveOntoData={saveOntoData}
            showQuitTip={showQuitTip}
            setSaveOntoData={this.setSaveOntoData}
            setOtlId={this.setOtlId}
            defaultParsingRule={defaultParsingRule}
            setDefaultParsingRule={setDefaultParsingRule}
            parsingTreeChange={parsingTreeChange}
            setParsingTreeChange={setParsingTreeChange}
            sourceFileType={sourceFileType}
            setSourceFileType={setSourceFileType}
          />
        )}
      </div>
    );
  }
}

export default OntoLibG6;
