import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import _ from 'lodash';
import intl from 'react-intl-universal';
import HeaderBar from './HeaderBar';

import IconFont from '@/components/IconFont';

import HeaderModalLang from './HeaderModalLang';

import { logoBlue } from '@/assets/images/base64';

import './style.less';

const KwHeader = (props: any) => {
  const history = useHistory();
  const { breadcrumb = [], onClickLogo } = props;
  const [modalKey, setModalKey] = useState<any>(null);

  useEffect(() => {
    if (onClickLogo) {
      const header = document.querySelector('.kw-header-bar-content');
      const logo = header?.getElementsByTagName('img')?.[0];
      if (!logo) return;
      logo.classList.add('logoButton');
      logo.onclick = onClickLogo;
    }
  }, [onClickLogo]);

  const onOpenModal = (key: string) => setModalKey(key);
  const onCloseModal = () => setModalKey(null);

  const extraElements = Object.keys(breadcrumb).length ? [breadcrumb] : [];
  if (onClickLogo) {
    extraElements.unshift({
      key: 'home',
      float: 'left',
      label: (
        <div className="toHomeIcon">
          <div className="toHomeButton">
            <IconFont type="icon-color-shouye" style={{ fontSize: 16 }} />
          </div>
        </div>
      ),
      onClick: onClickLogo
    });
  }

  const accountItems = [
    {
      key: 'language',
      label: intl.get('userManagement.language')
    },
    {
      key: 'management',
      label: intl.get('adminManagement.resourceManagement')
    }
  ];

  const account: any = {
    name: (
      <div className="kw-ellipsis" style={{ maxWidth: 100, display: 'inline-block' }}>
        developer
      </div>
    ),
    items: _.filter(accountItems, item => !!item),
    onClick: (keys: string[]) => {
      onCloseModal();
      const key = keys[0];
      switch (key) {
        case 'language':
          onOpenModal('language');
          break;
        case 'management':
          history.replace('/management');
          break;
        default:
          break;
      }
    }
  };

  return (
    <div className="c-headerRoot">
      <HeaderBar logo={logoBlue} extraElements={extraElements} account={account} />
      <HeaderModalLang visible={modalKey === 'language'} onClose={onCloseModal} />
    </div>
  );
};

export default KwHeader;
