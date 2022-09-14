/**
 * 二次确认弹窗, 常用于删除、退出提示
 */

import React from 'react';
import intl from 'react-intl-universal';
import { Button, ConfigProvider, Modal } from 'antd';
import type { ModalProps, ModalFuncProps } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import './style.less';

interface TipModalProps extends ModalProps {
  content?: React.ReactNode;
  titleIcon?: React.ReactNode;
}

const TipModal: React.FC<TipModalProps> = ({
  focusTriggerAfterClose = false, // 关闭自动聚焦
  destroyOnClose = true, // 关闭后销毁
  maskClosable = false, // 点击遮罩不关闭
  title,
  titleIcon,
  content,
  okText,
  cancelText,
  onOk,
  onCancel,
  ...otherProps
}) => {
  // 点击确定
  const handleOk = (e: any) => {
    onOk?.(e);
  };

  // 点击取消
  const handleCancel = (e: any) => {
    onCancel?.(e);
  };

  return (
    <Modal
      className="ad-tip-modal"
      focusTriggerAfterClose={focusTriggerAfterClose}
      destroyOnClose={destroyOnClose}
      maskClosable={maskClosable}
      width={432}
      footer={null}
      onCancel={onCancel}
      {...otherProps}
    >
      <div className="m-title">
        <div className="icon-box">{titleIcon || <ExclamationCircleFilled className="err-icon" />}</div>
        <div className="t-text">{title}</div>
      </div>

      <div className="m-body">{content}</div>

      <div className="m-footer">
        <ConfigProvider autoInsertSpaceInButton={false}>
          <Button className="cancel-btn" onClick={handleCancel}>
            {cancelText || intl.get('global.cancel')}
          </Button>
          <Button type="primary" className="ok-btn" onClick={handleOk}>
            {okText || intl.get('global.ok')}
          </Button>
        </ConfigProvider>
      </div>
    </Modal>
  );
};

/**
 * 提示弹窗，函数调用
 */
const tipModalFunc = (props: TipModalProps) => {
  (document.activeElement as HTMLElement)?.blur(); // 解决antd4.2的bug, 关闭弹窗后滚动条位置谜之变化
  const { focusTriggerAfterClose = false, closable = true, titleIcon, okText, cancelText, ...otherProps } = props;
  return new Promise(resolve => {
    Modal.confirm({
      className: 'ad-tip-modal-function',
      icon: titleIcon || <ExclamationCircleFilled className="err-icon" />,
      okText: okText || ` ${intl.get('global.ok')} `, // 添加空格绕过antd的autoInsertSpaceInButton规则
      cancelText: cancelText || ` ${intl.get('global.cancel')} `,
      okType: 'primary',
      cancelButtonProps: { type: 'default' },
      width: 432,
      focusTriggerAfterClose,
      closable,
      onOk() {
        resolve(true);
      },
      onCancel() {
        resolve(false);
      },
      ...otherProps
    });
  });
};

// "知道了"确认弹窗, 函数式调用
const knowModalFunc: { open: Function; close: Function } = {
  open: (props: ModalFuncProps) => {
    (document.activeElement as HTMLElement)?.blur();

    return new Promise(resolve => {
      Modal.info({
        className: 'ad-know-modal-function',
        title: intl.get('workflow.tip'),
        icon: <ExclamationCircleFilled className="err-icon" />,
        okText: intl.get('memberManage.know'),
        width: 432,
        keyboard: false,
        ...props
      });
    });
  },
  close: () => {
    Modal.destroyAll();
  }
};

export default TipModal;
export { tipModalFunc, knowModalFunc };
