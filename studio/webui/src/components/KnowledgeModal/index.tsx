import React, { memo, useState, useEffect } from 'react';
import { Modal, Button, Input, Form, ConfigProvider, message, Radio } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import intl from 'react-intl-universal';
import _ from 'lodash';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';
import './style.less';

const COLOR_LIST: { id: string; color: string }[] = [
  { id: 'a', color: '#126EE3' },
  { id: 'b', color: '#7CBE00' },
  { id: 'c', color: '#FF8600' },
  { id: 'd', color: '#019688' },
  { id: 'e', color: '#8c8c8c' }
];
const ERROR_CODE: Record<string, string> = {
  'Builder.service.knw_service.knwService.editKnw.RequestError': 'graphList.errorEdit', // 编辑失败
  'Builder.controller.knowledgeNetwork_controller.editKnw.PermissionError': 'graphList.editperMissionError',
  'Builder.service.knw_service.knwService.knowledgeNetwork_save.RequestError': 'graphList.errorCreate', // 创建失败
  'Builder.controller.knowledgeNetwork_controller.save_knowledgenetwork.PermissonError': 'graphList.perMissionError',
  'Builder.third_party_service.managerUtils.ManagerUtils.create_knw_resource.RequestError': 'graphList.perMissionError',
  'Builder.controller.knowledgeNetwork_controller.save_knowledgenetwork.AddPermissionError': 'knowledge.noAuth'
};

