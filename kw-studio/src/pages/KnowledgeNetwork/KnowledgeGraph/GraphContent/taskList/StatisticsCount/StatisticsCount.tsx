import React, { useEffect, useMemo } from 'react';
import './style.less';
import UniversalModal from '@/components/UniversalModal';
import intl from 'react-intl-universal';
import { message, Table, Tooltip } from 'antd';
import IconFont from '@/components/IconFont';
import numToThousand from '@/utils/handleFunction/NumToThousand';
import Format from '@/components/Format';
import servicesSubGraph from '@/services/subGraph';
import { useLanguage } from '@/hooks/useLanguage';
import HOOKS from '@/hooks';

const StatisticsCount = ({ collapseStatistic, setCollapseStatistic, data }: any) => {
  const language = HOOKS.useLanguage();

  const getNumber = (value: number) => {
    if (value && value !== 0) {
      return numToThousand(value);
    }
    return '--';
  };

  const dataSource = useMemo(() => {
    return [
      {
        title: (
          <span className="kw-space-between" title={intl.get('task.classCount')}>
            <span>{intl.get('task.classCount')}</span>
            <Tooltip title={intl.get('task.classTip')}>
              <IconFont className="kw-c-watermark" type="icon-wenhao" />
            </Tooltip>
          </span>
        ),
        entity: getNumber(data.entity_num),
        edge: getNumber(data.edge_num),
        key: '1'
      },
      {
        title: (
          <span className="kw-space-between" title={intl.get('task.propCount')}>
            <span>{intl.get('task.propCount')}</span>
            <Tooltip title={intl.get('task.propTip')}>
              <IconFont className="kw-c-watermark" type="icon-wenhao" />
            </Tooltip>
          </span>
        ),
        entity: getNumber(data.entity_pro_num),
        edge: getNumber(data.edge_pro_num),
        key: '2'
      },
      {
        title: (
          <span className="kw-space-between" title={intl.get('task.knowledgeCount')}>
            <span>{intl.get('task.knowledgeCount')}</span>
            <Tooltip title={intl.get('task.knowledgeTip')}>
              <IconFont className="kw-c-watermark" type="icon-wenhao" />
            </Tooltip>
          </span>
        ),
        entity: getNumber(data.graph_entity),
        edge: getNumber(data.graph_edge),
        key: '3'
      }
    ];
  }, []);

  const columns = [
    {
      title: (
        <Format.Button
          title={intl.get('global.unExpand')}
          type="text"
          onClick={() => {
            setCollapseStatistic(true);
          }}
        >
          <IconFont type="icon-fanye" />
        </Format.Button>
      ),
      dataIndex: 'title',
      ellipsis: true
      // width: 110，
    },
    {
      title: intl.get('global.entityClass'),
      dataIndex: 'entity',
      ellipsis: true
    },
    {
      title: intl.get('global.relationClass'),
      dataIndex: 'edge',
      ellipsis: true
    }
  ];

  return (
    <div
      style={{ width: language === 'zh-CN' ? 292 : 540 }}
      className="StatisticsCount-modal"
      title={intl.get('task.statisticsCount')}
    >
      <Table bordered size="small" columns={columns} dataSource={dataSource} pagination={false} />
    </div>
  );
};

export default StatisticsCount;
