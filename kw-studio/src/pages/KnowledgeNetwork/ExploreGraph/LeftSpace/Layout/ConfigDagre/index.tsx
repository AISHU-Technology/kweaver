import React, { useState, useEffect, useCallback } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Select, Slider, InputNumber } from 'antd';

import { GRAPH_LAYOUT_DAGRE_DIR } from '@/enums';
import Format from '@/components/Format';
import { ConfigLine } from '../../components';

import './style.less';

const GRAPH_LAYOUT_DAGRE_DIR_KVL: any = _.map(GRAPH_LAYOUT_DAGRE_DIR.getKeyValueListDir(), item => ({
  ...item,
  label: intl.get(item?.label)
}));
const GRAPH_LAYOUT_DAGRE_ALIGN_KVL: any = _.map(GRAPH_LAYOUT_DAGRE_DIR.getKeyValueListAlign(), item => ({
  ...item,
  label: intl.get(item?.label)
}));

const ConfigDagre = (props: any) => {
  const { defaultData } = props;
  const { onChangeConfig } = props;
  const [config, setConfig] = useState(_.isEmpty(defaultData) ? GRAPH_LAYOUT_DAGRE_DIR.DEFAULT_CONFIG : defaultData);
  const { direction, align, nodesep, ranksep } = config || {};

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
    if ((key === 'nodesep' || key === 'ranksep') && !value) newConfig[key] = 1;
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
          options={GRAPH_LAYOUT_DAGRE_DIR_KVL}
          onChange={value => onChange({ key: 'direction', value })}
        />
      </ConfigLine>
      <ConfigLine label={intl.get('exploreGraph.layout.align')}>
        <Select
          value={align}
          style={{ width: '100%' }}
          options={GRAPH_LAYOUT_DAGRE_ALIGN_KVL}
          onChange={value => onChange({ key: 'align', value })}
        />
      </ConfigLine>
      <ConfigLine label={intl.get('exploreGraph.layout.entitySpacing')}>
        <div className="slideInput">
          <Slider min={1} max={1000} value={nodesep} onChange={value => onChange({ key: 'nodesep', value })} />
          <InputNumber min={1} max={1000} value={nodesep} onChange={value => onChange({ key: 'nodesep', value })} />
        </div>
      </ConfigLine>
      <ConfigLine label={intl.get('exploreGraph.layout.layerSpacing')}>
        <div className="slideInput">
          <Slider min={1} max={1000} value={ranksep} onChange={value => onChange({ key: 'ranksep', value })} />
          <InputNumber min={1} max={1000} value={ranksep} onChange={value => onChange({ key: 'ranksep', value })} />
        </div>
      </ConfigLine>
    </div>
  );
};

export default ConfigDagre;
