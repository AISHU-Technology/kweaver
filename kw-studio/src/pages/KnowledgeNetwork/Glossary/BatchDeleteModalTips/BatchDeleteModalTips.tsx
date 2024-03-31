import React from 'react';
import UniversalModal from '@/components/UniversalModal';
import { Table } from 'antd';
import HOOKS from '@/hooks';
import intl from 'react-intl-universal';

type BatchDeleteTipsProps = {
  closeBatchDeleteModalTips: () => void;
  columns: any;
  successDataCount: any;
  failDataSource: any;
};
const BatchDeleteModalTips: React.FC<BatchDeleteTipsProps> = props => {
  const { closeBatchDeleteModalTips, columns, successDataCount, failDataSource } = props;
  const language = HOOKS.useLanguage();
  const prefixCls = 'BatchDeleteModalTips';
  return (
    <UniversalModal visible className={prefixCls} title={intl.get('global.tip')} onCancel={closeBatchDeleteModalTips}>
      {language === 'en-US' ? (
        <div>
          Deleted<span className="kw-c-primary kw-pl-1 kw-pr-1">{successDataCount}</span>term Library(s) and the other
          <span className="kw-c-error kw-pl-1 kw-pr-1">{failDataSource.length}</span>
          failed to be deleted. Failure details:
        </div>
      ) : (
        <div>
          已成功删除 <span className="kw-c-primary kw-pl-1 kw-pr-1">{successDataCount}</span>个术语库，另外
          <span className="kw-c-error kw-pl-1 kw-pr-1">{failDataSource.length}</span>
          个删除失败。失败详情如下：
        </div>
      )}
      <Table
        scroll={{ x: '100%', y: 300 }}
        className="kw-mt-3"
        columns={columns}
        dataSource={failDataSource}
        pagination={false}
      />
    </UniversalModal>
  );
};

export default BatchDeleteModalTips;
