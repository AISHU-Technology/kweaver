import React, { useEffect, useState } from 'react';
import { Button, Dropdown, Input, ConfigProvider, message, Menu } from 'antd';
import { LeftOutlined, DownOutlined } from '@ant-design/icons';
import HOOKS from '@/hooks';
import _ from 'lodash';
import AdSpin from '@/components/AdSpin';
import customService from '@/services/customService';
import cognitiveSearchService from '@/services/cognitiveSearch';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { useHistory, Prompt } from 'react-router-dom';
import Test from './Test';
import { getParam } from '@/utils/handleFunction';

import './style.less';

const CustomTest = (props: any) => {
  const { knwStudio } = props;
  const location = window.location;
  const history = useHistory();
  const [isExit, setIsExit] = useState(false);
  const [usb, setUsb] = useState({});
  const [customList, setCustomList] = useState<any>([]); // 全部服务
  const [serviceInfo, setServiceInfo] = useState<any>({}); // 选中的服务
  const [isPrevent, setIsPrevent] = useState(true); // 是否阻止路由跳转
  const [inOutResult, setInOutResult] = useState({});
  const [loading, setLoading] = useState(false);
  const [actuatorData, setActuatorData] = useState<any>({}); // 测试进入填入的数据
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskId, setTaskId] = useState(0);

  useEffect(() => {
    const { action, s_id } = getParam(['action', 's_id']);
    setIsExit(true);
    s_id && onGetEdit(s_id);
    initGetList(); // 列表
  }, []);

  useEffect(() => {
    if (usb === 'knw') {
      onExits('knw');
      return;
    }
    if (knwStudio === 'studio') {
      onExits('studio');
    }
  }, [knwStudio]);

  /**
   * 获取自定义服务列表
   */
  const initGetList = async () => {
    const { knw_id } = getParam(['knw_id']);
    try {
      const data = { page: 1, size: 10000, type: 'custom' };
      const { res } = await customService.customList(data);
      if (res?.count) {
        setCustomList(res?.results);
      }
    } catch (err) {
      //
    }
  };

  /**
   * 获取指定服务数据
   */
  const onGetEdit = async (id: any) => {
    setInOutResult({});
    setActuatorData({});
    setLoading(true);
    try {
      const { res } = await customService.editCustom(id);
      if (res) {
        const { custom_config, ...info } = res;
        setServiceInfo(res);
        setActuatorData(JSON.stringify(custom_config, null, 8));
        onGetStatus(res?.id, res?.env);
        setTaskId(res?.id);
      }
    } catch (err) {
      const { ErrorCode, Description } = err?.response || err?.data || err || {};
      if (ErrorCode === 'KnCognition.ServicePermissionDeniedErr') {
        return message.error(intl.get('license.serAuthError'));
      }
      if (ErrorCode === 'KnCognition.GraphPermissionDeniedErr') {
        return message.error(intl.get('analysisService.noGraphAuth'));
      }
      Description && message.error(Description);
    }
  };

  /**
   * 获取初始化状态
   */
  const onGetStatus = async (id: any, env: any) => {
    try {
      setTaskLoading(true);
      const { res } = await customService.getStatus({ id, env });
      if (res) {
        setTaskLoading(false);
        setLoading(false);
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
    if (taskLoading && taskId) {
      onGetStatus(taskId, serviceInfo?.env);
    }
  }, 2000);

  /**
   * 退出
   */
  const onExits = async (type?: any, data?: any) => {
    setIsPrevent(false);
    if (type === 'studio') {
      Promise.resolve().then(() => {
        history.push('/home');
      });
      return;
    }
    if (type === 'knw') {
      Promise.resolve().then(() => {
        history.push('/cognitive-application/domain-custom');
      });
    }
  };

  const SERVICE_MENUS = customList?.length ? (
    <Menu
      className="kw-search-dropdown"
      style={{ maxHeight: '370px', overflowY: 'auto', overflowX: 'hidden', width: '226px' }}
      selectedKeys={[String(serviceInfo.id)]}
    >
      {_.map(customList, item => {
        const { name, id } = item;
        const selected = String(item?.id) === id;
        return (
          <Menu.Item
            key={String(id)}
            className={classNames({ selected })}
            style={{ height: 40, width: '226px' }}
            onClick={() => {
              setServiceInfo(item);
              onGetEdit(item.id);
            }}
          >
            <div className="kw-ellipsis" style={{ maxWidth: 196 }} title={name}>
              {name}
            </div>
          </Menu.Item>
        );
      })}
    </Menu>
  ) : (
    <></>
  );

  return (
    <div className="custom-config-test-page-wrap-root">
      {isExit && !location.pathname.includes('iframe') && (
        <div className="top-header kw-align-center">
          {location.pathname.includes('iframe') ? null : (
            <Button onClick={() => onExits('knw')} type="text" className="kw-pl-6 kw-center exit-btn">
              <LeftOutlined />
              <span className="exit-operate">{intl.get('global.exit')}</span>
            </Button>
          )}
          <Dropdown overlay={SERVICE_MENUS} trigger={['click']} placement="bottomLeft">
            <div className={`${location.pathname.includes('iframe') && 'kw-pl-6'} s-name kw-align-center kw-pointer`}>
              <div className="kw-ellipsis" style={{ maxWidth: 160 }}>
                {serviceInfo.name || ''}
              </div>
              <DownOutlined className="kw-ml-2" style={{ fontSize: 13 }} />
            </div>
          </Dropdown>
        </div>
      )}
      {loading && (
        <div className={`loading-mask ${loading && 'spinning'}`}>
          <div className="spin-content-box kw-flex">
            <AdSpin />
            <div className="loading-content">{intl.get('cognitiveSearch.loading')}</div>
          </div>
        </div>
      )}
      <Test
        actuatorData={actuatorData}
        inOutResult={inOutResult}
        setInOutResult={setInOutResult}
        serviceInfo={serviceInfo}
      />

      <Prompt
        when={isPrevent}
        message={location => {
          setUsb('knw');
          return false;
        }}
      />
    </div>
  );
};

export default CustomTest;
