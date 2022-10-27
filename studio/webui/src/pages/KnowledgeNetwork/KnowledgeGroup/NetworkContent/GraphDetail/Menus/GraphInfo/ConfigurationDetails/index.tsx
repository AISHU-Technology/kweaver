import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Spin, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import serviceGraphDetail from '@/services/graphDetail';

import Format from '@/components/Format';
import PropertyList from './PropertyList';
import IndexesList from './IndexesList';

import flow4Empty from '@/assets/images/flow4Empty.svg';
import './style.less';

const SHOW_TEXT: any = {
  entity: {
    className: 'point',
    name: intl.get('graphDetail.entity'),
    alias: intl.get('graphDetail.entityAlias')
  },
  edge: {
    className: 'line',
    name: intl.get('graphDetail.edge'),
    alias: intl.get('graphDetail.edgeAlias')
  }
};

const ConfigurationDetails = (props: any) => {
  const { selectedData, graphid } = props;
  const { name, alias, color, count } = selectedData?.data || {};

  const [isFetching, setIsFetching] = useState(false);
  const [source, setSource] = useState<any>({});
  const { indexes = [], properties = [] } = source;

  useEffect(() => {
    if (_.isEmpty(selectedData?.data)) return;
    getData();
  }, [JSON.stringify(selectedData)]);

  const getData = async () => {
    try {
      setIsFetching(true);
      const result = await serviceGraphDetail.graphGetInfoDetail({ graph_id: graphid, name, type: selectedData?.type });
      setSource(result?.res || {});
      setIsFetching(false);
    } catch (error) {
      setIsFetching(false);
      const { type = '', response = {} } = (error || {}) as any;
      if (type === 'message') message.error(response?.Description || '');
    }
  };

  return (
    <div className="configurationDetailsRoot">
      <div className="content ad-p-5 ad-pt-4">
        <div className="header ad-pb-2 ad-mb-3">
          <Format.Title level={22}>{intl.get('graphDetail.categoryInformation')}</Format.Title>
        </div>
        {_.isEmpty(selectedData) ? (
          <div className="empty">
            <img className="ad-mb-2" src={flow4Empty} />
            <Format.Text style={{ textAlign: 'center', padding: '0px 24px' }}>
              {intl.get('graphDetail.clickTheEntityClassOrRelationship')}
            </Format.Text>
          </div>
        ) : (
          <Spin spinning={isFetching} indicator={<LoadingOutlined style={{ fontSize: 30 }} spin />}>
            <div className="nodeInfo ad-pb-3">
              <div className="ad-pb-4">
                <div className="ad-pb-2">
                  <Format.Text>{SHOW_TEXT[selectedData?.type].name || ''}</Format.Text>
                </div>
                <div className="imitationInput">
                  <div className="ad-align-center ad-w-100">
                    <div
                      className={classnames(SHOW_TEXT[selectedData?.type].className || '')}
                      style={{ backgroundColor: color }}
                    />
                    <Format.Title className="ad-ellipsis" tip={name}>
                      {name}
                    </Format.Title>
                  </div>
                </div>
              </div>
              <div className="ad-pb-4">
                <div className="ad-pb-2">
                  <Format.Text>{SHOW_TEXT[selectedData?.type].alias || ''}</Format.Text>
                </div>
                <div className="imitationInput">
                  <Format.Text className="ad-ellipsis">{alias}</Format.Text>
                </div>
              </div>
            </div>

            <PropertyList items={properties} />
            <IndexesList items={indexes} />
          </Spin>
        )}
      </div>
    </div>
  );
};

export default (props: any) => {
  const { isShow, ...other } = props;
  if (!isShow) return null;
  return <ConfigurationDetails {...other} />;
};
