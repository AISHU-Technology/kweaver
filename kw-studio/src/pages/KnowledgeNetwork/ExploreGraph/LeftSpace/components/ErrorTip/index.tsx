import React from 'react';
import { ExclamationCircleFilled } from '@ant-design/icons';

import intl from 'react-intl-universal';

const ErrorTip = () => {
  return (
    <div>
      <ExclamationCircleFilled className="kw-c-error" />
      <span className="kw-ml-2">{intl.get('exploreGraph.operateFail')}</span>
    </div>
  );
};
export default ErrorTip;
