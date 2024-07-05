import React, { useEffect, useRef, useState } from 'react';
import { Tooltip, message } from 'antd';
import './style.less';
import intl from 'react-intl-universal';
import ParamCodeEditor from '@/components/ParamCode';
import IconFont from '@/components/IconFont';
import KwSpin from '@/components/KwSpin';
import DragLine from '@/components/DragLine';
import _ from 'lodash';
import customService from '@/services/customService';
import KwScrollBar from '@/components/KwScrollBar';
import { copyToBoardArea } from '@/utils/handleFunction';
import classNames from 'classnames';

/**
 * 各类型参数对应初始值
 */
const PARAM_TYPE: Record<string, any> = {
  int: 1,
  boolean: true,
  list: [],
  str: '',
  dic: {}
};

const initHeight = 548;
const minHeight = 100;
const maxHeight = 637;
const smallHeight = 100;
const Test = (props: any) => {
  const { actuatorData, inOutResult, serviceInfo, setInOutResult } = props;
  const editorRef = useRef<any>(null);
  const outRef = useRef<any>(null); // 输出
  const [isShowResult, setIsShowResult] = useState(false);
  const [inputValue, setInputValue] = useState<any>('');
  const [scalingHeight, setScalingHeight] = useState(initHeight);
  const [loading, setLoading] = useState(false);
  const [isOpenOrClose, setIsOpenOrClose] = useState(false); // 开-true 或 关-false的判断

  useEffect(() => {
    if (_.isEmpty(actuatorData)) return;
    const handleData = onHandleParam();
    setInputValue(handleData);
  }, [actuatorData]);

  useEffect(() => {
    if (outRef?.current) {
      outRef.current.scrollTop = outRef.current?.scrollHeight;
    }
  }, [inOutResult]);

  /**
   * 文本变化, 如果参数标记有变动, 则会返回剩余的参数标记
   * @param value
   * @param existedParams
   */
  const onChange = (value: string, params?: any[]) => {
    setInputValue(value);
  };

  /**
   * 参数整理
   */
  const onHandleParam = () => {
    const cloneData = _.cloneDeep(serviceInfo?.custom_config) || {};
    const handleData = _.reduce(
      cloneData?.input_type,
      (pre: any, key: any) => {
        pre[key?.name] = PARAM_TYPE[key?.type];
        return pre;
      },
      {}
    );
    return JSON.stringify(handleData, null, 8);
  };

  /**
   * 测试
   */
  const onTest = async () => {
    setIsShowResult(true);
    setInOutResult({});
    // onDefault();
    setLoading(true);
    try {
      let data: any = {};
      if (_.isEmpty(inputValue)) {
        data = { testData: '' };
      } else if (JSON.parse(JSON.stringify(inputValue.replace(/(^\s*)/g, ''), null, 0))[0] !== '{') {
        data = { testData: String(inputValue) };
      } else {
        data = { testData: JSON.parse(inputValue) };
      }
      // const data = JSON.parse(inputValue);
      const { env = '0' } = serviceInfo;
      const { res } = await customService.testCustom({ ...data, service_id: serviceInfo?.id, env });
      if (res) {
        // 为空新添加
        let num: any = 0;
        if (_.isEmpty(inOutResult)) {
          const inInput = [{ in: inputValue, out: JSON.stringify(res, null, 4), key: 1 }];
          setInOutResult(inInput);
        } else {
          // 不为空按顺序加1
          num = Object.keys(inOutResult).length + 1;
          const inInput = [...inOutResult, { in: inputValue, out: JSON.stringify(res, null, 4), key: num }];
          setInOutResult(inInput);
        }
        setLoading(false);
      }
    } catch (err) {
      const { ErrorDetails } = err?.response || err?.data || err || {};

      const errorTip =
        typeof ErrorDetails?.[0]?.detail === 'object'
          ? JSON.stringify(ErrorDetails?.[0]?.detail)
          : ErrorDetails?.[0]?.detail;
      let num: any = 0;
      if (_.isEmpty(inOutResult)) {
        const inInput = [{ in: inputValue, out: errorTip, key: 1, error: true }];
        setInOutResult(inInput);
      } else {
        // 不为空按顺序加1
        num = Object.keys(inOutResult).length + 1;
        const inInput = [...inOutResult, { in: inputValue, out: errorTip, error: true, key: num }];
        setInOutResult(inInput);
      }
      setLoading(false);
    }
  };

  /**
   * 恢复默认
   */
  const onDefault = () => {
    const handleData = onHandleParam();
    setInputValue(handleData);
  };

  /** 拖动高度 */
  const onChangeWidth = (offset: number) => {
    const y = scalingHeight + offset;
    const width = y > maxHeight ? maxHeight : y < minHeight ? minHeight : y;
    setScalingHeight(width);
  };

  /** 拖动高度结束 */
  const onChangeEndHeight = (offset: number) => {
    const x = scalingHeight + offset;
    const curHeight = x > maxHeight ? maxHeight : x < minHeight ? minHeight : x;
    if (curHeight < smallHeight) setScalingHeight(minHeight);
  };

  /**
   * 拖拽按钮操作
   */
  const onDragOperate = () => {
    if (!isOpenOrClose) {
      setScalingHeight(minHeight);
      setIsOpenOrClose(!isOpenOrClose);
      return;
    }
    setScalingHeight(initHeight);
    setIsOpenOrClose(!isOpenOrClose);
  };

  const switchStyle = {
    top: scalingHeight
  };

  /**
   * 复制
   */
  const onCopy = (data: any) => {
    copyToBoardArea(data);
    message.success(intl.get('exploreAnalysis.copySuccess'));
  };

  return (
    <div className="custom-test-page-wrap-root kw-w-100 kw-h-100">
      <div className="test-outline-box">
        {isShowResult ? (
          <div ref={outRef} className="input-result-box kw-pt-6" style={{ height: `${scalingHeight}px` }}>
            {loading && (
              <div className={`loading-mask ${loading && 'spinning'}`}>
                <div className="spin-content-box kw-flex">
                  <KwSpin />
                </div>
              </div>
            )}
            {_.map(inOutResult, (item: any, index: any) => {
              return (
                <div key={index} className="kw-flex">
                  <div className="in-title kw-mr-2 kw-c-primary kw-ml-2">{`[${item?.key}]`}</div>
                  <div className="result-in-out-wrap kw-mb-6">
                    <KwScrollBar className="in-result-box" autoHeight autoHeightMax={400}>
                      {/* <div className="in-result-box kw-flex kw-pb-6"> */}
                      <div className="icon-copy kw-pointer kw-w-100" onClick={() => onCopy(item?.in)}>
                        <IconFont type="icon-copy" style={{ fontSize: '14px' }} />
                      </div>
                      <pre className="in-box">{item?.in}</pre>
                      {/* </div> */}
                    </KwScrollBar>
                    <div className="out-result-box kw-flex">
                      <div className={classNames('param-code-editor-box kw-w-100', item?.error ? 'kw-p-3' : undefined)}>
                        {item?.error ? (
                          <div className="error-box">
                            <IconFont type="icon-Warning" className="kw-mr-2" style={{ color: '#F5222D' }} />
                            {item?.out}
                          </div>
                        ) : (
                          <>
                            <div className="icon-copy kw-pointer" onClick={() => onCopy(item?.out)}>
                              <IconFont type="icon-copy" style={{ fontSize: '14px' }} />
                            </div>
                            <ParamCodeEditor
                              value={item?.out}
                              readonly={true}
                              className="functionCodeEditor"
                              options={{
                                lineNumbers: true
                              }}
                            />
                          </>
                        )}
                      </div>
                      {/* )} */}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {isShowResult ? (
          <DragLine
            className="dragLine"
            onChange={(x, y) => onChangeWidth(y)}
            onEnd={(x, y) => onChangeEndHeight(y)}
            onDragOperate={onDragOperate}
            style={{ top: scalingHeight, height: '5px' }}
            showIcon
            switchStyle={switchStyle}
            switchName="switchName"
          />
        ) : null}

        <div className="kw-c-header kw-mb-2 kw-pl-6 kw-pt-6">{intl.get('customService.input')}</div>
        <div
          className="test-input-box kw-ml-6"
          // style={{ height: isShowResult ? '166px' : `calc(95% - ${outRef?.current?.style?.height || 0}px)` }}
          style={{
            height: isShowResult ? `calc(90% - ${scalingHeight}px)` : 'calc(100% - 32px)'
          }}
        >
          <div className="kw-w-100 kw-flex icon-box">
            <Tooltip title={intl.get('apiTrial.run')} placement="top">
              <div className="kw-mr-3 start-icon">
                <IconFont onClick={onTest} type="icon-qidong" className="kw-c-primary kw-pointer" />
              </div>
            </Tooltip>

            <Tooltip title={intl.get('cognitiveSearch.default')} placement="top">
              <IconFont onClick={onDefault} type="icon-huifumoren" className="kw-pointer" />
            </Tooltip>
          </div>
          <ParamCodeEditor
            value={inputValue}
            className="functionCodeEditor"
            ref={editorRef}
            options={{
              lineNumbers: false
            }}
            height="100%"
            onChange={onChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Test;
