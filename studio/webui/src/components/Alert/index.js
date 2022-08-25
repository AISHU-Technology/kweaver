import React from 'react'
import { Alert as _Alert } from 'antd'

import './index.less'

const Alert = props => {
  return (
    <_Alert className="alertRoot" {...props} />
  )
};

export default Alert
