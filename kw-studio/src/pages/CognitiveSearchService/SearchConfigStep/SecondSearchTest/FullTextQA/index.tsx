import React, { useState, useEffect, useRef } from 'react';
import { Modal, Tooltip, message, ConfigProvider, Button } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';
import { useSelector } from 'react-redux';
import FullTextContentSecond from './FullTextContentSecond';
import FullTextContentFirst from './FullTextContentFirst';
import HOOKS from '@/hooks';
import intl from 'react-intl-universal';
import UniversalModal from '@/components/UniversalModal';
import servicesPermission from '@/services/rbacPermission';
import AnswerOrganizationConfig from './AnswerOrganizationConfig';

import './style.less';
import IconFont from '@/components/IconFont';
import classNames from 'classnames';

const FullTextQA = (props: any) => {
  const {
    visible,
    onHandleCancel,
    isOpenQA,
    setTextIsDisable,
    kgqaData,
    setKgqaData,
    kgqaConfig,
    setKgqaConfig,
    fullContent,
    setFullContent,
    onSaveDefault,
    onHandleSave,
    qaStep,
    setQaStep,
    onAuthError,
    setIsQAConfigError,
    testData,
    setQaError
  } = props;

  const wrapperHeight = qaStep === 1 ? '286px' : '660px';
  const [limitNum, setLimitNum] = useState('5');
  const [thresholdNum, setThresholdNum] = useState('0');
  const isReset = useSelector((state: any) => state.getIn(['graphQA', 'isReset']));
  const [authData, setAuthData] = useState<any>();
  const [formData, setFormData] = useState<any>({});
  const FullTextContentFirstRef = useRef<any>(null);
  const FullTextContentSecondRef = useRef<any>(null);
  const FullTextContentAnswerRef = useRef<any>(null);
  const language = HOOKS.useLanguage();
  // 弹窗宽度设置
  const MODEL_WIDTH: Record<number, number> = {
    1: language === 'zh-CN' ? 480 : 490, // 返回限制配置
    2: 1000, // 图谱资源配置
    3: 640 // 答案组织方式配置
  };

  useEffect(() => {
    if (qaStep === 2) {
      const dataIds = _.map(kgqaData?.props?.data_source_scope, item => String(item.kg_id));
      let error = false;
      // servicesPermission.dataPermission(postData).then(result => {
      //   const codesData = _.keyBy(result?.res, 'dataId');

      //   const newGraphData = _.filter(kgqaData?.props?.data_source_scope, item => {
      //     const hasAuth = _.includes(codesData?.[item.kg_id]?.codes, 'KG_VIEW');
      //     if (!hasAuth) error = true;
      //     return hasAuth;
      //   });
      //   const ids = _.map(newGraphData, item => item?.kg_id);
      //   setAuthData(ids);
      //   if (error) {
      //     onAuthError({ qa: true });
      //     message.error(intl.get('global.graphNoPeromission'));
      //   }
      // });
      const ids = _.map(kgqaData?.props?.data_source_scope, item => item?.kg_id);
      setAuthData(ids);
      if (error) {
        onAuthError({ qa: true });
        message.error(intl.get('global.graphNoPeromission'));
      }
    }
  }, [qaStep]);

  useEffect(() => {
    const saveConfs = kgqaData?.props?.saveConfs;
    const initLimit = saveConfs && !_.isNil(saveConfs?.limit) ? saveConfs?.limit : '5';
    const initThresholdNum = saveConfs && !_.isNil(saveConfs?.threshold) ? saveConfs?.threshold : '0.6';
    setLimitNum(initLimit);
    setThresholdNum(initThresholdNum);
  }, [kgqaData?.props?.saveConfs]);

  useEffect(() => {
    if (isReset) {
      changeLimitNum('5');
      changeThresholdNum('0.6');
    }
  }, [isReset]);

  const changeLimitNum = (val: string) => {
    setLimitNum(val);
  };
  const changeThresholdNum = (val: string) => {
    setThresholdNum(val);
  };

  /**
   * 弹窗标题
   */
  const titleModal = () => {
    return (
      <div>
        {qaStep === 1 ? (
          intl.get('cognitiveSearch.configuration')
        ) : (
          <div className="kw-flex">
            <div className="kw-mr-2">{intl.get('cognitiveSearch.qaAdvConfig.qaBasicConfig')}</div>
            <Tooltip title={intl.get('cognitiveSearch.graphQA.range')} placement="top">
              <IconFont type="icon-wenhao" style={{ color: 'rgba(0,0,0,0.45)' }} />
            </Tooltip>
          </div>
        )}
      </div>
    );
  };

  /**
   * 弹窗底部按钮
   */
  const modalFooterData = () => {
    return (
      <>
        <ConfigProvider autoInsertSpaceInButton={false}>
          <Button className="foot-btn" type="default" onClick={() => onHandleCancel()}>
            {intl.get('cognitiveSearch.cancel')}
          </Button>
          {qaStep !== 1 ? (
            <Button
              className="foot-btn"
              type={qaStep === 2 ? 'primary' : 'default'}
              onClick={() => {
                setQaStep(qaStep === 2 ? 3 : 2);
              }}
            >
              {qaStep === 2 ? intl.get('cognitiveSearch.next') : intl.get('global.previous')}
            </Button>
          ) : null}
          {qaStep !== 2 ? (
            <Button className="foot-btn" type="primary" onClick={onSave}>
              {intl.get('global.save')}
            </Button>
          ) : null}
        </ConfigProvider>
      </>
    );
  };

  /**
   * 保存
   */
  const onSave = async () => {
    if (qaStep === 1) {
      FullTextContentFirstRef.current?.onHandleSave();
    } else {
      const graphQa = await FullTextContentSecondRef.current?.onSave();
      if (!graphQa) return;
      FullTextContentAnswerRef?.current?.onOk();
    }
  };

  return (
    <UniversalModal
      className={classNames('full-text-qa-wrapper', { 'full-text-qa-wrapper-padding-bottom-root': qaStep === 3 })}
      open={visible}
      title={titleModal()}
      okText={intl.get('createEntity.save')}
      destroyOnClose={true}
      width={MODEL_WIDTH[qaStep]}
      style={{ height: wrapperHeight, top: '24px' }}
      onCancel={onHandleCancel}
      footer={null}
      maskClosable={false}
      footerData={modalFooterData()}
    >
      {/* 返回限制配置 */}
      {qaStep === 1 && (
        <FullTextContentFirst
          ref={FullTextContentFirstRef}
          limitNum={limitNum}
          thresholdNum={thresholdNum}
          onHandleCancel={onHandleCancel}
          changeLimitNum={changeLimitNum}
          changeThresholdNum={changeThresholdNum}
          kgqaData={kgqaData}
          setKgqaData={setKgqaData}
          kgqaConfig={kgqaConfig}
          setKgqaConfig={setKgqaConfig}
          onSaveDefault={onSaveDefault}
        />
      )}

      {/* 图谱资源配置 */}
      <FullTextContentSecond
        visible={qaStep === 2}
        ref={FullTextContentSecondRef}
        authData={authData}
        onHandleCancel={onHandleCancel}
        setTextIsDisable={setTextIsDisable}
        kgqaData={kgqaData}
        kgqaConfig={kgqaConfig}
        setKgqaData={setKgqaData}
        setKgqaConfig={setKgqaConfig}
        fullContent={fullContent}
        setFullContent={setFullContent}
        isOpenQA={isOpenQA}
        limitNum={limitNum}
        thresholdNum={thresholdNum}
        onSaveDefault={onSaveDefault}
        setIsQAConfigError={setIsQAConfigError}
      />

      {/* 答案组织方式配置 */}
      <AnswerOrganizationConfig
        visible={qaStep === 3}
        ref={FullTextContentAnswerRef}
        kgqaConfig={kgqaConfig}
        onSaveDefault={onSaveDefault}
        onHandleSave={onHandleSave}
        testData={testData}
        setKgqaConfig={setKgqaConfig}
        kgqaData={kgqaData}
        setKgqaData={setKgqaData}
        setQaError={setQaError}
        formData={formData}
        setFormData={setFormData}
      />
    </UniversalModal>
  );
};

export default FullTextQA;
