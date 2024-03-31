import React, { useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classnames from 'classnames';

import LabelSetting from './LabelSetting';
import LabelShow from './LabelShow';

import './style.less';

const NAVIGATION = [
  { value: 'show', label: intl.get('exploreGraph.style.showAttributes') },
  { value: 'setting', label: intl.get('exploreGraph.style.settings') }
];

const LabelNodeLeftSpace = (props: any) => {
  const { selected, onChangeNavigation } = props;
  return (
    <div className="labelNavigation">
      {_.map(NAVIGATION, item => {
        const { value, label } = item;
        return (
          <div
            key={value}
            className={classnames('navigationItem', { selected: selected === value })}
            onClick={() => onChangeNavigation(value)}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
};

const LabelNode = (props: any) => {
  const { value, shapeType, isBatchClass, disabledPosition } = props;
  const { onChange } = props;

  const [navigation, setNavigation] = useState('show');
  const onChangeNavigation = (key: string) => setNavigation(key);

  return (
    <div className="labelRoot">
      <LabelNodeLeftSpace selected={navigation} onChangeNavigation={onChangeNavigation} />
      <div className="labelContent">
        {navigation === 'show' && (
          <LabelShow value={value} isBatchClass={isBatchClass} labelLimit={3} onChange={onChange} />
        )}
        {navigation === 'setting' && (
          <LabelSetting value={value} shapeType={shapeType} disabledPosition={disabledPosition} onChange={onChange} />
        )}
      </div>
    </div>
  );
};

export default LabelNode;
