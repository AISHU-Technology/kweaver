import React, { useState } from 'react';
import intl from 'react-intl-universal';
import { Button, message, Tooltip } from 'antd';

import serviceWorkFlow from '@/services/workflow';
import DataSource from '@/components/DataSource';

import './style.less';

const DataSourceBox = props => {
  const { next, prev, dataSourceData, setDataSourceData, graphId, useDs, dataSourceRef } = props;
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
