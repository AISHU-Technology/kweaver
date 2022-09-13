import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Form, Button, Input, message, ConfigProvider, Select } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

import serviceStorageManagement from '@/services/storageManagement';
import serviceWorkflow from '@/services/workflow';

import './style.less';

const FormItem = Form.Item;
const { TextArea } = Input;
const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 }
};

const graphNameTest = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
const graphDesTest = /^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\s]+$/;

const Basic = (props, ref) => {
  const { next, setBasicData, graphId, setGraphId, graphStatus, dataLoading, basicData, setDbType } = props;
  const [form] = Form.useForm();
  const formSnapshot = useRef({}); // 保存时生成表单数据快照, 用于判断表单是否被修改
  const [disabled, setDisabled] = useState(false);
  const [nextLoad, setNextLoad] = useState(false);
  const [shouldRepeat, setShouldRepeat] = useState(false); // 由后端控制DB名是否可以重复
  const [storageList, setStorageList] = useState([]); // 存储列表

  // 暴露组件内部方法
  useImperativeHandle(ref, () => ({
    isModify: () => {
      const field = ['graph_Name', 'graph_des'];
      return field.some(key => {
        const oldValue = formSnapshot.current[key] || '';
        const curValue = form.getFieldValue(key) || '';
        return oldValue !== curValue;
      });
    }
  }));

  useEffect(() => {
    getStorage();
    didMount();

    /* eslint-disable-next-line */
  }, [graphId]);

  const didMount = async () => {
    if (basicData?.graph_Name) {
      const item = _.filter(storageList || [], item => item?.id === basicData?.graph_db_id) || [];
      const id = item?.[0]?.id || undefined;

      form.setFieldsValue({ ...basicData, graph_db_id: id });
    }
    // 新建;
    if (!graphId) form.setFieldsValue({ ...basicData });
    formSnapshot.current = { ...basicData };

    const { baseInfo_flag } = (await serviceWorkflow.graphGetBis()) || {};
    baseInfo_flag ? setShouldRepeat(true) : setShouldRepeat(false);
  };

  const getStorage = async () => {
    const data = { page: 1, size: -1, orderField: 'created', order: 'DESC', type: 'all', name: '' };
    try {
      const { res } = await serviceStorageManagement.graphDBGetList(data);
      if (!_.isEmpty(res)) {
        if (basicData?.graph_db_id) {
          const currentDb = _.filter(res?.data, item => item.id === basicData.graph_db_id)[0];
          setDbType(currentDb.type);
        }
        setStorageList(res?.data);
      }
    } catch (error) {
      const { type = '', response = {} } = error || {};
      if (type === 'message') message.error(response?.Description || '');
    }
  };

  const saveData = async (e, isNext = false) => {
    if (disabled || dataLoading || nextLoad) return;

    e.preventDefault();
    await form.validateFields();

    if (form.getFieldError('password')?.[0] && form.getFieldError('username')?.[0]) return;
    setNextLoad(true);

    form.validateFields().then(async values => {
      setDisabled(true);

      const body = {
        graph_step: 'graph_baseInfo',
        graph_process: [
          {
            graph_Name: values.graph_Name,
            graph_des: values.graph_des || '',
            graph_db_id: values.graph_db_id
          }
        ],
        knw_id:
          window.sessionStorage.getItem('selectedKnowledgeId') &&
          parseInt(window.sessionStorage.getItem('selectedKnowledgeId'))
      };

      if (!graphId) {
        // 新建
        const res = await serviceWorkflow.graphCreate(body);

        if (res && res.res) {
          setGraphId(parseInt(res.res.split(' ')[0]));
          window.history.replaceState({}, 0, `/home/workflow/create?id=${res.res.split(' ')[0]}&status=edit`);
          setBasicData(body.graph_process[0]);
          isNext && next();
          formSnapshot.current = values;

          !isNext && message.success(intl.get('datamanagement.savedSuccessfully'));
        }

        if (res && res.Code) {
          if (res.Code === 500002) {
            form.setFields([{ name: 'graph_Name', errors: [intl.get('workflow.basic.nameExists')] }]);
          } else if (res.Code === 500001) {
            message.error(res.Cause);
          } else if (res.Code === 500004) {
            form.setFields([{ name: 'graph_Name', errors: [intl.get('workflow.basic.nameExists')] }]);
          } else if ([500007, 500008].includes(res.Code)) {
            message.error(intl.get('workflow.basic.dbErr'));
          } else if (res.Code === 500057) {
            message.error(intl.get('graphList.noNetworkIdErr')); // 单一无权限
          } else {
            next(res);
          }
        }
      } else {
        // 编辑
        const res = await serviceWorkflow.graphEdit(graphId, body);

        if (res && res.res) {
          setBasicData(body.graph_process[0]);
          isNext && next();
          formSnapshot.current = values;
          !isNext && message.success(intl.get('datamanagement.savedSuccessfully'));
        }

        if (res && res.Code) {
          if (res.Code === 500002) {
            form.setFields([{ name: 'graph_Name', errors: [intl.get('workflow.basic.nameExists')] }]);
          } else if (res.Code === 500001) {
            message.error(res.Cause);
          } else if (res.Code === 500004) {
            form.setFields([{ name: 'graph_Name', errors: [intl.get('workflow.basic.nameExists')] }]);
          } else if ([500007, 500008].includes(res.Code)) {
            message.error(intl.get('workflow.basic.dbErr'));
          } else if (res.Code === 500057) {
            message.error(intl.get('graphList.noNetworkIdErr')); // 单一无权限
          } else {
            next(res);
          }
        }
      }

      setDisabled(false);
    });

    setNextLoad(false);
  };

  const basicNext = e => saveData(e, true);

  const onSave = e => saveData(e);

  return (
    <div className="graph-basic-wrapper">
      <div className="graph-basic">
        <Form {...layout} form={form} className="basic-from" colon={false}>
          <FormItem
            name="graph_Name"
            label={<span className="from-label">{intl.get('workflow.basic.graphName')}</span>}
            validateFirst={true}
            rules={[
              { type: 'string' },
              { required: true, message: intl.get('datamanagement.empty') },
              { max: 50, message: intl.get('workflow.basic.maxLong', { length: 50 }) },
              { pattern: graphNameTest, message: intl.get('workflow.basic.nameConsists') },
              {
                validator: async (rule, value) => {
                  if (value) {
                    if (value[0] === ' ' || value[value.length - 1] === ' ') {
                      throw new Error(intl.get('workflow.basic.desConsists'));
                    }
                  }
                  if (/\n|\r/g.test(value)) {
                    throw new Error(intl.get('workflow.basic.desConsists'));
                  }
                }
              }
            ]}
          >
            <Input autoComplete="off" />
          </FormItem>

          <FormItem
            name="graph_db_id"
            label={intl.get('workflow.basic.storage')}
            validateFirst={true}
            rules={[{ required: true, message: intl.get('createEntity.select') }]}
          >
            <Select
              placeholder={intl.get('workflow.basic.storagePlace')}
              disabled={graphStatus === 'finish'}
              onChange={(value, option) => {
                setDbType(option.type);
              }}
            >
              {_.map(storageList || [], item => {
                return (
                  <Select.Option value={item.id} key={item.id} data={item}>
                    {item.name}
                  </Select.Option>
                );
              })}
            </Select>
          </FormItem>

          <FormItem
            name="graph_des"
            label={<span className="from-label">{intl.get('workflow.basic.graphDescription')}</span>}
            validateFirst={true}
            rules={[
              { type: 'string' },
              { max: 150, message: intl.get('workflow.basic.maxLong', { length: 150 }) },
              { pattern: graphDesTest, message: intl.get('workflow.basic.desConsists') }
            ]}
          >
            <TextArea rows={6} autoComplete="off" />
          </FormItem>

          {shouldRepeat && (
            <div className="dbwarning">
              <ExclamationCircleFilled className="icon" />
              <span className="word">{intl.get('workflow.basic.dbwarning')}</span>
            </div>
          )}

          <ConfigProvider autoInsertSpaceInButton={false}>
            <Button className="ant-btn-default save-btn btn" onClick={onSave}>
              {intl.get('workflow.save1')}
            </Button>

            <Button type="primary" className="next-btn btn" onClick={basicNext}>
              {intl.get('workflow.next')}
            </Button>
          </ConfigProvider>
        </Form>
      </div>
    </div>
  );
};

export default forwardRef(Basic);
