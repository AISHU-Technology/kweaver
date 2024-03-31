import React from 'react';
import Cookie from 'js-cookie';
import classnames from 'classnames';
import { Tooltip } from 'antd';

import IconFont from '@/components/IconFont';

import './style.less';
import { kwCookie } from '@/utils/handleFunction';

const ConfigLine = (props: any) => {
  const language = kwCookie.get('kwLang') || 'zh-CN';

  const { tip = '', label = '', style = {}, className, children } = props;
  return (
    <div className={classnames('configLineRoot', className)} style={style}>
      {label && (
        <div className="label" style={{ width: language === 'zh-CN' ? 85 : 120 }}>
          {label}
          {tip && (
            <Tooltip className="kw-ml-2 kw-c-text" title={tip} placement="bottomLeft">
              <IconFont type="icon-wenhao" />
            </Tooltip>
          )}
        </div>
      )}
      <div className="value">{children}</div>
    </div>
  );
};

export default ConfigLine;
