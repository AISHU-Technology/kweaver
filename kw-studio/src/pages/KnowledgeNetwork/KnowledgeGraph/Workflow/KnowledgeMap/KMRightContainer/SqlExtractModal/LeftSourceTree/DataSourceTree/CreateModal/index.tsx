import React, { useRef, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Button, Form, Input, Select, message, Modal } from 'antd';
import { ExclamationCircleFilled, DownOutlined, RightOutlined, LoadingOutlined } from '@ant-design/icons';
import apiService from '@/utils/axios-http/oldIndex';
import TemplateModal from '@/components/TemplateModal';
import UniversalModal from '@/components/UniversalModal';
import servicesDataSource from '@/services/dataSource';
import TrimmedInput from '@/components/TrimmedInput';

import { ONLY_KEYBOARD } from '@/enums';

import { defaultOption, odbc, ERROR_CODE } from './enum';
const { Option } = Select;
type TypeCreateModal = {
  visible: boolean;
  onCancel: () => void;
  onOK: () => void;
};
const UNSTRUCTURED = 'unstructured'; // 非结构化
const STANDARDEXTRACTION = 'standardExtraction'; // 标准抽取
const MODELEXTRACTION = 'modelExtraction'; // 模型抽取
const ODBCPERFIX = 'odbc-';
const CONNTYPE = 'odbc';
const STRUCTURED = 'structured'; // 结构化

