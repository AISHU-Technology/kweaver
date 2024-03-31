import React, { useMemo } from 'react';
import classNames from 'classnames';
import './style.less';
import { Steps } from 'antd';
import type { StepsProps, StepProps } from 'antd';
import IconFont from '@/components/IconFont';

const { Step } = Steps;

interface AdStepsProps extends StepsProps {
  items: StepProps[];
  type?: 'navigation' | 'default';
}

const AdSteps: React.FC<AdStepsProps> = props => {
  const { className, items, size = 'small', type = 'default', onChange, current, ...restProps } = props;

  const targetIndex = useMemo(() => {
    if (current && current > 0) {
      return current - 1;
    }
  }, [current]);

  return (
    <Steps
      className={classNames('kw-steps', className, {
        'kw-steps-navigation': type === 'navigation'
      })}
      type="navigation"
      size={size}
      onChange={onChange}
      current={current}
      {...restProps}
    >
      {items.map((stepItem, index) => {
        return (
          <Step
            className={classNames('kw-steps-item', {
              'kw-steps-item-noTab': !onChange,
              'kw-steps-item-noArrow': targetIndex === index && type === 'navigation'
            })}
            key={index}
            {...stepItem}
          />
        );
      })}
    </Steps>
  );
};

export default AdSteps;
