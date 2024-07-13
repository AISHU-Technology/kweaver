/**
 * 发布图分析服务
 */
import React, { useState, useEffect, useRef } from 'react';
import { Button, Form, Input, Checkbox, Radio, ConfigProvider, message } from 'antd';
import { useHistory } from 'react-router-dom';
import intl from 'react-intl-universal';
import _ from 'lodash';
import cognitiveSearchService from '@/services/cognitiveSearch';
import intentionService from '@/services/intention';
import { knowModalFunc } from '@/components/TipModal';
import HOOKS from '@/hooks';
import { ANALYSIS_SERVICES, ONLY_NORMAL_NAME } from '@/enums';
import WangEditor from '@/components/WangEditor';
import { getTextByHtml, getParam, localStore } from '@/utils/handleFunction';
import {
  onHandleConfig,
  onHandleIntention,
  onHandleGraph,
  initConfs,
  getPropertyRes,
  checkProperty
} from './assistFunction';
import { BasicData } from '../types';
import './style.less';
import { handleKnwCardKgId, handleRelatedKgId } from '../SecondSearchTest/assistFunction';

const { text, ACCESS_METHOD, PERMISSION } = ANALYSIS_SERVICES;

export interface PublishProps {
  basicData: BasicData;
  testData: any;
  onChange?: (data: Partial<BasicData>) => void;
  onPrev: (state: any) => void;
  setIsPrevent: (bool?: any) => void;
  setOperateFail: (state: any) => void;
  setTestData: (state: any) => void;
  setIsQAConfigError: (state: any) => void;
  kgqaConfig: any;
  kgqaData: any;
  checked: any;
  isOpenQA: boolean;
  setKgqaData: any;
  setKgqaConfig: any;
  qaError: string;
  externalModel: any[];
  isSaved: boolean;
  emError: boolean;
  setIsSaved: (boole: boolean) => void;
}

type PublishField = Pick<BasicData, 'name' | 'description' | 'access_method' | 'permission'>;

const ERROR_CODE: Record<string, string> = {
  'KnCognition.ServicePermissionDeniedErr': intl.get('license.serAuthError'),
  'KnCognition.GraphPermissionDeniedErr': intl.get('analysisService.noGraphAuth')
};

