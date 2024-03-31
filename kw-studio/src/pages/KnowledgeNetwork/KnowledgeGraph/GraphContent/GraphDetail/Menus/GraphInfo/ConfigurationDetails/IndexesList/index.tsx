import React from 'react';
import _ from 'lodash';
import { Tooltip } from 'antd';
import intl from 'react-intl-universal';

import Format from '@/components/Format';

import './style.less';

const IndexLine = (props: any) => {
  const { label, value, hasTip = false } = props;

  return (
    <div className="kw-align-center" style={{ alignItems: 'flex-start' }}>
      <div style={{ minWidth: 68 }}>{label}</div>
      <div>：</div>
      {hasTip ? (
        <Tooltip placement="topLeft" title={value}>
          <div className="kw-ellipsis">{value}</div>
        </Tooltip>
      ) : (
        <div className="properties">{value}</div>
      )}
    </div>
  );
};

type IndexType = {
  name: string;
  type: string;
  properties: { name: string; alias: string }[];
};
type IndexLineType = {
  items: IndexType[];
};
const IndexesList = (props: IndexLineType) => {
  const { items } = props;

  return (
    <div className="indexesListRoot">
      <div className="indexes kw-align-center kw-pb-3 kw-mb-4">
        <Format.Title>{intl.get('graphDetail.indexes')}</Format.Title>
        <Format.Text className="kw-c-subtext">（{items.length}）</Format.Text>
      </div>
      {_.isEmpty(items) ? (
        <Format.Text className="kw-w-100 kw-c-subtext " align="center">
          {intl.get('graphDetail.noContent')}
        </Format.Text>
      ) : (
        _.map(items, (item: IndexType, index) => {
          const { name, type, properties } = item;
          const propertiesType = Array.isArray(properties);
          return (
            <div key={index} className="imitationInput kw-mb-3">
              <IndexLine label="Name" value={name} hasTip={true} />
              <IndexLine label="Type" value={type} />
              <IndexLine
                label="Properties"
                value={
                  <>
                    {propertiesType ? (
                      _.map(properties, ({ name, alias }) => (
                        <div key={name} className="kw-ellipsis" title={`${alias || name}（${name}）`}>
                          {`${alias || name}（${name}）`}
                        </div>
                      ))
                    ) : (
                      <div>{properties}</div>
                    )}
                  </>
                }
              />
            </div>
          );
        })
      )}
    </div>
  );
};

export default IndexesList;
