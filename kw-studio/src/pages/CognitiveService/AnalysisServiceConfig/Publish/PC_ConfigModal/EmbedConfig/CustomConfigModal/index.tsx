import React, { useState, useEffect } from 'react';
import { Form, Input, message, Select, Switch, Empty } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { fuzzyMatch } from '@/utils/handleFunction';
import serviceGraphDetail from '@/services/graphDetail';
import serviceFunction from '@/services/functionManage';
import UniversalModal from '@/components/UniversalModal';
import ExplainTip from '@/components/ExplainTip';
import { isNameExisted } from '../assistant';
import kongImg from '@/assets/images/kong.svg';

const { Option } = Select;
const DEFAULT_BODY = {
  page: 1,
  size: 1000,
  search: '',
  language: 'nGQL',
  order_type: 'desc',
  order_field: 'update_time'
};

const AddConfigModal = (props: any) => {
  const { visible, action, graphId, knwId, data, totalConfig, onOk, onCancel } = props;
  const [form] = Form.useForm();
  const [entityList, setEntityList] = useState<any[]>([]); // 所有实体类
  const [funcList, setFuncList] = useState<any[]>([]); // 所有函数

  useEffect(() => {
    getClass();
    getFunc();

    if (action === 'edit' && data.name) {
      const { name, doubleEvent, func = {} } = data;
      form.setFieldsValue({ name, doubleEvent, class: data.class, func: func.name });
    }
  }, []);

  // 获取所有实体类, 自定义配置时需要
  const getClass = async () => {
    const { res } = (await serviceGraphDetail.graphGetInfoOnto({ graph_id: graphId })) || {};
    res && setEntityList(res.entity || []);
  };

  // 获取所有实体类, 自定义配置时需要
  const getFunc = async () => {
    const body = { ...DEFAULT_BODY, knw_id: knwId };
    const { res } = (await serviceFunction.functionList(body)) || {};
    res && setFuncList(res.functions || []);
  };

  /**
   * 点击确认
   */
  const handleOk = async () => {
    await form
      .validateFields()
      .then(async values => {
        const validData = action === 'edit' ? { ...data, name: values.name } : { name: values.name };
        if (isNameExisted(validData, totalConfig)) {
          form.setFields([{ name: 'name', errors: [intl.get('global.repeatName')] }]);
          return;
        }

        const funcObj = _.find(funcList, f => f.name === values.func);
        if (!funcObj) {
          return form.setFields([{ name: 'func', errors: [intl.get('analysisService.funcNameErr')] }]);
        }
        const { res, ErrorDetails } = (await serviceFunction.functionInfo({ function_id: funcObj.id })) || {};
        res &&
          onOk({
            ...values,
            alias: values.name,
            func: res
          });
        ErrorDetails && message.error(ErrorDetails);
      })
      .catch(err => {
        //
      });
  };

  return (
    <UniversalModal
      className="add-canvas-config-modal"
      title={
        action === 'edit'
          ? _.capitalize(intl.get('analysisService.editConfig'))
          : _.capitalize(intl.get('analysisService.addConfig'))
      }
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        { label: intl.get('global.ok'), type: 'primary', onHandle: handleOk }
      ]}
    >
      <div className="main-content">
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label={intl.get('analysisService.funcName')}
            name="name"
            validateFirst
            rules={[
              { required: true, message: intl.get('global.noNull') },
              { pattern: /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/g, message: intl.get('global.onlyNormalName') },
              { max: 50, message: intl.get('global.lenErr', { len: 50 }) }
            ]}
          >
            <Input placeholder={intl.get('analysisService.pleaseFuncName')} autoComplete="off" />
          </Form.Item>

          <Form.Item
            label={intl.get('global.entityClass')}
            name="class"
            validateFirst
            rules={[{ required: true, message: intl.get('exploreGraph.noSelectTip') }]}
          >
            <Select
              placeholder={intl.get('createEntity.sp')}
              notFoundContent={<Empty image={kongImg} description={intl.get('global.noData')} />}
              showSearch
              filterOption={(inputValue, option) => {
                if (fuzzyMatch(inputValue, option?.data?.name) || fuzzyMatch(inputValue, option?.data?.alias)) {
                  return true;
                }
                return false;
              }}
            >
              {_.map(entityList, entity => (
                <Option key={entity.name} value={entity.name} data={entity}>
                  {entity.alias}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={
              <>
                {intl.get('function.functions')}
                <ExplainTip title={intl.get('analysisService.funcTip')} />
              </>
            }
            name="func"
            validateFirst
            rules={[
              {
                validator: async (_, value) => {
                  if (!funcList.length) {
                    throw new Error(intl.get('analysisService.funcError'));
                  }
                  if (!value) {
                    throw new Error(intl.get('exploreGraph.noSelectTip'));
                  }
                }
              }
            ]}
          >
            <Select
              placeholder={intl.get('analysisService.pleaseSelectFuncName')}
              notFoundContent={<Empty image={kongImg} description={intl.get('global.noData')} />}
            >
              {_.map(funcList, func => (
                <Option key={func.name}>{func.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            style={{ margin: 0 }}
            label={
              <span>
                {intl.get('analysisService.doubleEvtT')}
                <span className="kw-c-subtext">{intl.get('analysisService.doubleEvtSubT')}</span>
              </span>
            }
            name="doubleEvent"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </div>
    </UniversalModal>
  );
};

export default (props: any) => (props.visible ? <AddConfigModal {...props} /> : null);
