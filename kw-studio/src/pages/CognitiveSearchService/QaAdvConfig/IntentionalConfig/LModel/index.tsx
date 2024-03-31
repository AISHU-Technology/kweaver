import React, { useEffect, useState } from 'react';
import { Upload, Input, Button, Form, Dropdown, message } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { FolderOpenOutlined, CloseCircleFilled } from '@ant-design/icons';
import IconFont from '@/components/IconFont';
import searchServices from '@/services/cognitiveSearch';
import RenderStep from '../../components/RenderStep';
import EmptyBox from '../../components/EmptyBox';
import IntentList from './IntentList';
import UploadFileTip from './ExplainTip';
import SelectModel from './SelectModel';
import { containsTemplateTags, initIntention, omitIntentId, updateGaConfig } from './assistant';
import { IntentionConfigType } from '..';
import classNames from 'classnames';
import TestLModel from './Test';

import './style.less';

interface LModelType extends IntentionConfigType {
  sourceModel: any[];
  onChangeView: (type: string, data: any) => void;
}
const LModel = (props: LModelType) => {
  const { configData, sourceModel, updateConfig, onChangeView, onPrev, onNext } = props;
  const [form] = Form.useForm();

  const [fileData, setFileData] = useState<any>();
  const [intentList, setIntentList] = useState<any[]>([]); // 意图列表
  const [modelConfig, setModelConfig] = useState<any>(); // 初始化模型配置
  const [showTest, setShowTest] = useState<{ config: any }>({ config: {} });

  /** 左侧步骤条 */
  const leftstep = [
    { label: 1, height: 62 },
    { label: 2, height: 374 },
    { label: 3, height: 0 }
  ];

  useEffect(() => {
    const { intent_list, model_type, intent_prompt, entity_prompt } = configData?.intent_config || {};
    const intentList = initIntention(intent_list);
    const sourceModelKV = _.keyBy(sourceModel, 'sub_type');
    const mType = sourceModelKV[model_type] ? model_type : undefined;
    setIntentList(intentList);
    setModelConfig({ model_type: mType, intent_prompt, entity_prompt });
    form.setFieldsValue({ model_type: mType, intent_prompt, entity_prompt });
  }, [configData?.intent_config?.intent_list, configData?.intent_config?.model_type]);

  /**
   * 切换为小模型配置
   */
  const onChangeMode = () => {
    const data: any = form.getFieldsValue();
    if (intentList?.length > 0) return onChangeView('small', true);
    if (data?.intent_prompt || data?.entity_prompt) return onChangeView('small', true);
    onChangeView('small', false);
  };

  /**
   *
   * @param data 更新后的意图
   * @param editData 编辑的数据 包括操作类型，原始数据、更新数据等
   */
  const updateIntention = (data: any[], editData?: any) => {
    if (editData) {
      // 更新图分析配置的字段
      const intent_binding = updateGaConfig(configData?.ga_config, editData);
      updateConfig({ ga_config: { intent_binding } });
    }
    setIntentList(data);
  };

  /** 校验提示词参数 */
  const checkParams = (values: { model_type: string; entity_prompt: string; intent_prompt: string }) => {
    // 校验提示词是否有参数
    if (values?.model_type === 'openai') {
      const initParamsErr = ['query', 'intent_map'].every(item => containsTemplateTags(values?.intent_prompt, [item]));
      const entityParamsErr = ['query', 'entity_info'].every(item =>
        containsTemplateTags(values?.entity_prompt, [item])
      );
      if (!initParamsErr) return message.error(intl.get('cognitiveSearch.qaAdvConfig.intParamsError'));
      if (!entityParamsErr) return message.error(intl.get('cognitiveSearch.qaAdvConfig.entParamsError'));
    }
    if (values?.model_type === 'private_llm') {
      const initParamsErr = ['query', 'intent_map'].every(item => containsTemplateTags(values?.intent_prompt, [item]));

      const entityParamsErr = ['query', 'entity_info'].every(item =>
        containsTemplateTags(values?.entity_prompt, [item])
      );
      if (!initParamsErr) return message.error(intl.get('cognitiveSearch.qaAdvConfig.intParamsError'));
      if (!entityParamsErr) return message.error(intl.get('cognitiveSearch.qaAdvConfig.llmEntParamsError'));
    }
    return false;
  };

  // 下一步更新数据
  const onClickNext = async () => {
    if (_.isEmpty(intentList)) return message.error(intl.get('cognitiveSearch.qaAdvConfig.intentNoNull'));
    form
      .validateFields()
      .then(values => {
        const intent_list = omitIntentId(intentList);
        const haserror = checkParams(values);
        if (haserror) return;
        updateConfig({ intent_config: { intent_list, ...values } });
        onNext();
      })
      .catch(err => {
        const doc = document.getElementsByClassName('LModelLeft')?.[0];
        if (doc) {
          setTimeout(() => {
            doc.scrollTop = doc.scrollHeight + 24;
          }, 100);
        }
      });
  };

  const onValuesChange = (change: any, values: any) => {
    if (_.has(change, 'model_type')) {
      form.setFieldsValue({ intent_prompt: '', entity_prompt: '' });
    }
  };

  /** 测试 */
  const onTextCheck = () => {
    if (_.isEmpty(intentList)) return message.error(intl.get('cognitiveSearch.qaAdvConfig.intentNoNull'));
    return form
      .validateFields()
      .then(values => {
        const haserror = checkParams(values);
        if (haserror) return;
        setShowTest({ config: values });
        return values;
      })
      .catch(err => {
        message.error(intl.get('cognitiveSearch.qaAdvConfig.promptnotNull'));
        const doc = document.getElementsByClassName('LModelLeft')?.[0];
        if (doc) {
          setTimeout(() => {
            doc.scrollTop = doc.scrollHeight + 24;
          }, 100);
        }
        return false;
      });
  };

  const prop: any = {
    name: 'file',
    accept: '.yaml,.yml',
    showUploadList: false,
    customRequest: () => false,
    beforeUpload(file: any, fileList: any) {
      if (file.size > 1024 * 1024 * 10) {
        message.error(intl.get('intention.support'));
        return false;
      }
      onUploadFile(file);
      return false;
    }
  };

  const onUploadFile = async (file: any) => {
    try {
      const res = await searchServices.parseModel({ file });
      if (res?.res) {
        const list = initIntention(res?.res);
        setIntentList(list);
        setFileData(file);
      }
      if (res?.ErrorCode === 'KnCognition.CheckDataErr') {
        const name = file.name.split('.');
        const fileType = name[name.length - 1];
        if (!['yml', 'yaml'].includes(fileType)) {
          return message.error(intl.get('intention.format'));
        }
        return message.error(intl.get('cognitiveSearch.qaAdvConfig.fileError'));
      }

      res?.Description && message.error(res?.Description);
    } catch (err) {
      const { Description } = err || err?.response || err || err?.data || {};

      message.error(Description);
    }
  };

  return (
    <div className="configLModelRoot">
      <div className="kw-flex lModelContent">
        <div className="LModelLeft ">
          <div className="kw-flex">
            <div className="kw-mr-3">
              {leftstep?.map(item => {
                return <RenderStep key={item?.label} index={item?.label} height={item?.height} />;
              })}
            </div>
            <div className="kw-flex-item-full-width">
              <div className="kw-space-between kw-mb-2 kw-pl-3" style={{ width: 392 }}>
                <span>
                  <span className="kw-mr-1">{intl.get('cognitiveSearch.qaAdvConfig.selectFile')}</span>
                  <UploadFileTip />
                </span>
                <span className="kw-c-primary kw-pointer" onClick={onChangeMode}>
                  {intl.get('cognitiveSearch.qaAdvConfig.switchSModel')}
                </span>
              </div>
              <Upload {...prop} className="kw-ml-3">
                <Input
                  className="upFileInput"
                  prefix={<FolderOpenOutlined style={{ opacity: '0.45', color: 'rgba(0,0,0,0.65)' }} />}
                  value={fileData?.name}
                  placeholder={intl.get('analysisService.importService.pleaseUpload')}
                  style={{ width: 392 }}
                  suffix={
                    fileData?.name && (
                      <CloseCircleFilled
                        className="suffixIcon"
                        onClick={e => {
                          e.stopPropagation();
                          setFileData('');
                        }}
                      />
                    )
                  }
                />
              </Upload>
              <div className="kw-mt-8 kw-w-100 kw-mb-6" style={{ height: 380, overflowY: 'auto' }}>
                <IntentList fileName={fileData?.name} intentList={intentList} updateIntention={updateIntention} />
              </div>
              <Form form={form} onValuesChange={onValuesChange} layout="vertical">
                <SelectModel form={form} sourceModel={sourceModel} modelConfig={modelConfig} />
              </Form>
            </div>
          </div>
        </div>

        <div className="kw-flex-item-full-width">
          {/* 测试页面 */}
          <TestLModel
            intentList={intentList}
            sourceModel={sourceModel}
            modelConfig={showTest?.config}
            onTextCheck={onTextCheck}
          />
        </div>
      </div>
      <div className="config-footer kw-center">
        <div>
          <Button onClick={onPrev}>{intl.get('global.cancel')}</Button>
          <Button className="kw-ml-2" type="primary" onClick={onClickNext}>
            {intl.get('global.next')}
          </Button>
        </div>
      </div>
    </div>
  );
};
export default LModel;
