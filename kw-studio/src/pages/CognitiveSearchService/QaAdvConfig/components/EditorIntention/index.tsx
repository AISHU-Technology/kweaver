import React, { useEffect, useMemo, useState } from 'react';
import _ from 'lodash';
import IconFont from '@/components/IconFont';
import { Dropdown, Input } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { ONLY_KEYBOARD } from '@/enums';

import './style.less';
type EditorIntentionType = {
  type: 'intent' | 'slot';
  data: any;
  existData: any;
  onCancel: (data: any) => void;
  onOk: (data: { name: string; description: string }) => void;
};
const EditorIntention = (props: EditorIntentionType) => {
  const { type, data, existData, onCancel, onOk } = props;
  const [errorText, setErrorText] = useState<string>('');
  const [errorDesc, setErrorDesc] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [description, setDesc] = useState<string>('');
  const [focus, setFocus] = useState<boolean>(true);
  const placeName =
    type === 'intent'
      ? intl.get('cognitiveSearch.qaAdvConfig.enterIntentName')
      : intl.get('cognitiveSearch.qaAdvConfig.enterSlotName');
  const placeDes =
    type === 'intent'
      ? intl.get('cognitiveSearch.qaAdvConfig.enterIntentDes')
      : intl.get('cognitiveSearch.qaAdvConfig.enterSlotDes');

  /** 存在的名字 */
  const exitName = useMemo(() => {
    return _.map(
      _.filter(existData, item => item?.id !== data?.id),
      d => d?.name || d?.intent
    );
  }, [existData]);

  useEffect(() => {
    setName(data?.name || data?.intent);
    setDesc(data?.description);
  }, [data]);

  const overlay = () => {
    if (errorText || errorDesc) {
      return (
        <div
          className="errorWrapper"
          onClick={e => {
            e.stopPropagation();
          }}
        >
          {errorText || errorDesc}
        </div>
      );
    }
    return <span />;
  };

  /** 监听名字输入报错 */
  const handleNameChange = (e?: any) => {
    const text = e?.target?.value.trim();
    const error = validate(text, 50, true);
    setErrorText(error);
  };

  /** 监听描述输入报错 */
  const handleDescChange = (e?: any) => {
    const text = e?.target?.value.trim();
    const error = validate(text, 255, false, false);
    setErrorDesc(error);
  };

  const handleOk = () => {
    const nameErr = validate(name, 50, true);
    const desERr = validate(description, 255, false, false);
    setErrorText(nameErr);
    setErrorDesc(desERr);
    if (nameErr || desERr) return;
    onOk({ name, description });
  };

  const validate = (text: string, len: number, isUniq = false, notNull = true) => {
    let errors = '';
    if (!text && notNull) errors = intl.get('cognitiveSearch.qaAdvConfig.nameNotNull');
    if (!ONLY_KEYBOARD.test(text) && text) errors = intl.get('global.onlyKeyboard');
    if (text?.length > len) errors = intl.get('global.lenErr', { len });
    if (isUniq && exitName?.includes(text)) errors = intl.get('glossary.glossaryDuplicateName');
    return errors;
  };

  const handleCancel = () => {
    const idEditor = !!data?.name || !!data?.intent;
    onCancel(idEditor);
  };

  return (
    <div className="editorIntentionRoot kw-align-center">
      <Dropdown
        overlay={overlay}
        visible={!!errorText || !!errorDesc}
        getPopupContainer={e => e?.parentElement || document?.body}
      >
        <div
          className={classNames('kw-flex-item-full-width kw-border', { focusBorder: focus })}
          style={{ borderColor: errorText || errorDesc ? '#f5222d' : '' }}
        >
          <Input
            bordered={false}
            placeholder={placeName}
            style={{ width: '100%', height: 22 }}
            value={name}
            autoFocus
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            onChange={e => {
              setName(e?.target?.value);
              handleNameChange(e);
            }}
          />
          <Input
            bordered={false}
            value={description}
            placeholder={placeDes}
            style={{ width: '100%', height: 22 }}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            onChange={e => {
              setDesc(e?.target?.value);
              handleDescChange(e);
            }}
          />
        </div>
      </Dropdown>
      <IconFont
        className="kw-ml-4 kw-mr-2 kw-c-primary kw-pointer"
        type="icon-duigou"
        style={{ fontSize: 20 }}
        onClick={() => handleOk()}
      />
      <IconFont className="kw-pointer" type="icon-guanbiquxiao" onClick={handleCancel} />
    </div>
  );
};
export default EditorIntention;
