import React, { useState, useEffect, useCallback } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Select, Slider, Switch, InputNumber } from 'antd';

import { GRAPH_LAYOUT_TREE_DIR } from '@/enums';
import Format from '@/components/Format';
import { ConfigLine } from '../../components';

import './style.less';

const GRAPH_LAYOUT_TREE_FIR_KVL = _.map(GRAPH_LAYOUT_TREE_DIR.getKeyValueList(), item => ({
  ...item,
  label: intl.get(item?.label)
}));

const ConfigTree = (props: any) => {
  const { defaultData, selectedItem } = props;
  const { onChangeConfig } = props;
  const [config, setConfig] = useState(_.isEmpty(defaultData) ? GRAPH_LAYOUT_TREE_DIR.DEFAULT_CONFIG : defaultData);
  const { direction, hGap, vGap, limit, isGroup } = config;

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
    if ((key === 'hGap' || key === 'vGap' || key === 'limit') && !value) newConfig[key] = 1;
    newConfig[key] = value;
    setConfig(newConfig);
    onCallback(newConfig);
  };

  return (
    <div className="configTreeRoot">
      <Format.Title className="kw-mb-2" level={22}>
        {intl.get('exploreGraph.layout.config')}
      </Format.Title>
      <ConfigLine label={intl.get('exploreGraph.layout.direction')}>
        <Select
          value={direction}
          style={{ width: '100%' }}
          options={GRAPH_LAYOUT_TREE_FIR_KVL}
          onChange={value => onChange({ key: 'direction', value })}
        />
      </ConfigLine>
      <ConfigLine label={intl.get('exploreGraph.layout.entitySpacing')}>
        <div className="slideInput">
          <Slider min={1} max={1000} value={hGap} onChange={value => onChange({ key: 'hGap', value })} />
          <InputNumber min={1} max={1000} value={hGap} onChange={value => onChange({ key: 'hGap', value })} />
        </div>
      </ConfigLine>
      <ConfigLine label={intl.get('exploreGraph.layout.layerSpacing')}>
        <div className="slideInput">
          <Slider min={1} max={1000} value={vGap} onChange={value => onChange({ key: 'vGap', value })} />
          <InputNumber min={1} max={1000} value={vGap} onChange={value => onChange({ key: 'vGap', value })} />
        </div>
      </ConfigLine>
      <ConfigLine label={intl.get('exploreGraph.layout.grouping')}>
        <Switch
          checked={isGroup}
          onChange={value => {
            selectedItem?.graph?.current.__removeSubGroups();
            onChange({ key: 'isGroup', value });
          }}
        />
      </ConfigLine>
      <ConfigLine
        label={intl.get('exploreGraph.layout.displayLimit')}
        tip={intl.get('exploreGraph.layout.displayMore')}
      >
        <div className="slideInput">
          <Slider min={1} max={1000} value={limit} onChange={value => onChange({ key: 'limit', value })} />
          <InputNumber min={1} max={1000} value={limit} onChange={value => onChange({ key: 'limit', value })} />
        </div>
      </ConfigLine>
    </div>
  );
};

export default ConfigTree;
