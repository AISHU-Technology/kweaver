import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Button, Drawer, Form, Input, Select, message } from 'antd';
import intl from 'react-intl-universal';
import serviceFunction from '@/services/functionManage';
import IconFont from '@/components/IconFont';
import { getParam } from '@/utils/handleFunction';
import { paramPolyfill, isSingleStatement, updatePosition } from '@/components/ParamCodeEditor';
import { ONLY_KEYBOARD } from '@/enums';
import TrimmedInput from '@/components/TrimmedInput';
import CodeWrapper from '../Code';
import _ from 'lodash';

// import Example from '@/components/ParamCodeEditor/example';

import './style.less';

const FormItem = Form.Item;

const CreateDrawer = (props: any) => {
  const { isOpen, isDisabled, editInfo, onChangeDrawer, onChangeState } = props;
  const [form] = Form.useForm();
  const [parameters, setParameters] = useState<any>([]); // 参数列表
  const [codeError, setCodeError] = useState<any>(''); // 编辑器错误
  const kwId = useMemo(() => getParam('id'), [location?.search]);
  const descTest = /^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\s]+$/;
  const codeRef = useRef<any>();

  useEffect(() => {
    if (isOpen && editInfo?.id) {
      const { name, description, language, parameters, code } = editInfo;
      form.setFieldsValue({ name, description, language });
      const params = paramPolyfill(parameters);
      setParameters(params);
      codeRef.current.initMark(code, params);
    }
  }, [editInfo, isOpen]);

  const hasRepeat = (params: any) => {
    if (_.isEmpty(params)) return true;
    const uniq = _.unionBy(params, (p: any) => p?.name);
    if (params?.length > uniq?.length) return false;
    return true;
  };

  // 新建或编辑按钮
  const onOk = () => {
    form.validateFields().then(async values => {
      const { name, description, language } = values;
      const { params, statement } = codeRef?.current?.getOriginData() || {};
      if (codeError) return;
      if (!statement.trim()) return setCodeError(intl.get('global.noNull'));
      if (!isSingleStatement(statement)) return message.error(intl.get('function.onlySingle'));
      const paramsArr = updatePosition(parameters, params);
      if (!hasRepeat(paramsArr)) {
        message.error(intl.get('function.notRepeat'));
        return;
      }
      try {
        const data = {
          knw_id: Number(kwId),
          name,
          language,
          code: statement,
          description,
          parameters: paramsArr
        };
        let response: any = {};
        if (!editInfo?.id) {
          response = await serviceFunction.functionCreate(data);
        } else {
          response = await serviceFunction.functionEdit({ ...data, function_id: editInfo?.id });
        }
        if (response?.res) {
          const tip = editInfo?.id ? intl.get('function.editSuccess') : intl.get('function.addSuccess');
          message.success(tip);
          setTimeout(() => {
            onChangeState({});
          }, 100);
          // eslint-disable-next-line no-unreachable
          onChangeDrawer(false);
        }
        // eslint-disable-next-line no-unreachable
        if (
          [
            'Builder.FunctionService.CreateFunction.DuplicatedName',
            'Builder.FunctionService.EditFunction.DuplicatedName'
          ].includes(response.ErrorCode)
        ) {
          form.setFields([{ name: 'name', errors: [intl.get('global.repeatName')] }]);
          return;
        }
        if (response?.ErrorCode) {
          message.error(response?.ErrorDetails);
        }
        // eslint-disable-next-line no-unreachable
      } catch (err) {
        //
      }
    });
  };

  // 改变参数内容
  const onParamChange = (params: any) => {
    setParameters(params);
  };

  // 取消
  const onCancel = () => {
    onChangeDrawer(false);
  };

  return (
    <div>
      <Drawer
        title={intl.get('function.functions')}
        className="createFunctionRoot"
        placement={'right'}
        destroyOnClose={true}
        maskClosable={false}
        open={isOpen}
        width={1080}
        closable={false}
        extra={<IconFont type="icon-guanbiquxiao" onClick={() => onChangeDrawer(false)} />}
      >
        <div className="drawerContent">
          <Form
            form={form}
            className="function-form kw-pl-6 kw-pr-6"
            layout="vertical"
            initialValues={{
              name: '',
              description: '',
              language: 'nGQL',
              code: ''
            }}
          >
            <div className="kw-space-between">
              <FormItem
                label={intl.get('function.functionName')}
                style={{ width: 'calc(50% - 10px)' }}
                name="name"
                rules={[
                  { required: true, message: intl.get('global.noNull') },
                  { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
                  { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') }
                ]}
              >
                <TrimmedInput
                  placeholder={intl.get('function.enterFunName')}
                  autoComplete="off"
                  disabled={isDisabled}
                />
              </FormItem>
              <FormItem
                label={intl.get('function.language')}
                style={{ width: 'calc(50% - 10px)' }}
                name="language"
                rules={[{ required: true, message: intl.get('global.noNull') }]}
              >
                <Select disabled={isDisabled}>
                  <Select.Option key={'nGQL'} value="nGQL">
                    nGQL
                  </Select.Option>
                </Select>
              </FormItem>
            </div>
            <FormItem
              label={intl.get('global.desc')}
              name="description"
              validateFirst={true}
              rules={[
                { max: 255, message: intl.get('global.lenErr', { len: 255 }) },
                {
                  pattern: ONLY_KEYBOARD,
                  message: intl.get('global.onlyKeyboard') // 仅支持键盘上字符
                }
              ]}
            >
              <Input.TextArea
                placeholder={intl.get('function.enterDes')}
                autoComplete="off"
                style={{ height: 64 }}
                disabled={isDisabled}
              ></Input.TextArea>
            </FormItem>
          </Form>
          <div className="kw-pl-6 kw-pr-6">
            <CodeWrapper
              ref={codeRef}
              mode="simple"
              parameters={parameters}
              isDisabled={isDisabled}
              codeError={codeError}
              onErrorChange={setCodeError}
              onParamChange={onParamChange}
            />

            {/* <Example /> */}
          </div>
        </div>
        <div className="drawerFooter">
          <Button type="default" onClick={onCancel}>
            {intl.get('function.cancel')}
          </Button>
          <Button type="primary" disabled={isDisabled} onClick={() => onOk()}>
            {intl.get('function.save')}
          </Button>
        </div>
      </Drawer>
    </div>
  );
};
export default (props: any) => {
  const { isOpen } = props;
  if (!isOpen) return null;
  return <CreateDrawer {...props} />;
};
