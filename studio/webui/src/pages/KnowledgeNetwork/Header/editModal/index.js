/**
 * @author Haiyan
 * @date 2022/3/11
 *
 */

import React, { memo, useState, useEffect } from 'react';
import _ from 'lodash';
import { Modal, Button, Input, Form, ConfigProvider, message, Radio } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import apiKnowledge from '@/services/knowledgeNetwork/index';
import './index.less';

const COLOR_LIST = [
  { id: 'a', color: '#126EE3' },
  { id: 'b', color: '#7CBE00' },
  { id: 'c', color: '#FF8600' },
  { id: 'd', color: '#019688' },
  { id: 'e', color: '#8c8c8c' }
];

// 弹窗内容
const ModalContent = memo(props => {
  const { setVisible, anyDataLang, editNetwork, initKnowledgeList, changeSelectedKnowledge } = props;
  const [form] = Form.useForm();
  const [selectColor, setSelectColor] = useState('a'); // 默认选择第一个颜色

  useEffect(() => {
    changeColor({ target: { value: '' } }, editNetwork.color);
  }, [editNetwork]);

  /**
   * 点击确定
   */
  const onOk = e => {
    form
      .validateFields()
      .then(async values => {
        // 编辑知识网络
        const data = {
          knw_id: editNetwork.id,
          knw_name: values.name,
          knw_des: values.des,
          knw_color: values?.color || '#126EE3'
        };
        const res = await apiKnowledge.knowledgeNetEdit(data);

        // 编辑成功！
        if (res && res.res) {
          message.success(intl.get('graphList.editSuccess'));
          initKnowledgeList(true);
          changeSelectedKnowledge(editNetwork.id);
        }
        // 编辑失败！
        if (res.ErrorCode === 'Builder.service.knw_service.knwService.editKnw.RequestError') {
          message.error(intl.get('graphList.errorEdit'));
        }
        // 重名
        if (res.ErrorCode === 'Builder.service.knw_service.knwService.editKnw.NameRepeat') {
          form.setFields([
            {
              name: 'name',
              errors: [intl.get('graphList.repeatName')]
            }
          ]);

          return;
        }

        // 权限
        if (res.ErrorCode === 'Builder.controller.knowledgeNetwork_controller.editKnw.PermissionError') {
          message.error(intl.get('graphList.editperMissionError'));
        }

        setVisible(false);
      })

      .catch(err => {});
  };

  // 选择显色回调函数
  const changeColor = (e, init) => {
    const color = init || e.target.value;
    const selected = _.filter(COLOR_LIST, item => item.color === color)?.[0] || {};
    if (selected?.id) setSelectColor(selected.id);
  };

  return (
    <div className="add-netWork-content">
      <div className={`m-body ${anyDataLang === 'en-US' && 'EN'}`}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            color: editNetwork.color || '#126EE3',
            name: editNetwork.knw_name || '',
            des: editNetwork.knw_description || ''
          }}
        >
          <Form.Item
            name="name"
            label={intl.get('graphList.name')}
            rules={[
              {
                required: true,
                message: [intl.get('graphList.cannotEmpty')]
              },
              {
                max: 50,
                message: [intl.get('graphList.max50')]
              },

              {
                pattern:
                  /(^[\u4e00-\u9fa5_a-zA-Z0-9=~!@#$&%^&*()_+`'"{}[\];:,.?<>|/~！@#￥%…&*·（）—+。={}|【】：；‘’“”、《》？，。/\n\\]+$)|-/,
                message: [intl.get('graphList.onlyKeyboard')]
              }
            ]}
          >
            <Input autoComplete="off" className="auth-input" placeholder={[intl.get('graphList.inputName')]} />
          </Form.Item>
          <Form.Item
            name="des"
            label={intl.get('graphList.des')}
            rules={[
              {
                max: 200,
                message: [intl.get('graphList.max200')]
              },
              {
                pattern:
                  /(^[\u4e00-\u9fa5_a-zA-Z0-9=~!@#$&%^&*()_+`'"{}[\];:,.?<>|/~！@#￥%…&*·（）—+。={}|【】：；‘’“”、《》？，。/\n\\]+$)|-/,
                message: [intl.get('graphList.onlyKeyboard')]
              }
            ]}
          >
            <Input.TextArea autoComplete="off" className="des-input" placeholder={intl.get('graphList.inputDes')} />
          </Form.Item>
          <Form.Item
            name="color"
            label={intl.get('graphList.color')}
            rules={[
              {
                required: true,
                message: [intl.get('graphList.cannotEmpty')]
              }
            ]}
          >
            <Radio.Group onChange={changeColor} className="group">
              {_.map(COLOR_LIST, item => {
                const { id, color } = item;
                const isSelected = selectColor === id;
                return (
                  <Radio.Button key={id} value={color} className="box">
                    <div className="color-box">
                      <span className={isSelected ? 'selected colors' : 'colors'} style={{ backgroundColor: color }} />
                      <CheckOutlined
                        className="checked"
                        style={{ color: '#fff', borderColor: color, display: isSelected ? 'block' : 'none' }}
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
          <Button className="ant-btn-default btn" onClick={() => setVisible('', false)}>
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
const CreateNetworkModal = props => {
  const { visible, setVisible, editNetwork, initKnowledgeList, changeSelectedKnowledge, ...otherProps } = props;
  const title = [intl.get('graphList.editNetwork')];

  return (
    <Modal
      visible={visible}
      title={title}
      onCancel={e => {
        e.stopPropagation();
        setVisible(false);
      }}
      className="add-netWork-modal"
      destroyOnClose={true}
      focusTriggerAfterClose={false}
      width={640}
      maskClosable={false}
      footer={null}
    >
      <ModalContent
        {...otherProps}
        setVisible={setVisible}
        editNetwork={editNetwork}
        initKnowledgeList={initKnowledgeList}
        changeSelectedKnowledge={changeSelectedKnowledge}
      />
    </Modal>
  );
};

CreateNetworkModal.defaultProps = {
  visible: Boolean,
  setVisible: () => {},
  optionType: String,
  editNetwork: Object
};

export default memo(CreateNetworkModal);
