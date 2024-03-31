import React, { useState, useEffect } from 'react';

import { Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table/interface';

import _ from 'lodash';
import intl from 'react-intl-universal';

import { getParam } from '@/utils/handleFunction';
import Format from '@/components/Format';
import emptyImg from '@/assets/images/empty.svg';
import kgEmpty from '@/assets/images/kgEmpty.svg';
import configEmpty from '@/assets/images/strategyEmpty.svg';
import importError from '@/assets/images/ImportError.svg';

import { TableType } from './types';

import './style.less';

const IntentionTable = (props: any) => {
  const { iconShow, onUploadDocument, docContent, editMes, intentionList, setIntentionList } = props;

  useEffect(() => {
    const { action } = getParam(['action']);
    if (_.isEmpty(docContent)) {
      return;
    }
    if (action === 'create') {
      onHandleMes(docContent.file?.response?.res);
    }
  }, [docContent]);

  useEffect(() => {
    if (_.isEmpty(editMes) && _.isEmpty(docContent)) {
      return;
    }
    onHandleMes(_.isEmpty(docContent) ? editMes : docContent.file?.response?.res);
  }, [editMes, docContent]);

  const onHandleMes = (data: any) => {
    const handleEditMes = _.map(data?.intent_entity_list, (item: any, index: any) => {
      item.intent_id = index + 1;
      if (typeof item?.entity_name === 'string') {
        item.entity_name = _.filter(item?.entity_name?.split("'"), (i: any) => {
          return i !== '[' && i !== ']' && i !== ', ';
        });
      }
      return item;
    });
    const entityHandle = _.map(handleEditMes, (e: any) => {
      if ((e.entity_name ? e.entity_name[0] : '[]') === '[]') {
        e.entity_name = [];
      }
      return e;
    });
    setIntentionList(entityHandle);
  };

  const columns: ColumnsType<TableType> = [
    {
      title: intl.get('intention.number'),
      key: 'intent_id',
      dataIndex: 'intent_id',
      width: 282
    },
    {
      title: intl.get('intention.name'),
      key: 'intent_name',
      dataIndex: 'intent_name',
      width: 576,
      render: (text: any, record: any) => (
        <div title={text} className="kw-ellipsis intention-over-length">
          {text}
        </div>
      )
    },
    {
      title: intl.get('intention.slot'),
      key: 'entity_name',
      dataIndex: 'entity_name',
      width: 552,
      render: (text: any, record: any) => (
        <div title={text.join('、')} className="kw-ellipsis name-length">
          {text.join('、')}
        </div>
      )
    }
  ];

  return (
    <div className="intention-deal-create-box">
      {iconShow === 'table' ? (
        <>
          <div className="kw-mt-5 kw-mb-4">
            <Format.Title className="kw-mr-2">{intl.get('intention.preview')}</Format.Title>
          </div>
          <Table
            columns={columns}
            dataSource={intentionList}
            pagination={false}
            rowKey="id"
            className="intention-slot-table"
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
      ) : (
        <div className="img-box">
          {iconShow === 'empty' && (
            <>
              <img src={kgEmpty} alt="empty" />
              <div>
                {intl.get('intention.uploadBtn').split('|')[0]}
                <span className="kw-c-primary kw-pointer" onClick={onUploadDocument}>
                  {intl.get('intention.uploadBtn').split('|')[1]}
                </span>
                {intl.get('intention.uploadBtn').split('|')[2]}
              </div>
            </>
          )}
          {iconShow === 'upload' && (
            <>
              <img src={configEmpty} alt="upload" />
              <div>{intl.get('intention.fileUploading')}</div>
            </>
          )}
          {iconShow === 'fail' && (
            <>
              <img src={importError} alt="upload" />
              <div>{intl.get('intention.fileFailed')}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default IntentionTable;
