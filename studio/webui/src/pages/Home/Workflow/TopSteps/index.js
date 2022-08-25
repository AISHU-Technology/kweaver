/**
 * 顶部步骤条
 */

import React, { memo } from 'react';
import { CheckOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import './style.less';

const checkIcon = <CheckOutlined className="check-icon" />;

const TopSteps = props => {
  const { current } = props;

  // 文字图标
  const NumIcon = ({ number }) => <span className="num-icon">{number}</span>;

  // 所有步骤条标题
  const titleList = [
    intl.get('workflow.basic.basic'),
    intl.get('workflow.datasource.datasource'),
    intl.get('workflow.onto.onto'),
    intl.get('workflow.information.information'),
    intl.get('workflow.knowledge.knowledge'),
    intl.get('workflow.conflation.conflation')
  ];

  return (
    <div className="flow-top-steps">
      {titleList.map((title, index) => {
        const isFinish = index < current;
        const isProgress = index === current;

        return (
          <div key={title} className={`step-item ${isFinish && 'finish'} ${isProgress && 'progress'}`}>
            <span className="status-icon">{isFinish ? checkIcon : <NumIcon number={index + 1} />}</span>
            <span className="step-title">{title}</span>
          </div>
        );
      })}
    </div>
  );
};

export default memo(TopSteps);
