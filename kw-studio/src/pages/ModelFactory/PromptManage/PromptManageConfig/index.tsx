import React, { useState, useEffect, useRef } from 'react';

import intl from 'react-intl-universal';

import _ from 'lodash';
import { message } from 'antd';
import { useHistory } from 'react-router-dom';

import TipModal from '@/components/TipModal';
import { getParam } from '@/utils/handleFunction';
import AdExitBar from '@/components/AdExitBar/AdExitBar';

import * as promptServices from '@/services/prompt';

import PromptConfig from './PromptConfig';

import './style.less';

const PromptManageConfig = () => {
  const backRef = useRef<any>();
  const [promptName, setPromptName] = useState<any>('');
  const [projectList, setProjectList] = useState<any>([]); // 所有分组
  const [exitVisible, setExitVisible] = useState(false); // 退出弹窗
  const [isChange, setIsChange] = useState(false); // 是否更改配置 更改-弹出退出弹窗

  useEffect(() => {
    const { name } = getParam(['name']);
    setPromptName(name);
    getData();
  }, []);

  /**
   * 获取数据
   * @param state 各种状态
   * @param isMount 是否是初始化
   * @param targetData 触发选中
   */
  const getData = async () => {
    try {
      const action = getParam('action');
      const { res } =
        (await promptServices.promptProjectList({
          prompt_item_name: '',
          page: 1,
          size: 1000,
          is_management: true
        })) || {};
      if (res) {
        setProjectList(res?.data || []);
      }
    } catch (err) {
      const { description } = err?.response || err?.data || err || {};
      description && message.error(description);
    }
  };

  /**
   * 保存并关闭
   */
  const saveAndExit = async () => {
    setExitVisible(false);
    await Promise.resolve();
    backRef?.current?.handleSave();
  };

  /**
   * 放弃保存
   */
  const unSaveAndExit = async () => {
    setExitVisible(false);
    await Promise.resolve();
    backRef?.current?.onBack();
  };

  /**
   * 退出
   */
  const onExit = () => {
    if (isChange) {
      setExitVisible(true);
    } else {
      backRef?.current?.onBack();
    }
  };

  return (
    <div className="kw-column-center prompt-manage-config-wrap-root kw-h-100">
      <AdExitBar
        onExit={() => onExit()}
        title={
          <span className="kw-align-center">
            <div className="kw-mr-1 kw-flex">
              <div className="kw-ellipsis thesaurus-name" title={promptName || intl.get('prompt.createPrompt')}>
                {promptName || intl.get('prompt.createPrompt')}
              </div>
            </div>
          </span>
        }
      />
      <PromptConfig ref={backRef} projectList={projectList} setIsChange={setIsChange} onExit={onExit} />
      <TipModal
        visible={exitVisible}
        title={intl.get('prompt.exitTitle')}
        content={intl.get('prompt.exitContent')}
        okText={intl.get('prompt.saveClose')}
        cancelText={intl.get('prompt.abandon')}
        keyboard={false}
        closable
        onOk={saveAndExit}
        onCancel={unSaveAndExit}
        onClose={() => setExitVisible(false)}
      />
    </div>
  );
};

export default PromptManageConfig;