const ThirdPublish = (props: PublishProps | any) => {
  const history = useHistory();

  const {
    basicData,
    testData,
    onPrev,
    setIsPrevent,
    kgqaConfig,
    setKgqaConfig,
    setOperateFail,
    kgqaData,
    checked,
    isOpenQA,
    setKgqaData,
    qaError,
    externalModel,
    setIsQAConfigError,
    isSaved,
    setIsSaved,
    emError
    // savedPCConfig,
    // setSavedPCConfig
  } = props;

  const [form] = Form.useForm();
  const language = HOOKS.useLanguage();
  const PCRef = useRef<any>(); // PC配置组件ref
  const scrollWrapRef = useRef<HTMLDivElement>(null); // 滚动容器
  const [loading, setLoading] = useState(false);
  const [isShowConfig, setIsShowConfig] = useState(false); // 是否显示PC内嵌功能配置面板
  const [graphQaConfs, setGraphQaConfs] = useState<any>([]); // 初始化图谱配置

  useEffect(() => {
    const { action } = getParam(['action']);
    if (basicData?.action === 'init') {
      setTimeout(() => {
        const { name } = basicData;
        if (action === 'copy') {
          form.setFieldsValue({ ...basicData, name: `${name}的副本` });
        } else {
          form.setFieldsValue({ ...basicData });
        }
      }, 0);
      if (_.includes(basicData?.access_method, ACCESS_METHOD?.PC_EMBED)) {
        setIsShowConfig(true);
      }
    }
  }, [basicData]);

  const onSubmit = (e: React.MouseEvent, type: 'save' | 'publish') => {
    e.preventDefault();
    form
      .validateFields()
      .then(value => {
        handleSubmit(value, type);
      })
      .catch(err => {
        setLoading(false);
        scrollWrapRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      });
  };

  useEffect(() => {
    if (testData?.props?.data_source_scope?.length) {
      (async () => {
        const { s_id } = getParam(['s_id']);
        if (s_id) return false;
        const propertyRes = await getPropertyRes(testData?.props?.data_source_scope);
        const kgqaDATA = {
          props: {
            ...kgqaData.props,
            data_source_scope: testData?.props?.data_source_scope,
            confs: propertyRes?.data
          }
        };
        setKgqaData(kgqaDATA);
        const confsArr = initConfs(kgqaDATA);
        setGraphQaConfs(confsArr);
      })();
    }
  }, [testData?.props?.data_source_scope]);

  /**
   * 校验成功后发送请求
   * @param formValues 表单数据
   * @param type 保存 0 | 发布 1
   */
  const handleSubmit = async (formValues: PublishField, type: 'save' | 'publish') => {
    const { action } = getParam(['action']);
    if (loading) return;
    setOperateFail(false);
    const { knw_id } = basicData;
    const data_source_scope = onHandleGraph(testData.props.data_all_source);
    const search_config = onHandleConfig(testData.props.full_text.search_config);
    const pcConfigure = basicData?.pc_configure_item;
    const userInfo = localStore.get('userInfo') || {};
    // 处理知识卡片图谱id类型
    const knowledge_card = handleKnwCardKgId(testData.props?.knowledge_card);
    const related_knowledge = handleRelatedKgId(testData.props?.related_knowledge);
    let body: any = {
      ...formValues,
      status: type === 'save' ? 0 : 1,
      knw_id: String(knw_id),
      pc_configure_item: pcConfigure || '',
      description: getTextByHtml(formValues.description) ? formValues.description : '', // 去除空的富文本
      auto_wire: true,
      nodes: [
        {
          props: {
            full_text: { search_config, switch: checked?.checked },
            kgqa: { switch: false },
            knowledge_card,
            related_knowledge
          }
        }
      ],
      data_source_scope,
      email: userInfo?.email,
      openai_status: !qaError,
      embed_model_status: emError
    };
    const { s_id } = getParam(['s_id']);
    body = onHandleQa(body, s_id);

    if (action !== 'copy') {
      body.id = basicData.id || s_id;
    }
    body.nodes[0].props.kgqa.switch = isOpenQA;
    try {
      setLoading(true);
      const res =
        action === 'create' || action === 'copy'
          ? await cognitiveSearchService.createSearch(body)
          : await cognitiveSearchService.editSearch(body);
      setLoading(false);

      if (res) {
        type === 'publish'
          ? message.success(intl.get('analysisService.publishing'))
          : message.success(intl.get('global.saveSuccess'));
        setIsPrevent(false);
        setIsSaved(true);
        if (type === 'publish') {
          Promise.resolve().then(() => {
            history.push(`/cognitive-application/domain-intention?id=${basicData.knw_id}&type=search`);
          });
        }
        history.push(
          `${window.location.pathname}?action=edit&s_id=${res?.res}&knw_id=${body?.knw_id}&name=${body?.name}`
        );
      }
    } catch (err) {
      setLoading(false);
      const { Description, ErrorCode } = err?.response || err.data || err;
      if (ErrorCode === 'KnCognition.DuplicateApplicationNameErr') {
        form.setFields([{ name: 'name', errors: [intl.get('global.repeatName')] }]);
        return;
      }
      if (ERROR_CODE[ErrorCode]) {
        message.error(ERROR_CODE[ErrorCode]);
        return;
      }
      Description && message.error(Description);
    }
  };

  /**
   * 图谱qa参数处理
   */
  const onHandleQa = (body: any, s_id: any) => {
    // 新建配置
    if (!s_id) {
      let confTmp = [];

      let kgqaDataTmp: any = {};
      confTmp = _.isEmpty(kgqaConfig?.confs) ? graphQaConfs : kgqaConfig?.confs;
      kgqaDataTmp = {
        limit: kgqaConfig?.limit,
        threshold: kgqaConfig?.threshold,
        confs: [...confTmp],
        switch: isOpenQA,
        ans_organize: kgqaConfig?.ans_organize,
        adv_config: kgqaConfig?.adv_config
      };
      // }
      if (isOpenQA && !checkProperty(confTmp)) {
        message.warning(intl.get('cognitiveSearch.graphQA.checkPropertyError'));
        setIsQAConfigError(true);
        return false;
      }
      kgqaDataTmp.exploration_switch = checked.qaSubgraph;
      body.nodes[0].props.kgqa = kgqaDataTmp;
    } else {
      // 编辑配置
      let configTmp;
      if (!_.isEmpty(kgqaConfig)) {
        // 手动修改配置
        configTmp = kgqaConfig;
      } else if (!_.isEmpty(kgqaData.props.saveConfs)) {
        // 点击编辑按钮获取到配置
        const confsArr = initConfs(kgqaData);
        configTmp = {
          ...kgqaData.props.saveConfs,
          confs: [...confsArr]
        };
      }
      if (isOpenQA && !checkProperty(configTmp?.confs)) {
        message.warning(intl.get('cognitiveSearch.graphQA.checkPropertyError'));
        setIsQAConfigError(true);
        return false;
      }
      configTmp.exploration_switch = checked.qaSubgraph;
      body.nodes[0].props.kgqa = configTmp;
    }
    return body;
  };

  /**
   * 表单数据不需要实时同步到state, 点击发布时直接获取最终表单即可
   */
  const onFormChange = (changedValues: Partial<PublishField>) => {
    setIsSaved(false);
    if (changedValues.access_method) {
      setIsShowConfig(_.includes(changedValues.access_method, ACCESS_METHOD.PC_EMBED));
    }
  };

  return (
    <div className="search-config-publish">
      <div ref={scrollWrapRef} className="scroll-wrap kw-mt-6 kw-ml-6 kw-mr-6">
        <div className="form-box">
          <Form form={form} layout="vertical" scrollToFirstError onValuesChange={onFormChange}>
            <Form.Item
              label={intl.get('analysisService.serviceName')}
              name="name"
              validateFirst
              rules={[
                { required: true, message: intl.get('global.noNull') },
                { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
                {
                  pattern: ONLY_NORMAL_NAME,
                  message: intl.get('global.onlyNormalName')
                }
              ]}
            >
              <Input placeholder={intl.get('analysisService.serviceNamePlace')} autoComplete="off" />
            </Form.Item>

            <Form.Item
              label={intl.get('analysisService.accessControl')}
              name="permission"
              rules={[{ required: true, message: intl.get('global.pleaseSelect') }]}
            >
              <Radio.Group>
                <Radio className="align-item kw-mr-8" value={PERMISSION.APPID_LOGIN}>
                  {text(PERMISSION.APPID_LOGIN)}
                </Radio>
                <Radio className="align-item" value={PERMISSION.SINGLE_LOGIN} disabled>
                  {text(PERMISSION.SINGLE_LOGIN)}
                </Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              label={intl.get('analysisService.accessMode')}
              name="access_method"
              rules={[{ required: true, message: intl.get('analysisService.accessModeTip') }]}
            >
              <Checkbox.Group>
                <Checkbox className="align-item kw-mr-8" value={ACCESS_METHOD.REST_API}>
                  RESTful API
                </Checkbox>
                <Checkbox
                  className="align-item"
                  value={ACCESS_METHOD.PC_EMBED}
                  disabled={
                    _.isEmpty(testData?.props?.data_source_scope) ||
                    (!checked.card && !checked.checked && !checked.qAChecked && !checked.recommend)
                  }
                >
                  {text(ACCESS_METHOD.PC_EMBED)}
                </Checkbox>
              </Checkbox.Group>
            </Form.Item>
            <Form.Item
              label={intl.get('global.desc')}
              name="description"
              rules={[
                {
                  validator: async (_, value) => {
                    const text = getTextByHtml(value);
                    if (text.length > 20000) {
                      throw new Error(intl.get('global.lenErr', { len: 20000 }));
                    }
                  }
                }
              ]}
            >
              <WangEditor height={260} language={language} />
            </Form.Item>
          </Form>
        </div>
      </div>

      <div className="footer-box">
        <ConfigProvider autoInsertSpaceInButton={false}>
          <Button className="foot-btn kw-mr-2" type="default" onClick={() => onPrev(1)}>
            {intl.get('global.previous')}
          </Button>
          <Button className="btn-middle kw-mr-2" disabled={isSaved} type="default" onClick={e => onSubmit(e, 'save')}>
            {/* {intl.get('analysisService.saveAndExist')} */}
            {intl.get('global.save')}
          </Button>
          <Button className="foot-btn" type="primary" onClick={e => onSubmit(e, 'publish')}>
            {intl.get('analysisService.publish')}
          </Button>
        </ConfigProvider>
      </div>
    </div>
  );
};

export default ThirdPublish;
