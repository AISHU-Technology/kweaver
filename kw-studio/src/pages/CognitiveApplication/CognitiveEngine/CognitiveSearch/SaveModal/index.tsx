/**
 * 保存配置弹窗
 * @author Jason.ji
 * @date 2022/05/17
 *
 */

import React, { useEffect } from 'react';
import { Button, Input, Modal, ConfigProvider } from 'antd';
import HOOKS from '@/hooks';
import { ONLY_KEYBOARD } from '@/enums';
import intl from 'react-intl-universal';
import TrimmedInput from '@/components/TrimmedInput';

import './style.less';

export interface SaveModalProps {
  visible: boolean; // 弹窗是否可见
  setVisible: Function; // 控制弹窗是否可见
  type?: 'edit' | 'create' | string; // 编辑 | 新增
  editInfo?: Record<string, any>; // 编辑的数据
  onOk: (name: string, onError: Function) => void; // 点击确定回调
}

const ModalContent: React.FC<SaveModalProps> = ({ editInfo, setVisible, type = 'create', onOk }) => {
  // 定义校验规则
  const rules = {
    name: [
      {
        required: true,
        message: intl.get('global.noNull') // 不能为空
      },
      {
        max: 50,
        message: intl.get('global.lenErr', { len: 50 }) // 最大50字符
      },
      {
        pattern: ONLY_KEYBOARD,
        message: intl.get('global.onlyKeyboard') // 仅支持键盘上字符
      }
    ]
  };
  const [field, errors, { setFields, setFieldsErr, onSubmit }]: any[] = HOOKS.useForm(['name'], { rules });

  useEffect(() => {
    if (type !== 'edit' || !editInfo?.conf_name) return;
    setFields({ name: editInfo.conf_name }, false);
  }, [type, editInfo]);

  // 点击确定
  const handleOk = () => {
    onSubmit()
      .then((values: any) => {
        onOk(values.name, setFieldsErr);
      })
      .catch((err: any) => {});
  };

  return (
    <div>
      <div className="m-header">
        {type === 'create' ? intl.get('searchConfig.createTitle') : intl.get('searchConfig.editTitle')}
      </div>

      <div className="m-content">
        <div className="m-flex">
          <span className="strategy-name">{intl.get('searchConfig.configName')}</span>
          <div className="input-box">
            <TrimmedInput
              className={`${errors.name && 'err'}`}
              placeholder={intl.get('searchConfig.pleaseName')}
              allowClear
              value={field.name}
              onChange={value => setFields({ name: value })}
              onPressEnter={handleOk}
            />
            <p className="err-msg">{errors.name}</p>
          </div>
        </div>
      </div>

      <div className="m-footer">
        <ConfigProvider autoInsertSpaceInButton={false}>
          <Button type="default" onClick={() => setVisible(false)}>
            {intl.get('global.cancel')}
          </Button>
          <Button type="primary" onClick={handleOk}>
            {intl.get('global.ok')}
          </Button>
        </ConfigProvider>
      </div>
    </div>
  );
};

const SaveModal: React.FC<SaveModalProps> = props => {
  const { visible, setVisible } = props;

  return (
    <Modal
      className="kg-save-strategy-modal"
      open={visible}
      width={640}
      destroyOnClose
      footer={null}
      focusTriggerAfterClose={false}
      maskClosable={false}
      onCancel={() => setVisible(false)}
    >
      <ModalContent {...props} />
    </Modal>
  );
};

export default SaveModal;
