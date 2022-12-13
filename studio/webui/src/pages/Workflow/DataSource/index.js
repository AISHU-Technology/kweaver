import React, { useState } from 'react';
import intl from 'react-intl-universal';
import { Button, message, Tooltip } from 'antd';

import serviceWorkFlow from '@/services/workflow';
import servicesCreateEntity from '@/services/createEntity';
import DataSource from '@/components/DataSource';

import './style.less';

const DataSourceBox = props => {
  const {
    next,
    prev,
    dataSourceData,
    setDataSourceData,
    graphId,
    useDs,
    dataSourceRef,
    setOntologyId,
    ontoData,
    ontologyId
  } = props;
  const [disabled, setDisabled] = useState(false);
  const [getNewData, setGetNewData] = useState(false);

  const dataPrev = e => {
    e.preventDefault();
    prev();
  };

  const dataNext = async e => {
    e.preventDefault();
    if (disabled) return;

    setDisabled(true);

    if (dataSourceData.length === 0 && useDs.length === 0) {
      message.error(intl.get('workflow.datasource.noChecked'));
    } else {
      const body = {
        graph_step: 'graph_ds',
        graph_process: dataSourceData.map(value => value.id)
      };

      const res = await serviceWorkFlow.graphEdit(graphId, body);

      if (res?.res) {
        const buildOntology = await createOntology();
        if (!buildOntology) return;
        next();
      }

      if (res?.Code === 500001) {
        message.error(res.Cause || res.Message || res.Code);
      }

      if (res?.Code === 500006) {
        message.error(res.Cause || res.Message || res.Code);
        setGetNewData(!getNewData);
      }

      if (res && res.Code) {
        next(res);
      }
    }

    setDisabled(false);
  };

  /**
   * 创建本体
   */
  const createOntology = async () => {
    if (ontologyId !== 0) return true;
    try {
      if (ontoData.length === 0 || ontoData?.[0].id === 0) {
        const data = {
          ontology_name: '',
          ontology_des: ''
        };
        const requestData = {
          graph_step: 'graph_otl',
          updateoradd: 'add',
          graph_process: [data]
        };
        const mess = await servicesCreateEntity.changeFlowData(graphId, requestData);
        if (mess && mess.res) {
          setOntologyId(mess.res.ontology_id);
          return true;
        }

        if (mess?.Code === 500002 || mess?.Code === 500001) {
          message.error(mess.Cause);
          return false;
        }
      }
      return true;
    } catch (error) {
      message.error(error);
    }
  };

  return (
    <div className="work-flow-data-source-box">
      <DataSource
        dataSourceData={dataSourceData}
        setDataSourceData={setDataSourceData}
        useDs={useDs}
        graphId={graphId}
        getNewData={getNewData}
        dataSourceRef={dataSourceRef}
      />

      <div className="work-flow-footer">
        <Button className="ant-btn-default btn" onClick={dataPrev}>
          {intl.get('workflow.previous')}
        </Button>
        <Tooltip
          overlayStyle={{ width: '260px' }}
          getPopupContainer={triggerNode => triggerNode.parentElement}
          title={
            <div>
              {intl.get('workflow.tooltip')}
              <br />
              <div className="ds-button-tip-line"></div>
              <br />
              {intl.get('workflow.tooltiptex')}
            </div>
          }
        >
          <Button type="primary" className="btn" onClick={dataNext}>
            {intl.get('workflow.next')}
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

export default DataSourceBox;
