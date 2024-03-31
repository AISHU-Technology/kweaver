import React, { useEffect, useRef, useState } from 'react';
import { Tooltip, message } from 'antd';
import './style.less';
import intl from 'react-intl-universal';
import ScrollBar from '@/components/ScrollBar';
import AdSpin from '@/components/AdSpin';
import { copyToBoardArea, getParam } from '@/utils/handleFunction';
import ParamCodeEditor from '@/components/ParamCode';
import IconFont from '@/components/IconFont';
import DragLine from '@/components/DragLine';
import classNames from 'classnames';
import _ from 'lodash';
import customService from '@/services/customService';

/**
 * 各类型参数对应初始值
 */
const PARAM_TYPE: Record<string, any> = {
  int: 1,
  boolean: true,
  list: [],
  str: '',
  dict: {}
};

const initHeight = 366;
const minHeight = 60;
const maxHeight = 578;
const smallHeight = 100;
const Test = (props: any) => {
  const { inputJson, isTestInputShow, initialId, inOutResult, setInOutResult } = props;
  const editorRef = useRef<any>(null);
  const outRef = useRef<any>(null); // 输出
  const inputRef = useRef<any>(null); // 输出
  const [isShowResult, setIsShowResult] = useState(false);
  const [inputValue, setInputValue] = useState<any>('');
  const [loading, setLoading] = useState(false);
  const [scalingHeight, setScalingHeight] = useState(initHeight);
  const [isOpenOrClose, setIsOpenOrClose] = useState(false); // 开-true 或 关-false的判断

  useEffect(() => {
    if (_.isEmpty(inputJson)) return;
    if (isTestInputShow) {
      const handleData = onHandleParam();
      setInputValue(handleData);
      setIsShowResult(false);
      return;
    }
    setIsShowResult(false);
  }, [isTestInputShow, inputJson]);

  useEffect(() => {
    if (outRef?.current) {
      outRef.current.scrollTop = outRef?.current?.scrollHeight;
    }
  }, [inOutResult]);

  /**
   * 参数整理
   */
  const onHandleParam = () => {
    const cloneData = _.cloneDeep(JSON.parse(inputJson)) || {};
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
   * 文本变化, 如果参数标记有变动, 则会返回剩余的参数标记
   * @param value
   * @param existedParams
   */
  const onChange = (value: string) => {
    setInputValue(value);
  };

  const getPlaceholder = () => {
    // 空行保留
    return `${intl.get('customService.runConfigTest')}`;
  };

  /**
   * 测试
   */
  const onTest = async () => {
    setIsShowResult(true);
    setInOutResult({});
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

      const { env } = getParam(['env']);

      const { res } = await customService.testCustom({ ...data, service_id: initialId, env });
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
      const { ErrorDetails, Description } = err?.response || err?.data || err || {};
      const errorTip =
        typeof ErrorDetails?.[0]?.detail === 'object'
          ? JSON.stringify(ErrorDetails?.[0]?.detail)
          : ErrorDetails?.[0]?.detail;
      let num: any = 0;
      if (_.isEmpty(inOutResult)) {
        const inInput = [{ in: inputValue, out: JSON.stringify(errorTip), key: 1, error: true }];
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

  /**
   * 复制
   */
  const onCopy = (data: any) => {
    copyToBoardArea(data);
    message.success(intl.get('exploreAnalysis.copySuccess'));
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

  return (
    <div className="custom-test-wrap-root kw-w-100 kw-h-100">
      <div className="test-outline-box">
        {isShowResult ? (
          <div ref={outRef} className="input-result-box kw-mb-6 kw-pt-6" style={{ height: `${scalingHeight}px` }}>
            {loading && (
              <div className={`loading-mask ${loading && 'spinning'}`}>
                <div className="spin-content-box kw-flex">
                  <AdSpin />
                </div>
              </div>
            )}
            {_.map(inOutResult, (item: any, index: any) => {
              return (
                <div key={index} ref={inputRef} className={`input_${index} kw-flex kw-pr-6 kw-pl-6`}>
                  <div className="in-title kw-mr-2 kw-c-primary">{`[${item?.key}]`}</div>
                  <div className="result-in-out-wrap kw-mb-6">
                    <ScrollBar className="in-result-box" autoHeight autoHeightMax={400}>
                      {/* <div className="in-result-box kw-flex kw-pb-6"> */}
                      <div className="icon-copy kw-pointer kw-w-100" onClick={() => onCopy(item?.in)}>
                        <IconFont type="icon-copy" style={{ fontSize: '14px' }} />
                      </div>
                      <pre className="in-box">{item?.in}</pre>
                      {/* </div> */}
                    </ScrollBar>
                    <div className="out-result-box kw-flex">
                      <div className={classNames('param-code-editor-box kw-w-100', item?.error ? 'kw-p-3' : undefined)}>
                        {item?.error ? (
                          <div className="error-box" onClick={() => onCopy(item?.out)}>
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
                                lineNumbers: true,
                                scrollbarStyle: 'native'
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

        <div
          style={{
            height: isShowResult ? `calc(100% - ${scalingHeight + 31}px)` : 'calc(100% - 8px)'
          }}
        >
          <div className="kw-c-header kw-mb-2 kw-pl-6">{intl.get('customService.input')}</div>
          <div
            className="test-input-box kw-ml-6"
            // style={{ height: isShowResult ? '212px' : `calc(95% - ${outRef?.current?.style?.height || 0}px)` }}
          >
            <div className="kw-w-100 kw-flex icon-box">
              <Tooltip placement="top" title={intl.get('apiTrial.run')}>
                <div className="kw-mr-3 start-icon">
                  <IconFont onClick={onTest} type="icon-qidong" className="kw-c-primary kw-pointer" />
                </div>
              </Tooltip>

              <Tooltip placement="top" title={intl.get('cognitiveSearch.default')}>
                <IconFont onClick={onDefault} type="icon-huifumoren" className="kw-pointer" />
              </Tooltip>
            </div>
            <ParamCodeEditor
              value={inputValue}
              className="functionCodeEditor"
              ref={editorRef}
              options={{
                placeholder: getPlaceholder(),
                lineNumbers: false
              }}
              height="100%"
              onChange={onChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Test;
