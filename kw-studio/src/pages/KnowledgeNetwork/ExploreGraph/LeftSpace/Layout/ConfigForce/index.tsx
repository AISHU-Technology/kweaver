import React, { useState, useEffect, useCallback } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Slider, InputNumber } from 'antd';

import { GRAPH_LAYOUT_FORCE } from '@/enums';
import Format from '@/components/Format';
import { ConfigLine } from '../../components';

import './style.less';

const FORCE_DEFAULT_CONFIG = GRAPH_LAYOUT_FORCE.getDefault();

const ConfigForce = (props: any) => {
  const { defaultData } = props;
  const { onChangeConfig } = props;
  const [config, setConfig] = useState(_.isEmpty(defaultData) ? FORCE_DEFAULT_CONFIG : defaultData);
  const { linkDistance, nodeStrength } = config || {};

  const [isPageFirstRender, setIsPageFirstRender] = useState(true);

  useEffect(() => {
    if (_.isEmpty(defaultData)) return;
    setConfig(defaultData);
  }, [defaultData]);

  const onCallback = useCallback(
    _.debounce((data: any) => {
      if (isPageFirstRender) setIsPageFirstRender(false);
      const _config = data;
      if (!isPageFirstRender) config.isHaveChanged = true;
      onChangeConfig(_config);
    }, 300),
    []
  );

  const onChange = ({ key, value }: any) => {
    const newConfig = { ...config };
    newConfig[key] = value;
    if (key === 'linkDistance' && !value) newConfig[key] = 1;
    if (key === 'nodeStrength' && !value) newConfig[key] = 0;
    if (key === 'nodeStrength' && value < -300) newConfig[key] = -300;
    if (key === 'nodeStrength' && value > 300) newConfig[key] = 300;
    setConfig(newConfig);
    onCallback(newConfig);
  };

  return (
    <div className="configForceRoot">
      <Format.Title className="kw-mb-2" level={22}>
        {intl.get('exploreGraph.layout.config')}
      </Format.Title>
      <ConfigLine label={intl.get('exploreGraph.layout.linkDistance')}>
        <div className="slideInput">
          <Slider
            min={1}
            max={1000}
            value={linkDistance}
            onChange={value => onChange({ key: 'linkDistance', value })}
          />
          <InputNumber
            min={1}
            max={1000}
            value={linkDistance}
            onChange={value => onChange({ key: 'linkDistance', value })}
          />
        </div>
      </ConfigLine>
      <ConfigLine
        tip={intl.get('exploreGraph.layout.nodeStrengthNumbers')}
        label={intl.get('exploreGraph.layout.nodeStrength')}
      >
        <div className="slideInput">
          <Slider
            min={-300}
            max={300}
            value={nodeStrength}
            onChange={value => onChange({ key: 'nodeStrength', value })}
          />
          <InputNumber
            min={-300}
            max={300}
            value={nodeStrength}
            onChange={value => onChange({ key: 'nodeStrength', value })}
          />
        </div>
      </ConfigLine>
    </div>
  );
};

export default ConfigForce;
