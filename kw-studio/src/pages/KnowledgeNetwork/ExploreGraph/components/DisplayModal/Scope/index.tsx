import React from 'react';
import intl from 'react-intl-universal';
import { Radio, Space } from 'antd';

const SCOPE_ONE: any = { node: 'exploreGraph.style.currentEntity', edge: 'exploreGraph.style.currentRelationship' };
const SCOPE_ALL: any = { node: 'exploreGraph.style.allEntity', edge: 'exploreGraph.style.allRelationship' };

const Scope = (props: any) => {
  const { modalType, updateData } = props;
  const { onChangeData, onUpdateStyle } = props;

  const onChangeRadio = (e: any) => {
    const value = e.target.value;
    onUpdateStyle({ ...updateData, scope: value });

    if (value === 'all') {
      const key = updateData._class || updateData.class;
      const newConfig: any = { node: {}, edge: {}, more: {}, type: value };
      newConfig[modalType][key] = updateData;
      onChangeData({ type: 'config', data: newConfig });
    }
  };

  return (
    <div>
      <Radio.Group onChange={onChangeRadio} value={updateData.scope}>
        <Space direction="vertical">
          <Radio value="one">{intl.get(SCOPE_ONE[modalType])}</Radio>
          <Radio value="all">{intl.get(SCOPE_ALL[modalType])}</Radio>
        </Space>
      </Radio.Group>
    </div>
  );
};

export default Scope;
