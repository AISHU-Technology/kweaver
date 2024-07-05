import React, { memo, useState } from 'react';
import { connect } from 'react-redux';
import intl from 'react-intl-universal';
import { Select } from 'antd';
import UniversalModal from '@/components/UniversalModal';

import { changekwLang } from '@/reduxConfig/actions';

import './style.less';
import { kwCookie } from '@/utils/handleFunction';

const HeaderModalLang = (props: any) => {
  const { visible, updatekwLang, onClose } = props;
  const [lang, setLang] = useState(kwCookie.get('kwLang') || 'zh-CN');

  const onOk = async () => {
    const oldLang = kwCookie.get('kwLang') || 'zh-CN';
    if (lang === oldLang) return onClose();

    setLang(lang);
    updatekwLang(lang);
    window.location.reload();
    kwCookie.set('kwLang', lang, { expires: 365 });

    onClose();
  };

  return (
    <UniversalModal
      open={visible}
      className="language-modal"
      title={intl.get('userManagement.language')}
      footer={null}
      zIndex={1052}
      maskClosable={false}
      destroyOnClose={true}
      focusTriggerAfterClose={false}
      onCancel={onClose}
      footerData={[
        { label: intl.get('userManagement.cancel'), onHandle: onClose },
        { label: intl.get('userManagement.ok'), type: 'primary', onHandle: onOk }
      ]}
    >
      <div className="modal-body">
        <Select
          defaultValue={lang}
          style={{ width: '100%' }}
          onChange={e => setLang(e)}
          getPopupContainer={triggerNode => triggerNode.parentElement}
        >
          <Select.Option value="zh-CN">简体中文</Select.Option>
          <Select.Option value="en-US">English</Select.Option>
        </Select>
      </div>
    </UniversalModal>
  );
};

const mapStateToProps = (state: any) => ({
  kwLang: state.getIn(['changekwLang', 'kwLang'])
});

const mapDispatchToProps = (dispatch: any) => ({
  updatekwLang: (kwLang: any) => dispatch(changekwLang(kwLang))
});

export default connect(mapStateToProps, mapDispatchToProps)(memo(HeaderModalLang));
