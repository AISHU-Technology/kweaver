import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import TemplateModal from '@/components/TemplateModal';
import UniversalModal from '@/components/UniversalModal';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import NoDataBox from '@/components/NoDataBox';
import { localStore } from '@/utils/handleFunction';
import kongImg from '@/assets/images/kong.svg';

import './style.less';
import { Button } from 'antd';
import IconFont from '@/components/IconFont';
import KwScrollBar from '@/components/KwScrollBar';
const HistoryModal = (props: any) => {
  const { visible, onClose, sqlHistory, sqlKey, selectedItem, updateHistory, onClickHistory } = props;
  const [dataList, setDataList] = useState<any>([]);

  useEffect(() => {
    const historyList = localStore.get('sqlHistory')?.[sqlKey] || sqlHistory?.[selectedItem?.key];
    setDataList(historyList);
  }, [visible]);

  const onClear = (index?: number) => {
    if (_.isNumber(index)) {
      const curr = _.filter(dataList, (list, i: number) => i !== index);

      updateHistory(curr);
      setDataList(curr);
    } else {
      updateHistory([]);
      setDataList([]);
      onClose();
    }
  };

  // 点击将历史语句带入
  const clickHistoryItem = (item: any) => {
    onClickHistory(item);
    onClose();
  };
  return (
    <UniversalModal
      className="sql-history-modal"
      open={visible}
      title={intl.get('exploreGraph.history')}
      width={640}
      zIndex={2000}
      onCancel={onClose}
      footer={null}
      closeIcon={
        <div>
          <IconFont type="icon-guanbiquxiao" />
        </div>
      }
      footerData={[
        { label: intl.get('exploreGraph.clearTwo'), onHandle: () => onClear(), isDisabled: _.isEmpty(dataList) },
        { label: intl.get('exploreGraph.close'), type: 'primary', onHandle: onClose }
      ]}
    >
      <div>
        <div className="history-content">
          {_.isEmpty(dataList) ? (
            <div className="empty-box">
              <NoDataBox imgSrc={kongImg} desc={intl.get('exploreGraph.DataEmpty')} />
            </div>
          ) : (
            <KwScrollBar style={{ height: 497 }} isShowX={false}>
              {_.map(dataList, (item: any, index: number) => {
                return (
                  <div key={index} className="historyItem">
                    <div
                      className="kw-h-100 kw-align-center kw-border-b itemContent"
                      onClick={() => clickHistoryItem(item)}
                    >
                      <div className="kw-ellipsis-6 kw-pl-4 kw-c-header" style={{ width: 560 }} title={item}>
                        {item}
                      </div>
                      <IconFont
                        type="icon-lajitong"
                        className="deleteQuery"
                        onClick={e => {
                          e.stopPropagation();
                          onClear(index);
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </KwScrollBar>
          )}
        </div>
      </div>
    </UniversalModal>
  );
};

const mapStateToProps = (state: any) => ({
  sqlHistory: state.getIn(['sqlQueryHistory'])?.toJS()?.sqlHistory || ''
});

export default connect(mapStateToProps)(HistoryModal);
