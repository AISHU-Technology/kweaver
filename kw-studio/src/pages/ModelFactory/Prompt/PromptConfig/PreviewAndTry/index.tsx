import React, { useState, useEffect, useRef } from 'react';

import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Button, Divider, message } from 'antd';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import ComposInput from '@/components/ComposInput';
import VariableInput from '../components/VariableInput';
import { postStream } from '@/utils/axios-http/fetchStream';

import Chat from './Chat';
import Generate from './Generate';
import useConfigStore from '../useConfigStore';
import { TRuntimeOptions, TChatInfo } from '../types';
import { parseAImessage, generateTimestamp } from '../utils';

import './style.less';

const uniqueChatId = () => _.uniqueId('chatMessage');
const getHistory = (chatData: TChatInfo) => {
  return _.reduce(
    chatData,
    (res, item) => (item.status ? res : [...res, _.pick(item, 'role', 'message')]),
    [] as any[]
  );
};

export interface PreviewAndTryProps {
  className?: string;
}

const PreviewAndTry = (props: any) => {
  const { className } = props;
  const scrollRef = useRef<HTMLDivElement>(null);
  const { configStore, setConfigStore } = useConfigStore();
  const { publicState, promptInfo, editorRef, variables, enhanceConfig, modelData, modelOptions } = configStore;
  const [chatData, setChatData] = useState<TChatInfo>([]);
  const [askValue, setAskValue] = useState('');
  const [varInputData, setVarInputData] = useState<Record<string, any>>({}); // 变量的输入值
  const isCancel = useRef<any>(false); // 停止响应
  const [abortController, setAbortController] = useState<AbortController>();

  useEffect(() => {
    chatData.length && promptInfo.prompt_type === 'chat' && scrollToBottom();
  }, [chatData]);

  useEffect(() => {
    setChatData([]);
    setVarInputData({});
    setAskValue('');
  }, [publicState.resetFlag]);

  const scrollToBottom = () => {
    if (!scrollRef.current) return;
    setTimeout(() => {
      const scrollElement = scrollRef.current!;
      scrollElement.scrollTo({ left: 0, top: scrollElement.scrollHeight });
    }, 0);
  };

  /**
   * 获取最新配置
   */
  const getLatestOptions = () => {
    const runtimeData: TRuntimeOptions = {
      model_id: modelData.model_id,
      model_para: { ...modelOptions },
      messages: editorRef?.current?.getValue?.() || '',
      inputs: getInputValues(),
      variables
    };
    return runtimeData;
  };

  /**
   * 是否可以运行
   */
  const shouldRun = (toast = false) => {
    if (isLoading()) return false;
    const errVarNames: string[] = [];
    let hasError = false;
    _.forEach(variables, item => {
      !item.optional &&
        !varInputData[item.id] &&
        varInputData[item.id] !== 0 &&
        errVarNames.push(item.field_name || item.var_name);
      !_.isEmpty(item.error) && (hasError = true);
    });
    toast &&
      errVarNames.length &&
      message.error(`${intl.get('prompt.var')} ${errVarNames.join('、')} ${intl.get('prompt.isNull')}`);
    if (hasError) return false;
    return !errVarNames.length;
  };

  const onRun = () => {
    setChatData([]);
    const runtimeData = getLatestOptions();
    const answerId = uniqueChatId();
    const newAnswer = {
      id: answerId,
      timestamp: generateTimestamp(),
      role: 'ai',
      message: '',
      status: 'loading'
    };
    setChatData(() => [newAnswer]);
    postAI({ answerId, historyInfo: [], options: runtimeData });
  };

  /**
   * 重新开始, 仅清空变量、对话
   */
  const onRestart = () => {
    setChatData([]);
    setVarInputData({});
  };

  /**
   * 停止回答
   */
  const onStop = () => {
    chatData[chatData.length - 1] = { ...chatData[chatData?.length - 1], status: 'stop' };
    setChatData([...chatData]);
    abortController?.abort();
  };

  const onSendMessage = () => {
    if (!shouldRun(true)) return;
    const newChat = {
      id: uniqueChatId(),
      timestamp: generateTimestamp(),
      role: 'human',
      message: askValue,
      status: ''
    };
    const answerId = uniqueChatId();
    const newAnswer = {
      id: answerId,
      timestamp: generateTimestamp(),
      role: 'ai',
      message: '',
      status: 'loading'
    };
    setChatData(pre => [...pre, newChat, newAnswer]);
    setAskValue('');
    postAI({
      answerId,
      historyInfo: [...getHistory(chatData), _.pick(newChat, 'role', 'message')]
    });
  };

  /**
   * 问题提交ai
   * @param answerId 回复的id, 用于接口响应后的更新
   * @param askInfo 询问的信息
   */
  const postAI = async (params: {
    answerId: string;
    historyInfo: { role: string; message: string }[];
    options?: TRuntimeOptions;
  }) => {
    const { answerId, historyInfo, options } = params;
    const curOptions = options || getLatestOptions();
    const body = {
      model_id: curOptions.model_id,
      model_para: curOptions.model_para,
      messages: curOptions.messages,
      inputs: curOptions.inputs,
      variables: curOptions.variables,
      history_dia: historyInfo,
      type: configStore?.originInfo?.prompt_type
    };
    // try {
    // 非流式 (暂时保留)
    // const { res } = (await promptServices.promptRun(body)) || {};
    // // const resData = parseAImessage(res);
    // if (isDef(res?.data)) {
    //   updateChatInfo({ id: answerId, message: res.data, status: '', ..._.pick(res, 'time', 'token_len') });
    // } else {
    //   removeChatInfo(answerId);
    // }

    // 流式
    let isShow = true;
    let resultData: any = '';
    const { description, code } = await postStream(
      '/api/model-factory/v1/prompt-run-stream',
      { method: 'POST', body },
      setAbortController,
      {
        async onmessage(event: any) {
          if (_.includes(event?.data, '--info--') || event.data === '--end--') {
            // --end--返回完毕
            // --info-- 后面数据为响应时间time以及token，加--info--为了与--end--区分
            if (_.includes(event?.data, '--info--')) {
              const handleEvent = JSON.parse(event?.data?.split('--')?.[2]);
              updateChatInfo({ id: answerId, message: resultData, status: 'stop', ...handleEvent });
            }
            isShow = false;
          } else {
            resultData += event?.data;
            updateChatInfo({ id: answerId, message: resultData, status: 'response' });
          }
        },
        onclose(e: any) {
          stopAnswer(answerId, resultData);
        },
        async onerror(err: any) {
          stopAnswer(answerId, resultData);
        }
      }
    );
    if (description) {
      abortController?.abort();
      if (code === -200) {
        updateChatInfo({ id: answerId, message: intl.get('prompt.serviceCancel'), status: 'stop' });
        return;
      }
      removeChatInfo(answerId);
      if (code === 'ModelFactory.LLM.Error') {
        return message.error(intl.get('prompt.tokenErrTip'));
      }
      description && message.error(description);
    }
  };

  /**
   * 回答停止(停止响应按钮消失，请求取消)
   */
  const stopAnswer = (answerId: any, resultData: any) => {
    abortController?.abort();
    updateChatInfo({ id: answerId, message: resultData, status: 'stop' });
  };

  /**
   * 更新对话
   * @param data 带有id的对话信息
   */
  const updateChatInfo = (data: Partial<TChatInfo[number]>) => {
    setChatData(pre => {
      const newInfo = [...pre];
      const index = _.findIndex(pre, item => item.id === data?.id);
      if (index < 0) return pre;
      newInfo[index] = { ...newInfo[index], ...data, timestamp: generateTimestamp() };
      return newInfo;
    });
  };

  /**
   * 删除某一条对话
   * @param data 对话信息id
   */
  const removeChatInfo = (id: string) => {
    setChatData(pre => pre.filter(d => d.id !== id));
  };

  const getInputValues = () => {
    const inputs: any = {};
    variables.forEach(v => (inputs[v.var_name] = varInputData[v.id]));
    return inputs;
  };

  const isLoading = () => {
    return ['response', 'loading'].includes(chatData[chatData.length - 1]?.status);
  };

  return (
    <div className={classNames(className, 'mf-prompt-preview-root kw-flex-column kw-h-100')}>
      <div className="kw-space-between kw-p-6 kw-pb-5 kw-pt-5">
        <Format.Title level={3}>{intl.get('prompt.debug')}</Format.Title>
        {promptInfo.prompt_type === 'chat' && (
          <Button onClick={onRestart} icon={<IconFont type="icon-tongyishuaxin" />}>
            {intl.get('prompt.restart')}
          </Button>
        )}
      </div>
      <div className="kw-mb-5 kw-pl-6 kw-pr-6" style={{ maxHeight: '40%' }}>
        <VariableInput
          variables={variables}
          varInputData={varInputData}
          disabled={!shouldRun()}
          type={promptInfo.prompt_type}
          onChange={setVarInputData}
          onRun={onRun}
          onRestart={onRestart}
        />
      </div>
      {promptInfo.prompt_type === 'completion' && (
        <div className="kw-align-center kw-p-6 kw-pt-1 kw-pb-0">
          <Format.Title className="kw-mr-2">{intl.get('prompt.result')}</Format.Title>
          <div className="kw-flex-item-full-width" style={{ height: 1, background: '#e5e5e5' }} />
        </div>
      )}

      <div
        ref={scrollRef}
        className={classNames('content-scroll-wrap kw-flex-item-full-height', {
          chat: promptInfo.prompt_type === 'chat'
        })}
      >
        {promptInfo.prompt_type === 'chat' ? (
          <Chat data={chatData} prologue={enhanceConfig?.prologue} />
        ) : (
          <div className="generate">
            <Generate data={chatData} />
          </div>
        )}

        {promptInfo.prompt_type === 'completion' && isLoading() && (
          <Button className="static-stop-btn" onClick={onStop}>
            <IconFont type="icon-zhongzhixiangying" />
            {intl.get('prompt.stop')}
          </Button>
        )}
      </div>
      {promptInfo.prompt_type === 'chat' && (
        <div className="ask-input">
          <div className="ask-input-inner kw-align-center">
            <ComposInput
              className="kw-flex-item-full-width"
              useAntd
              bordered={false}
              value={askValue}
              showCount={{ formatter: (info: any) => info.count }}
              onChange={e => setAskValue(e.target.value)}
              onPressEnter={onSendMessage}
            />
            <Divider type="vertical" style={{ height: 20, margin: '0 12px 0 0', borderColor: '#e5e5e5' }} />
            <Button className="ask-btn" onClick={onSendMessage} disabled={!shouldRun()}>
              <IconFont type="icon-fabu" />
            </Button>
          </div>
        </div>
      )}
      {promptInfo.prompt_type === 'chat' && isLoading() && (
        <Button className="fixed-stop-btn" onClick={onStop}>
          <IconFont type="icon-zhongzhixiangying" />
          {intl.get('prompt.stop')}
        </Button>
      )}
    </div>
  );
};

export default PreviewAndTry;
