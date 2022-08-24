import React, { Component } from 'react';
import intl from 'react-intl-universal';
import { withRouter } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';

import { hexMd5 } from '@/utils/crypto/md5';
import servicesExpired from '@/services/expired';

import { localStore, getParam } from '@/utils/handleFunction';
import IconFont from '@/components/IconFont';

import './index.less';

// 密码规则
const passReg =
  /^(?![a-zA-Z]+$)(?![A-Z0-9]+$)(?![A-Z_<> .,?/';:"[\]\\{}|!@#$%^&*`~()+=-]+$)(?![a-z0-9]+$)(?![a-z_<> .,?/';:"[\]\\{}|!@#$%^&*`~()+=-]+$)(?![0-9_<> .,?/';:"[\]\\{}|!@#$%^&*`~()+=-]+$)[a-zA-Z0-9_<> .,?/';:"[\]\\{}|!@#$%^&*`~()+=-]{8,128}$/;

class ResetPassword extends Component {
  state = {
    errorText: '', // 错误提示
    wordLength: 8, // 密码最小长度
    showForget: true // 是否显示“忘记密码”, admin 不显示
  };

  formRef = React.createRef();

  componentDidMount() {
    this.getWordLength();

    this.initName();
  }

  /**
   * @description 初始化用户名
   */
  initName = () => {
    const name = getParam('name');

    if (!name) return;

    this.formRef.current.setFieldsValue({ username: name });
    this.setState({ showForget: name !== 'admin' });
  };

  /**
   * @description 获取密码最小长度
   */
  getWordLength = async () => {
    const res = await servicesExpired.pwSizeGet();

    if (res && res.res) {
      this.setState({
        wordLength: res.res.Size
      });
    }
  };

  /**
   * @description 切换登录
   */
  returnLogin = () => {
    window.sessionStorage.removeItem('loginType');
    this.props.setOperationType('login');
  };

  /**
   * @description 提交表单
   */
  onFinish = async value => {
    if (!this.validatorForms(value)) {
      return;
    }
    const { username } = this.props;
    const { oldpassword, newpassword } = value;

    const data = {
      name: username || window.sessionStorage.getItem('changeUserEmail'),
      oldpass: hexMd5(oldpassword),
      newpass: window.btoa(newpassword)
    };

    const res = await servicesExpired.pwReset(data);

    if (res && res.ErrorCode) {
      const { ErrorCode } = res;

      // 新旧密码一样
      if (ErrorCode === 'Manager.Account.ModifySamePasswordError') {
        this.formRef.current.setFields([
          {
            name: 'newpassword',
            errors: [intl.get('userManagement.passTheSame')]
          }
        ]);
        this.setState({
          errorText: [intl.get('userManagement.passTheSame')]
        });
      }

      if (
        ErrorCode === 'Manager.Account.UsernameInvalidError' || // 账户名非法
        ErrorCode === 'Manager.Account.AccountError' // 账号错误
      ) {
        this.formRef.current.setFields([
          {
            name: 'username',
            errors: [' ']
          },
          {
            name: 'oldpassword',
            errors: [intl.get('login.authError')]
          }
        ]);

        this.setState({
          errorText: [intl.get('login.authError')]
        });
        return;
      }

      if (ErrorCode === 'Manager.Account.AccountLockedError') {
        message.error([intl.get('userManagement.locked', { time: res.Description })]);

        return;
      }
      // ldap用户不能激活
      if (ErrorCode === 'Manager.Ldap.UserActiveError') {
        message.error([intl.get('userManagement.ladpUserActiveError')]);

        return;
      }

      // ladp 用户不能重置密码
      if (ErrorCode === 'Manager.Ldap.UserChangePasswordError') {
        message.error([intl.get('userManagement.ldapResetPassError')]);

        return;
      }

      // 已禁用
      if (ErrorCode === 'Manager.Account.AccountDisableError') {
        message.error(intl.get('userManagement.accountDisabled'));
      }

      // 未激活
      if (ErrorCode === 'Manager.Account.AccountInactivatedError') {
        message.error(intl.get('userManagement.goActivate'));
      }
    }

    if (res && res.res) {
      // 将重置的密码带入到登录页
      localStore.set('adUser', {
        name: username,
        pass: window.btoa(newpassword)
      });

      message.success([intl.get('userManagement.changeSuccess')]);
      window.sessionStorage.removeItem('loginType');
      this.props.setOperationType('login');
    }
  };

  /**
   * 校验
   */
  validatorForms = value => {
    const { oldpassword, newpassword, surepassword } = value;

    if (!oldpassword) {
      this.setState({
        errorText: [intl.get('login.noOldPass')]
      });
      return false;
    }

    if (!newpassword) {
      this.setState({
        errorText: [intl.get('login.noNewPass')]
      });
      return false;
    }

    if (!surepassword) {
      this.setState({
        errorText: [intl.get('login.noSurePass')]
      });
      return false;
    }

    if (oldpassword === newpassword) {
      this.setState({
        errorText: [intl.get('login.samePass')]
      });
      return false;
    }

    if (newpassword.length < 8) {
      this.setState({
        errorText: [intl.get('login.passwordRules')]
      });
    }

    if (newpassword.length > 128) {
      this.setState({
        errorText: [intl.get('login.passwordRules')]
      });
    }

    if (!passReg.test(newpassword)) {
      this.setState({
        errorText: [intl.get('login.passwordRules')]
      });
      return false;
    }

    if (surepassword !== newpassword) {
      this.setState({
        errorText: [intl.get('login.newPassDifferent')]
      });
      return false;
    }
    return true;
  };

  /**
   * 用户名变化
   */
  onNameChange = e => {
    const { value } = e.target;

    this.setState({ showForget: value !== 'admin' });
  };

  /**
   * 点击忘记密码
   */
  onForget = e => {
    message.error(intl.get('userManagement.contactAdmin'));
  };

  passwordChange = e => {
    this.setState({
      errorText: ''
    });
  };

  render() {
    const { username } = this.props;

    return (
      <div className="reset-password-content">
        <div className="box">
          <div className="info">
            <div className="title">{intl.get('login.changePassword')}</div>
            <div className="des">{intl.get('login.passwordRules')}</div>

            <Form requiredMark={false} layout="vertical" ref={this.formRef} onFinish={this.onFinish}>
              <div className="change-pass-name">
                <IconFont type="icon-dengluzhanghu" className="username-icon" />
                {username || window.sessionStorage.getItem('changeUserEmail')}
              </div>

              <Form.Item name="oldpassword">
                <Input.Password
                  visibilityToggle={false}
                  prefix={<IconFont type="icon-mima" className="input-icon" />}
                  placeholder={intl.get('login.inputOldPass')}
                  onChange={this.passwordChange}
                  autoComplete="off"
                />
              </Form.Item>

              <Form.Item name="newpassword">
                <Input.Password
                  visibilityToggle={false}
                  prefix={<IconFont type="icon-newcode" className="input-icon" />}
                  placeholder={intl.get('login.inputNewPass')}
                  onChange={this.passwordChange}
                  autoComplete="off"
                />
              </Form.Item>

              <Form.Item name="surepassword">
                <Input.Password
                  visibilityToggle={false}
                  prefix={<IconFont type="icon-queren" className="input-icon" />}
                  placeholder={intl.get('login.inputSurePass')}
                  onChange={this.passwordChange}
                  autoComplete="off"
                />
              </Form.Item>
              <p className="error-text">{this.state.errorText}</p>
              <Form.Item className="bottom-button-e">
                <Button className="ant-btn-default return" onClick={this.returnLogin}>
                  {intl.get('userManagement.cancel')}
                </Button>
              </Form.Item>

              <Form.Item className="bottom-button-e">
                <Button type="primary" className="sure" htmlType="submit">
                  {intl.get('userManagement.ok1')}
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(ResetPassword);
