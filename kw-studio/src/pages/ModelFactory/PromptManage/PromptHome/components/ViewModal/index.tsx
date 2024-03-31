import React, { useEffect, useState } from 'react';

import _ from 'lodash';
import { message } from 'antd';
import intl from 'react-intl-universal';

import * as promptServices from '@/services/prompt';
import UniversalModal from '@/components/UniversalModal';

import ViewLeftInfo from './ViewLeftInfo';
import ViewRightVariable from './ViewRightVariable';

import './style.less';

const ViewModal = (props: any) => {
  const { visible, setViewModal, recordData } = props;
  const [editInfoData, setEditInfoData] = useState<any>({}); // 某一具体信息

  useEffect(() => {
    if (!visible) return;
    init(recordData);
  }, [recordData, visible]);

  /**
   * 查看某一具体信息
   */
  const init = async (data: any) => {
    try {
      const { res } = await promptServices.promptDetail({ prompt_id: data?.prompt_id });
      if (res) {
        setEditInfoData(res);
      }
    } catch (err) {
      const { description } = err?.response || err?.data || err || {};
      description && message.error(description);
    }
  };

  return (
    <UniversalModal
      visible={visible}
      width={'1000px'}
      maskClosable={false}
      className="view-prompt-modal-root"
      onCancel={() => setViewModal(false)}
      title={intl.get('prompt.viewPrompt')}
    >
      <div className="kw-flex">
        <div className="view-prompt-left kw-pt-4 kw-pl-6">
          <ViewLeftInfo recordData={recordData} />
        </div>
        <div className="view-prompt-right kw-pl-5 kw-pt-4 kw-pb-6 kw-pr-6">
          <ViewRightVariable editInfoData={editInfoData} />
        </div>
      </div>
    </UniversalModal>
  );
};

export default ViewModal;
