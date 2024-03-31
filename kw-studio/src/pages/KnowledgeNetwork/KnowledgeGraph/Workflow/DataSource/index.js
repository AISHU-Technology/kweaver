import React, { useState } from 'react';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { Button, message, Tooltip } from 'antd';

import serviceWorkFlow from '@/services/workflow';
import servicesCreateEntity from '@/services/createEntity';

import DataSource from './DataSource';

import './style.less';
import { useLocation } from 'react-router-dom';

const DataSourceBox = props => {
  const {
    next,
    prev,
    flowCurrent,
    dataSourceData,
    setDataSourceData,
    graphId,
    useDs,
    dataSourceRef,
    ontology_id,
    setOntologyId,
    ontoData
  } = props;
  const [disabled, setDisabled] = useState(false);
  const [getNewData, setGetNewData] = useState(false);
  const location = useLocation();
  const viewMode = location.state?.mode === 'view'; // 是否处于查看模式
  const dataPrev = e => {
    e.preventDefault();
    prev();
  };

  const dataNext = async e => {
    e?.preventDefault();
    if (disabled) {
      return;
    }
    // 查看模式
    if (viewMode) {
      next();
      return;
    }

    setDisabled(true);
    const body = {
      graph_step: 'graph_ds',
      graph_process: dataSourceData.map(value => value.id)
    };
    const res = await serviceWorkFlow.graphEdit(graphId, body);
    if (res?.res) {
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

    setDisabled(false);
  };

  return (
    <div className="datasource-box">
      <DataSource
        flowCurrent={flowCurrent}
        dataSourceData={dataSourceData}
        setDataSourceData={setDataSourceData}
        useDs={useDs}
        graphId={graphId}
        getNewData={getNewData}
        dataSourceRef={dataSourceRef}
        dataNext={dataNext}
      />

      <div className="work-flow-footer">
        <Button className="ant-btn-default btn" onClick={dataPrev}>
          {intl.get('global.previous')}
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
            {intl.get('global.next')}
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

export default DataSourceBox;
