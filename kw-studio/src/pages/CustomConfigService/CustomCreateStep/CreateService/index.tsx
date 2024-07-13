import React, { useState, useRef } from 'react';
import { Button, Tabs, message } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { ANALYSIS_SERVICES } from '@/enums';

import ParamCodeEditor, { ParamEditorRef, paramPolyfill } from '@/components/ParamCodeEditor';
import IconFont from '@/components/IconFont';
import KwSpin from '@/components/KwSpin';
import servicesPermission from '@/services/rbacPermission';
import cognitiveSearchService from '@/services/cognitiveSearch';
import ViewActuator from './ViewActuator';
import Test from './Test';
import CodeMirror from './CodeMirror';
import Template from './Template';
import './style.less';
import customService from '@/services/customService';
import HOOKS from '@/hooks';
import classNames from 'classnames';

const { TabPane } = Tabs;
const initWidth = 1127;
const minWidth = 400;
const maxWidth = 1520;
const CreateService = (props: any) => {
  const {
    onNext,
    onExit,
    basicData,
    setActuatorData,
    actuatorData,
    addIsDisable,
    setAddIsDisable,
    inputJson,
    setInputJson,
    isTestInputShow,
    setIsTestInputShow,
    templateData,
    actuatorSelectData,
    actuatorAddSelectData,
    step,
    visible
  } = props;
  const editorRef = useRef<ParamEditorRef>(null);
  const insertRef = useRef<any>(null);
  const [scalingWidth, setScalingWidth] = useState(initWidth);
  const [tabKey, setTabKey] = useState('template');
  const [inOutResult, setInOutResult] = useState<any>([]); // 右侧测试输入输出结果
  const [initialId, setInitialId] = useState(0); // 初始化后的id
  const [isDisableClick, setIsDisableClick] = useState(false); // 是否允许点击复制
  const [loading, setLoading] = useState(false);
  const [isUseTest, setIsUseTest] = useState(true); // 一进入测试按钮不允许点击
  const language = HOOKS.useLanguage();

  const onChangeWidth = (offset: number) => {
    const x = scalingWidth + offset;
    const width = x > maxWidth ? maxWidth : x < minWidth ? minWidth : x;
    setScalingWidth(width);
  };

  /**
   * 点击运行配置
   */
  const onHandleRun = (isShow = false) => {
    setIsTestInputShow(false);
    if (isShow) {
      setTabKey('test');
      setIsTestInputShow(true);
    }
  };

  /**
   * 向编辑器中插入实体类名、属性名
   * @param text
   */
  const onInsertText = (text: string) => {
    editorRef?.current?.insertText(text);
  };

  /**
   * 下一步
   */
  const onNextJudgement = async () => {
    // onNext();
    if (_.isEmpty(actuatorData)) {
      message.error(intl.get('customService.jsonNotEmpty'));
      return;
    }

    if (JSON.parse(JSON.stringify(actuatorData.replace(/(^\s*)/g, ''), null, 0))[0] === '{') {
      onCheck();
    } else {
      message.error(intl.get('customService.contentError'));
    }
  };

  /**
   * 校验图谱格式
   */
  const onCheck = async () => {
    try {
      const res = await customService.checkValidity({
        // knw_id: String(basicData?.knw_id),
        custom_config: JSON.parse(actuatorData)
      });
      if (res) {
        onCheckGraph();
      }
    } catch (err) {
      const { ErrorCode, ErrorDescription, ErrorDetails } = err?.response || err?.data || err || {};
      if (ErrorCode === 'KnCognition.ArgsErr') {
        message.error(intl.get('customService.contentError'));
        return;
      }
      const errorTip =
        typeof ErrorDetails?.[0]?.detail === 'object'
          ? JSON.stringify(ErrorDetails?.[0]?.detail)
          : ErrorDetails?.[0]?.detail;
      message.error(errorTip || intl.get('customService.contentError'));
    }
  };

  /**
   * 图谱权限
   */
  const onCheckGraph = async () => {
    // const graphList = await getGraphList(basicData?.knw_id);
    const cloneData = _.cloneDeep(JSON.parse(actuatorData));
    const ids: any = [];
    _.map(cloneData?.nodes, (item: any) => {
      _.map(item?.props, (i: any) => {
        if (i?.props?.required_resource?.doc_graph_info?.graph_id) {
          ids.push(i?.props?.required_resource?.doc_graph_info?.graph_id);
        } else {
          _.map(i?.props?.search_config, (n: any) => {
            _.map(n?.kgs, (k: any) => {
              ids.push(String(k?.kg_id));
            });
          });
        }
      });
    });

    // 有图谱时校验图谱权限
    if (!_.isEmpty(ids)) {
      // 图谱权限

      // servicesPermission.dataPermission(postData).then(result => {
      //   const codesData = _.keyBy(result?.res, 'dataId');
      //   const newGraphData = _.filter(ids, item => {
      //     const hasAuth = _.includes(codesData?.[item]?.codes, 'KG_VIEW');
      //     return hasAuth;
      //   });
      //   if (_.isEmpty(newGraphData)) {
      //     message.error(intl.get('analysisService.noGraphAuth'));
      //   } else {
      //     onNext();
      //   }
      // });
      onNext();
    } else {
      onNext();
    }
  };

  /**
   * 查询图谱
   * @param id 知识网络id
   */
  const getGraphList = async (id: number) => {
    try {
      // bug451083 获取有效图谱
      const { res } = (await cognitiveSearchService.getKgList(id)) || {};
      return res?.df || [];
    } catch (error) {
      //
    }
  };

  // 取消操作
  const onCancel = () => {
    insertRef?.current?.onCancel();
  };

  /**
   * 添加模板
   */
  const onAddTemplate = () => {
    insertRef?.current?.onImportTemplate();
  };

  return (
    <>
      {visible ? (
        <div className="custom-first-step-root kw-h-100 kw-w-100 kw-flex">
          {/* loading加载 */}
          {loading && (
            <div className={`loading-mask ${loading && 'spinning'}`}>
              <div className="spin-content-box kw-flex">
                <KwSpin />
                {
                  <div className="loading-content">
                    {intl.get('cognitiveSearch.loading')}
                    <span onClick={onCancel} className="kw-c-link kw-pointer kw-ml-3">
                      {intl.get('exploreGraph.cancelOperation')}
                    </span>
                  </div>
                }
              </div>
            </div>
          )}
          <div className="custom-content kw-flex kw-w-100">
            <div className="content-left kw-h-100" style={{ width: scalingWidth }}>
              <CodeMirror
                editorRef={editorRef}
                ref={insertRef}
                setTabKey={setTabKey}
                isDisableClick={isDisableClick}
                setIsDisableClick={setIsDisableClick}
                onChangeWidth={onChangeWidth}
                onHandleRun={onHandleRun}
                setIsUseTest={setIsUseTest}
                setInputJson={setInputJson}
                basicData={basicData}
                initialId={initialId}
                setInitialId={setInitialId}
                actuatorData={actuatorData}
                setActuatorData={setActuatorData}
                setIsTestInputShow={setIsTestInputShow}
                setAddIsDisable={setAddIsDisable}
                scalingWidth={scalingWidth}
                setScalingWidth={setScalingWidth}
                step={step}
                setLoading={setLoading}
              />
            </div>

            <div
              className="content-right kw-h-100"
              style={{ width: `calc(100% - ${scalingWidth}px)`, minWidth: '400px' }}
            >
              <Tabs
                className={classNames('right-tab', 'kw-h-100', { 'right-tab-2': language === 'en-US' })}
                activeKey={tabKey}
                onChange={key => setTabKey(key as 'actuator' | 'test')}
              >
                <TabPane key="template" tab={intl.get('customService.templateTwo')}>
                  <Template onAddTemplate={onAddTemplate} templateData={templateData} />
                </TabPane>
                <TabPane key="actuator" tab={intl.get('customService.knowledgeComponents')}>
                  <ViewActuator
                    appEnv={basicData?.env || '0'}
                    setAddIsDisable={setAddIsDisable}
                    addIsDisable={addIsDisable}
                    onInsertText={onInsertText}
                    actuatorSelectData={actuatorSelectData}
                    actuatorAddSelectData={actuatorAddSelectData}
                    isDisableClick={isDisableClick}
                    setIsDisableClick={setIsDisableClick}
                  />
                </TabPane>
                <TabPane key="test" tab={intl.get('customService.test')} disabled={isUseTest}>
                  <Test
                    inputJson={inputJson}
                    isTestInputShow={isTestInputShow}
                    inOutResult={inOutResult}
                    setInOutResult={setInOutResult}
                    initialId={initialId}
                  />
                </TabPane>
              </Tabs>
            </div>
          </div>
          <div className="footer-box kw-center kw-w-100">
            <Button className="kw-mr-3" onClick={onExit}>
              {intl.get('customService.cancelModal')}
            </Button>
            <Button type="primary" onClick={onNextJudgement}>
              {intl.get('cognitiveSearch.next')}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default CreateService;
