import React from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';

import './style.less';

const DisplayMore = (props: any) => {
  const { selectedItem } = props;
  const { onOpenDisplayModal } = props;

  return (
    <div className="displayMoreRoot">
      <div className="moreLine kw-c-subtext">{intl.get('exploreGraph.style.button')}</div>
      <div
        className="moreLine"
        onClick={() => {
          const more = _.find(selectedItem.graph?.current?.getNodes(), item => item?.getModel()?.class === '__more');
          const displayModalData = more?.getModel()?._sourceData
            ? { ...more?.getModel()?._sourceData, _class: '__more' }
            : {
                _class: '__more',
                icon: '',
                scope: 'all',
                type: 'customCircle',
                color: 'rgba(0,0,0,.25)',
                fillColor: 'rgba(0,0,0,.25)',
                strokeColor: 'rgba(0,0,0,.25)',
                position: 'top',
                labelLength: 15,
                showLabels: [{ key: 'more', alias: 'more', value: '更多', isChecked: true }]
              };
          onOpenDisplayModal(displayModalData);
        }}
      >
        <div className="btnIcon">BTN</div>
        <div>{intl.get('exploreGraph.style.moreButton')}</div>
      </div>
    </div>
  );
};

export default DisplayMore;
