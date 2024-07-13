import React from 'react';
import intl from 'react-intl-universal';
import _ from 'lodash';
import TemplateModal from '@/components/TemplateModal';
import IconFont from '@/components/IconFont';
import KwKNIcon from '@/components/KwKNIcon';
// import kgImg from '@/assets/images/knGraph.svg';

type GraphModalType = {
  visible: boolean;
  data?: any[];
  onCancel: () => void;
};

const GraphModal = (props: GraphModalType) => {
  const { visible, data, onCancel } = props;

  return (
    <TemplateModal
      open={visible}
      className="corGraphModal"
      title={intl.get('exploreAnalysis.corGraphTitle')}
      width={480}
      footer={null}
      onCancel={onCancel}
    >
      <div style={{ padding: '20px 24px 28px' }}>
        <div
          className="kw-align-center kw-w-100 kw-ellipsis kw-border kw-pl-3"
          title={data?.[0]?.name}
          style={{ height: 40, borderBottom: 'none' }}
        >
          <KwKNIcon style={{ marginRight: 6 }} type={data?.[0]?.color} />
          <div title={data?.[0]?.name} className="kw-ellipsis">
            {data?.[0]?.name}
          </div>
        </div>
        <div className="kw-border" style={{ height: 442, overflowY: 'auto' }}>
          {_.map(data?.[0]?.resource_kgs, item => {
            return (
              <div className="kw-align-center kw-pl-3 kw-pr-3" style={{ height: 40 }}>
                <IconFont type="icon-color-zhishitupu11" style={{ fontSize: 16 }} />
                <div className="kw-ellipsis kw-ml-2" style={{ maxWidth: 380 }} title={item?.kg_name}>
                  {item?.kg_name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </TemplateModal>
  );
};
export default (props: GraphModalType) => (props?.visible ? <GraphModal {...props} /> : null);
