import React from 'react';
import intl from 'react-intl-universal';
import { Button, ConfigProvider, Modal } from 'antd';
import type { ModalProps, ModalFuncProps } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import classNames from 'classnames';
import './style.less';

interface TipModalProps extends ModalProps {
  content?: React.ReactNode;
  titleIcon?: React.ReactNode;
  iconChange?: React.ReactNode;
  extractBtn?: React.ReactNode;
  onClose?: ModalProps['onCancel'];
}

/**
 * 二次确认弹窗, 常用于删除、退出提示
 */
const TipModal: React.FC<TipModalProps> = ({
  focusTriggerAfterClose = false,
  destroyOnClose = true,
  maskClosable = false,
  title,
  titleIcon,
  content,
  okText,
  cancelText,
  onOk,
  onCancel,
  className,
  onClose,
  extractBtn,
  closable = false,
  ...otherProps
}) => {
  const handleOk = (e: any) => {
    onOk?.(e);
  };

  const handleCancel = (e: any) => {
    onCancel?.(e);
  };

  return (
    <Modal
      className={classNames('kw-tip-modal', className)}
      focusTriggerAfterClose={focusTriggerAfterClose}
      destroyOnClose={destroyOnClose}
      maskClosable={maskClosable}
      width={432}
      footer={null}
      onCancel={onClose || onCancel}
      closable={closable}
      {...otherProps}
    >
      <div className="m-title">
        <div className="icon-box">{titleIcon || <ExclamationCircleFilled className="err-icon" />}</div>
        <div className="t-text">{title}</div>
      </div>

      <div className="m-body">{content}</div>

      <div className="m-footer">
        <ConfigProvider autoInsertSpaceInButton={false}>
          <div className="kw-space-between">
            <div>{extractBtn}</div>
            <div>
              <Button className="cancel-btn" onClick={handleCancel}>
                {cancelText || intl.get('global.cancel')}
              </Button>
              <Button type="primary" className="ok-btn kw-ml-2" onClick={handleOk}>
                {okText || intl.get('global.ok')}
              </Button>
            </div>
          </div>
        </ConfigProvider>
      </div>
    </Modal>
  );
};

/**
 * 提示弹窗，函数调用
 * 不支持extractBtn
 */
const tipModalFunc = (props: Omit<TipModalProps, 'extractBtn'>) => {
  (document.activeElement as HTMLElement)?.blur();
  const {
    focusTriggerAfterClose = false,
    closable = false,
    titleIcon,
    okText,
    cancelText,
    iconChange = false,
    ...otherProps
  } = props;
  return new Promise(resolve => {
    Modal.confirm({
      className: 'kw-tip-modal-function',
      icon: titleIcon || <ExclamationCircleFilled className={`${iconChange ? 'warn-icon' : 'err-icon'}`} />,
      okText: okText || ` ${intl.get('global.ok')} `,
      cancelText: cancelText || ` ${intl.get('global.cancel')} `,
      okType: 'primary',
      cancelButtonProps: { type: 'default' },
      width: 432,
      zIndex: 2000,
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

const knowModalFunc: { open: Function; close: Function } = {
  open: (props: ModalFuncProps) => {
    (document.activeElement as HTMLElement)?.blur();

    return new Promise(() => {
      Modal.info({
        className: 'kw-know-modal-function',
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
