import React from 'react';
import { Select, Divider } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';

import { RELATION } from '../enums';

export default function GroupLine(props: { value: any; onChange: (data: any) => void }) {
  const { value, onChange } = props;
  return (
    <div className="kw-align-center">
      <Divider orientation="center">
        <Select
          className={'relationSelect'}
          style={{ minWidth: 64 }}
          value={value}
          bordered={false}
          onChange={e => onChange(e)}
          getPopupContainer={() => document.getElementById('serviceRulesId')!}
        >
          {_.map(RELATION, op => {
            return (
              <Select.Option value={op.value} key={op.value}>
                {intl.get(op.label)}
              </Select.Option>
            );
          })}
        </Select>
      </Divider>
    </div>
  );
}
