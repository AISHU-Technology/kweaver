import React from 'react';
import intl from 'react-intl-universal';
import { Modal } from 'antd';
import type { ModalProps } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

interface TipModalProps extends ModalProps {
  title?: React.ReactNode;
  content?: React.ReactNode; // 弹窗内容
  titleIcon?: React.ReactNode; // 弹窗icon
  okText?: string;
  cancelText?: string;
}
/**
 * 探索的数据量超过500 弹窗提示
 */
const TipModal = (props: TipModalProps) => {
  (document.activeElement as HTMLElement)?.blur(); // 解决antd4.2的bug, 关闭弹窗后滚动条位置谜之变化
  const { title, titleIcon, okText, content, cancelText, ...otherProps } = props;
  return new Promise(resolve => {
    Modal.confirm({
      title: title || intl.get('exploreGraph.tips'),
      icon: titleIcon || <ExclamationCircleFilled className="kw-c-warning" />,
      content: content || <div className="kw-c-text">{intl.get('exploreGraph.layoutTip')}</div>,
      okText: okText || intl.get('exploreGraph.continue'),
      cancelText: cancelText || intl.get('exploreGraph.cancel'),
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

export default TipModal;
