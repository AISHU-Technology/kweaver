import React, { useRef } from 'react';
import { Divider, Tooltip, message } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import intl from 'react-intl-universal';

import NoDataBox from '@/components/NoDataBox';
import IconFont from '@/components/IconFont';
import { copyToBoard, formatTime } from '@/utils/handleFunction';

import PromptIcon from '../../components/PromptIcon';
import OperateBar from '@/pages/ModelFactory/LLMModel/components/OperateBar';
import { getOperateMenu } from '../../enums';
import { PromptItem } from '../../types';
import './style.less';

export interface DataCardsProps {
  className?: string;
  cardsData: PromptItem[];
  onOperate?: (key: string, data: any) => void;
}

const Line = () => (
  <Divider type="vertical" className="kw-m-0 kw-mr-2" style={{ top: 0, height: '1em', borderColor: '#e5e5e5' }} />
);

const DataCards = (props: DataCardsProps) => {
  const { className, cardsData, onOperate } = props;
  const containerDOM = useRef<HTMLDivElement>(null);

  const copyId = async (id: string) => {
    const isSuccess = await copyToBoard(id);
    isSuccess && message.success(intl.get('exploreAnalysis.copySuccess'));
  };

  return (
    <div ref={containerDOM} className={classNames(className, 'manage-prompt-home-cards-root kw-flex')}>
      {_.map(cardsData, card => {
        const { prompt_id, prompt_type, prompt_name, prompt_desc, icon, prompt_deploy, update_by, update_time } = card;
        return (
          <div
            key={prompt_id}
            className="prompt-home-cards-item kw-p-4 kw-pointer"
            onClick={() => onOperate?.('check', card)}
          >
            <div className="kw-align-center kw-mb-4">
              <PromptIcon icon={icon} type={prompt_type} />
              <div className="kw-flex-item-full-width kw-pl-2 kw-pr-2 kw-c-header kw-ellipsis" title={prompt_name}>
                {prompt_name}
              </div>
              <Tooltip title={intl.get('global.copy') + ' ID'}>
                <div
                  className="llm-op-bar-root kw-center kw-pointer"
                  onClick={e => {
                    e.stopPropagation();
                    copyId(prompt_id);
                  }}
                >
                  <IconFont type="icon-copy" />
                </div>
              </Tooltip>
              <OperateBar
                items={getOperateMenu(prompt_deploy)}
                onItemClick={key => onOperate?.(key, card)}
                getPopupContainer={() => containerDOM.current!}
              />
            </div>
            <div className="prompt-desc kw-ellipsis-2 kw-mb-3 kw-c-text-lower" title={prompt_desc}>
              {prompt_desc || <span className="kw-c-watermark">{intl.get('global.notDes')}</span>}
            </div>

            <div className="prompt-status kw-align-center kw-c-text-lower">
              <div className="kw-ellipsis kw-mr-2" style={{ maxWidth: 56 }} title={update_by}>
                {update_by || '- -'}
              </div>
              <Line />
              <IconFont type="icon-gengxinshijian" className="kw-mr-1" />
              <Tooltip title={intl.get('global.finalOperatorTime')}>
                <span className="flex-item-full-width kw-ellipsis">{formatTime(update_time)}</span>
              </Tooltip>
            </div>
          </div>
        );
      })}

      {!cardsData.length && (
        <div className="kw-center kw-w-100 kw-mt-8 kw-p-4">
          <NoDataBox.NO_RESULT />
        </div>
      )}
    </div>
  );
};

export default DataCards;
