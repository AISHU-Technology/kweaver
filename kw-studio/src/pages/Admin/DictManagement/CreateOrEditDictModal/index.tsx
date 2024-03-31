import _ from 'lodash';
import intl from 'react-intl-universal';
import React, { useState, useEffect } from 'react';
import { Form, Input } from 'antd';

import HOOKS from '@/hooks';
import TemplateModal from '@/components/TemplateModal';
import UniversalModal from '@/components/UniversalModal';
import servicesEventStats, {
  addDictDataType,
  updateDictDataType,
  addDictItemDataType,
  updateDictItemDataType
} from '@/services/eventStats';

// 正则匹配
const nameDesRegex = /^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\s]+$/;
const typeRegex = /^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/;

// create or edit modal props
export interface CreateOrEditDictModalProps {
  dictModalType: DICT_MODAL_TYPE; // 字典类型、字典值
  createOrEditDictInitData: CreateOrEditDictDataType | undefined;
  closeResModal: (modalType?: DICT_MODAL_TYPE) => void;
  resModalVisible: boolean;
  comparedData: any[];
}

export interface CreateOrEditDictDataType {
  id?: string; // 修改数据时的id（编辑时用）
  cName: string; // 中文名
  eName: string; // 英文名
  remark: string; // 描述
  dictType?: string; // 字典类型（字典类型用）
  dictId?: string; // 字典类型id（字典值用）
  itemValue?: string; // 数据值 （字典值用）
}

export enum DICT_MODAL_TYPE {
  DICT_TYPE = 'dictType',
  DICT_VALUE = 'value'
}

