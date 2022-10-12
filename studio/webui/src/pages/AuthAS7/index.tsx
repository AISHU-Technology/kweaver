import React, { useState, useEffect } from 'react';
import { Button, message } from 'antd';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { CheckCircleFilled, ExclamationCircleFilled } from '@ant-design/icons';

import servicesDataSource from '@/services/dataSource';

import './style.less';

const AuthSuccess = () => {
  const history = useHistory();
  const [authSuccess, setAuthSuccess] = useState(true);

  useEffect(() => {
    if (history.location.search.includes('?code=') && !history.location.search.includes('error')) {
      const body = {
        ds_code: history.location.search.split('?code=')[1].split('&')[0],
        ds_auth: history.location.pathname.split('auth-success/')[1]
      };

      const response: any = servicesDataSource.asAuthPost(body);

      const { Code, Cause } = response;

      if (Code && Code === 500001) {
        message.error(Cause || '');
      }

      document.title = `${intl.get('datamanagement.as7.auth')}_AnyDATA`;
    } else {
      setAuthSuccess(false);
      document.title = `${intl.get('datamanagement.as7.auth')}_AnyDATA`;
    }
  }, [history]);

  const handleClose = () => {
    if (navigator.userAgent.indexOf('Firefox') !== -1 || navigator.userAgent.indexOf('Chrome') !== -1) {
      window.location.href = 'about:blank';
      window.close();
    } else {
      window.opener = null;
      window.open(' ', '_self');
      window.close();
    }
  };

  return (
    <div className="auth-as7">
      <div className="auth-as7-box">
        {authSuccess ? (
          <div className="icon-success">
            <CheckCircleFilled />
          </div>
        ) : (
          <div className="icon-error">
            <ExclamationCircleFilled />
          </div>
        )}

        <div className="title">
          {authSuccess ? intl.get('datamanagement.as7.authSuccess') : intl.get('datamanagement.as7.authError')}
        </div>

        <div className="text">
          {authSuccess ? intl.get('datamanagement.as7.authSuccessText') : intl.get('datamanagement.as7.authErrorText')}
        </div>

        <Button className="ant-btn-default" onClick={handleClose}>
          {intl.get('datamanagement.as7.sure')}
        </Button>
      </div>
    </div>
  );
};

export default AuthSuccess;
