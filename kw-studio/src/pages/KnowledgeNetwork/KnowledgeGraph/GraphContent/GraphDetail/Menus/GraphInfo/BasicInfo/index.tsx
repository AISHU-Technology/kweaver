import React from 'react';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Divider, Typography } from 'antd';
import Format from '@/components/Format';

import './style.less';
import IconFont from '@/components/IconFont';

const { Paragraph } = Typography;
const Line = (props: any) => {
  const { tip, label, value, multiple = false, className } = props;
  const valueText = value || (value === 0 ? 0 : '--');
  return (
    <div className={classnames('kw-mb-2', className)}>
      <div className="kw-c-subtext">{label}</div>
      <div className="kw-align-center" style={{ minHeight: 40 }} title={valueText}>
        {multiple ? (
          <Paragraph ellipsis={{ rows: 3 }}>{valueText}</Paragraph>
        ) : (
          <span className="kw-ellipsis">{valueText}</span>
        )}
      </div>
    </div>
  );
};

interface BasicInfoInterface {
  graphBasicData: {
    name: string;
    id: number;
    status: string;
    graph_des: string;
    is_import: boolean;
    create_time: string;
    create_user: string;
    update_user: string;
    update_time: string;
    graphdb_address: string;
    graphdb_dbname: string;
  };
  graphCount: {
    nodeCount: number;
    edgeCount: number;
  };
  closeDrawer?: () => void;
}

const BasicInfo = (props: BasicInfoInterface) => {
  const { graphBasicData, graphCount, closeDrawer } = props;
  const { id, graph_des, is_import, create_time, create_user, update_user, update_time, graphdb_dbname } =
    graphBasicData;

  return (
    <div className="basicInfoRoot">
      <div className="content">
        <div className="header kw-border-b kw-space-between">
          <Format.Title level={20}>{intl.get('graphDetail.knGraphOverview')}</Format.Title>
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
        <Line className="kw-mt-5" label="图谱ID" value={id} />
        <Line label="图空间名称" value={graphdb_dbname} />
        <Line
          label={intl.get('graphDetail.creationWay')}
          value={is_import ? intl.get('graphDetail._import') : intl.get('graphDetail.manually')}
        />
        <Line label={intl.get('graphDetail.description')} multiple={true} value={graph_des} />
        <Divider className="divider" />
        <Line label="实体数量" value={graphCount.nodeCount} />
        <Line label="关系数量" value={graphCount.edgeCount} />
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
