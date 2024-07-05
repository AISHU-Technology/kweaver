import React, { memo, useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Button, Input, Form, ConfigProvider, message } from 'antd';
import UniversalModal from '@/components/UniversalModal';
import { GRAPH_DB_TYPE, ONLY_KEYBOARD } from '@/enums';

import intl from 'react-intl-universal';
import _ from 'lodash';
import { sessionStore } from '@/utils/handleFunction';
import TrimmedInput from '../TrimmedInput';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';
import './style.less';
import KwKNIcon, { KNIconList } from '@/components/KwKNIcon';
import classnames from 'classnames';

const ERROR_CODE: Record<string, string> = {
  'Builder.service.knw_service.knwService.editKnw.RequestError': 'graphList.errorEdit',
  'Builder.controller.knowledgeNetwork_controller.editKnw.PermissionError': 'graphList.editperMissionError',
  'Builder.service.knw_service.knwService.knowledgeNetwork_save.RequestError': 'graphList.errorCreate',
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

const ModalContent = memo(
  forwardRef((props: ModalContentType, ref) => {
    const { source, optionType, onSuccess, onCancel, onToPageNetwork } = props;
    const [form] = Form.useForm();
    const [selectColor, setSelectColor] = useState(KNIconList[0].icon);
    const graphDbType = sessionStore.get('graph_db_type');
    const eceph_available = sessionStore.get('ECeph_available');

    useImperativeHandle(ref, () => ({
      onOk
    }));

    useEffect(() => {
      optionType === 'edit' && changeColor(source?.color);
      if (optionType === 'edit' && graphDbType === GRAPH_DB_TYPE?.NEBULA) {
        const to_be_uploaded = !!source?.to_be_uploaded;
        form.setFieldsValue({ to_be_uploaded });
      } else {
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
          const { name, des, to_be_uploaded } = values;
          let isUpLoad: any;
          if (to_be_uploaded !== undefined) {
            isUpLoad = to_be_uploaded ? 1 : 0;
          }
          const data: any = {
            knw_name: name,
            knw_des: des?.trim(),
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
          } catch (error) {
            /* empty */
          }
          onCancel();
        })
        .catch(() => {
          /* empty */
        });
    };

    const changeColor = (value: string) => {
      const color = value;
      const selected = _.filter(KNIconList, item => item.icon === color)?.[0] || {};
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
                {KNIconList.map(item => (
                  <div
                    key={item.icon}
                    className={classnames('color-icon kw-center', {
                      'color-icon-selected': selectColor === item.icon
                    })}
                    onClick={() => {
                      changeColor(item.icon);
                    }}
                  >
                    <KwKNIcon key={item.icon} type={item.icon} size={32} fontSize={16} />
                  </div>
                ))}
              </div>
              {/* <Radio.Group onChange={e => changeColor(e?.target?.value)} className="group">*/}
              {/*  {_.map(KNIconList, item => {*/}
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
      open={visible}
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
