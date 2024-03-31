/**
 * 路由404页面
 *
 * @author liang.zhiqiang@aishu.cn
 * @date 2020/06/16
 *
 */

import React from 'react';
import intl from 'react-intl-universal';
import NotFoundImg from '@/assets/images/404.svg';
import versionInfo from '../../version.json';
import './style.less';
const NotFound = () => {
  return (
    <div className="not-found">
      <img src={NotFoundImg} alt="404" className="notfound-bgi" />
      <div className="login-footer">
        {intl.get('login.reserved')} &copy;{versionInfo.copyright}
        {intl.get('login.edition')} {versionInfo.version}
      </div>
    </div>
  );
};

export default NotFound;
