import React from 'react';
import intl from 'react-intl-universal';
import { Button, ConfigProvider, Modal } from 'antd';
import type { ModalProps } from 'antd';
import classNames from 'classnames';
import Format from '../Format';
import './style.less';

export interface TemplateModalProps extends ModalProps {
  children?: React.ReactNode;
  title?: string | React.ReactNode; // 标题
  header?: React.ReactNode; // 自定义渲染标题dom
  footerExtra?: React.ReactNode; // 底部左侧额外元素
  isDisabled?: boolean; // 按钮是否灰置
  fullScreen?: boolean; // 是否全屏
  footerAlign?: 'left' | 'center' | 'right'; // 按钮对其方式
}

/**
 * 常用于 新建、编辑、添加数据 等操作的弹窗模板, 包含标题和底部按钮
 * `header`和`footer`为`null`则不渲染
 */
const TemplateModal = (props: TemplateModalProps) => {
  const {
    className,
    children,
    header,
    title,
    okText,
    cancelText,
    footer,
    footerExtra,
    isDisabled,
    fullScreen = false,
    footerAlign = 'right',
    ...reset
  } = props;

  const classes = classNames('c-template-modal', className, {
    'c-template-modal-fullScreen': fullScreen
  });

  return (
    <Modal
      className={classes}
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
              <Format.Title level={3} className="kw-mt-3 kw-ml-6">
                {title}
              </Format.Title>
            </div>
          )}

      <div
        className={classNames('m-content', {
          'kw-flex-item-full-height': fullScreen
        })}
      >
        {children}
      </div>

      {footer === null
        ? null
        : footer || (
            <div className="m-footer">
              <div
                className={classNames({
                  'kw-space-between': !!footerExtra
                })}
              >
                {footerExtra && <div>{footerExtra}</div>}

                <div style={{ textAlign: footerExtra ? 'unset' : footerAlign }}>
                  <ConfigProvider autoInsertSpaceInButton={false}>
                    <Button type="default" className="kw-mr-3" onClick={reset.onCancel}>
                      {cancelText || intl.get('global.cancel')}
                    </Button>
                    <Button type="primary" onClick={reset.onOk} disabled={isDisabled}>
                      {okText || intl.get('global.ok')}
                    </Button>
                  </ConfigProvider>
                </div>
              </div>
            </div>
          )}
    </Modal>
  );
};

TemplateModal.displayName = 'TemplateModal';
export default TemplateModal;
