import React, { useImperativeHandle, forwardRef, useRef } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Button } from 'antd';
import IconFont from '@/components/IconFont';
import Format from '@/components/Format';
import ExplainTip from '@/components/ExplainTip';

import Sql from './Sql';
import MyTable from './Table';
import { CONTENT_TYPE } from '../enums';

import emptyImg from '@/assets/images/flow4Empty.svg';
import error from '@/assets/images/ImportError.svg';
import create from '@/assets/images/create.svg';

import './style.less';

type TypeDataContent = {
  dataError: any; // 预览报错
  loading: boolean; // 加载表格的数据
  treeData: any[];
  contentKey: string;
  tableData: any[];
  tableTitle: string[];
  activeCol: string;
  selectedData: any;
  onLoadData: (node: any, refresh: string) => void;
  onChangeModalVisible: (data: boolean) => void;
};
const DomainDataContent = (props: TypeDataContent, ref: any) => {
  const { loading, treeData, contentKey, dataError, tableData, tableTitle, activeCol, selectedData } = props;
  const { onLoadData, onChangeModalVisible } = props;
  const contentRef = useRef<any>();

  useImperativeHandle(ref, () => ({ onInsert }));

  const onInsert = (value: any) => {
    contentRef?.current?.onInsert(value);
  };

  const isEmpty = treeData.length === 0 || (treeData.length === 1 && treeData[0]?.title === '');

  return (
    <div className="dataSourceQueryContent">
      {isEmpty ? (
        <div className="contentEmpty">
          <img src={create} />
          <div className="kw-c-text-lower">
            {intl.get('domainData.clickLeftToolbar').split('|')[0]}
            <Button type="link" style={{ minWidth: 0, padding: '0 4px' }} onClick={() => onChangeModalVisible(true)}>
              <IconFont type="icon-Add" />
            </Button>
            {intl.get('domainData.clickLeftToolbar').split('|')[1]}
          </div>
        </div>
      ) : (
        contentKey === '' && (
          <div className="contentEmpty">
            <img src={dataError ? error : emptyImg} />
            <div className="kw-c-text-lower">{dataError || intl.get('domainData.contentEmpty')}</div>
          </div>
        )
      )}
      {contentKey === CONTENT_TYPE.SHOW_TABLE && (
        <div className="contenWrapper kw-border ">
          <div className="kw-space-between" style={{ height: 40 }}>
            <div className="kw-align-center">
              <IconFont type="icon-Datatable" />
              <span title={selectedData.title} className="kw-ellipsis sheetName">
                {selectedData.title}
              </span>
            </div>
            <div className="kw-align-center">
              <IconFont className="kw-c-warning kw-mr-1" type="icon-Warning" />
              <Format.Text>{intl.get('domainData.showTop500')}</Format.Text>
              <Format.Button
                className="kw-ml-2"
                type="icon"
                tip={intl.get('global.refresh')}
                onClick={() => onLoadData(selectedData, 'refresh')}
              >
                <IconFont type="icon-tongyishuaxin" />
              </Format.Button>
            </div>
          </div>
          <MyTable
            className="tableWrapper"
            loading={loading}
            tableData={tableData}
            tableTitle={tableTitle}
            activeCol={activeCol}
          />
        </div>
      )}
      {contentKey === CONTENT_TYPE.SHOW_SQL && <Sql selectedData={selectedData} ref={contentRef} />}
    </div>
  );
};
export default forwardRef(DomainDataContent);
