import React, { useState, useRef } from 'react';
import { message, Form, Select } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import serviceFunction from '@/services/functionManage';
import UniversalModal from '@/components/UniversalModal';
import Format from '@/components/Format';
import ParamCodeEditor, { ParamEditorRef, paramPolyfill } from '@/components/ParamCodeEditor';
import ParamTable from '../../ParamTable';

export interface QuoteModalProps {
  visible: boolean;
  funcList: any[];
  onOk: (data: { code: string; params: any[] }) => void;
  onCancel: () => void;
}

const QuoteModal = (props: QuoteModalProps) => {
  const { visible, funcList, onOk, onCancel } = props;
  const [form] = Form.useForm();
  const editorRef = useRef<ParamEditorRef>(null);
  const [selectedFunc, setSelectedFunc] = useState<any>({});

  /**
   * 处理 `确认` 的逻辑
   */
  const handleOk = () => {
    form
      .validateFields()
      .then(values => {
        onOk?.({ code: selectedFunc.code, params: selectedFunc.paramsList });
      })
      .catch(err => {
        //
      });
  };

  /**
   * 选择函数
   * @param id 函数id
   */
  const handleSelect = async (id: number) => {
    try {
      const data = { function_id: id };
      const response = await serviceFunction.functionInfo(data);
      if (response?.res) {
        const paramsList = paramPolyfill(response.res.parameters);
        setSelectedFunc({ ...response.res, paramsList });
        editorRef.current?.initMark(response.res.code, paramsList);
        return;
      }
      response?.ErrorDetails && message.error(response.ErrorDetails);
      setSelectedFunc({});
    } catch (err) {
      //
    }
  };

  return (
    <UniversalModal
      className="function-quote-modal"
      title={intl.get('function.referenceBtn')}
      width={1000}
      open={visible}
      // visible
      onOk={handleOk}
      onCancel={onCancel}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        { label: intl.get('global.ok'), type: 'primary', onHandle: handleOk }
      ]}
    >
      <div style={{ maxHeight: '496px' }}>
        <div className="kw-h-100" style={{ overflow: 'auto' }}>
          <Form form={form} layout="vertical">
            <Form.Item
              label={intl.get('function.functionName')}
              name="id"
              rules={[{ required: true, message: intl.get('global.pleaseSelect') }]}
            >
              <Select
                getPopupContainer={e => e.parentElement}
                listHeight={32 * 8}
                className="kw-w-100"
                placeholder={intl.get('global.pleaseSelect')}
                onChange={handleSelect}
              >
                {_.map(funcList, item => (
                  <Select.Option key={item.id} data={item}>
                    {item.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>

          <Format.Title className="kw-mb-2" strong={4}>
            {intl.get('analysisService.graphLang')}
          </Format.Title>
          <ParamCodeEditor ref={editorRef} height="137px" readonly />
          <div className="kw-pt-6">
            <Format.Title className="kw-mb-2" strong={4}>
              {intl.get('function.parameter')}
            </Format.Title>
            <ParamTable data={selectedFunc.paramsList || []} readonly />
          </div>
        </div>
      </div>
    </UniversalModal>
  );
};

export default (props: QuoteModalProps) => (props.visible ? <QuoteModal {...props} /> : null);
