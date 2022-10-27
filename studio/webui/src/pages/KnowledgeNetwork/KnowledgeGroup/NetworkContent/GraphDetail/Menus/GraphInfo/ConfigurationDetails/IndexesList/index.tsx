import React from 'react';
import _ from 'lodash';
import {Tooltip} from 'antd';
import intl from 'react-intl-universal';

import Format from '@/components/Format';

import './style.less';

const IndexLine = (props: any) => {
  const { label, value, hasTip = false } = props;

  return (
    <div className="ad-align-center ad-pb-2" style={{ alignItems: 'flex-start' }}>
      <div style={{ minWidth: 68 }}>{label}</div>
      <div>：</div>
      {hasTip ? (
        <Tooltip placement="topLeft" title={value}>
          <div className="ad-ellipsis">{value}</div>
        </Tooltip>
      ) : (
        <div className="ad-ellipsis">{value}</div>
      )}
    </div>
  );
};

type IndexType = {
  name: string;
  type: string;
  properties: string[];
};
type IndexLineType = {
  items: IndexType[];
};
const IndexesList = (props: IndexLineType) => {
  const { items } = props;

  return (
      <div className="indexesListRoot">
          <div className="indexes ad-align-center ad-pb-3 ad-mb-4">
              <Format.Title>Indexes</Format.Title>
              <Format.Text className="ad-c-subtext">（{items.length}）</Format.Text>
          </div>
          {_.isEmpty(items) ? (
              <Format.Text className="ad-w-100 ad-c-subtext " align="center">
                  {intl.get('graphDetail.noContent')}
              </Format.Text>
          ) : (
              _.map(items, (item: IndexType, index) => {
                  const {name, type, properties} = item;
                  const propertiesType = Array.isArray(properties);
                  return (
                      <div key={index} className="imitationInput ad-mb-3">
                          <IndexLine label="Name" value={name} hasTip={true}/>
                          <IndexLine label="Type" value={type}/>
                          <IndexLine
                              label="Properties"
                              value={
                                  <div className="properties">
                                      {propertiesType ? (
                                          _.map(properties, (d, i) => (
                                              <div key={i} className="span">
                                                  {d}
                                              </div>
                                          ))
                                      ) : (
                                          <div className="span">{properties}</div>
                                      )}
                                  </div>
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
