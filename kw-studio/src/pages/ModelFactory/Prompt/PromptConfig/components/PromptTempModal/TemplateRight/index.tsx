import React, { useState } from 'react';

import _ from 'lodash';
import { message } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';

import HELPER from '@/utils/helper';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import NoDataBox from '@/components/NoDataBox';
import PromptIcon from '@/components/PromptIcon';
import SearchInput from '@/components/SearchInput';
import { fuzzyMatch } from '@/utils/handleFunction';

import createImg from '@/assets/images/kgEmpty.svg';
import * as promptServices from '@/services/prompt';

import './style.less';

const getIconStyles = (color: string): React.CSSProperties => ({
  color,
  background: HELPER.hexToRgba(color, 0.06),
  border: `1px solid ${HELPER.hexToRgba(color, 0.15)}`
});

const TemplateRight = (props: any) => {
  const {
    showData,
    templates,
    isTemplate,
    setShowData,
    selectGroup,
    showTreeSelect,
    selectedPrompt,
    setSelectedPrompt
  } = props;

  const [searchQuery, setSearchQuery] = useState(''); // 搜索内容

  /**
   * 提示词模板名称搜索
   */
  const onSearchTemplate = _.debounce(e => {
    const { value } = e?.target;
    setSearchQuery(value);
    const data = isTemplate ? templates : showTreeSelect;
    const matchData: any = value
      ? _.filter(_.cloneDeep(data), (item: any) => fuzzyMatch(value, item?.prompt_name))
      : data;
    setShowData(matchData);
  }, 200);

  /**
   * 模板选择
   */
  const onSelect = (item: any) => {
    if (!isTemplate) {
      onGetPromptInfo(item?.prompt_id);
      return;
    }

    setSelectedPrompt((pre: any) => (pre.prompt_id === item.prompt_id ? {} : item));
  };

  /**
   * 提示词具体信息
   */
  const onGetPromptInfo = async (promptId: any) => {
    try {
      const { res } = (await promptServices.promptDetail({ prompt_id: promptId })) || {};
      if (res) {
        setSelectedPrompt((pre: any) => (pre.prompt_id === promptId ? {} : res));
      }
    } catch (err) {
      const { description } = err?.response || err?.data || err || {};
      description && message.error(description);
    }
  };

  return (
    <div className="prompt-temp-modal-right-root">
      {selectGroup ? (
        <div className="right-header-box kw-p-6 kw-pt-3 kw-pb-0">
          <div className="box-left kw-center">
            <IconFont type="icon-wenjianjia" className="kw-mr-3" />
            <div className="kw-ellipsis select-group-title" title={selectGroup?.split('/')?.[0]}>
              {selectGroup?.split('/')?.[0]}
            </div>
            {selectGroup?.split('/')?.[1] ? (
              <div className="kw-ellipsis select-group-title" title={selectGroup?.split('/')?.[1]}>
                /{selectGroup?.split('/')?.[1]}
              </div>
            ) : null}
          </div>
          <div className="box-right">
            <SearchInput
              placeholder={intl.get('prompt.searchTemplateName')}
              onChange={e => {
                e.persist();
                onSearchTemplate(e);
              }}
            />
          </div>
        </div>
      ) : null}

      {!_.isEmpty(showTreeSelect) || isTemplate ? (
        <div className="scroll-wrap kw-flex-item-full-height kw-pr-5 kw-pl-6">
          <div className="kw-space-between">
            {_.map(showData, item => {
              const { prompt_id, prompt_name, prompt_desc, iconProps, icon, prompt_type } = item;
              let iconStyles: any = {};
              if (iconProps?.color) {
                iconStyles = getIconStyles(iconProps?.color);
              }
              return (
                <div
                  key={prompt_id}
                  className={classNames('prompt-item kw-align-center kw-pointer', {
                    checked: selectedPrompt.prompt_id === prompt_id
                  })}
                  onClick={() => onSelect(item)}
                >
                  <div
                    className={classNames('kw-center kw-mr-2', { 'prompt-icon': iconProps?.color })}
                    style={iconProps?.color ? iconStyles : null}
                  >
                    {!iconProps?.color ? (
                      <PromptIcon icon={icon} type={prompt_type} className="kw-mr-2" />
                    ) : (
                      <IconFont type={iconProps.fontClass} />
                    )}
                  </div>
                  <div className="kw-flex-item-full-width">
                    <Format.Title className="kw-w-100 kw-mt-1" ellipsis title={prompt_name}>
                      {prompt_name}
                    </Format.Title>
                    <div
                      className={classNames('prompt-desc kw-c-text-lower kw-ellipsis-2', {
                        'kw-c-watermark': !prompt_desc
                      })}
                      title={prompt_desc || intl.get('global.notDes')}
                    >
                      {prompt_desc || intl.get('global.notDes')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : !isTemplate && !searchQuery ? (
        <div className="noDataBox">
          <NoDataBox className="kw-center noDataBox-div" imgSrc={createImg} desc={intl.get('prompt.noTemplate')} />
        </div>
      ) : null}

      {!showData.length && searchQuery ? (
        <div className="noData-box kw-content-center kw-w-100">
          <NoDataBox type="NO_RESULT" />
        </div>
      ) : null}
    </div>
  );
};

export default TemplateRight;
