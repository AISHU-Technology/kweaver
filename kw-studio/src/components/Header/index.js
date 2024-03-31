import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import KwHeadBar from '../KwHeadBar';

import IconFont from '@/components/IconFont';

import ModalLanguage from './ModalLanguage';

import { logoBlue } from '@/assets/images/base64';

import './style.less';

const CHeader = props => {
  const { breadcrumb = [], onClickLogo } = props;
  const [modalKey, setModalKey] = useState(null);

  useEffect(() => {
    if (onClickLogo) {
      const header = document.querySelector('.kw-header-bar-content');
      const logo = header.getElementsByTagName('img')?.[0];
      logo.classList.add('logoButton');
      logo.onclick = onClickLogo;
    }
  }, [onClickLogo]);

  const onOpenModal = key => setModalKey(key);
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
    }
  ];

  const account = {
    name: (
      <div className="kw-ellipsis" style={{ maxWidth: 100, display: 'inline-block' }}>
        developer
      </div>
    ),
    items: _.filter(accountItems, item => !!item),
    onClick: keys => {
      onCloseModal();
      const key = keys[0];
      if (key === 'language') onOpenModal('language');
    }
  };

  return (
    <div className="c-headerRoot">
      <KwHeadBar logo={logoBlue} extraElements={extraElements} account={account} />
      <ModalLanguage visible={modalKey === 'language'} onClose={onCloseModal} />
    </div>
  );
};

export default CHeader;
