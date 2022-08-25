/**
 * 登录
 *
 * @author liang.zhiqiang@aishu.cn
 * @date 2020/05/21
 *
 */

import React, { useEffect, useState } from 'react';
import Cookie from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';
import { connect } from 'react-redux';
import intl from 'react-intl-universal';
import { withRouter, Link } from 'react-router-dom';
import { Button, Form, Input, Checkbox, Dropdown, Menu } from 'antd';
import { DownOutlined } from '@ant-design/icons';

import { hexMd5 } from '@/utils/crypto/md5';
import versionInfo from '@/version.json';
import { changeUserInfo } from '@/reduxConfig/actions';
import servicesLogin from '@/services/login';

import IconFont from '@/components/IconFont';
import { localStore, sessionStore } from '@/utils/handleFunction';
import ResetPassword from './resetPassword/index';

import sdkFile from '@/downLoad/sdk.zip';
import logo from '@/assets/images/head-Logo.svg';
import './style.less';

const FormItem = Form.Item;
const { Item } = Menu;

const Login = props => {
  const [form] = Form.useForm();
  const { history, userInfo, updateUserInfo, anyDataLang } = props;
  const [errorText, setErrorText] = useState(''); // 报错信息
  const [errorType, setErrorType] = useState(0); // 1 用户名错误 2 密码错误 3其他错误 4初次登陆
  const [operationType, setOperationType] = useState('login'); // 操作类型，登陆或者重置密码
  const [username, setUsername] = useState(''); // 用户名
  const [visibleAbout, setVisibleAbout] = useState(false);

  useEffect(() => {
    document.title = `${intl.get('title.login')}_AnyDATA`;
  }, []);
  useEffect(() => {
    const adUser = localStore.get('adUser');
    setOperationType(window.sessionStorage.getItem('loginType'));

    if (adUser) {
      form.setFields([
        {
          name: 'username',
          value: adUser.name
        },
        {
          name: 'password',
          value: window.atob(adUser.pass)
        },
        {
          name: 'remember',
          value: true
        }
      ]);
    }
  }, [userInfo, operationType]);

  const handleLogin = async e => {
    e.preventDefault();
    await form.validateFields();
    if (!form.getFieldValue('password') && !form.getFieldValue('username')) {
      return;
    }

    form
      .validateFields()
      .then(async values => {
        const sessionid = uuidv4();
        // 查询用户来源 status: 是否为ldap用户  true 是， false 否
        const source = await servicesLogin.userSourceGet(values.username);

        const body = {
          name: values.username,
          pass: source.res?.status ? btoa(values.password) : hexMd5(values.password),
          sessionid
        };
        // 用户名
        setUsername(values.username);

        const response = await servicesLogin.loginPost(body);

        const { res, ErrorCode, Description } = response || {};

        if (res && !ErrorCode) {
          const uuid = res.Uuid || '';
          const userInfo = {
            name: res.Name,
            email: res.Email,
            type: res.Type,
            id: res.Id,
            status: res.Status,
            LdapDomain: res.LdapDomain // 不为空就是ldap用户
          };

          // 未激活的状态的需要提示用户重置密码
          if (res.Status === 3) {
            setUsername(res.Email);
            setErrorType(4);
            setErrorText(intl.get('login.unableLogo'));
            return;
          }

          localStore.set('userInfo', userInfo);
          sessionStore.set('sessionid', sessionid);
          updateUserInfo(userInfo);
          Cookie.set('sessionid', sessionid);
          Cookie.set('uuid', uuid);

          if (values.remember) {
            localStore.set('adUser', {
              name: values.username,
              pass: window.btoa(values.password)
            });
          } else {
            const adUser = localStore.get('adUser');

            if (adUser && adUser.name === values.username) {
              localStore.remove('adUser');
            }
          }

          // 登陆默认到知识网络
          history.push('/home/graph-list');
        } else if (ErrorCode) {
          switch (ErrorCode) {
            // 账号错误
            case 'Manager.Account.AccountError': {
              setErrorType(3);
              setErrorText(intl.get('login.error'));
              break;
            }

            // 账户名非法
            case 'Manager.Account.UsernameInvalidError': {
              setErrorType(3);
              setErrorText(intl.get('login.error'));
              break;
            }

            // 已禁用
            case 'Manager.Account.AccountDisableError': {
              setErrorType(3);
              setErrorText(intl.get('login.blocked'));
              break;
            }

            // ladp 账户已经失效
            case 'Manager.Ldap.UserInvalidError': {
              setErrorType(3);
              setErrorText(intl.get('login.ldapAccountInvalid'));
              break;
            }

            // 已禁用
            case 'Manager.Account.AccountInactivatedError': {
              setErrorType(3);
              setErrorText(intl.get('userManagement.goActivate'));
              break;
            }

            // 已锁定改
            case 'Manager.Account.AccountLockedError': {
              setErrorType(3);
              setErrorText(intl.get('login.locked', { time: Description }));
              break;
            }

            // 密码长度不符合范围
            case 'Manager.Account.PasswordLenNotMatchError': {
              setErrorType(3);
              setErrorText(intl.get('userManagement.wordLow'));
              break;
            }
            // 密码过期
            case 'Manager.Account.AccountPasswordExpireError': {
              setErrorType(4);
              setErrorText(intl.get('login.passwordTimeout'));
              break;
            }
            // 账号试用过期
            case 'Manager.Account.InsufficientAccountPermissionsError': {
              setErrorType(3);
              setErrorText(intl.get('userManagement.wordLow'));
              break;
            }
            // ldap 连接错误
            case 'Manager.Ldap.ConnError': {
              setErrorType(3);
              setErrorText(intl.get('userManagement.wordLow'));
              break;
            }
            // ldap用户密码异常
            case 'Manager.Ldap.UserPasswordError': {
              setErrorType(3);
              setErrorText(intl.get('login.authError'));
              break;
            }
            // ldap查询错误
            case 'Manager.Ldap.SearchAttributesError': {
              setErrorType(3);
              setErrorText(intl.get('login.ladpSearchError'));
              break;
            }
            // ldap查询用户为0
            case 'Manger.Ldap.NullSearchError': {
              setErrorType(3);
              setErrorText(intl.get('login.ladpSearchError'));
              break;
            }
            // ldap用户查询多个
            case 'Manager.Ldap.MultiSearchError': {
              setErrorType(3);
              setErrorText(intl.get('login.ladpSearchError'));
              break;
            }
            // ldap用户属性异常
            case 'Manager.Ldap.UserAttributesError': {
              setErrorType(3);
              setErrorText(intl.get('login.ladpAttrError'));
              break;
            }
            // 授权过期，普通用户无法登陆
            case 'Manager.SoftAuth.TestAuthCodeExpireError': {
              setErrorType(3);
              setErrorText(intl.get('login.invalid'));
              break;
            }
            // 用户信息不存在
            case 'Manager.Graph.UserNotFoundError': {
              setErrorType(3);
              setErrorText(intl.get('login.userInfoNull'));
              break;
            }
            default:
              break;
          }
        }
      })
      .catch(errors => {
        // eslint-disable-next-line no-console
        // console.log(errors.values.errorFields);
      });
  };

  const usernameChange = e => {
    setErrorType(0);
    setErrorText('');
    form.setFields([
      {
        name: 'username',
        errors: []
      }
    ]);
    // 是否有记住用户
    const adUser = localStore.get('adUser');

    if (!adUser) {
      return;
    }

    // 记住密码的情况下，换用户名需要清空密码
    const { password, username } = form.getFieldsValue();
    if (window.atob(adUser?.pass) === password && username !== adUser?.name) {
      form.setFieldsValue({ password: '' });
    }
  };

  const passwordChange = value => {
    setErrorType(0);
    setErrorText('');
    form.setFields([
      {
        name: 'password',
        errors: []
      }
    ]);
  };

  /**
   * @description 跳转OpenAPI文档页面
   */
  const toAPIDoc = () => {
    window.open('/swagger');
  };

  /**
   * @description sdk 下载
   */
  const downloadFile = () => {
    const aLink = document.createElement('a');
    const evt = document.createEvent('MouseEvents');

    evt.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    aLink.download = 'sdk.zip';
    aLink.href = sdkFile;
    aLink.dispatchEvent(evt);
  };

  const menu = () => {
    return (
      <Menu>
        <Item key="sdk">
          <div onClick={downloadFile}>{intl.get('login.download')}</div>
        </Item>
        <Item key="api" onClick={toAPIDoc}>
          {intl.get('login.checkApi')}
        </Item>
      </Menu>
    );
  };

  return (
    <div className="login">
      <div className="login-bgi-box"></div>
      <div className="login-box">
        <div className="login-intl">
          <div className="open-API">
            <Dropdown overlay={menu()} trigger={['click']} placement="bottomRight" overlayClassName="login-sdk-overlay">
              <div className="api-drop-text">
                <div>
                  <IconFont origin="new" type="icon-wendang-xianxing" className="icon" />
                </div>
                <div>{intl.get('login.apiHandbook')}</div>
                <div className="icon-font">
                  <DownOutlined />
                </div>
              </div>
            </Dropdown>
          </div>
        </div>

        <div className="login-form-box">
          {operationType !== 'resetPass' ? (
            <>
              <div className="login-form-title">
                <img className="logo-img" src={logo} alt="AnyDATA" />
                <div className="title-text">{intl.get('login.studio')}</div>
              </div>

              <Form layout="vertical" form={form} hideRequiredMark="true" className="login-form">
                <FormItem
                  name="username"
                  validateFirst={true}
                  rules={[
                    {
                      validator: async (rule, value) => {
                        if (!value) {
                          setErrorType(1);
                          setErrorText(intl.get('login.noAccount'));
                          throw new Error('error');
                        }
                      }
                    }
                  ]}
                  validateTrigger="onSubmit"
                >
                  <Input
                    className="login-form-input"
                    prefix={<IconFont type="icon-dengluzhanghu" className="input-icon" />}
                    placeholder={intl.get('login.inputAccount')}
                    onChange={e => usernameChange(e)}
                    autoComplete="off"
                  />
                </FormItem>

                <FormItem
                  name="password"
                  validateFirst={true}
                  rules={[
                    {
                      validator: async (rule, value) => {
                        if (!value && !errorType) {
                          setErrorType(2);
                          setErrorText(intl.get('login.noPass'));
                          throw new Error('error');
                        }
                      }
                    }
                  ]}
                  validateTrigger="onSubmit"
                >
                  <Input
                    type="password"
                    className="login-form-input"
                    prefix={<IconFont type="icon-mima" className="input-icon" />}
                    placeholder={intl.get('login.inputPass')}
                    onChange={passwordChange}
                    autoComplete="off"
                  />
                </FormItem>

                <FormItem name="remember" valuePropName="checked" className="login-form-remember-box">
                  <Checkbox className="login-form-remember">{intl.get('login.remember')}</Checkbox>
                </FormItem>

                <Button type="primary" className="login-form-button" htmlType="submit" onClick={handleLogin}>
                  {intl.get('login.signin')}
                </Button>
              </Form>
              {/* 报错 */}
              {errorText && <p className="error-message">{errorText}</p>}
              {/* 未激活用户 需要修改密码 */}
              {errorType === 4 && (
                <p
                  className="toReset"
                  onClick={() => {
                    setErrorText('');
                    setErrorType(0);
                    window.sessionStorage.setItem('loginType', 'resetPass');
                    window.sessionStorage.setItem('changeUserEmail', username);
                    setOperationType('resetPass');
                  }}
                >
                  {intl.get('login.modify')}
                </p>
              )}
            </>
          ) : (
            <ResetPassword username={username} setOperationType={setOperationType}></ResetPassword>
          )}
          <div className="agreement-box">
            <span className="agreement">{intl.get('login.agreement')}</span>
            <Link className="link" to={'/privacy-policy'} target="_blank">
              {intl.get('login.privacyPolicy')}
            </Link>
            {intl.get('login.and')}
            <Link className="link" to={'/legal-notice'} target="_blank">
              {intl.get('login.legalNotice')}
            </Link>
            <p className="version-information">
              <span
                className="info"
                onClick={() => {
                  setVisibleAbout(true);
                }}
              >
                {intl.get('login.version')}
              </span>
              {anyDataLang === 'zh-CN' && `：${versionInfo.version}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = state => ({
  userInfo: state.getIn(['changeUserInfo', 'userInfo']).toJS(),
  anyDataLang: state.getIn(['changeAnyDataLang', 'anyDataLang'])
});

const mapDispatchToProps = dispatch => ({
  updateUserInfo: info => dispatch(changeUserInfo(info))
});

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Login));
