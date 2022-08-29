import React from 'react';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Divider } from 'antd';

import HELPER from '@/utils/helper';

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
  graphCount: {
    nodeCount: number;
    edgeCount: number;
  };
  graphBasicData: {
    name: string;
    status: string;
    graph_des: string;
    is_import: boolean;
    create_time: string;
    create_user: string;
    update_user: string;
    update_time: string;
    graphdb_name: string;
    graphdb_address: string;
  };
}

const BasicInfo = (props: BasicInfoInterface) => {
  const { graphCount, graphBasicData } = props;
  const { nodeCount, edgeCount } = graphCount;
  const { graph_des, is_import, create_time, create_user, update_user, update_time, graphdb_name, graphdb_address } =
    graphBasicData;

  const formatNode =
    nodeCount < HELPER.formatNumberWithSuffix.limit
      ? nodeCount
      : `${intl.get('graphDetail.about')}${HELPER.formatNumberWithSuffix(nodeCount)} (${HELPER.formatNumberWithComma(
          nodeCount
        )})`;

  const formatEdge =
    edgeCount < HELPER.formatNumberWithSuffix.limit
      ? edgeCount
      : `${intl.get('graphDetail.about')}${HELPER.formatNumberWithSuffix(edgeCount)} (${HELPER.formatNumberWithComma(
          edgeCount
        )})`;

  return (
    <div className="basicInfoRoot">
      <div className="content ad-p-5 ad-pt-4">
        <div className="header ad-pb-2 ad-mb-3">
          <Format.Title level={22}>{intl.get('graphDetail.kgGeneralProperties')}</Format.Title>
        </div>
        <Line label={intl.get('graphDetail.storageLocation')} value={graphdb_name} />
        <Line
          label={intl.get('graphDetail.creationWay')}
          value={is_import ? intl.get('graphDetail._import') : intl.get('graphDetail.manually')}
        />
        <Line label="存储位置" value={graphdb_address} />
        <Line label={intl.get('graphDetail.description')} isEllipsis={false} value={graph_des} />
        <Divider className="divider" />
        <Line label={intl.get('graphDetail.numberOfEntity')} value={formatNode} />
        <Line label={intl.get('graphDetail.numberOfRelation')} value={formatEdge} />
        <Divider className="divider" />
        <Line label={intl.get('graphDetail.creationPerson')} value={create_user} />
        <Line label={intl.get('graphDetail.creationTime')} value={create_time} />
        <Line label={intl.get('graphDetail.finalModifier')} value={update_user || '--'} />
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
