import React from 'react';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Divider } from 'antd';

import Format from '@/components/Format';

import './style.less';

const Line = (props: any) => {
  const { tip, label, value, isEllipsis = true, className } = props;

  return (
    <div className={classnames('ad-pb-4', className)}>
      <div className="ad-pb-2">
        <Format.Text className="ad-c-subtext" noHeight={true}>
          {label}
        </Format.Text>
      </div>
      <div>
        <Format.Text tip={tip} className={classnames('ad-c-header', 'ad-w-100', { 'ad-ellipsis': isEllipsis })}>
          {value || (value === 0 ? 0 : '--')}
        </Format.Text>
      </div>
    </div>
  );
};

interface BasicInfoInterface {
  graphBasicData: {
    name: string;
    status: string;
    graph_des: string;
    is_import: boolean;
    create_time: string;
    update_time: string;
    graphdb_name: string;
    graphdb_address: string;
  };
}

const BasicInfo = (props: BasicInfoInterface) => {
  const { graphBasicData } = props;
  const { graph_des, is_import, create_time, update_time, graphdb_name, graphdb_address } = graphBasicData;

  return (
    <div className="basicInfoRoot">
      <div className="content ad-p-5 ad-pt-4">
        <div className="header ad-pb-2 ad-mb-3">
          <Format.Title level={22}>{intl.get('graphDetail.kgGeneralProperties')}</Format.Title>
        </div>
        <Line label="ID" value={graphdb_name} />
        <Line
          label={intl.get('graphDetail.creationWay')}
          value={is_import ? intl.get('graphDetail._import') : intl.get('graphDetail.manually')}
        />
        <Line label={intl.get('graphDetail.storageLocation')} value={graphdb_address} />
        <Line label={intl.get('graphDetail.description')} isEllipsis={false} value={graph_des} />
        <Divider className="divider" />
        <Line label={intl.get('graphDetail.creationTime')} value={create_time} />
        <Line label={intl.get('graphDetail.finalModificationTime')} value={update_time || '--'} />
      </div>
    </div>
  );
};

export default (props: any) => {
  const { isShow, ...other } = props;
  if (!isShow) return null;
  return <BasicInfo {...other} />;
};
