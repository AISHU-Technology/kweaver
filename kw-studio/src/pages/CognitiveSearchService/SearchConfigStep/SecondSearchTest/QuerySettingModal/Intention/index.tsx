import React, { useEffect, useState } from 'react';
import { Radio, Space } from 'antd';
import Format from '@/components/Format';

import _ from 'lodash';
import intl from 'react-intl-universal';
import IntentionTable from './IntentionTable';
import IntentionSelect from './IntentionSelect';

const Intention = (props: any) => {
  const { radioOpen, operateFail, intentId, setIntentId, saveRef, testData } = props;
  const [intentionList, setIntentionList] = useState<any>([]); // 表格中的意图数据
  const [loading, setLoading] = useState(false);

  return (
    <div className="intention-recognition-modal-table">
      {/* 开关开启展示意图 1-开启 0-关闭 */}
      <IntentionSelect
        setLoading={setLoading}
        intentionList={intentionList}
        setIntentionList={setIntentionList}
        intentId={intentId}
        setIntentId={setIntentId}
        testData={testData}
        radioOpen={radioOpen}
        isVisible={radioOpen === 1}
        ref={saveRef}
        operateFail={operateFail}
      />
      <IntentionTable
        intentionList={intentionList}
        loading={loading}
        isVisible={!_.isEmpty(intentionList)}
        radioOpen={radioOpen}
      />
    </div>
  );
};

export default Intention;
