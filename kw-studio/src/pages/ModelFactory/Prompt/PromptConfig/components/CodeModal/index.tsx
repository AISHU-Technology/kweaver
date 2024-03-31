import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';

import * as promptServices from '@/services/prompt';
import PromptEditor, { importModes, importThemes } from '@/components/PromptEditor';
import IconFont from '@/components/IconFont';
import UniversalModal from '@/components/UniversalModal';
import { copyToBoard } from '@/utils/handleFunction';

import DataRow from './DataRow';
import { formatCode } from '../../utils';
import './style.less';

import useConfigStore from '../../useConfigStore';

importModes(['python']);
importThemes(['monokai']);

export interface CodeModalProps {
  className?: string;
  visible?: boolean;
  onCancel?: () => void;
}

const CodeModal = (props: CodeModalProps) => {
  const { className, visible, onCancel } = props;
  const { configStore } = useConfigStore();
  const { promptInfo, modelData, modelOptions } = configStore;
  const [code, setCode] = useState('');
  const [url, setUrl] = useState(() => {
    return window.origin + `/api/model-factory/v1/prompt-used/${promptInfo.prompt_id}`;
  });

  useEffect(() => {
    if (promptInfo.prompt_id) getCodeTemp();
  }, [promptInfo.prompt_id]);

  useEffect(() => {
    const codeText = formatCode({ ...modelData, model_para: { ...modelOptions } });
    setCode(codeText);
  }, [modelOptions, modelData]);

  const getCodeTemp = async () => {
    try {
      const { res } =
        (await promptServices.promptCodeGet({ model_id: modelData.model_id, prompt_id: promptInfo.prompt_id })) || {};
      if (!res) return;
      setUrl(window.origin + res.prompt_deploy_url);
    } catch (err) {
      //
    }
  };

  const onCopy = async (text: string) => {
    const isSuccess = await copyToBoard(text);
    isSuccess && message.success(intl.get('exploreAnalysis.copySuccess'));
  };

  return (
    <UniversalModal
      className={classNames(className, 'mf-prompt-code-modal')}
      title="查看代码"
      visible={visible}
      onCancel={onCancel}
    >
      <div>
        <div className="kw-mb-4 kw-c-header">您可以使用以下代码开始将当前的提示和设置集成到您的应用程序中。</div>
        <div className="editor-header kw-space-between">
          <div>{/* POST/v1/完成 */}</div>
          <div className="kw-align-center" onClick={() => onCopy(code)}>
            <span>Python</span>
            <div className="kw-ml-4 kw-pointer">
              <IconFont type="icon-copy" className="kw-mr-1" />
              {intl.get('global.copy')}
            </div>
          </div>
        </div>
        <PromptEditor
          height={promptInfo.prompt_deploy ? 280 : 400}
          mode="python"
          theme="monokai"
          value={code}
          readOnly
          options={{ lineNumbers: true }}
        />

        {!!promptInfo.prompt_deploy && (
          <>
            <DataRow className="kw-mt-4" title="终端" value={url} onCopy={onCopy} />

            {promptInfo.model_series === 'openai' && (
              <>
                <DataRow
                  className="kw-mt-4"
                  title="KEY"
                  label={'*'.repeat(modelData.model_config?.api_key?.length)}
                  value={modelData.model_config?.api_key}
                  onCopy={onCopy}
                />

                <div className="openai-warning kw-mt-4 kw-c-subtext">
                  请将这个密钥保存在安全且易于访问的地方。出于安全原因，您将无法通过 OpenAI
                  帐户再次查看它。如果您丢失了该密钥，则需要生成一个新密钥。
                </div>
              </>
            )}
          </>
        )}
      </div>
    </UniversalModal>
  );
};

export default (props: CodeModalProps) => (props.visible ? <CodeModal {...props} /> : null);