// modal
const CreateOrEditDictModal = (props: CreateOrEditDictModalProps) => {
  // props
  const { dictModalType, createOrEditDictInitData, closeResModal, resModalVisible, comparedData } = props;

  // 多行输入
  const { TextArea } = Input;

  // antd form ref
  const [formRef] = Form.useForm();

  // 当前的语言
  const language = HOOKS.useLanguage();

  // 中文名称
  const [cName, setCName] = useState<string | undefined>(createOrEditDictInitData?.cName);
  // 英文名称
  const [eName, setEName] = useState<string | undefined>(createOrEditDictInitData?.eName);
  // 字典类型
  const [dictType, setDictType] = useState<string | undefined>(createOrEditDictInitData?.dictType);
  // 数据值
  const [itemValue, setItemValue] = useState<string | undefined>(createOrEditDictInitData?.itemValue);
  // 描述
  const [describe, setDescribe] = useState<string | undefined>(createOrEditDictInitData?.remark);

  // ok button clicked event
  const createOrEditDict = () => {
    formRef
      .validateFields()
      .then(async value => {
        const result = await sendResThenGetResp();
        if (result.res) {
          closeResModal(dictModalType);
        }
      })
      .catch(error => {});
  };

  // send request and get response
  const sendResThenGetResp = async () => {
    let resData;
    if (createOrEditDictInitData?.id) {
      if (dictModalType === DICT_MODAL_TYPE.DICT_TYPE) {
        const requestData: updateDictDataType = {
          id: createOrEditDictInitData.id,
          cName: cName!,
          eName: eName!,
          remark: describe
        };
        resData = await servicesEventStats.updateDict(requestData);
      } else {
        const requestData: updateDictItemDataType = {
          id: createOrEditDictInitData.id,
          cName: cName!,
          eName: eName!,
          itemValue,
          remark: describe
        };
        resData = await servicesEventStats.updateDictItem(requestData);
      }
    } else {
      if (dictModalType === DICT_MODAL_TYPE.DICT_TYPE) {
        const requestData: addDictDataType = {
          cName: cName!,
          eName: eName!,
          dictType: dictType!,
          remark: describe
        };
        resData = await servicesEventStats.addDict(requestData);
      } else {
        const requestData: addDictItemDataType = {
          cName: cName!,
          eName: eName!,
          dictId: createOrEditDictInitData!.dictId!,
          itemValue,
          remark: describe
        };
        resData = await servicesEventStats.addDictItem(requestData);
      }
    }
    return resData;
  };

  // 中文名称变更
  const onCNameChanged = (e: any) => {
    setCName(e.target.value);
  };

  // 英文名称变更
  const onENameChanged = (e: any) => {
    setEName(e.target.value);
  };

  // 字典类型变更
  const onTypeChanged = (e: any) => {
    setDictType(e.target.value);
  };

  // 字典值变更
  const onValueChanged = (e: any) => {
    setItemValue(e.target.value);
  };

  // 描述变更
  const onDescChanged = (e: any) => {
    setDescribe(e.target.value);
  };

  return (
    <UniversalModal
      className="create-edit-dict-modal"
      width={640}
      title={
        createOrEditDictInitData?.id
          ? intl.get('dictManagement.modalComponent.edit_modal_title')
          : dictModalType === DICT_MODAL_TYPE.DICT_TYPE
          ? intl.get('dictManagement.modalComponent.add_type_modal_title')
          : intl.get('dictManagement.modalComponent.add_value_modal_title')
      }
      visible={resModalVisible}
      onCancel={() => closeResModal()}
      onOk={createOrEditDict}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: closeResModal },
        { label: intl.get('global.ok'), type: 'primary', onHandle: createOrEditDict }
      ]}
    >
      <div
        className="create-edit-dict-modal-content"
        // style={{
        //   height: '494px',
        //   padding: '24px 24px 64px 24px'
        // }}
      >
        <Form form={formRef} className="create-edit-dict-modal-content-form" layout={'vertical'} requiredMark={true}>
          <Form.Item
            name="create-edit-dict-modal-content-cName"
            label={intl.get('dictManagement.modalComponent.c_name_title')}
            validateFirst={true}
            initialValue={cName}
            rules={[
              { required: true, message: intl.get('dictManagement.errorMsg.empty') },
              { max: 50, message: intl.get('dictManagement.errorMsg.max', { len: 50 }) },
              { pattern: nameDesRegex, message: intl.get('dictManagement.errorMsg.nameDesRegex') },
              {
                validator: async (_: any, value: any) => {
                  const cNameArr = comparedData.map((obj: any) => obj.cName);
                  if (cNameArr.includes(value)) {
                    throw new Error(
                      intl.get('dictManagement.errorMsg.exist', { content: intl.get('dictManagement.errorMsg.title') })
                    );
                  }
                }
              }
            ]}
          >
            <Input
              placeholder={intl.get('dictManagement.modalComponent.c_name_placeHold')}
              onChange={onCNameChanged}
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            name="create-edit-dict-modal-content-eName"
            label={intl.get('dictManagement.modalComponent.e_name_title')}
            initialValue={eName}
            rules={[
              { required: true, message: intl.get('dictManagement.errorMsg.empty') },
              { max: 50, message: intl.get('dictManagement.errorMsg.max', { len: 50 }) },
              { pattern: nameDesRegex, message: intl.get('dictManagement.errorMsg.nameDesRegex') },
              {
                validator: async (_: any, value: any) => {
                  const eNameArr = comparedData.map((obj: any) => obj.eName);
                  if (eNameArr.includes(value)) {
                    throw new Error(
                      intl.get('dictManagement.errorMsg.exist', { content: intl.get('dictManagement.errorMsg.title') })
                    );
                  }
                }
              }
            ]}
          >
            <Input
              placeholder={intl.get('dictManagement.modalComponent.e_name_placeHold')}
              onChange={onENameChanged}
              autoComplete="off"
            />
          </Form.Item>

          {dictModalType === DICT_MODAL_TYPE.DICT_TYPE && (
            <Form.Item
              name="create-edit-dict-modal-content-dictType"
              label={intl.get('dictManagement.modalComponent.type_title')}
              initialValue={dictType}
              rules={[
                { required: true, message: intl.get('dictManagement.errorMsg.empty') },
                { max: 50, message: intl.get('dictManagement.errorMsg.max', { len: 50 }) },
                { pattern: typeRegex, message: intl.get('dictManagement.errorMsg.typeRegex') },
                {
                  validator: async (_: any, value: any) => {
                    const dictTypeArr = comparedData.map((obj: any) => obj.dictType);
                    if (dictTypeArr.includes(value)) {
                      throw new Error(
                        intl.get('dictManagement.errorMsg.exist', {
                          content: intl.get('dictManagement.modalComponent.type_title')
                        })
                      );
                    }
                  }
                }
              ]}
            >
              <Input
                placeholder={intl.get('dictManagement.modalComponent.type_placeHold')}
                onChange={onTypeChanged}
                disabled={createOrEditDictInitData?.id !== undefined}
                autoComplete="off"
              />
            </Form.Item>
          )}

          {dictModalType === DICT_MODAL_TYPE.DICT_VALUE && (
            <Form.Item
              name="create-edit-dict-modal-content-itemValue"
              label={intl.get('dictManagement.modalComponent.value_title')}
              initialValue={itemValue}
              rules={[
                { required: true, message: intl.get('dictManagement.errorMsg.empty') },
                { max: 100, message: intl.get('dictManagement.errorMsg.max', { len: 100 }) },
                {
                  validator: async (_: any, value: any) => {
                    const itemValueArr = comparedData.map((obj: any) => obj.itemValue);
                    if (itemValueArr.includes(value)) {
                      throw new Error(
                        intl.get('dictManagement.errorMsg.exist', {
                          content: intl.get('dictManagement.modalComponent.value_title')
                        })
                      );
                    }
                  }
                }
              ]}
            >
              <Input
                placeholder={intl.get('dictManagement.modalComponent.value_placeHold')}
                onChange={onValueChanged}
                autoComplete="off"
              />
            </Form.Item>
          )}

          <Form.Item
            name="create-edit-dict-modal-content-describe"
            label={intl.get('dictManagement.modalComponent.describe_title')}
            initialValue={describe}
            rules={[
              { max: 255, message: intl.get('dictManagement.errorMsg.max', { len: 255 }) },
              { pattern: nameDesRegex, message: intl.get('dictManagement.errorMsg.nameDesRegex') }
            ]}
          >
            <TextArea rows={4} onChange={onDescChanged} />
          </Form.Item>
        </Form>
      </div>
    </UniversalModal>
  );
};

export default CreateOrEditDictModal;
