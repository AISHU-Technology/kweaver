import React, { useEffect, useRef } from 'react';

import _ from 'lodash';
import intl from 'react-intl-universal';
import { Tooltip, Switch, message } from 'antd';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import { copyToBoard } from '@/utils/handleFunction';
import PromptEditor, { uniquePromptId } from '@/components/PromptEditor';

import './style.less';
import KwTable from '@/components/KwTable';

const ViewRightVariable = (props: any) => {
  const { editInfoData } = props;
  const editRef = useRef<any>();

  useEffect(() => {
    onHandlePromptEditor(editInfoData?.variables);
  }, [editInfoData]);

  /**
   * 编译器显示信息处理
   */
  const onHandlePromptEditor = (data: any) => {
    const variables = _.map(data, v => ({ ...v, id: uniquePromptId() }));
    editRef?.current?.init?.(editInfoData?.messages, { variables });
  };

  /**
   * 复制
   */
  const onCopy = () => {
    copyToBoard(editRef?.current?.getValue() || '');
    message.success(intl.get('global.copySuccess'));
  };

  const columns = [
    {
      title: intl.get('prompt.varName'),
      dataIndex: 'var_name',
      ellipsis: true
    },
    {
      title: intl.get('prompt.fieldName'),
      dataIndex: 'field_name',
      ellipsis: true
    },
    {
      title: intl.get('prompt.required'),
      dataIndex: 'optional',
      render: (text: any, record: any) => <Switch size="small" checked={!text} disabled={true} />
    }
  ];

  return (
    <div className="prompt-modal-view-right-variable-root">
      <div className="kw-mb-2 view-header-box">
        <div className="view-header-title kw-align-center">
          <Format.Title>{intl.get('prompt.prompt')}</Format.Title>
          <Tooltip className="kw-ml-2" title={intl.get('prompt.promptTip')}>
            <IconFont type="icon-wenhao" style={{ opacity: '0.65' }} />
          </Tooltip>
        </div>

        <div className="kw-pointer kw-c-primary view-header-copy" onClick={onCopy}>
          {intl.get('global.copy')}
        </div>
      </div>
      <div className="right-code-mirror kw-mb-3">
        <PromptEditor height={'251px'} ref={editRef} readOnly={true} />
      </div>
      {editInfoData?.variables?.length ? (
        <>
          <div className="kw-mb-2 kw-mt-4">
            <Format.Title>{intl.get('prompt.var')}</Format.Title>
            <Tooltip title={intl.get('prompt.promptTip')} className="kw-ml-2">
              <IconFont type="icon-wenhao" style={{ opacity: 0.65 }} />
            </Tooltip>
          </div>
          <KwTable
            className="view-table-root"
            showHeader={false}
            columns={columns}
            dataSource={editInfoData?.variables}
          />
        </>
      ) : null}
    </div>
  );
};

export default ViewRightVariable;
