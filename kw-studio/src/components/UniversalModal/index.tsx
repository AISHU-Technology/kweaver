import React from 'react';
import { Modal } from 'antd';
import type { ModalProps } from 'antd';
import classNames from 'classnames';
import Header from './Header';
import Footer, { FooterModalSourceType } from './Footer';
import './style.less';

export interface TemplateModalProps extends ModalProps {
  children?: React.ReactNode;
  title?: string | React.ReactNode; // 标题
  footerExtra?: React.ReactNode; // 底部左侧额外元素
  isDisabled?: boolean; // 按钮是否灰置
  footerData?: FooterModalSourceType[] | React.ReactNode; // 底部元素
  fullScreen?: boolean; // 是否全屏 默认 false
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
    okText,
    cancelText,
    footerExtra,
    isDisabled,
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
