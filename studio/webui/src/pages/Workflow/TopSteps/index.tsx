import React, { memo } from 'react';
import { CheckOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import './style.less';

const NumIcon = ({ number }: { number: number }) => <span className="num-icon">{number}</span>;

interface TopStepsProps {
  current?: number;
}
const TopSteps: React.FC<TopStepsProps> = props => {
  const { current = 0 } = props;

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
          <div
            key={title}
            className={classNames('step-item', {
              finish: isFinish,
              progress: isProgress
            })}
          >
            <span className="status-icon">
              {isFinish ? <CheckOutlined className="check-icon" /> : <NumIcon number={index + 1} />}
            </span>
            <span className="step-title">{title}</span>
          </div>
        );
      })}
    </div>
  );
};

export default memo(TopSteps);