const NAME_TEST =
  /(^[\u4e00-\u9fa5_a-zA-Z0-9=~!@#$&%^&*()_+`'"{}[\];:,.?<>|/~！@#￥%…&*·（）—+。={}|【】：；‘’“”、《》？，。/\n\\+]+$)|-/;
const DES_TEST =
  /([\\s\u4e00-\u9fa5_a-zA-Z0-9=~!@#$&%^&*()_+`'"{}[\];:,.?<>|/~！@#￥%…&*·（）—+。={}|【】：；‘’“”、《》？，。/\n\\]+$)|-/;

type ModalContentType = {
  source: any;
  optionType: string;
  onSuccess: () => void;
  onCancel: () => void;
};
// 弹窗内容
const ModalContent = memo((props: ModalContentType) => {
  const { source, optionType, onSuccess, onCancel } = props;
  const [form] = Form.useForm();
  const history = useHistory();
  const [selectColor, setSelectColor] = useState('a'); // 默认选择第一个颜色

  useEffect(() => {
    optionType === 'edit' && changeColor(source?.color);
  }, [source]);

  /**
   * 点击确定
   */
  const onOk = () => {
    form
      .validateFields()
      .then(async values => {
        const data: any = { knw_name: values.name, knw_des: values.des?.trim(), knw_color: values?.color || '#126EE3' };
        try {
          if (optionType === 'edit') {
            data.knw_id = source?.id;
            const { res = {}, ErrorCode = '' } = await servicesKnowledgeNetwork.knowledgeNetEdit(data);
            if (!_.isEmpty(res)) {
              message.success(intl.get('graphList.editSuccess'));
              onSuccess();
            }
            if (ERROR_CODE[ErrorCode]) message.error(intl.get(ERROR_CODE[ErrorCode]));
            if (ErrorCode === 'Builder.service.knw_service.knwService.editKnw.NameRepeat') {
              return form.setFields([{ name: 'name', errors: [intl.get('graphList.repeatName')] }]);
            }
          }

          // 新建知识网络
          if (optionType === 'add') {
            const result = await servicesKnowledgeNetwork.knowledgeNetCreate(data);
            if (result?.message === 'success') {
              message.success(intl.get('graphList.addSuccess'));
              history.push(`/knowledge/network?id=${result?.data}`);
            }
            if (ERROR_CODE[result?.ErrorCode]) message.error(intl.get(ERROR_CODE[result?.ErrorCode]));

            if (result?.ErrorCode === 'Builder.service.knw_service.knwService.knowledgeNetwork_save.NameRepeat') {
              return form.setFields([{ name: 'name', errors: [intl.get('graphList.repeatName')] }]);
            }
          }
        } catch (error) {
          // console.log('error')
        }
        onCancel();
      })
      .catch(err => {});
  };

  // 选择显色回调函数
  const changeColor = (value: string) => {
    const color = value;
    const selected = _.filter(COLOR_LIST, item => item.color === color)?.[0] || {};
    if (selected?.id) setSelectColor(selected.id);
  };

  return (
    <div className="add-netWork-content">
      <div className="m-body">
        <Form
          form={form}
          layout="vertical"
          validateTrigger={['onChange', 'onBlur']}
          initialValues={{
            color: source?.color || '#126EE3',
            name: source?.knw_name || '',
            des: source?.knw_description || ''
          }}
        >
          <Form.Item
            name="name"
            label={intl.get('graphList.name')}
            rules={[
              { required: true, message: intl.get('graphList.cannotEmpty') },
              { max: 50, message: intl.get('graphList.max50') },
              { pattern: NAME_TEST, message: intl.get('graphList.onlyKeyboard') }
            ]}
          >
            <Input
              autoComplete="off"
              className="auth-input"
              placeholder={intl.get('graphList.inputName')}
              onChange={e => {
                const { value } = e.target;
                form.setFieldsValue({ name: value.trim() });
              }}
            />
          </Form.Item>
          <Form.Item
            name="des"
            label={intl.get('graphList.des')}
            rules={[
              { max: 200, message: intl.get('graphList.max200') },
              () => {
                const test = DES_TEST;
                return {
                  validator(rule, value) {
                    if (value.trim() === '') return Promise.resolve();
                    if (test.test(value.trim())) return Promise.resolve();
                    return Promise.reject([intl.get('graphList.onlyKeyboard')]);
                  }
                };
              }
            ]}
          >
            <Input.TextArea autoComplete="off" className="des-input" placeholder={intl.get('graphList.inputDes')} />
          </Form.Item>
          <Form.Item
            name="color"
            label={intl.get('graphList.color')}
            rules={[{ required: true, message: intl.get('graphList.cannotEmpty') }]}
          >
            <Radio.Group onChange={e => changeColor(e?.target?.value)} className="group">
              {_.map(COLOR_LIST, item => {
                const { id, color } = item;
                const isSelected = selectColor === id;
                return (
                  <Radio.Button key={id} value={color} className="box">
                    <div className="color-box">
                      <span className={isSelected ? 'selected colors' : 'colors'} style={{ backgroundColor: color }} />
                      <CheckOutlined
                        className="checked"
                        style={{ color, borderColor: color, display: isSelected ? 'block' : 'none' }}
                      />
                    </div>
                  </Radio.Button>
                );
              })}
            </Radio.Group>
          </Form.Item>
        </Form>
      </div>

      <div className="m-footer">
        <ConfigProvider autoInsertSpaceInButton={false}>
          <Button className="ant-btn-default btn" onClick={() => onCancel()}>
            {intl.get('graphList.cancel')}
          </Button>

          <Button type="primary" className="btn primary" onClick={onOk}>
            {intl.get('graphList.sure')}
          </Button>
        </ConfigProvider>
      </div>
    </div>
  );
});

// 弹窗
type KnowledgeModalType = {
  visible: boolean;
  source: {
    type: string;
    data: any;
  };
  onSuccess: () => void;
  onCancel: () => void;
};
const KnowledgeModal = (props: KnowledgeModalType) => {
  const { visible, source, onSuccess, onCancel } = props;
  const { type, data = {} } = source;
  const title = type === 'add' ? [intl.get('graphList.createNetwork')] : [intl.get('graphList.editNetwork')];

  return (
    <Modal
      visible={visible}
      title={title}
      className="add-netWork-modal"
      destroyOnClose
      focusTriggerAfterClose={false}
      maskClosable={false}
      footer={null}
      onCancel={e => {
        e.stopPropagation();
        onCancel();
      }}
    >
      <ModalContent optionType={type} source={data} onSuccess={onSuccess} onCancel={onCancel} />
    </Modal>
  );
};

export default memo(KnowledgeModal);
