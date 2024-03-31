import React, { forwardRef, useImperativeHandle } from 'react';
import { Button, ConfigProvider, InputNumber, Tooltip } from 'antd';
import UniversalModal from '@/components/UniversalModal';
import intl from 'react-intl-universal';
import { QuestionCircleOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import HOOKS from '@/hooks';
import './style.less';
const FullTextContentFirst = forwardRef((props: any, ref) => {
  const {
    onHandleCancel,
    kgqaData,
    setKgqaData,
    limitNum,
    thresholdNum,
    changeLimitNum,
    changeThresholdNum,
    onSaveDefault,
    kgqaConfig,
    setKgqaConfig
  } = props;
  const language = HOOKS.useLanguage();

  useImperativeHandle(ref, () => ({
    onHandleSave
  }));

  /**
   * 参数配置保存
   * P_BUTTON 图谱qa参数配置保存
   */
  const onHandleSave = () => {
    const config = {
      limit: limitNum,
      threshold: thresholdNum,
      confg: kgqaData.confs
    };

    kgqaData.props = { ...kgqaData.props, limit: limitNum, threshold: thresholdNum };
    setKgqaData({ ...kgqaData });
    setKgqaConfig((pre: any) => ({ ...pre, ...config }));
    onSaveDefault();
    onHandleCancel();
  };

  return (
    <>
      <div className="full-text-qa-first-wrapper kw-center">
        <div style={{ transform: 'translateY(10%)' }}>
          <div className="graphqa-first-wrapper graphqa-row1 kw-flex">
            <h3>
              <strong>*</strong>
              {intl.get('cognitiveSearch.graphQA.answerTopVal')}
              <Tooltip
                placement="top"
                arrowPointAtCenter
                className="kw-ml-2"
                title={intl.get('cognitiveSearch.graphQA.answerTopValTip')}
              >
                <QuestionCircleOutlined style={{ color: 'rgba(0,0,0,0.45)' }} />
              </Tooltip>
            </h3>
            <InputNumber
              className="input-number kw-ml-2"
              min="1"
              max="10"
              step="1"
              precision={0}
              value={limitNum}
              onChange={changeLimitNum}
            />
          </div>
          <div
            className={classNames('graphqa-first-wrapper graphqa-row2 kw-flex kw-mb-4', {
              'kw-ml-2': language === 'zh-CN'
            })}
          >
            <h3>
              <strong>*</strong>
              {intl.get('cognitiveSearch.graphQA.answerLowestVal')}
              <Tooltip
                placement="top"
                arrowPointAtCenter
                className="kw-ml-2"
                title={intl.get('cognitiveSearch.graphQA.answerLowestValTip')}
              >
                <QuestionCircleOutlined style={{ color: 'rgba(0,0,0,0.45)' }} />
              </Tooltip>
            </h3>
            <InputNumber
              className={classNames('input-number', language === 'zh-CN' ? 'kw-ml-2' : 'kw-ml-5')}
              precision={2}
              min="0"
              max="1"
              step="0.1"
              value={thresholdNum}
              onChange={changeThresholdNum}
            />
          </div>
        </div>
      </div>
      {/* <UniversalModal.Footer
        source={
          <ConfigProvider autoInsertSpaceInButton={false}>
            <Button className="foot-btn" type="default" onClick={() => onHandleCancel()}>
              {intl.get('cognitiveSearch.cancel')}
            </Button>
            <Button className="foot-btn" type="primary" onClick={() => onHandleSave()}>
              {intl.get('global.save')}
            </Button>
          </ConfigProvider>
        }
      /> */}
    </>
  );
});

export default FullTextContentFirst;
