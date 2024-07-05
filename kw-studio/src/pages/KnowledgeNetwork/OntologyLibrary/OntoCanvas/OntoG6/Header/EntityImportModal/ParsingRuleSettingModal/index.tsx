import React, { useState, useEffect } from 'react';
import { Modal, Input, Popconfirm, Popover, Button } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';
import HOOKS from '@/hooks';
import { ONLY_KEYBOARD } from '@/enums';

import ErrorTip from './ErrorTip';

import './style.less';

const INPUT_TITLE: Record<any, string> = {
  delimiter: intl.get('createEntity.fields'),
  quotechar: intl.get('createEntity.quote'),
  escapechar: intl.get('createEntity.escape')
};

const PLACEHOLDER: Record<any, string> = {
  delimiter: ',',
  quotechar: '"',
  escapechar: '"'
};

const ParsingRuleSettingModal = (props: any) => {
  const { defaultParsingRule, setDefaultParsingRule } = props;
  const language = HOOKS.useLanguage();
  const [visible, setVisible] = useState(false);
  const [parsingSetting, setParsingSetting] = useState<any>({
    delimiter: ',',
    quotechar: '"',
    escapechar: '"',
    delimiterError: '',
    quotecharError: '',
    escapecharError: ''
  }); // 默认解析规则设置

  useEffect(() => {
    if (visible) {
      setParsingSetting({ ...defaultParsingRule });
    }
  }, [visible]);

  /**
   * 输入框处理
   */
  const onHandleChange = (value: string, type: string) => {
    switch (type) {
      case 'delimiter':
        onTypeError(value, type);
        break;
      case 'quotechar':
        onTypeError(value, type);
        break;
      case 'escapechar':
        onTypeError(value, type);
        break;
      default:
        break;
    }
  };

  /**
   * 报错提示
   */
  const onTypeError = (value: string, type: string) => {
    const error: any = onCheckValidate(value, type);
    let data: any = {};
    switch (type) {
      case 'delimiter':
        data = { ...parsingSetting, delimiter: value, delimiterError: error };
        if (parsingSetting.quotechar === value) {
          data.quotecharError = intl.get('createEntity.inputSame');
        }
        if (parsingSetting.escapechar === value) {
          data.escapecharError = intl.get('createEntity.inputSame');
        }
        setParsingSetting({ ...data });
        break;
      case 'quotechar':
        setParsingSetting({ ...parsingSetting, quotechar: value, quotecharError: error });
        break;
      case 'escapechar':
        setParsingSetting({ ...parsingSetting, escapechar: value, escapecharError: error });
        break;
      default:
        break;
    }
  };

  /**
   * 规则设置校验
   */
  const onCheckValidate = (value: string, type: string) => {
    if (!value) {
      return intl.get('createEntity.cannotNull');
    }
    if (!ONLY_KEYBOARD.test(value)) {
      return intl.get('global.onlyKeyboard');
    }
    if (value.length > 1) {
      return intl.get('global.lenErr', { len: 1 });
    }
    if (type !== 'delimiter' && value === parsingSetting?.delimiter) {
      return intl.get('createEntity.inputSame');
    }

    return '';
  };

  /**
   * 确定
   */
  const onOk = () => {
    const { delimiter, quotechar, escapechar, delimiterError, quotecharError, escapecharError } = parsingSetting;

    if (delimiterError || quotecharError || escapecharError) return;
    const newParse: any = _.cloneDeep(defaultParsingRule);
    // 判断输入框是否为空
    if (delimiter) {
      newParse.delimiter = delimiter;
    } else if (!delimiter) {
      setParsingSetting({ ...parsingSetting, delimiter, delimiterError: intl.get('createEntity.cannotNull') });
      return;
    }
    if (quotechar) {
      newParse.quotechar = quotechar;
    } else if (!quotechar) {
      setParsingSetting({ ...parsingSetting, quotechar, quotecharError: intl.get('createEntity.cannotNull') });
      return;
    }
    if (escapechar) {
      newParse.escapechar = escapechar;
    } else if (!escapechar) {
      setParsingSetting({ ...parsingSetting, escapechar, escapecharError: intl.get('createEntity.cannotNull') });
      return;
    }
    setDefaultParsingRule(newParse);
    setVisible(false);
  };

  /**
   * 取消 默认解析规则不变
   */
  const onCancel = () => {
    const { delimiter, quotechar, escapechar } = defaultParsingRule;
    setParsingSetting({ delimiter, quotechar, escapechar });
    setVisible(false);
  };

  /**
   * 失去焦点
   */
  const onBlur = () => {
    const cloneData = _.cloneDeep(parsingSetting);
    if (!cloneData.delimiter) {
      cloneData.delimiter = ',';
      onTypeError(',', 'delimiter');
    }
    if (!cloneData.quotechar) {
      cloneData.quotechar = '"';
      onTypeError('"', 'quotechar');
    }
    if (!cloneData.escapechar) {
      cloneData.escapechar = '"';
      onTypeError('"', 'escapechar');
    }
  };

  const confirm = () => {
    return (
      <>
        {_.map(['delimiter', 'quotechar', 'escapechar'], (item: any, index: number) => {
          return (
            <React.Fragment key={String(index)}>
              <div className={classNames('kw-flex', item === 'escapechar' ? 'kw-mb-0' : 'kw-mb-2')}>
                <div className={classNames('rule-title kw-flex', { 'rule-title-en': language === 'en-US' })}>
                  {INPUT_TITLE[item]}
                </div>
                <ErrorTip errorText={!parsingSetting[`${item}Error`] ? '' : parsingSetting[`${item}Error`]}>
                  <Input
                    className={classNames({ 'err-input': parsingSetting[`${item}Error`] })}
                    placeholder={PLACEHOLDER[item]}
                    onChange={e => onHandleChange(e?.target?.value, item)}
                    autoComplete="off"
                    value={parsingSetting[item]}
                    onBlur={onBlur}
                  />
                </ErrorTip>
              </div>
            </React.Fragment>
          );
        })}
        <div className="footer-box kw-flex">
          <Button onClick={onCancel} type="default" className="kw-mr-3">
            {intl.get('global.cancel')}
          </Button>
          <Button onClick={onOk} type="primary">
            {intl.get('global.ok')}
          </Button>
        </div>
      </>
    );
  };

  // 卡片状态改变
  const onVisibleChange = (visible: boolean) => {
    setVisible(visible);
  };

  return (
    <Popover
      open={visible}
      onOpenChange={visible => onVisibleChange(visible)}
      placement="topLeft"
      overlayClassName="parsing-setting-modal-root"
      content={confirm}
      trigger="click"
    >
      <div className="kw-pointer rule-setting kw-pt-1">
        {intl.get('createEntity.defaultParse')}
        <IconFont type="icon-setting" className="kw-ml-2" />
      </div>
    </Popover>
  );
};

export default ParsingRuleSettingModal;
