/**
 * @description 图谱被删除时提示弹窗
 */

import React from 'react';
import intl from 'react-intl-universal';
import { Modal } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

import './style.less';

const graphTipModal = new (function () {
  /**
   * 打开弹窗
   * @param {String} desc 描述
   */
  this.open = (desc = '') => {
    document.activeElement.blur(); // 解决antd4.2的bug, 关闭弹窗后滚动条位置谜之变化

    return new Promise(() => {
      Modal.info({
        className: 'graph-not-exist-modal',
        title: intl.get('workflow.tip'),
        icon: <ExclamationCircleFilled className="err-icon" />,
        content: desc,
        okText: intl.get('memberManage.know'),
        width: 432,
        keyboard: false,
        onOk() {
          window.location.replace('/home/graph-list');
        }
      });
    });
  };

  this.close = () => {
    Modal.destroyAll();
  };
})();

export { graphTipModal };
