import React from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import Format from '@/components/Format';
import { Button, Select } from 'antd';
import { ParamEmpty } from '../../../components/EmptyBox';

import './style.less';
import KwTable from '@/components/KwTable';
const ParamSlotConfig = (props: any) => {
  const { currentIntention, onChangeBindSlot, clearSlotConfig } = props;

  const columns: any[] = [
    {
      title: intl.get('function.parameter'),
      ellipsis: true,
      dataIndex: 'param'
    },
    {
      title: intl.get('cognitiveSearch.intention.slot'),
      dataIndex: 'slot',
      width: 296,
      render: (slot: any, record: any) => {
        const value = _.find(currentIntention?.binding_info, item => item?.param === record?.param);
        return (
          <Select
            style={{ width: 248 }}
            value={value?.slot || undefined}
            placeholder={intl.get('cognitiveSearch.intention.select')}
            onChange={key => onSelectedSlot(key, record)}
          >
            {_.map(currentIntention?.slots, item => {
              return <Select.Option key={item?.name}>{item?.name}</Select.Option>;
            })}
          </Select>
        );
      }
    },
    {
      title: intl.get('function.showName'),
      dataIndex: 'alias'
    },
    {
      title: intl.get('function.type'),
      dataIndex: 'type',
      render: (text: string) => (text === 'entity' ? intl.get('function.entity') : intl.get('function.string'))
    },
    {
      title: intl.get('function.example'),
      ellipsis: true,
      dataIndex: 'example'
    }
  ];

  const onSelectedSlot = (value: any, record: any) => {
    onChangeBindSlot({ ...record, slot: value });
  };

  return (
    <div className="paramSlotConfigRoot">
      <Format.Title className="kw-mb-4 kw-mt-1" style={{ fontSize: 16 }}>
        {intl.get('cognitiveSearch.qaAdvConfig.bindSlot')}
      </Format.Title>
      <div className="kw-align-center">
        <span className="tipIcon" />
        <span className="kw-c-subtext kw-ml-2">{intl.get('cognitiveSearch.qaAdvConfig.bindSlotTip1')}</span>
      </div>
      <div className="kw-align-center kw-mb-6">
        <span className="tipIcon" />
        <span className="kw-c-subtext kw-ml-2"> {intl.get('cognitiveSearch.qaAdvConfig.bindSlotTip2')}</span>
      </div>
      {currentIntention?.graph_info?.params?.length > 0 ? (
        <div>
          <KwTable
            showHeader={false}
            scroll={{ x: '100%', y: 300 }}
            rowKey={(record: any) => record?.param}
            columns={columns}
            dataSource={currentIntention?.binding_info}
            pagination={false}
          />
          <Button onClick={clearSlotConfig} className="kw-mt-6">
            {intl.get('cognitiveSearch.qaAdvConfig.clearPrams')}
          </Button>
        </div>
      ) : (
        <ParamEmpty
          desc={
            !currentIntention?.kg_id || !currentIntention?.graph_info?.statements
              ? intl.get('cognitiveSearch.qaAdvConfig.selectKgFirst')
              : intl.get('cognitiveSearch.qaAdvConfig.noSlot')
          }
        />
      )}
    </div>
  );
};
export default ParamSlotConfig;
