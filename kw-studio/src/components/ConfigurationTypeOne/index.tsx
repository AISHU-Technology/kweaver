/**
 * 侧边栏菜单展示
 */

import React, { useEffect, useState } from 'react';
import { Switch, Tooltip } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import IconFont from '../IconFont';
import classNames from 'classnames';

import './style.less';

type ConfigurationTypeProp = {
  checked: any;
  configTitle: any; // Displayed data
  onSettingModal: (key: string) => void; // Judgment page/pop-up display
  onSwitch: (isCheck: boolean, key: string) => void; // Determine switch status
  checkedObj: any;
  operateFail: boolean; // operation failed
  operateSave: boolean; // Saved successfully
};

// The switch in the loop must match the state
const ConfigurationTypeOne = (props: ConfigurationTypeProp) => {
  const { configTitle, checked, onSettingModal, onSwitch, checkedObj, operateFail, operateSave } = props;
  const [checkedStatus, setCheckedStatus] = useState<any>({}); // switch status

  useEffect(() => {
    setCheckedStatus(checkedObj);
  }, [checked, operateSave, operateFail]);

  /**
   * 开关变化
   */
  const onSwitchChange = (isCheck: boolean, key: string) => {
    onSwitch(isCheck, key);
  };

  return (
    <div>
      {_.map(configTitle, (item: any, item_index: any) => {
        return (
          <div key={item.key} className="components-config-Sidebar-One kw-c-header kw-mt-3">
            <div className="config-title">{item.title}</div>

            {_.map(item?.children, (t: any, t_index: any) => {
              return (
                <React.Fragment key={t.key}>
                  <div className="kw-flex kw-pl-3 kw-mb-1 kw-mt-5">
                    <div className="config-children-title ">
                      {t?.title}
                      {t?.tip && (
                        <Tooltip title={t.tip} placement="top" className="kw-ml-2 icon-why">
                          <IconFont type="icon-wenhao" />
                        </Tooltip>
                      )}
                    </div>
                    <Switch
                      size="small"
                      checked={checkedStatus[t?.key]}
                      onChange={isCheck => onSwitchChange(isCheck, t?.key)}
                    />
                  </div>
                  {!checkedStatus[t?.key] ? null : (
                    <>
                      <div
                        className="line-vertical kw-ml-5"
                        style={{
                          height: t?.children?.length === 1 ? 20 : t?.children?.length * 28,
                          marginBottom: t?.children?.length === 1 ? -20 : -t?.children?.length * 28
                        }}
                      ></div>
                      {_.map(t?.children, (i: any, index: any) => {
                        return (
                          <div className="show-line kw-pt-3" key={index}>
                            <div className="kw-flex setting kw-ml-5">
                              <div className="line kw-mr-1"></div>
                              <div className="config-children-title-switch">{i?.title}</div>
                              <Switch size="small" checked={checkedStatus[t?.key]} />
                            </div>
                            {i?.otherSetting?.title && (
                              <div
                                style={{ background: operateFail ? '#fff2f0' : 'rgba(0, 0, 0, 0.04)' }}
                                className={classNames('kw-flex other-setting', { 'warning-box': operateFail })}
                              >
                                {/* 成功 */}
                                {operateSave && !operateFail ? (
                                  <IconFont type="icon-chenggong" className="kw-mr-2" style={{ color: '#126ee3' }} />
                                ) : null}
                                {/* 普通 */}
                                {!operateFail && !operateSave ? (
                                  <IconFont className="kw-mr-2" type="icon-Warning" style={{ color: '#b7b7b7' }} />
                                ) : null}
                                {/* 失败 */}
                                {operateFail ? (
                                  <IconFont className="kw-mr-2" type="icon-Warning" style={{ color: '#F5222D' }} />
                                ) : null}
                                <div className="config-children-title kw-flex">
                                  {i?.otherSetting?.title}
                                  {operateSave && !operateFail ? null : (
                                    <div className="kw-ml-2 kw-c-error">{intl.get('cognitiveSearch.notConfig')}</div>
                                  )}
                                </div>

                                <IconFont
                                  className="kw-pt-1"
                                  type="icon-setting"
                                  onClick={() => onSettingModal(i?.otherSetting?.key)}
                                />
                              </div>
                            )}
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

export default ConfigurationTypeOne;
