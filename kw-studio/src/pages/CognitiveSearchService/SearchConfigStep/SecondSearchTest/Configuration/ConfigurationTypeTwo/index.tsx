import _ from 'lodash';
import { Switch, Tooltip } from 'antd';
import intl from 'react-intl-universal';
import React, { useEffect, useMemo, useState } from 'react';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import IconFont from '@/components/IconFont';
import ExplainTip from '@/components/ExplainTip';
import './style.less';

const ERROR: Record<string, string> = {
  openaiDelete: intl.get('cognitiveSearch.resource.openaiDelete'),
  openai: intl.get('cognitiveSearch.answersOrganization.connectError'),
  private_llmDelete: intl.get('cognitiveSearch.resource.privateDelete'),
  private_llm: intl.get('cognitiveSearch.answersOrganization.LLMConnectError')
};

type ConfigurationTypeProp = {
  checked: any;
  configTitleTwo: any;
  onSettingModal: (key: string, arg?: any) => void;
  onSwitch: (isCheck: boolean, key: string) => void;
  isSwitchDisable: string;
  checkedObj: any;
  errorObj?: any;
  qaError: string;
  advError: string;
  authError: any;
  isQAConfigError: boolean;
};

const ConfigurationTypeTwo = (props: ConfigurationTypeProp) => {
  const {
    authError,
    checked,
    configTitleTwo,
    onSettingModal,
    onSwitch,
    qaError,
    advError,
    isSwitchDisable,
    checkedObj,
    errorObj,
    isQAConfigError
  } = props;
  const [checkedStatus, setCheckedStatus] = useState<any>(checkedObj);

  const text = useMemo(() => {
    if (isSwitchDisable === 'kg') return intl.get('cognitiveSearch.resource.noGraph');
    if (isSwitchDisable === 'model') return intl.get('cognitiveSearch.resource.noModel');
    if (isSwitchDisable === 'all') return intl.get('cognitiveSearch.resource.noGraphAndModel');
  }, [isSwitchDisable]);

  useEffect(() => {
    setCheckedStatus(checkedObj);
  }, [checked]);

  const onSwitchChange = (isCheck: boolean, key: string) => {
    onSwitch(isCheck, key);
  };

  const disabled = (item: any) => {
    return ['kg', 'all'].includes(isSwitchDisable) || (item?.id === 'qa' && isSwitchDisable === 'model');
  };

  return (
    <div>
      {_.map(configTitleTwo, (item: any) => {
        return (
          <div key={item.key} className="components-config-Sidebar-Two kw-c-header">
            <div className="config-title">{item.title}</div>

            {isSwitchDisable && item?.key !== '1' ? (
              <div className="kw-mt-3 kw-flex test-content-tip">
                <IconFont type="icon-Warning" className="kw-mr-2" style={{ color: '#FFBF00' }} />
                <div>{text}</div>
              </div>
            ) : null}

            {_.map(item?.children, (t: any) => {
              return (
                <React.Fragment key={t.key}>
                  <div className="kw-flex kw-pl-3 kw-mb-1 kw-mt-5 title-box">
                    <div className="config-children-title">{t?.title}</div>
                    <Switch
                      size="small"
                      disabled={disabled(t) && item?.key !== '1'}
                      checked={checkedStatus[t?.key]}
                      onChange={isCheck => onSwitchChange(isCheck, t?.key)}
                    />
                  </div>
                  {!checkedStatus[t?.key] ? null : (
                    <>
                      <div
                        className="line-vertical kw-ml-5"
                        style={{
                          height: t?.children?.length * 34,
                          marginBottom: -t?.children?.length * 34
                        }}
                      ></div>
                      {_.map(t?.children, (i: any) => {
                        const isAuthError = authError?.[i.authkey];
                        return (
                          <div key={i.key} className="show-line kw-pt-3">
                            <div className="kw-flex setting kw-w-100">
                              <div className="line kw-mr-1"></div>
                              <div className="config-children-title" style={{ width: isAuthError ? 266 : 288 }}>
                                {i?.title}
                                {i?.tip ? (
                                  <Tooltip title={i?.tip} placement="top" className="kw-ml-2 icon-why">
                                    <IconFont type="icon-wenhao" />
                                  </Tooltip>
                                ) : null}
                                {!!errorObj[i.key] && (
                                  <span className="kw-ml-2 kw-c-error">
                                    ({intl.get('knowledgeCard.notConfigured')})
                                  </span>
                                )}
                                {((_.isBoolean(qaError) ? !qaError : !!qaError) || isQAConfigError) &&
                                i?.key === '2-2-2' ? (
                                  <Tooltip
                                    placement="top"
                                    title={
                                      isQAConfigError
                                        ? intl.get('cognitiveSearch.graphQA.checkPropertyError')
                                        : ERROR[qaError] || intl.get('cognitiveSearch.answersOrganization.connectError')
                                    }
                                  >
                                    <IconFont type="icon-Warning" className="kw-c-error icon-warn" />
                                  </Tooltip>
                                ) : null}
                                {ERROR[advError] && i?.key === 'advConfig' ? (
                                  <Tooltip placement="top" title={ERROR[advError]}>
                                    <IconFont type="icon-Warning" className="icon-warn" style={{ color: '#FFBF00' }} />
                                  </Tooltip>
                                ) : null}
                              </div>
                              {isAuthError && (
                                <ExplainTip title={intl.get('global.graphNoPeromission')}>
                                  <ExclamationCircleOutlined className="kw-c-error kw-mr-2 kw-pt-1" />
                                </ExplainTip>
                              )}
                              {i.configType === 'switch' ? (
                                <Switch
                                  size="small"
                                  checked={!!checkedStatus[i?.key]}
                                  onChange={isCheck => onSwitchChange(isCheck, i?.key)}
                                  style={{ transform: 'translateX(-25%)' }}
                                />
                              ) : (
                                <IconFont
                                  className="kw-pt-1"
                                  type="icon-setting"
                                  onClick={() => onSettingModal(i?.key)}
                                />
                              )}
                            </div>
                            {checkedStatus[i?.key]
                              ? _.map(i?.children, (child: any, childIndex: any) => {
                                  return (
                                    <React.Fragment key={childIndex}>
                                      <div
                                        className="line-vertical kw-ml-8"
                                        style={{
                                          height: i?.children?.length * 34,
                                          marginBottom: -i?.children?.length * 34
                                        }}
                                      ></div>
                                      <div className="kw-flex kw-ml-8 kw-pt-3">
                                        <div className="line kw-mr-1"></div>
                                        <div className="child-name">{child?.title}</div>
                                        <IconFont
                                          className="kw-pt-1"
                                          type="icon-setting"
                                          onClick={() => onSettingModal(child?.key)}
                                        />
                                      </div>
                                    </React.Fragment>
                                  );
                                })
                              : null}
                          </div>
                        );
                      })}
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default ConfigurationTypeTwo;
