import React from 'react';

import { getParam } from '@/utils/handleFunction';
import AnalysisServiceTest from '@/pages/CognitiveService/AnalysisServiceTest';

import './style.less';

const Graph = () => {
  const { service_id, operation_type, s_id } = getParam(['service_id', 'operation_type', 's_id']);
  return (
    <div className="iframeGraphRoot">
      <AnalysisServiceTest sId={s_id} serviceId={service_id} canSelectSever={false} operation_type={operation_type} />
    </div>
  );
};

export default Graph;
