import React, { useEffect, useState } from 'react';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table/interface';
import emptyImg from '@/assets/images/empty.svg';
import AdSpin from '@/components/AdSpin';

import _ from 'lodash';
import intl from 'react-intl-universal';

import './style.less';

const IntentionTable = (props: any) => {
  const { loading, isVisible } = props;
  const { intentionList } = props;
  const [intentTableData, setIntentTableData] = useState<any>([]);

  useEffect(() => {
    onHandleFormat(intentionList);
  }, [intentionList]);

  /**
   * 槽位数据格式处理
   */
  const onHandleFormat = (data: any) => {
    const handleEditMes = _.map(data, (item: any, index: any) => {
      item.intent_id = index + 1;
      if (typeof item?.entity_name === 'string') {
        item.entity_name = _.filter(item?.entity_name?.split("'"), (i: any) => {
          return i !== '[' && i !== ']' && i !== ', ';
        });
      }
      return item;
    });
    const entityHandle = _.map(handleEditMes, (e: any) => {
      if (e.entity_name[0] === '[]') {
        e.entity_name = [];
      }
      return e;
    });
    setIntentTableData(entityHandle);
  };

  const columns: ColumnsType<any> = [
    {
      title: intl.get('cognitiveSearch.intention.no'),
      key: 'intent_id',
      dataIndex: 'intent_id',
      width: 212
    },
    {
      title: intl.get('cognitiveSearch.intention.intentName'),
      key: 'intent_name',
      dataIndex: 'intent_name',
      width: 276,
      render: (text: any, record: any) => (
        <div title={text} className="kw-ellipsis intention-over-length">
          {text}
        </div>
      )
    },
    {
      title: intl.get('cognitiveSearch.intention.slot'),
      key: 'entity_name',
      dataIndex: 'entity_name',
      width: 264,
      render: (text: any, record: any) => (
        <div title={text.join('、')} className="kw-ellipsis name-length">
          {text.join('、')}
        </div>
      )
    }
  ];

  return (
    <div className="intention-cognitive-modal-table">
      {isVisible ? (
        <>
          <div className={`loading-mask ${loading && 'spinning'}`}>
            <AdSpin />
          </div>
          <Table
            columns={columns}
            dataSource={intentTableData}
            pagination={false}
            rowKey={record => record?.intentpool_id}
            className="search-intention-slot-table-root"
            locale={{
              emptyText: (
                <div className="empty-box">
                  <img src={emptyImg} className="empty-img" alt="nodata"></img>
                  <div className="empty-content">{intl.get('intention.noData')}</div>
                </div>
              )
            }}
          />
        </>
      ) : null}
    </div>
  );
};

export default IntentionTable;
