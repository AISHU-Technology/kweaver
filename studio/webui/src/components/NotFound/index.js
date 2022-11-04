import React from 'react';
import intl from 'react-intl-universal';
import logo from '@/assets/images/head-Logo.svg';
import NotFoundImg from '@/assets/images/404.svg';
import versionInfo from '../../version.json';
import './style.less';

const NotFound = () => {
  return (
    <div className="not-found">
      <img src={NotFoundImg} alt="404" className="notfound-bgi" />
      <div className="login-footer">
        {intl.get('login.reserved')} &copy;{versionInfo.copyright}
        <img src={logo} alt="null" className="login-footer-logo"></img>
        {intl.get('login.edition')} {versionInfo.version}
      </div>
    </div>
  );
};

export default NotFound;