const CreateModal = (props: TypeCreateModal) => {
  const { visible, onCancel, onOK } = props;
  const [form] = Form.useForm();
  const [allOptions, setAllOptions] = useState<any>(defaultOption);
  const [sourceType, setSourceType] = useState<any>('mysql');
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<{ test: boolean; save: boolean }>({ test: false, save: false });
  const dropRef = useRef(true);
  const asReg =
    /^(?=^.{3,255}$)[a-zA-Z0-9][-_a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-_a-zA-Z0-9]{0,62})+$|^(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|[1-9])\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$/;
  const ipv6Reg =
    /^([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}|:((:[\da−fA−F]1,4)1,6|:)|:((:[\da−fA−F]1,4)1,6|:)|^[\da-fA-F]{1,4}:((:[\da-fA-F]{1,4}){1,5}|:)|([\da−fA−F]1,4:)2((:[\da−fA−F]1,4)1,4|:)|([\da−fA−F]1,4:)2((:[\da−fA−F]1,4)1,4|:)|^([\da-fA-F]{1,4}:){3}((:[\da-fA-F]{1,4}){1,3}|:)|([\da−fA−F]1,4:)4((:[\da−fA−F]1,4)1,2|:)|([\da−fA−F]1,4:)4((:[\da−fA−F]1,4)1,2|:)|^([\da-fA-F]{1,4}:){5}:([\da-fA-F]{1,4})?|([\da−fA−F]1,4:)6:|([\da−fA−F]1,4:)6:/;

  const onFormChange = (e: any) => {
    if (!loading.save && !loading.test) return;

    Object.keys(apiService.sources).forEach(key => {
      (apiService.sources as any)[key](intl.get('exploreGraph.cancelRequest')); // 取消请求
    });

    setLoading({ test: false, save: false });
  };

  /**
   * 选择源
   */
  const onSourceSelect = (value: any, option: any) => {
    if (value === 'odbc') {
      if (allOptions.length > 6) {
        setAllOptions(defaultOption);
      } else {
        setAllOptions(_.concat(defaultOption, odbc));
      }
      dropRef.current = false;
    } else {
      dropRef.current = true;
    }
  };

  /** 保存 */
  const onSave = async () => {
    form.validateFields().then(async value => {
      const testBody = {
        data_source:
          value.data_source.indexOf(ODBCPERFIX) > -1
            ? String(value.data_source).substring(ODBCPERFIX.length)
            : value.data_source,
        ds_address: value.ds_address,
        ds_port: parseInt(value.ds_port),
        ds_user: value.ds_user,
        ds_password: form.isFieldTouched('ds_password') ? btoa(value.ds_password) : value.ds_password,
        ds_path: value.ds_path?.replace(/(^\s*)|(\s*$)/g, '') || '',
        vhost: value.vhost || '',
        queue: value.queue || '',
        connect_type: value.data_source.indexOf(ODBCPERFIX) > -1 ? CONNTYPE : ''
      };
      const more = {
        dsname: value.dsname,
        dataType: STRUCTURED,
        extract_type: STANDARDEXTRACTION,
        json_schema: value.json_schema || '',
        knw_id:
          window.sessionStorage.getItem('selectedKnowledgeId') &&
          parseInt(window.sessionStorage.getItem('selectedKnowledgeId') || '')
      };
      const test = await servicesDataSource.sourceConnectTest({ ...testBody, ds_id: value.id || 0 });
      let saveRes: any = {};
      if (test.res) {
        saveRes = await servicesDataSource.dataSourcePost({ ...testBody, ...more });

        // 结果处理
        if (saveRes?.res) {
          message.success(intl.get('datamanagement.savedSuccessfully'));
          onOK(); // 新建成功的回调
          return;
        }
      }
      const { ErrorCode, Description } = test || saveRes;

      if (!ErrorCode) return;
      if (
        ErrorCode === 'Builder.service.dsm_Service.DsmService.addds.SameNameError' ||
        ErrorCode === 'Builder.DsmService.Updata.SameNameError'
      ) {
        form.setFields([
          {
            name: 'dsname',
            errors: [intl.get('global.repeatName')]
          }
        ]);
      }
      ERROR_CODE[ErrorCode] ? message.error(ERROR_CODE[ErrorCode]) : message.error(Description);
    });
  };

  /** 测试连接 */
  const onConnect = async () => {
    form
      .validateFields()
      .then(async value => {
        try {
          let body = {};

          body = {
            ds_id: value.id || 0,
            data_source:
              value.data_source.indexOf(ODBCPERFIX) > -1
                ? String(value.data_source).substring(ODBCPERFIX.length)
                : value.data_source,
            ds_address: value.ds_address,
            ds_port: parseInt(value.ds_port),
            ds_user: value.ds_user,
            ds_password: form.isFieldTouched('ds_password') ? btoa(value.ds_password) : value.ds_password,
            ds_path: value.ds_path?.replace(/(^\s*)|(\s*$)/g, '') || '',
            vhost: value.vhost || '',
            queue: value.queue || '',
            connect_type: value.data_source.indexOf(ODBCPERFIX) > -1 ? CONNTYPE : ''
          };

          setLoading({ test: true, save: false });

          const response = await servicesDataSource.sourceConnectTest(body);

          setLoading({ test: false, save: false });

          if (response.res) {
            message.success(intl.get('datamanagement.testSuccessful'));
          }
          const { ErrorCode, Description } = response || {};

          if (!ErrorCode) return;
          if (
            ErrorCode === 'Builder.service.dsm_Service.DsmService.addds.SameNameError' ||
            ErrorCode === 'Builder.DsmService.Updata.SameNameError'
          ) {
            form.setFields([
              {
                name: 'dsname',
                errors: [intl.get('global.repeatName')]
              }
            ]);
          }
          ERROR_CODE[ErrorCode] ? message.error(ERROR_CODE[ErrorCode]) : message.error(Description);
        } catch (err) {}
      })
      .catch(err => {
        return false;
      });
  };

  /**
   * 选择数据来源
   */
  const onSourceChange = (value: any) => {
    if (value === 'odbc') {
      form.setFieldsValue({
        data_source: sourceType
      });
      return;
    }
    form.resetFields(['ds_user', 'ds_password', 'ds_path', 'ds_address', 'ds_port', 'ds_auth']);
    form.setFieldsValue({
      extract_type: value.includes(UNSTRUCTURED) ? MODELEXTRACTION : STANDARDEXTRACTION,
      ds_port: ''
    });
    setSourceType(value);
  };

  /**
   * 下拉菜单收起控制
   */
  const onOpenChange = (value: boolean) => {
    const odbcOption = document.getElementsByClassName('ant-select-item-option-content')[5];

    if (_.isEmpty(odbcOption)) {
      if (!dropRef.current) {
        return;
      }
      setOpen(value);
      return;
    }
    document.addEventListener('click', () => {
      dropRef.current = true;
    });

    if (!dropRef.current) {
      return;
    }
    setOpen(value);
  };
  /**
   * 密码置空
   */
  const passwordFocus = () => {
    if (!form.isFieldTouched('ds_password')) {
      form.setFieldsValue({ ds_password: '' });
    }
  };

  /**
   * 用户名置空
   */
  const userFocus = () => {
    if (!form.isFieldTouched('ds_user')) {
      form.setFieldsValue({ ds_user: '' });
    }
  };

  return (
    <UniversalModal
      open={visible}
      className="uploadSettingErrorModal"
      title={intl.get('domainData.addDataSource')}
      width={640}
      footer={null}
      onCancel={onCancel}
      footerData={[
        {
          label: loading?.test ? (
            <>
              <LoadingOutlined />
              &nbsp;
              {intl.get('datamanagement.testing')}
            </>
          ) : (
            intl.get('datamanagement.test')
          ),
          onHandle: () => onConnect()
        },
        {
          label: loading.save ? (
            <>
              <LoadingOutlined />
              &nbsp;
              {intl.get('datamanagement.saving')}
            </>
          ) : (
            intl.get('datamanagement.save')
          ),
          type: 'primary',
          onHandle: onSave
        }
      ]}
    >
      <div>
        <div>
          <div className="kw-align-center kw-pl-3 kw-mb-6" style={{ width: 592, height: 40, background: '#E6F4FF' }}>
            <ExclamationCircleFilled className="kw-c-primary kw-mr-2" />
            {intl.get('domainData.addDataSourceTip')}
          </div>
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              data_source: 'mysql'
            }}
            onValuesChange={onFormChange}
          >
            <Form.Item
              label={intl.get('datamanagement.dataName')}
              name="dsname"
              validateFirst
              rules={[
                { required: true, message: intl.get('global.noNull') },
                { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
                {
                  pattern: ONLY_KEYBOARD,
                  message: intl.get('global.onlyKeyboard')
                }
              ]}
            >
              <TrimmedInput autoComplete="off" placeholder={intl.get('datamanagement.pleaseDsname')} />
            </Form.Item>

            <Form.Item
              label={intl.get('datamanagement.dataSource')}
              name="data_source"
              rules={[{ required: true, message: intl.get('datamanagement.empty') }]}
            >
              <Select
                onSelect={onSourceSelect}
                optionLabelProp="label"
                onChange={onSourceChange}
                open={open}
                onDropdownVisibleChange={onOpenChange}
              >
                {_.map(allOptions, item => (
                  <Option key={item.id} value={item.value} label={item.label}>
                    {item.value === 'odbc' ? (
                      allOptions.length > 6 ? (
                        <DownOutlined style={{ marginRight: '0.5em' }} />
                      ) : (
                        <RightOutlined style={{ marginRight: '0.5em' }} />
                      )
                    ) : null}
                    {item.value.indexOf('odbc-') > -1 ? <span style={{ marginRight: '3.5em' }}></span> : null}
                    {item.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <div className="kw-space-between">
              <Form.Item
                label={intl.get('datamanagement.address')}
                name="ds_address"
                validateFirst
                rules={[
                  { required: true, message: intl.get('datamanagement.empty') },
                  {
                    validator: async (rule, value) => {
                      if (value.indexOf('--') > -1) {
                        throw new Error(intl.get('datamanagement.correctAddress'));
                      }

                      if (!asReg.test(value) && !ipv6Reg.test(value)) {
                        throw new Error(intl.get('datamanagement.correctAddress'));
                      }
                    }
                  }
                ]}
              >
                <Input style={{ width: 286 }} autoComplete="off" placeholder={intl.get('datamanagement.pleaseAddr')} />
              </Form.Item>
              <Form.Item
                name="ds_port"
                label={intl.get('datamanagement.port')}
                validateFirst
                rules={[
                  { required: true, message: intl.get('datamanagement.empty') },
                  {
                    pattern:
                      /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]{1}|6553[0-5])$/,
                    message: intl.get('datamanagement.correctPort')
                  }
                ]}
                getValueFromEvent={event => {
                  return event.target.value.replace(/\D/g, '');
                }}
              >
                <Input autoComplete="off" placeholder={intl.get('datamanagement.pleasePort')} style={{ width: 286 }} />
              </Form.Item>
            </div>
            <div className="kw-space-between">
              {/* 兼容safari，去除记住用户名功能 */}
              <Form.Item style={{ display: 'none' }}>
                <Input onFocus={userFocus} autoComplete="off" />
              </Form.Item>
              {/* 兼容safari，去除记住密码功能 */}
              <Form.Item style={{ display: 'none' }}>
                <Input type="password" onFocus={passwordFocus} autoComplete="off" />
              </Form.Item>

              <Form.Item
                label={intl.get('datamanagement.userName')}
                name="ds_user"
                validateFirst
                rules={[
                  { required: true, message: intl.get('datamanagement.empty') },
                  {
                    pattern: /^[^\s]*$/,
                    message: intl.get('datamanagement.illegalCharacters')
                  }
                ]}
              >
                <Input
                  autoComplete="off"
                  onFocus={userFocus}
                  style={{ width: 286 }}
                  placeholder={intl.get('datamanagement.pleaseUser')}
                />
              </Form.Item>

              <Form.Item
                name="ds_password"
                label={intl.get('datamanagement.password')}
                validateFirst
                rules={[{ required: true, message: intl.get('datamanagement.empty') }]}
              >
                <Input
                  style={{ width: 286 }}
                  type="password"
                  onFocus={passwordFocus}
                  autoComplete="off"
                  placeholder={intl.get('datamanagement.pleasePass')}
                />
              </Form.Item>
            </div>
            <Form.Item
              label={intl.get('datamanagement.database')}
              name="ds_path"
              rules={[{ required: true, message: intl.get('datamanagement.empty') }]}
            >
              <Input autoComplete="off" placeholder={intl.get('datamanagement.pleaseDatabase')} />
            </Form.Item>
          </Form>
        </div>
        {/* <div className="kw-border-t kw-pl-6 kw-pr-6" style={{ textAlign: 'right', height: 64, paddingTop: 14 }}>
          <Button onClick={() => onConnect()}>
            {loading?.test ? (
              <>
                <LoadingOutlined />
                &nbsp;
                {intl.get('datamanagement.testing')}
              </>
            ) : (
              intl.get('datamanagement.test')
            )}
          </Button>
          <Button type="primary" className="kw-ml-2" onClick={onSave}>
            {loading.save ? (
              <>
                <LoadingOutlined />
                &nbsp;
                {intl.get('datamanagement.saving')}
              </>
            ) : (
              intl.get('datamanagement.save')
            )}
          </Button>
        </div> */}
      </div>
    </UniversalModal>
  );
};
export default (props: any) => {
  return props?.visible ? <CreateModal {...props} /> : null;
};
