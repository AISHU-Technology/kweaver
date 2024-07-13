import React, { useState, useEffect } from 'react';

import _ from 'lodash';
import { message } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';

import { PROMPT_CONFIGS } from '@/enums';
import * as promptServices from '@/services/prompt';
import UniversalModal from '@/components/UniversalModal';

import TemplateLeft from './TemplateLeft';
import { TTemplates } from '../../../types';
import TemplateRight from './TemplateRight';

import './style.less';

export interface PromptTempModalProps {
  className?: string;
  visible?: boolean;
  templates: TTemplates;
  promptManageList?: any;
  type: 'chat' | 'completion' | string;
  onOk?: (data: TTemplates[number]) => void;
  onCancel?: () => void;
  formData?: any;
}

const iconMap: Record<string, { fontClass: string; color: string }> = {
  answer: { fontClass: 'icon-tishicimoban1', color: '#126ee3' },
  recommend: { fontClass: 'icon-tishicimoban2', color: '#126ee3' },
  document: { fontClass: 'icon-tishicimoban3', color: '#52C41A' },
  extract: { fontClass: 'icon-tishicimoban4', color: '#019688' },
  sql: { fontClass: 'icon-tishicimoban5', color: '#ff8501' },
  robot9: { fontClass: 'icon-color-prompt9', color: '#52c41a' },
  robot6: { fontClass: 'icon-color-prompt6', color: '#126ee3' }
};

/**
 * 内置prompt模板弹窗
 */
const PromptTempModal = (props: PromptTempModalProps) => {
  const { className, visible, templates, onOk, onCancel, promptManageList, formData } = props;
  const [selectedPrompt, setSelectedPrompt] = useState<TTemplates[number]>({} as any);
  const [showData, setShowData] = useState<TTemplates>([...templates]);
  const [showTreeSelect, setShowTreeSelect] = useState<any>([]);
  const [isTemplate, setIsTemplate] = useState(false);
  const [selectGroup, setSelectGroup] = useState<any>('');

  /**
   * 获取分词管理列表
   */
  const getData: Function = async (node: any) => {
    try {
      const { res } =
        (await promptServices.promptList({
          prompt_item_id: node?.parentKey,
          prompt_item_type_id: node?.key,
          prompt_name: '',
          rule: 'create_time',
          order: 'desc',
          deploy: 'all',
          prompt_type: 'all',
          page: 1,
          size: 1000,
          is_management: true
        })) || {};
      if (res) {
        const { data, total } = res;
        const filterData = _.filter(_.cloneDeep(data), (item: any) => item?.prompt_type === formData?.prompt_type);
        setShowTreeSelect(filterData);
        setShowData(filterData);
      }
    } catch (err) {
      const { description } = err?.response || err?.data || err || {};
      description && message.error(description);
    }
  };

  /**
   * 创建
   */
  const handleOk = () => {
    onOk?.(selectedPrompt);
  };

  return (
    <UniversalModal
      className={classNames(className, 'manage-default-prompt-modal')}
      title={intl.get('prompt.template')}
      open={visible}
      width={1000}
      onCancel={onCancel}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        { label: intl.get('global.ok'), type: 'primary', isDisabled: _.isEmpty(selectedPrompt), onHandle: handleOk }
      ]}
    >
      <div className="default-prompt-modal-content kw-flex" style={{ height: 504 }}>
        <div className="default-prompt-left">
          <TemplateLeft
            getData={getData}
            templates={templates}
            setShowData={setShowData}
            setIsTemplate={setIsTemplate}
            setSelectGroup={setSelectGroup}
            promptManageList={promptManageList}
            setShowTreeSelect={setShowTreeSelect}
          />
        </div>
        <div className="default-prompt-right">
          <TemplateRight
            showData={showData}
            templates={templates}
            isTemplate={isTemplate}
            setShowData={setShowData}
            selectGroup={selectGroup}
            showTreeSelect={showTreeSelect}
            selectedPrompt={selectedPrompt}
            setSelectedPrompt={setSelectedPrompt}
          />
        </div>
      </div>
    </UniversalModal>
  );
};

export default (props: Omit<PromptTempModalProps, 'templates'>) => {
  const { type, formData } = props;
  const [templates, setTemplates] = useState<TTemplates>([]);
  const [promptManageList, setPromptManageList] = useState<any>([]);

  useEffect(() => {
    getData(type);
    onGetPromptManageList();
  }, [type]);

  /**
   * 获取提示词管理列表
   */
  const onGetPromptManageList = async () => {
    try {
      const { res } =
        (await promptServices.promptProjectList({
          prompt_item_name: '',
          page: 1,
          size: 1000,
          is_management: true
        })) || {};
      if (res) {
        const { data } = res;
        setPromptManageList(data || []);
      }
    } catch (err) {
      const { description } = err?.response || err?.data || err || {};
      description && message.error(description);
    }
  };

  /**
   * 获取模板
   */
  const getData = async (type: PromptTempModalProps['type']) => {
    const { res }: any = (await promptServices.promptTemplateGet({ prompt_type: type })) || {};
    if (res?.data) {
      const data = _.map(res.data, (d, i: number) => {
        let iconProps = iconMap[d.icon];
        if (!iconProps) {
          const icons = PROMPT_CONFIGS.getIcons(type);
          iconProps = icons[i % icons.length];
        }
        return { ...d, iconProps };
      });
      setTemplates(data);
    }
  };

  return props.visible ? (
    <PromptTempModal {...props} templates={templates} promptManageList={promptManageList} formData={formData} />
  ) : null;
};
