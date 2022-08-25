/**
 * 国际化切换组件
 *
 * @author Eden
 * @date 2021/09/23
 *
 */

import React, { Component } from 'react';
import Cookie from 'js-cookie';
import { connect } from 'react-redux';
import { Dropdown, Menu } from 'antd';
import { DownOutlined } from '@ant-design/icons';

import IconFont from '@/components/IconFont';

import './style.less';

const { Item } = Menu;

class DropIntlChange extends Component {
  state = {
    lang: Cookie.get('anyDataLang') || 'zh-CN'
  };

  langChangeZ = () => {
    const { lang } = this.state;

    if (lang === 'zh-CN') return;

    Cookie.set('anyDataLang', 'zh-CN', { expires: 365 });

    this.setState({
      lang: 'zh-CN'
    });

    window.location.reload();
  };

  langChangeE = () => {
    const { lang } = this.state;

    if (lang === 'en-US') return;

    Cookie.set('anyDataLang', 'en-US', { expires: 365 });

    this.setState({
      lang: 'en-US'
    });

    window.location.reload();
  };

  menu = () => {
    const { lang } = this.state;
    return (
      <Menu>
        <Item key="zn" onClick={this.langChangeZ} className={lang === 'zh-CN' ? 'selected' : ''}>
          简体中文
        </Item>
        <Item key="en" onClick={this.langChangeE} className={lang === 'en-US' ? 'selected' : ''}>
          English
        </Item>
      </Menu>
    );
  };

  render() {
    return (
      <div className="drop-intl-change">
        <Dropdown
          placement="bottomLeft"
          overlay={this.menu()}
          trigger={['click']}
          overlayClassName="change-language-overlay"
        >
          <div className="change-language-content">
            <div>
              <IconFont type="icon-yuyan1" className="icon" />
            </div>
            <div>{this.state.lang === 'zh-CN' ? '简体中文' : 'English'}</div>
            <div className="icon-font">
              <DownOutlined />
            </div>
          </div>
        </Dropdown>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  anyDataLang: state.getIn(['changeAnyDataLang', 'anyDataLang'])
});

export default connect(mapStateToProps)(DropIntlChange);
