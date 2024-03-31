import { Select, Form } from 'antd';
import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import PromptConfig from './PromptConfig';
import { modelPrompt } from './enums';

type modelConfigType = { model_type?: string; intent_prompt?: string; entity_prompt?: string };

type SelectModelType = {
  sourceModel: any[]; // 模型资源
  modelConfig: modelConfigType;
  form: any; // 表单对象
};

const SelectModel = (props: SelectModelType) => {
  const { modelConfig, sourceModel, form } = props;
  const [promptData, setPromptData] = useState<any>({});

  useEffect(() => {
    if (!modelConfig?.model_type) return;
    const { model_type } = modelConfig;
    const sourceModelKV = _.keyBy(sourceModel, 'sub_type');
    const mType = sourceModelKV[model_type] ? model_type : '';
    setPromptData(modelPrompt?.[mType]);
  }, [sourceModel, modelConfig?.model_type]);

  const onChangeModel = (e: any) => {
    const prompt = modelPrompt?.[e];
    setPromptData(prompt);
  };

  const onCheckModelType = () => {
    form.setFields([{ name: 'model_type', errors: [intl.get('global.noNull')] }]);
  };

  return (
    <div>
      <Form.Item
        label={intl.get('cognitiveSearch.qaAdvConfig.selectModel')}
        name="model_type"
        rules={[{ required: true, message: intl.get('global.noNull') }]}
      >
        <Select style={{ width: 292 }} onChange={onChangeModel} placeholder={intl.get('global.pleaseSelect')}>
          {_.map(sourceModel, item => {
            const label = item?.sub_type === 'private_llm' ? intl.get('cognitiveSearch.privateLLM') : 'OpenAI';
            return (
              <Select.Option key={item?.sub_type} value={item?.sub_type}>
                {label}
              </Select.Option>
            );
          })}
        </Select>
      </Form.Item>
      <Form.Item
        name="intent_prompt"
        rules={[
          { required: true, message: intl.get('global.noNull') },
          { max: 1000, message: intl.get('global.lenErr', { len: 1000 }) }
        ]}
      >
        <PromptConfig
          title={intl.get('cognitiveSearch.qaAdvConfig.promptConfig')}
          onCheckModelType={onCheckModelType}
          defaultPrompt={modelConfig?.intent_prompt}
          variables={promptData?.intent_prompt?.variables}
          tip={promptData?.intent_prompt?.tip || modelPrompt?.openai?.intent_prompt?.tip}
          promptTemplate={promptData?.intent_prompt?.promptTemplate}
        />
      </Form.Item>
      <Form.Item
        name="entity_prompt"
        rules={[
          { required: true, message: intl.get('global.noNull') },
          { max: 1000, message: intl.get('global.lenErr', { len: 1000 }) }
        ]}
      >
        <PromptConfig
          title={intl.get('cognitiveSearch.qaAdvConfig.entityConfig')}
          onCheckModelType={onCheckModelType}
          defaultPrompt={modelConfig?.entity_prompt}
          variables={promptData?.entity_prompt?.variables}
          tip={promptData?.entity_prompt?.tip || modelPrompt?.openai?.entity_prompt?.tip}
          promptTemplate={promptData?.entity_prompt?.promptTemplate}
        />
      </Form.Item>
    </div>
  );
};
export default SelectModel;
