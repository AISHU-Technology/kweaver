import React, { memo, useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Modal, Button, Input, Form, ConfigProvider, message, Select } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import serviceStorageManagement from '@/services/storageManagement';

import IconFont from '@/components/IconFont';
import ScrollBar from '@/components/ScrollBar';

import './style.less';

const ERROR_CODE = {
  'Studio.Account.InsufficientAccountPermissionsError': 'configSys.PermissionsError',
  'Studio.GraphDB.AccountError': 'configSys.nameError', // 账号或密码错误
  'Studio.GraphDB.URLError': 'configSys.ipError', // ip或端口错误
  'Studio.OpenSearch.OsRecordNotFoundError': 'configSys.notexist' // opensearch 记录不存在
};
const nameTest =
  /(^[\u4e00-\u9fa5_a-zA-Z0-9=~!@#$&%^&*()_+`'"{}[\];:,.?<>|/~！@#￥%…&*·（）—+。={}|【】：；‘’“”、《》？，。/\n\\]+$)|-/;
const ipsTest =
  /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5]):([0-9]|[1-9]\d{1,3}|[1-5]\d{4}|6[0-5]{2}[0-3][0-5])$/;

const ModalContent = memo(props => {
  const { optionType, getData, closeModal, initData } = props;
  const [form] = Form.useForm();
  const [list, setList] = useState([]);
  const [configRepeat, setConfigRepeat] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [placeholder, setPlaceholder] = useState(intl.get('configSys.ipPlace')); // 输入框展位符
  const [repeatIp, setRepeatIP] = useState([]); // IP重复
  const [defaultIndex, setDefaultIndex] = useState(undefined); // 默认绑定的opensearch

  useEffect(() => {
    getIndexList();
  }, []);

  /**
   * 获取索引
   */
  const getIndexList = async () => {
    const data = { page: 1, size: -1, orderField: 'created', order: 'ASC', name: '' };

    try {
      const result = await serviceStorageManagement.openSearchGet(data);

      if (!_.isEmpty(result?.res)) {
        setList(result.res?.data);
        if (optionType === 'create' && props.dbType === 'nebula') {
          const dt = result.res?.data?.[0];

          dt && form.setFieldsValue({ osId: dt.id });
          dt && setDefaultIndex(dt.id);
        }

        if (optionType === 'edit') {
          result.res?.data.forEach(item => {
            if (item.name === initData.osName) {
              form.setFieldsValue({ osId: item.id });
              setDefaultIndex(item.id);
            }
          });
        }
      }
    } catch (error) {
      const { type = '', response = {} } = error || {};
      if (type === 'message' && response.ErrorCode === 'Studio.Common.ServerError') {
        message.error(response?.Description || '');
      }
    }
  };

  /**
   *
   * 提交
   */
  const onOk = e => {
    form.validateFields().then(async values => {
      const { ips, name, user, type, password, osId } = values;
      const ip = [];
      const port = [];
      const errors = [];
      let flag = false;

      ips.forEach((item, index) => {
        const arr = item.split(':');

        if (ips.indexOf(item) !== ips.lastIndexOf(item) && ips.indexOf(item) !== -1) {
          errors.push(index);
          flag = true;
        }

        ip.push(arr[0]);
        port.push(arr[1]);
      });
      // 判断是否有重复ip
      if (flag) {
        errors.shift();
        setRepeatIP(errors);

        return;
      }
      // 查看点击保存关闭弹窗
      optionType === 'check' && closeModal();

      try {
        if (optionType === 'create') {
          const result = await serviceStorageManagement.graphDBCreate({
            ip,
            name,
            user,
            type,
            password,
            port,
            osId
          });
          if (result && result.res) {
            message.success(intl.get('configSys.saveSuccess'));
            closeModal();
            getData();
          }
        }

        if (optionType === 'edit') {
          const { id } = initData;
          const res = await serviceStorageManagement.graphDBUpdate({ name, ip, id, user, type, password, port });
          if (res && res.res) {
            message.success(intl.get('configSys.editSuccess'));
            closeModal();
            getData();
          }
        }
      } catch (error) {
        const { type = '', response = {} } = error || {};
        if (type === 'message') messageError(response);
      }
    });
  };

  /**
   * 测试连接
   */
  const testConnection = () => {
    form.validateFields().then(async values => {
      const { ips, name, user, type, password } = values;
      const ip = [];
      const port = [];
      const errors = [];
      let flag = false;

      ips.forEach((item, index) => {
        const arr = item.split(':');
        if (ips.indexOf(item) !== ips.lastIndexOf(item) && ips.indexOf(item) !== -1) {
          errors.push(index);
          flag = true;
        }
        ip.push(arr[0]);
        port.push(arr[1]);
      });

      // 判断是否有重复ip
      if (flag) {
        errors.shift();
        setRepeatIP(errors);
        return;
      }
      setTestLoading(true);

      try {
        const result = await serviceStorageManagement.graphDBTest({ ip, name, user, type, password, port });
        if (result?.res) message.success(intl.get('configSys.testSuccess'));
        setTestLoading(false);
      } catch (error) {
        setTestLoading(false);
        const { type = '', response = {} } = error || {};
        if (type === 'message') messageError(response);
      }
    });
  };

  // 报错
  const messageError = res => {
    if (ERROR_CODE[res?.ErrorCode]) return message.error(intl.get(ERROR_CODE[res?.ErrorCode]));
    // 配置信息重复，有相同用户名密码，ip和port的数据源
    if (res && res.ErrorCode === 'Studio.GraphDB.DuplicateConfigError') return setConfigRepeat(true);
    if (res && res.ErrorCode === 'Studio.Common.ServerError') return message.error(res.Description);
    if (res && res.ErrorCode === 'Studio.GraphDB.DuplicateGraphDBRecordNameError') {
      return form.setFields([{ name: 'name', errors: [intl.get('configSys.nameRepeat')] }]);
    }
    message.error(res.Description);
  };

  // 切换类型
  const resetForm = e => {
    e === 'nebula'
      ? setPlaceholder(intl.get('configSys.nebulaIpPlace'))
      : setPlaceholder(intl.get('configSys.ipPlace'));

    form.resetFields(['password', 'user', 'ips']);
    optionType === 'create' && form.setFieldsValue({ osId: defaultIndex });
  };

  return (
    <div className="create-storage-content">
      <div>
        <ScrollBar autoHeight autoHeightMax={520} color="rgb(184,184,184)">
          <div className="m-body">
            <Form
              form={form}
              className="storage-management-form"
              layout="vertical"
              initialValues={{
                name: initData.name || '',
                type: initData.type || props.dbType,
                user: initData.user || '',
                password: initData.password || '',
                ips: initData.ips || [''],
                osId: initData.osId || defaultIndex
              }}
            >
              {/* 存储名 */}
              <Form.Item
                name="name"
                label={intl.get('configSys.storageName')}
                rules={[
                  { required: true, message: intl.get('subscription.cannotNull') },
                  { max: 50, message: [intl.get('configSys.max50')] },
                  { pattern: nameTest, message: [intl.get('searchConfig.support')] }
                ]}
              >
                <Input
                  autoComplete="off"
                  placeholder={[intl.get('configSys.searchTip')]}
                  className="name-input"
                ></Input>
              </Form.Item>
              <div className="form-row">
                {/* 存储类型 */}
                <Form.Item
                  label={[intl.get('configSys.storageType')]}
                  name="type"
                  validateFirst={true}
                  rules={[{ required: true, message: [intl.get('subscription.cannotNull')] }]}
                >
                  <Select
                    getPopupContainer={triggerNode => triggerNode.parentElement}
                    autoComplete="off"
                    disabled
                    onChange={resetForm}
                  >
                    <Select.Option key="orientdb" value="orientdb">
                      OrientDB
                    </Select.Option>
                    <Select.Option key="nebula" value="nebula">
                      Nebula Graph
                    </Select.Option>
                  </Select>
                </Form.Item>
                {/* 绑定索引 */}
                <Form.Item
                  label={intl.get('configSys.bindIndex')}
                  name="osId"
                  validateFirst={true}
                  rules={[
                    {
                      required: props.dbType === 'nebula',
                      message: [intl.get('subscription.cannotNull')]
                    }
                  ]}
                >
                  <Select
                    getPopupContainer={triggerNode => triggerNode.parentElement}
                    autoComplete="off"
                    disabled={optionType !== 'create'}
                    placeholder={intl.get('configSys.osIdPlaceholder')}
                    allowClear
                  >
                    {_.map(list, item => {
                      return (
                        <Select.Option key={item.id} value={item.id}>
                          {item.name}
                        </Select.Option>
                      );
                    })}
                  </Select>
                </Form.Item>
              </div>
              {/* 存储地址 */}
              <Form.List name="ips" className="form-list">
                {(fields, { add, remove }, { errors }) => (
                  <>
                    {_.map(fields, (field, index) => {
                      return (
                        <React.Fragment key={index}>
                          <Form.Item
                            className="ant-form-item-has-error"
                            key={index}
                            label={
                              index === 0 ? (
                                <div>
                                  <span style={{ color: 'red' }}>*</span>
                                  <span>{intl.get('configSys.storageAddress')}</span>
                                </div>
                              ) : (
                                ''
                              )
                            }
                          >
                            <div className="item-box">
                              <Form.Item
                                {...field}
                                validateTrigger={['onChange', 'onBlur']}
                                rules={[
                                  { required: true, message: intl.get('subscription.cannotNull') },
                                  { pattern: ipsTest, message: [intl.get('subscription.ipInputErr')] }
                                ]}
                                noStyle
                              >
                                <Input
                                  disabled={optionType === 'check'}
                                  placeholder={placeholder}
                                  className={configRepeat ? 'ip-input2 error-input' : 'ip-input2'}
                                  autoComplete="off"
                                  onChange={() => {
                                    setConfigRepeat(false);
                                    setRepeatIP([]);
                                  }}
                                />
                              </Form.Item>
                              {fields.length === 1 ? (
                                <IconFont
                                  type="icon-lajitong"
                                  className="delete-button"
                                  onClick={() => {
                                    optionType !== 'check' && form.setFieldsValue({ ips: [''] });
                                  }}
                                />
                              ) : (
                                <IconFont
                                  type="icon-lajitong"
                                  className="delete-button"
                                  onClick={() => {
                                    optionType !== 'check' && remove(field.name);
                                  }}
                                />
                              )}
                            </div>
                          </Form.Item>
                          <p className={configRepeat ? 'error-info' : 'none'}>{intl.get('configSys.ipRepeat')}</p>
                          <p className={repeatIp.includes(index) ? 'error-info' : 'none'}>
                            {intl.get('configSys.repeatError')}
                          </p>
                        </React.Fragment>
                      );
                    })}
                    {optionType !== 'check' ? (
                      <div className="add-address-btn" onClick={() => add()}>
                        {intl.get('configSys.addIP')}
                      </div>
                    ) : null}
                  </>
                )}
              </Form.List>
              <div className="form-row">
                {/* 访问账户名称 */}
                <Form.Item
                  name="user"
                  label={[intl.get('configSys.username')]}
                  rules={[{ required: true, message: intl.get('subscription.cannotNull') }]}
                >
                  <Input
                    className="user-input"
                    autoComplete="off"
                    placeholder={intl.get('configSys.userPlaceholder')}
                    disabled={optionType === 'check'}
                  ></Input>
                </Form.Item>
                {/* 访问存储密码 */}
                <Form.Item
                  name="password"
                  label={[intl.get('configSys.password')]}
                  rules={[{ required: true, message: intl.get('subscription.cannotNull') }]}
                >
                  <Input.Password
                    autoComplete="off"
                    visibilityToggle={false}
                    placeholder={intl.get('configSys.passPlaceholder')}
                    disabled={optionType === 'check'}
                    className="pass-input"
                  ></Input.Password>
                </Form.Item>
              </div>
            </Form>
          </div>
        </ScrollBar>

        <div className="m-footer">
          {optionType === 'check' ? (
            <Button type="primary" className="btn primary" onClick={() => closeModal()}>
              {intl.get('configSys.close')}
            </Button>
          ) : (
            <ConfigProvider autoInsertSpaceInButton={false}>
              <Button className="ant-btn-default btn-cancel" onClick={testConnection}>
                {testLoading ? <LoadingOutlined /> : ''}
                {testLoading ? intl.get('configSys.testing') : intl.get('configSys.linkTest')}
              </Button>

              <Button type="primary" className="btn primary" onClick={onOk}>
                {intl.get('configSys.Save')}
              </Button>
            </ConfigProvider>
          )}
        </div>
      </div>
    </div>
  );
});

// 弹窗
const CreateModal = props => {
  const { visible, closeModal, optionType, getData, initData, dbType, ...otherProps } = props;
  const created = [intl.get('configSys.createdStorage')];
  const edit = [intl.get('configSys.editStorage')];
  const check = [intl.get('configSys.checkStorage')];

  const title = optionType === 'create' ? created : optionType === 'edit' ? edit : check;

  return (
    <Modal
      visible={visible}
      width={640}
      title={title}
      footer={null}
      maskClosable={false}
      destroyOnClose={true}
      focusTriggerAfterClose={false}
      className="create-storage-modal"
      onCancel={e => {
        e.stopPropagation();
        closeModal();
      }}
    >
      <ModalContent
        {...otherProps}
        closeModal={closeModal}
        optionType={optionType}
        getData={getData}
        initData={initData}
        dbType={dbType}
      />
    </Modal>
  );
};

export default memo(CreateModal);
