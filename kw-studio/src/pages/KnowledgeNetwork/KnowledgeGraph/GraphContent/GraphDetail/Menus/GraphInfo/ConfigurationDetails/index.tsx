import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Spin, message, Divider } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import serviceGraphDetail from '@/services/graphDetail';

import Format from '@/components/Format';
import PropertyList from './PropertyList';
import IndexesList from './IndexesList';

import flow4Empty from '@/assets/images/flow4Empty.svg';
import './style.less';
import IconFont from '@/components/IconFont';
import NoDataBox from '@/components/NoDataBox';

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

const HIDE_PRO = ['_ds_id_', '_timestamp_', '_name_']; // 内置属性不显示

const ConfigurationDetails = (props: any) => {
  const { selectedData, graphid, closeDrawer } = props;
  const { name, alias, color, fill_color, count } = selectedData?.data || {};

  const [isFetching, setIsFetching] = useState(false);
  const [source, setSource] = useState<any>({});
  const { indexes = [] } = source;
  const properties = _.filter(source.properties, p => !HIDE_PRO.includes(p.name));

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
      const { type, response } = error as any;
      if (type === 'message') message.error(response?.Description || '');
    }
  };
  return (
    <div className="configurationDetailsRoot">
      <div className="content">
        <div className="header">
          <div className="kw-space-between">
            <Format.Title level={20}>{intl.get('graphDetail.knGraphClassDetail')}</Format.Title>
            <Format.Button
              onClick={closeDrawer}
              className="kw-c-text kw-ml-1"
              size="small"
              tip={intl.get('global.close')}
              type="icon"
            >
              <IconFont type="icon-guanbiquxiao" />
            </Format.Button>
          </div>
          <Divider className="kw-mt-2 kw-mb-2" />
        </div>
        {_.isEmpty(selectedData) ? (
          <div className="configurationDetailsRoot-empty">
            <NoDataBox imgSrc={flow4Empty} desc={intl.get('graphDetail.clickTheEntityClassOrRelationship')} />
          </div>
        ) : (
          <Spin spinning={isFetching} indicator={<LoadingOutlined style={{ fontSize: 30 }} spin />}>
            <div className="nodeInfo kw-pb-3">
              <div>
                <div className="kw-c-subtext">
                  <span>{SHOW_TEXT[selectedData?.type].name || ''}</span>
                </div>
                <div className="imitationInput">
                  <div className="kw-align-center kw-w-100">
                    <div
                      className={classnames(SHOW_TEXT[selectedData?.type].className || '')}
                      style={{ backgroundColor: color || fill_color }}
                    />
                    <Format.Title className="kw-ellipsis" tip={name}>
                      {name}
                    </Format.Title>
                    <span className="kw-c-subtext">({count})</span>
                  </div>
                </div>
              </div>
              <Divider className="kw-mt-0 kw-mb-2" />
              <div>
                <div className="kw-c-subtext">
                  <Format.Text>{SHOW_TEXT[selectedData?.type].alias || ''}</Format.Text>
                </div>
                <div className="imitationInput">
                  <Format.Title className="kw-ellipsis">{alias}</Format.Title>
                </div>
              </div>
              <Divider className="kw-mt-0 kw-mb-2" />
            </div>
            <PropertyList items={properties} />
            {/* <IndexesList items={indexes} />*/}
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
