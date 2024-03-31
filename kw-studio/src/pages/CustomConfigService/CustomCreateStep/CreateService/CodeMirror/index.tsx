import React, { useEffect, useImperativeHandle, forwardRef, useState, useRef } from 'react';
import intl from 'react-intl-universal';
import { message, Button, Tooltip } from 'antd';
import { copyToBoardArea, getParam } from '@/utils/handleFunction';
import _, { template } from 'lodash';
import HOOKS from '@/hooks';
import ParamCodeEditor, { ParamEditorRef, paramPolyfill } from '@/components/ParamCode';
import DragLine from '@/components/DragLine';
import IconFont from '@/components/IconFont';
import cognitiveSearchService from '@/services/cognitiveSearch';
import customService from '@/services/customService';

import './style.less';
import classNames from 'classnames';

const CodeMirror = (props: any, ref: any) => {
  const {
    onChangeWidth,
    setIsTestInputShow,
    basicData,
    initialId,
    setInitialId,
    setIsUseTest,
    actuatorData,
    setActuatorData,
    setInputJson,
    onHandleRun,
    editorRef,
    setAddIsDisable,
    scalingWidth,
    setScalingWidth,
    step,
    setIsDisableClick,
    setTabKey,
    setLoading
  } = props;
  const [selectionText, setSelectionText] = useState(''); // 输入的文本
  const [isDisable, setIsDisable] = useState(false); // 按钮是否禁用
  const [isWarnShow, setIsWarnShow] = useState(false); // 警告是否展示
  const [taskLoading, setTaskLoading] = useState(false);

  useImperativeHandle(ref, () => ({ onInsertText, onCancel, onImportTemplate }));

  useEffect(() => {
    setIsDisable(false);
  }, [basicData?.action]);

  useEffect(() => {
    if (_.isEmpty(actuatorData)) return;
    setSelectionText(actuatorData);
  }, [actuatorData]);

  /**
   * 取消操作
   */
  const onCancel = () => {
    setTaskLoading(false);
    setLoading(false);
    setInitialId(0);
  };

  const getPlaceholder = () => {
    // 空行保留
    return `${intl.get('customService.click')}
${intl.get('customService.clickTest')}`;
  };

  /**
   * 文本变化, 如果参数标记有变动, 则会返回剩余的参数标记
   * @param value
   * @param existedParams
   */
  const onChange = (value: string, existedParams?: any[]) => {
    setIsDisable(false);
    setSelectionText(value);
    setActuatorData(value);
    setIsWarnShow(true);
    setAddIsDisable(false);
  };

  const onFocus = (e: any) => {
    setIsDisableClick(true);
    setAddIsDisable(false);
  };

  const onBlur = (e: any) => {
    setAddIsDisable(true);
  };

  const onInsertText = (text: string) => {
    editorRef?.current?.insertText(text);
  };

  /**
   * 运行配置
   */
  const onRun = async () => {
    if (isDisable) return;
    setIsWarnShow(false);
    if (_.isEmpty(selectionText)) {
      message.error(intl.get('customService.jsonNotEmpty'));
      return;
    }
    if (JSON.parse(JSON.stringify(actuatorData.replace(/(^\s*)/g, ''), null, 0))[0] !== '{') {
      message.error(intl.get('customService.contentError'));
      return;
    }

    try {
      setLoading(true);
      const { s_id, action, env } = getParam(['s_id', 'action', 'env']);
      const data: any = { custom_config: JSON.parse(selectionText), env };
      if (s_id && !['create', 'copy'].includes(action)) {
        data.id = s_id;
      }
      const { res } = await customService.initialCustom(data);
      if (res) {
        setInitialId(res);
        onGetStatus(res);
      }
    } catch (err) {
      setTaskLoading(false);
      setLoading(false);
      setInitialId(0);
      const { ErrorDetails } = err?.data || err?.response || err || {};
      if (_.includes(ErrorDetails?.[0]?.detail, 'This user does not have permission')) {
        message.error(intl.get('analysisService.noGraphAuth'));
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
   * 获取初始化状态
   */
  const onGetStatus = async (id: any) => {
    try {
      setTaskLoading(true);
      const { env } = getParam(['env']);
      const { res } = await customService.getStatus({ id, env });

      if (res) {
        setTaskLoading(false);
        setIsDisable(true);
        setScalingWidth(400);
        onHandleRun(true);
        setInputJson(selectionText);
        setTabKey('test');
        setIsTestInputShow(true);
        setLoading(false);
        setIsUseTest(false);
      }
    } catch (err) {
      setTaskLoading(false);
      setLoading(false);
      const { ErrorCode, ErrorDetails } = err?.data || err || err?.response || {};
      if (ErrorDetails && ErrorDetails[0].detail.includes('has not been trained successfully')) {
        message.error(intl.get('cognitiveSearch.getStatusFail'));
        return;
      }
      if (ErrorCode === 'SearchEngine.GraphPermissionDeniedErr') {
        return message.error(intl.get('analysisService.noGraphAuth'));
      }
      err?.ErrorDetails && message.error(ErrorDetails[0].detail);
    }
  };

  // 任务轮询定时器
  HOOKS.useInterval(() => {
    if (taskLoading && step === 0) {
      onGetStatus(initialId);
      setAddIsDisable(true);
    }
  }, 2000);

  /**
   * 复制
   */
  const onCopy = () => {
    if (_.isEmpty(selectionText)) return;
    copyToBoardArea(selectionText);
    // copyToBoardArea(inputJson);
    message.success(intl.get('exploreAnalysis.copySuccess'));
  };

  /**
   * 引入模板
   */
  const onImportTemplate = async (key: string) => {
    try {
      const { res } = await customService.getTemplate();
      const selected_template =
        res?.custom_template.find((template: any) => template.name === key) || res?.custom_template[0];
      delete selected_template.name;
      delete selected_template.description;

      setSelectionText(JSON.stringify(selected_template, null, 8));
      setActuatorData(JSON.stringify(selected_template, null, 8));
      setIsDisable(false);
      setAddIsDisable(true);
      styledTemplate([
        'openai',
        'azure',
        '2023-03-15-preview',
        'https://kweaver-dev.openai.azure.com/',
        '16ff5cd7654c4ae9a9dd36059198a15d',
        'gpt-35-turbo-16k'
      ]);
    } catch (err) {
      setAddIsDisable(true);
      const { ErrorCode, Description, ErrorDetails } = err?.data || err || err?.response || {};
      ErrorDetails && message.error(ErrorDetails?.[0]?.detail);
    }
  };

  const styledTemplate = (highlightFields: string[], isInit = true) => {
    const _styledTemplate = (
      str: string,
      line = 0,
      subNum = 2,
      markOptions = isInit
        ? {
            css: 'color:green;font-style:italic;'
          }
        : {
            css: 'color:#a11;font-style:italic;'
          }
    ) => {
      const start = editorRef.current.editorInstance.getSearchCursor(str, { line }).pos.from;

      editorRef.current.editorInstance.markText(
        { line: start.line, ch: start.ch - str.length - subNum },
        { line: start.line, ch: start.ch - subNum },
        markOptions
      );
    };

    const findColNumber = (str: string) => {
      let lineNum = 0;
      const colNum = editorRef.current.editorInstance.doc.size;
      while (lineNum < colNum) {
        const lineText = editorRef.current.editorInstance.lineInfo(lineNum).text as string;
        lineText.match(str);
        if (lineText.match(str) !== null) {
          break;
        }
        lineNum++;
      }
      if (lineNum === 0 || lineNum === colNum - 1) {
        // eslint-disable-next-line no-void
        return void 0;
      }

      return lineNum;
    };

    highlightFields.forEach(query => {
      if (query === 'gpt-35-turbo-16k') {
        _styledTemplate(query, findColNumber(query), 1);
      }
      _styledTemplate(query, findColNumber(query));
    });
  };

  return (
    <div className="code-mirror-wrap-root kw-w-100 kw-h-100">
      <div className="content-operate-box">
        <div className="title-left kw-c-header kw-flex">{intl.get('customService.configuration')}</div>
        <div className="icon-right kw-flex kw-pt-1">
          {isWarnShow ? (
            <div
              className={classNames('kw-c-error kw-mr-5 kw-ellipsis', { 'warning-box': scalingWidth <= 548 })}
              title={intl.get('customService.reRun')}
            >
              <IconFont type="icon-Warning" className="kw-mr-2" />
              {intl.get('customService.reRun')}
            </div>
          ) : null}

          <Tooltip placement="top" title={intl.get('customService.runConfig')}>
            <div className="kw-mr-3 start-icon">
              <div className={classNames('btn', isDisable ? 'disable' : undefined)}>
                <IconFont
                  onClick={onRun}
                  type="icon-qidong"
                  className={classNames('btn-icon', isDisable ? 'kw-c-subtext' : 'kw-c-primary')}
                />
              </div>
            </div>
          </Tooltip>
          <Tooltip placement="top" title={intl.get('customService.copy')}>
            <div className={classNames('btn', _.isEmpty(selectionText) ? 'disable' : undefined)} onClick={onCopy}>
              <IconFont type="icon-copy" className="btn-icon" />
            </div>
          </Tooltip>
        </div>
      </div>
      {/* <div className="content-edit-code-box" onClick={onFocus}> */}
      <div className="content-edit-code-box">
        <ParamCodeEditor
          className="functionCodeEditor"
          value={selectionText}
          ref={editorRef}
          options={{
            placeholder: getPlaceholder(),
            lint: true
          }}
          height="100%"
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>
      <DragLine className="dragLine" onChange={(x, y) => onChangeWidth(x)} style={{ zIndex: '10' }} />
    </div>
  );
};

export default forwardRef(CodeMirror);
