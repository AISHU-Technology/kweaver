import React from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import { Tooltip } from 'antd';
import { RightOutlined, QuestionCircleOutlined } from '@ant-design/icons';

import { AlgorithmItemLineType } from './type';

import './style.less';

const AlgorithmItemLine = (props: AlgorithmItemLineType) => {
  const { className, disabled } = props;
  const { items, title } = props;
  const { onClick } = props;

  return (
    <div className={classnames('algorithmItemLine', className)}>
      <div className="kw-pb-2 kw-c-subtext kw-border-b" style={{ fontSize: 12 }}>
        {title}
      </div>
      <div className="kw-border-b kw-align-center">
        {_.map(items, item => {
          const { key, label, question } = item;
          return (
            <div
              key={key}
              className="item"
              onClick={() => {
                if (disabled) return;
                onClick({ key, label });
              }}
            >
              <div>
                <span>{label}</span>
                {question && (
                  <Tooltip title={question} placement="topLeft">
                    <QuestionCircleOutlined className="kw-ml-2 kw-c-subtext" />
                  </Tooltip>
                )}
              </div>
              <RightOutlined />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlgorithmItemLine;
