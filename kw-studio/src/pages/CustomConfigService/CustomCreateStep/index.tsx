import React, { useEffect, useState } from 'react';

import classNames from 'classnames';
import { message } from 'antd';
import HOOKS from '@/hooks';
import TopSteps from './TopSteps';
import intl from 'react-intl-universal';
import { useHistory, Prompt } from 'react-router-dom';
import { getParam, localStore } from '@/utils/handleFunction';
import { ANALYSIS_SERVICES } from '@/enums';

import _ from 'lodash';
import { tipModalFunc } from '@/components/TipModal';

import customService from '@/services/customService';

import CreateService from './CreateService';
import Publish from './Publish';

import './style.less';

const getFirstParam = () => {
  let action = getParam('action') as any;
  if (!['create', 'edit', 'publish', 'copy'].includes(action)) {
    action = 'create';
  }
  let step = 0;
  if (action === 'publish' || action === 'copy') {
    // step = 0;
    step = 1;
  } else {
    step = 0;
  }
  return { step, action };
};

// 部分参数写死
const { ACCESS_METHOD, PERMISSION, TRANS_MODE } = ANALYSIS_SERVICES;
const DEFAULT_CONFIG: any = {
  operation_type: 'custom-search',
  permission: PERMISSION.APPID_LOGIN,
  access_method: [ACCESS_METHOD.REST_API],
  props: {}
};
const CustomCreateStep = (props: any) => {
  const { knwStudio, setKnwStudio } = props;
  const history = useHistory();
  const [isPrevent, setIsPrevent] = useState(true); // 是否阻止路由跳转
  const [basicData, setBasicData] = useState<any>({}); // 流程存储信息
  const [step, setStep] = useState(() => getFirstParam().step);
  const [action] = useState<any>(() => getFirstParam().action); // 进入页面的动作行为
  const [usb, setUsb] = useState({});
  const [actuatorData, setActuatorData] = useState<any>({}); // 流程一填入的数据---编辑器数据
  const [addIsDisable, setAddIsDisable] = useState(true); // 添加是否禁用
  const [inputJson, setInputJson] = useState<any>(); // 左侧输入的json数据
  const [isTestInputShow, setIsTestInputShow] = useState(false); // 右侧测试框是否展示左侧输入的数据
  const [actuatorSelectData, setActuatorSelectData] = useState<any>([]); // 执行器 / 知识组件下拉框数据
  const [actuatorAddSelectData, setActuatorAddSelectData] = useState<any>([]); // 自定义知识组件下拉框数据
  const [templateData, setTemplateData] = useState<any>({}); // 模板

  const [isSaved, setIsSaved] = useState<boolean>(false); // 是否保存过

  useEffect(() => {
    onInit();
    onGetTemplate();
    return () => {
      localStore.remove('description');
    };
  }, []);

  useEffect(() => {
    if (usb === 'knw') {
      onExit('knw');
      return;
    }
    if (knwStudio === 'studio') {
      onExit('studio');
    }
  }, [knwStudio]);

  useEffect(() => {
    setIsSaved(false);
  }, [JSON.stringify(actuatorData)]);

  const onInit = async () => {
    const { g_id, s_id, env, name } = getParam([
      'g_id',
      's_id',
      'action',
      'env',
      'name'
      // 'description'
    ]);
    const description = localStore.get('description');
    const transMode = TRANS_MODE.NO_STREAM;
    setBasicData({
      ...(action === 'create' ? DEFAULT_CONFIG : {}),
      id: s_id,
      kg_id: parseInt(g_id) || 0,
      env,
      name,
      description,
      transMode
    } as any);
    setActuatorData({});
    if (!s_id) return;
    try {
      const { res } = await customService.editCustom(s_id);

      if (res) {
        const { custom_config, ...info } = res;
        setActuatorData(JSON.stringify(custom_config, null, 8));
        setBasicData((pre: any) => (action === 'edit' ? { ...pre, ...info } : { ...pre, ...info, name, description }));
        setInputJson(JSON.stringify(custom_config, null, 8));
        // setIsTestInputShow(true);
      }
    } catch (err) {
      const { ErrorCode, Description } = err?.data || err?.response || err || {};
      if (ErrorCode === 'KnCognition.ServicePermissionDeniedErr') {
        return message.error(intl.get('license.serAuthError'));
      }
      if (ErrorCode === 'KnCognition.GraphPermissionDeniedErr') {
        return message.error(intl.get('analysisService.noGraphAuth'));
      }
      Description && message.error(Description);
    }
  };

  /**
   * 获取模板
   */
  const onGetTemplate = async () => {
    try {
      const { res } = await customService.getTemplate();

      const cloneData = _.cloneDeep(res);
      // const templateAll = _.filter(Object.keys(res), (item: any) => item !== 'custom_template');
      const templateAll = _.filter(
        Object.keys(res),
        (item: any) => !['custom_template', 'description', 'custom_template_explain', 'env'].includes(item)
      );
      const templateArray = _.reduce(
        templateAll,
        (pre: any, key: any) => {
          pre.push(cloneData[key]);
          return pre;
        },
        []
      );
      setTemplateData(res.custom_template);

      setActuatorAddSelectData(cloneData.env || []);
      setActuatorSelectData(templateArray);
    } catch (err) {
      //
    }
  };

  /**
   * 退出
   */
  const onExit = async (type?: any, data?: any) => {
    if (isSaved) return history.push('/cognitive-application/domain-custom');
    const isOk = await tipModalFunc({
      title: intl.get('cognitiveSearch.quit'),
      content: intl.get('cognitiveSearch.notRetrieved'),
      closable: false
    });
    setKnwStudio('');
    if (!isOk) {
      setIsPrevent(true);
      return;
    }
    setIsPrevent(false);
    if (type === 'studio') {
      Promise.resolve().then(() => {
        history.push('/home');
      });
      return;
    }
    if (type === 'knw') {
      Promise.resolve().then(() => {
        history.push('/cognitive-application/domain-custom');
      });
    } else {
      Promise.resolve().then(() => {
        history.push('/cognitive-application/domain-custom');
      });
    }
  };

  /**
   * 下一步
   */
  const onNext = () => {
    setStep(step + 1);
  };

  /**
   * 上一步
   */
  const onPrev = () => {
    setStep(step - 1);
  };

  return (
    <div className="create-edit-custom-config-root kw-w-100">
      <TopSteps step={step} title={basicData?.name} onExit={onExit} isHideStep={action === 1} />
      <div className="view-step-wrap kw-w-100">
        {/* <div className={classNames('view-wrapper', step === 0 ? 'show' : 'hide')}> */}
        <CreateService
          visible={step === 0}
          actuatorData={actuatorData}
          setActuatorData={setActuatorData}
          onNext={onNext}
          onExit={onExit}
          basicData={basicData}
          addIsDisable={addIsDisable}
          setAddIsDisable={setAddIsDisable}
          inputJson={inputJson}
          setInputJson={setInputJson}
          isTestInputShow={isTestInputShow}
          setIsTestInputShow={setIsTestInputShow}
          templateData={templateData}
          actuatorSelectData={actuatorSelectData}
          actuatorAddSelectData={actuatorAddSelectData}
          step={step}
        />
        {/* </div> */}
        <div className={classNames('view-wrapper', step === 1 ? 'show' : 'hide')}>
          <Publish
            onPrev={onPrev}
            setIsPrevent={setIsPrevent}
            basicData={basicData}
            actuatorData={actuatorData}
            isSaved={isSaved}
            setIsSaved={setIsSaved}
          />
        </div>
      </div>
      <Prompt
        when={isPrevent}
        message={location => {
          setUsb('knw');
          return false;
        }}
      />
    </div>
  );
};

export default CustomCreateStep;
