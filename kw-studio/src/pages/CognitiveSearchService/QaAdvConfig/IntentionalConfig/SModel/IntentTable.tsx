import React, { useRef } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import Format from '@/components/Format';
import KwTable from '@/components/KwTable';
import emptyImg from '@/assets/images/empty.svg';
import HOOKS from '@/hooks';

const IntentTable = (props: any) => {
  const { slotsList } = props;
  const { height: winHeight } = HOOKS.useWindowSize(); // 屏幕高度
  const tableHeight = winHeight - 374; // 计算表格的高度

  const columns = [
    {
      title: intl.get('cognitiveSearch.intention.no'),
      dataIndex: '1',
      render: () => 1
    },
    {
      title: intl.get('cognitiveSearch.intention.intentName'),
      dataIndex: 'intent_name',
      ellipsis: true
    },
    {
      title: intl.get('cognitiveSearch.intention.slot'),
      dataIndex: 'entity_name',
      render: (text: any) => {
        return (
          <div title={_.join(text, '、')} className="kw-ellipsis name-length">
            {_.join(text, '、')}
          </div>
        );
      }
    }
  ];
  return (
    <div className="kw-mt-8 kw-w-100">
      <Format.Title className="kw-mb-3">{intl.get('cognitiveSearch.qaAdvConfig.datapreview')}</Format.Title>

      {!_.isEmpty(slotsList) ? (
        <KwTable
          showHeader={false}
          scroll={{ x: '100%', y: tableHeight }}
          columns={columns}
          dataSource={slotsList}
          pagination={false}
        />
      ) : (
        <div className="kw-center" style={{ flexDirection: 'column', marginTop: 120 }}>
          <img src={emptyImg} />
          <p className="kw-c-text-lower">{intl.get('cognitiveSearch.qaAdvConfig.selectPool')}</p>
        </div>
      )}
    </div>
  );
};
export default IntentTable;
