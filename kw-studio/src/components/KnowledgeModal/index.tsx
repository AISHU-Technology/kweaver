import React, { memo, useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Modal, Button, Input, Form, ConfigProvider, message, Radio, Switch } from 'antd';
import UniversalModal from '@/components/UniversalModal';
import { CheckOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import { GRAPH_DB_TYPE, ONLY_KEYBOARD } from '@/enums';

// import UniversalModal from '@/components/UniversalModal';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { sessionStore } from '@/utils/handleFunction';
import TrimmedInput from '../TrimmedInput';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';
import './style.less';
import AdKnowledgeNetIcon, { KnowledgeNetIconList } from '@/components/AdKnowledgeNetIcon/AdKnowledgeNetIcon';
import classnames from 'classnames';

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

const DES_TEST =
  /([\\s\u4e00-\u9fa5_a-zA-Z0-9=~!@#$&%^&*()_+`'"{}[\];:,.?<>|/~！@#￥%…&*·（）—+。={}|【】：；‘’“”、《》？，。/\n\\]+$)|-/;

type ModalContentType = {
  source: any;
  optionType: string;
  onSuccess: () => void;
  onCancel: () => void;
  onToPageNetwork?: (knId?: string | number) => void;
};
// 弹窗内容
const ModalContent = memo(
  forwardRef((props: ModalContentType, ref) => {
    const { source, optionType, onSuccess, onCancel, onToPageNetwork } = props;
    const [form] = Form.useForm();
    const history = useHistory();
    const [selectColor, setSelectColor] = useState(KnowledgeNetIconList[0].icon); // 默认选择第一个颜色
    const graphDbType = sessionStore.get('graph_db_type'); // 图数据库类型
    const eceph_available = sessionStore.get('ECeph_available'); // ECeph是否可用

    useImperativeHandle(ref, () => ({
      onOk
    }));

    useEffect(() => {
      optionType === 'edit' && changeColor(source?.color);
      if (optionType === 'edit' && graphDbType === GRAPH_DB_TYPE?.NEBULA) {
        const to_be_uploaded = !!source?.to_be_uploaded;
        form.setFieldsValue({ to_be_uploaded });
      } else {
        // 未接入eceph 不能上传
        const to_be_uploaded = eceph_available ? graphDbType === GRAPH_DB_TYPE?.NEBULA : 0;
        form.setFieldsValue({ to_be_uploaded });
      }
    }, [source]);

    /**
     * 点击确定
     */
    const onOk = () => {
      form
        .validateFields()
        .then(async values => {
          const { name, des, color, to_be_uploaded } = values;
          let isUpLoad: any;
          if (to_be_uploaded !== undefined) {
            isUpLoad = to_be_uploaded ? 1 : 0;
          }
          const data: any = {
            knw_name: name,
            knw_des: des?.trim(),
            // knw_color: color || '#126EE3',
            knw_color: selectColor,
            to_be_uploaded: isUpLoad
          };

          try {
            if (optionType === 'edit') {
              data.knw_id = source?.id;
              //
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
                if (onToPageNetwork) onToPageNetwork(result?.data);
              }
              if (ERROR_CODE[result?.ErrorCode]) message.error(intl.get(ERROR_CODE[result?.ErrorCode]));

              if (result?.ErrorCode === 'Builder.service.knw_service.knwService.knowledgeNetwork_save.NameRepeat') {
                return form.setFields([{ name: 'name', errors: [intl.get('graphList.repeatName')] }]);
              }
            }
          } catch (error) {}
          onCancel();
        })
        .catch(err => {});
    };

    // 选择显色回调函数
    const changeColor = (value: string) => {
      const color = value;
      const selected = _.filter(KnowledgeNetIconList, item => item.icon === color)?.[0] || {};
      if (selected?.icon) {
        setSelectColor(selected.icon);
      } else {
        setSelectColor('icon-color-zswl7');
      }
    };

    return (
      <div className="add-netWork-content">
        <div className="m-body">
          <Form
            form={form}
            layout="vertical"
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
                { required: true, message: intl.get('global.noNull') },
                { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
                { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') }
              ]}
            >
              <TrimmedInput autoComplete="off" className="auth-input" placeholder={intl.get('graphList.inputName')} />
            </Form.Item>
            <Form.Item
              name="des"
              label={intl.get('graphList.des')}
              rules={[
                { max: 255, message: intl.get('global.lenErr', { len: 255 }) },
                () => {
                  const test = DES_TEST;
                  return {
                    validator(rule, value) {
                      if (value.trim() === '') return Promise.resolve();
                      if (test.test(value.trim())) return Promise.resolve();
                      return Promise.reject([intl.get('global.onlyKeyboard')]);
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
              <div className="kw-flex" style={{ gap: 8 }}>
                {KnowledgeNetIconList.map(item => (
                  <div
                    key={item.icon}
                    className={classnames('color-icon kw-center', {
                      'color-icon-selected': selectColor === item.icon
                    })}
                    onClick={() => {
                      changeColor(item.icon);
                    }}
                  >
                    <AdKnowledgeNetIcon key={item.icon} type={item.icon} size={32} fontSize={16} />
                  </div>
                ))}
              </div>
              {/* <Radio.Group onChange={e => changeColor(e?.target?.value)} className="group">*/}
              {/*  {_.map(KnowledgeNetIconList, item => {*/}
              {/*    const { icon, color } = item;*/}
              {/*    const isSelected = selectColor === icon;*/}
              {/*    return (*/}
              {/*      <Radio.Button key={icon} value={color} className="box">*/}
              {/*        <div className="color-box">*/}
              {/*          <span*/}
              {/*            className={isSelected ? 'selected colors' : 'colors'}*/}
              {/*            style={{ backgroundColor: color }}*/}
              {/*          />*/}
              {/*          <CheckOutlined*/}
              {/*            className="checked"*/}
              {/*            style={{ color, borderColor: color, display: isSelected ? 'block' : 'none' }}*/}
              {/*          />*/}
              {/*        </div>*/}
              {/*      </Radio.Button>*/}
              {/*    );*/}
              {/*  })}*/}
              {/* </Radio.Group>*/}
            </Form.Item>
          </Form>
        </div>
      </div>
    );
  })
);

// 弹窗
type KnowledgeModalType = {
  visible: boolean;
  source: { type: string; data: any };
  onSuccess: () => void;
  onCancel: () => void;
  onToPageNetwork?: (knId?: string | number) => void;
};
const KnowledgeModal = (props: KnowledgeModalType) => {
  const { visible, source, onSuccess, onCancel, onToPageNetwork } = props;
  const { type, data = {} } = source;
  const title = type === 'add' ? intl.get('graphList.createNetwork') : intl.get('graphList.editNetwork');
  const ModalContentRef = useRef(null);

  if (!visible) return null;
  return (
    <UniversalModal
      visible={visible}
      title={title}
      className="add-netWork-modal"
      destroyOnClose
      focusTriggerAfterClose={false}
      maskClosable={false}
      footerData={
        <ConfigProvider autoInsertSpaceInButton={false}>
          <Button className="ant-btn-default btn" onClick={() => onCancel()}>
            {intl.get('graphList.cancel')}
          </Button>

          <Button type="primary" className="btn primary" onClick={() => (ModalContentRef.current as any).onOk()}>
            {intl.get('graphList.sure')}
          </Button>
        </ConfigProvider>
      }
      onCancel={e => {
        e.stopPropagation();
        onCancel();
      }}
      width={640}
    >
      <div className="m-content">
        <ModalContent
          ref={ModalContentRef}
          optionType={type}
          source={data}
          onSuccess={onSuccess}
          onCancel={onCancel}
          onToPageNetwork={onToPageNetwork}
        />
      </div>
    </UniversalModal>
  );
};

export default memo(KnowledgeModal);
