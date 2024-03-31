import React, { useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classnames from 'classnames';

import LabelShow from './LabelShow';
import LabelSetting from './LabelSetting';

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

const LabelEdges = (props: any) => {
  const { value } = props;
  const { onChange } = props;

  const [navigation, setNavigation] = useState('show');
  const onChangeNavigation = (key: string) => setNavigation(key);

  return (
    <div className="labelRoot">
      <LabelNodeLeftSpace selected={navigation} onChangeNavigation={onChangeNavigation} />
      <div className="labelContent">
        {navigation === 'show' && <LabelShow value={value} labelLimit={2} onChange={onChange} />}
        {navigation === 'setting' && <LabelSetting value={value} config={{ LABEL_FILL: true }} onChange={onChange} />}
      </div>
    </div>
  );
};

export default LabelEdges;
