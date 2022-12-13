/**
 * 常用于 新建、编辑、添加数据 等操作的弹窗模板, 包含标题和底部按钮
 * `header`和`footer`为`null`则不渲染
 */
import React from 'react';
import intl from 'react-intl-universal';
import { Button, ConfigProvider, Modal } from 'antd';
import type { ModalProps } from 'antd';
import classNames from 'classnames';
import Format from '../Format';
import './style.less';

export interface TemplateModalProps extends ModalProps {
  children?: React.ReactNode;
  title?: string; // 标题
  header?: React.ReactNode; // 自定义渲染标题
}

const TemplateModal = (props: TemplateModalProps) => {
  const { className, children, header, title, okText, cancelText, footer, ...reset } = props;

  return (
    <Modal
      className={classNames('c-template-modal', className)}
      focusTriggerAfterClose={false}
      destroyOnClose
      maskClosable={false}
      width={640}
      footer={null}
      {...reset}
    >
      {header === null
        ? null
        : header || (
            <div className="m-header">
              <Format.Title level={3} className="ad-mt-3 ad-ml-6">
                {title}
              </Format.Title>
            </div>
          )}

      <div className="m-content">{children}</div>

      {footer === null
        ? null
        : footer || (
            <div className="m-footer">
              <ConfigProvider autoInsertSpaceInButton={false}>
                <Button type="default" className="ad-mr-3" onClick={reset?.onCancel}>
                  {cancelText || intl.get('global.cancel')}
                </Button>
                <Button type="primary" onClick={reset?.onOk}>
                  {okText || intl.get('global.ok')}
                </Button>
              </ConfigProvider>
            </div>
          )}
    </Modal>
  );
};

TemplateModal.displayName = 'TemplateModal';
export default TemplateModal;
