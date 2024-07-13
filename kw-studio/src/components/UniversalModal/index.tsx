import React from 'react';
import { Modal } from 'antd';
import type { ModalProps } from 'antd';
import classNames from 'classnames';
import Header from './Header';
import Footer, { FooterModalSourceType } from './Footer';
import './style.less';

export interface TemplateModalProps extends ModalProps {
  children?: React.ReactNode;
  title?: string | React.ReactNode;
  footerExtra?: React.ReactNode;
  isDisabled?: boolean;
  footerData?: FooterModalSourceType[] | React.ReactNode;
  fullScreen?: boolean;
}

/**
 * 常用于 新建、编辑、添加数据 等操作的弹窗模板, 包含标题和底部按钮
 * `title`和`footer`为`null`则不渲染
 */
const UniversalModal = (props: TemplateModalProps) => {
  const {
    className,
    children,
    title = null,
    footerExtra,
    width = 640,
    footerData,
    fullScreen = false,
    ...reset
  } = props;

  return (
    <Modal
      className={classNames('kw-universal-modal', className, {
        'kw-modal-fullScreen': fullScreen
      })}
      focusTriggerAfterClose={false}
      destroyOnClose
      maskClosable={false}
      width={fullScreen ? '100%' : width}
      footer={null}
      {...reset}
    >
      <Header visible={!!title} title={title}></Header>

      <div className="kw-universal-modal-content">{children}</div>

      <Footer
        visible={footerData !== null || JSON.stringify(footerData) !== '{}'}
        source={footerData}
        footerExtra={footerExtra}
      />
    </Modal>
  );
};

UniversalModal.displayName = 'UniversalModal';
UniversalModal.Footer = Footer;
export default UniversalModal;
