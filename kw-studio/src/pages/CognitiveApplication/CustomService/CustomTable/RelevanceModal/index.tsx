import React, { useEffect, useState } from 'react';
import { Modal, Select } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import AdKnowledgeNetIcon from '@/components/AdKnowledgeNetIcon/AdKnowledgeNetIcon';
// import kgImg from '@/assets/images/knGraph.svg';

import './style.less';
import IconFont from '@/components/IconFont';

const RelevanceModal = (props: any) => {
  const { visible, relevanceList, setRelevanceModal } = props;
  const [kgList, setKgList] = useState<any[]>(relevanceList?.[0]?.resource_kgs);

  useEffect(() => {
    setKgList(relevanceList?.[0]?.resource_kgs);
  }, [relevanceList]);

  return (
    <Modal
      visible={visible}
      onCancel={() => setRelevanceModal(false)}
      title={intl.get('customService.associateGraph')}
      footer={null}
      className="custom-config-service-relevance-modal-root"
    >
      <Select
        style={{ width: '100%' }}
        labelInValue
        defaultValue={relevanceList?.[0]?.knw_id}
        onChange={(e: any, op: any) => setKgList(op?.data)}
      >
        {_.map(relevanceList, item => {
          return (
            <Select.Option key={item?.knw_id} data={item?.resource_kgs}>
              <AdKnowledgeNetIcon type={item?.color} className="kw-mr-2" /> {item?.name}
            </Select.Option>
          );
        })}
      </Select>
      <div className="relevance-name-wrap">
        {_.map(kgList, (item: any) => {
          return (
            <div key={item?.kg_id} className="kw-flex relevance-name-box ">
              {/* <img src={kgImg} /> */}
              <IconFont type="icon-color-zhishitupu11" style={{ fontSize: 16 }} />
              <div className="kw-ml-2 kw-ellipsis name-content" title={item?.kg_name}>
                {item?.kg_name}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

export default (props: any) => (props?.visible ? <RelevanceModal {...props} /> : null);
