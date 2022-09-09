import React, { useState } from 'react';
import intl from 'react-intl-universal';
import { Modal, Button, Input, Form, ConfigProvider, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import serviceStorageManagement from '@/services/storageManagement';

import './index.less';

const ERROR_CODE = {
  'Manager.GraphDB.AccountError': 'configSys.nameError', // 账号或密码错误
  'Manager.GraphDB.URLError': 'configSys.ipError', // ip或端口错误
  'Manager.OpenSearch.OsRecordNotFoundError': 'configSys.notexist', // 记录不存在
  'Manager.OpenSearch.DuplicateOsConfigError': 'configSys.duplicateOsConfigError' // 配置信息重复，有相同用户名密码，ip和port的数据源
};
const nameTest =
  /(^[\u4e00-\u9fa5_a-zA-Z0-9=~!@#$&%^&*()_+`'"{}[\];:,.?<>|/~！@#￥%…&*·（）—+。={}|【】：；‘’“”、《》？，。/\n\\]+$)|-/;
const ipTest =
  /^(?=^.{3,255}$)[a-zA-Z0-9][-_a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-_a-zA-Z0-9]{0,62})+$|^(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|[1-9])\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$/;
const portTest =
  /^([1-9][0-9]{0,3} | [1-5][0-9]{4} | 6[0-4][0-9]{3} | 65[0-4][0-9]{2} | 655[0-2][0-9]{1} | 6553[0-5])$/;

const ModalContent = props => {
  const { initData, optionType, closeModal, getData } = props;
  const [form] = Form.useForm();
  const [testLoading, setTestLoading] = useState(false);

  const onOk = () => {
    form.validateFields().then(async values => {
      const { ip, name, user, password, port } = values;

      try {
        // 新建
        if (optionType === 'create') {
          const data = { name, user, password, ip: [ip], port: [port] };
          const res = await serviceStorageManagement.openSearchCreate(data);
          if (res && res.res) {
            message.success(intl.get('configSys.saveSuccess'));
            closeModal();
            getData();
          }
        }
        // 编辑
        if (optionType === 'edit') {
          const data = { user, name, password, ip: [ip], port: [port], id: initData.id };
          const res = await serviceStorageManagement.openSearchUpdate(data);
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
      const { ip, user, password, port } = values;
      const data = { user, password, ip: [ip], port: [port] };

      try {
        setTestLoading(true);
        const result = await serviceStorageManagement.openSearchTest(data);
        if (result?.res) message.success(intl.get('configSys.testSuccess'));
        setTestLoading(false);
      } catch (error) {
        setTestLoading(false);
        const { type = '', response = {} } = error || {};
        if (type === 'message') messageError(response);
      }
    });
  };

  // 爆错
  const messageError = res => {
    // 存储位置名称已存在
    if (res && res.ErrorCode === 'Manager.OpenSearch.DuplicateOsRecordNameError') {
      form.setFields([{ name: 'name', errors: [intl.get('configSys.nameRepeat')] }]);
      return;
    }
    if (res && res.ErrorCode === 'Manager.Common.ServerError') return message.error(res.Description);
    if (ERROR_CODE[res?.ErrorCode]) return message.error(intl.get(ERROR_CODE[res?.ErrorCode]));
    message.error(res.Description);
  };

  return (
    <div className="createIndex-modal-content">
      <div className="createIndex-modal-body">
        <Form
          form={form}
          className="index-form"
          layout="vertical"
          initialValues={{
            name: initData.name || '',
            ip: initData.ip || '',
            user: initData.user || '',
            password: initData.password || '',
            port: initData.port || ''
          }}
        >
          {/* 索引名 */}
          <Form.Item
            name="name"
            label={intl.get('configSys.storageName')}
            rules={[
              { required: true, message: intl.get('subscription.cannotNull') },
              { max: 50, message: [intl.get('configSys.max50')] },
              { pattern: nameTest, message: [intl.get('searchConfig.support')] }
            ]}
          >
            <Input autoComplete="off" placeholder={[intl.get('configSys.searchTip')]} className="name-input"></Input>
          </Form.Item>
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
              ></Input>
            </Form.Item>
            {/* 访问密码 */}
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
          <div className="form-row">
            {/* ip */}
            <Form.Item
              name="ip"
              label={intl.get('datamanagement.address')}
              rules={[
                { required: true, message: intl.get('subscription.cannotNull') },
                { pattern: ipTest, message: intl.get('datamanagement.correctAddress') }
              ]}
            >
              <Input
                className="ip-input"
                autoComplete="off"
                placeholder={intl.get('configSys.placeIpInput')}
                disabled={optionType === 'check'}
              ></Input>
            </Form.Item>
            {/* 端口 */}
            <Form.Item
              name="port"
              label={intl.get('configSys.port')}
              rules={[
                { required: true, message: intl.get('subscription.cannotNull') },
                { pattern: portTest, message: intl.get('datamanagement.correctPort') }
              ]}
            >
              <Input autoComplete="off" placeholder={intl.get('configSys.inputPort')} className="port-input"></Input>
            </Form.Item>
          </div>
        </Form>
      </div>
      <div className="createIndex-modal-footer">
        <ConfigProvider autoInsertSpaceInButton={false}>
          <Button className="ant-btn-default btn-cancel" onClick={testConnection}>
            {testLoading ? <LoadingOutlined /> : ''}
            {testLoading ? intl.get('configSys.testing') : intl.get('configSys.linkTest')}
          </Button>

          <Button type="primary" className="btn primary" onClick={onOk}>
            {intl.get('configSys.Save')}
          </Button>
        </ConfigProvider>
      </div>
    </div>
  );
};

const CreateIndexModal = props => {
  const { visible, closeModal, optionType, optionIndex, getData, initData, ...otherProps } = props;
  const created = [intl.get('configSys.createIndex')];
  const edit = [intl.get('configSys.editIndex')];
  const title = optionType === 'create' ? created : edit;

  return (
    <div>
      <Modal
        visible={visible}
        title={title}
        width={640}
        footer={null}
        maskClosable={false}
        destroyOnClose={true}
        className="create-index-modal"
        focusTriggerAfterClose={false}
        onCancel={e => {
          e.stopPropagation();
          closeModal();
        }}
      >
        <ModalContent
          {...otherProps}
          closeModal={closeModal}
          optionIndex={optionIndex}
          optionType={optionType}
          getData={getData}
          initData={initData}
        />
      </Modal>
    </div>
  );
};

export default CreateIndexModal;
