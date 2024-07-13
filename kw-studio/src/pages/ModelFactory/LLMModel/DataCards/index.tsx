import React, { useRef } from 'react';
import { Divider, Tooltip } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import intl from 'react-intl-universal';

import IconFont from '@/components/IconFont';
import NoDataBox from '@/components/NoDataBox';
import { formatTime } from '@/utils/handleFunction';

import OperateBar from '../components/OperateBar';
import ModelIcon from '../components/ModelIcon';
import ApiButton from '../components/ApiButton';
import { OPERATE_ITEMS } from '../enums';
import { TableState, DataItem } from '../types';
import './style.less';

export interface DataCardsProps {
  className?: string;
  disabledStatus?: Record<string, boolean>;
  cardsData: DataItem[];
  tableState: TableState;
  modelConfig: any;
  onOperate?: (key: string, data: any) => void;
}

const DataCards = (props: DataCardsProps) => {
  const { className, disabledStatus = {}, cardsData, tableState, modelConfig, onOperate } = props;
  const containerDOM = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerDOM} className={classNames(className, 'llm-model-cards-root')}>
      <div className="kw-flex" style={{ flexWrap: 'wrap' }}>
        {_.map(cardsData, card => {
          const { model_id, model_name, model_series, update_time, update_by } = card;
          return (
            <div key={model_id} className="llm-model-cards-item kw-p-4">
              <div className="kw-align-center kw-mb-4">
                <ModelIcon size={32} type={model_series} modelConfig={modelConfig} />
                <div className="kw-flex-item-full-width kw-pl-2 kw-pr-2 kw-c-header kw-ellipsis" title={model_name}>
                  {model_name}
                </div>
                <OperateBar
                  items={OPERATE_ITEMS}
                  testLoading={tableState.testLoadingId === model_id}
                  disabledKeys={disabledStatus}
                  onItemClick={key => onOperate?.(key, card)}
                  getPopupContainer={() => containerDOM.current!}
                />
              </div>
              {/* <ApiButton className="kw-mb-5" onClick={() => onOperate?.('api', card)} /> */}
              <div className="kw-align-center kw-c-text-lower" style={{ fontSize: 12 }}>
                <div className="kw-ellipsis kw-mr-2" style={{ maxWidth: 56 }} title={update_by}>
                  {update_by || '- -'}
                </div>
                <Divider
                  type="vertical"
                  className="kw-m-0 kw-mr-2"
                  style={{ top: 0, height: '1em', borderColor: '#e5e5e5' }}
                />
                <IconFont type="icon-gengxinshijian" className="kw-mr-1" />
                <Tooltip title={intl.get('global.finalOperatorTime')}>
                  <span className="flex-item-full-width kw-ellipsis">{formatTime(update_time)}</span>
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>

      {!cardsData.length && (
        <div className="kw-center kw-mt-8 kw-p-4">
          <NoDataBox type="NO_RESULT" />
        </div>
      )}
    </div>
  );
};

export default DataCards;
