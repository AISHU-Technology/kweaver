import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Modal, Form, Input, Upload, message } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';
import { ONLY_KEYBOARD } from '@/enums';

import serviceModelLibrary from '@/services/modelLibrary';
import Tags from '@/components/Tags';
import TrimmedInput from '@/components/TrimmedInput';
import UniversalModal from '@/components/UniversalModal';

import { TYPE_CREATE, TYPE_OVER, TYPE_EDIT } from '../enums';
import CoverSelectModel from './CoverSelectModel';

import './style.less';

interface ImportModelType {
  modelData: any;
  visible: boolean;
  onOk: (type: string) => void;
  onCancel: () => void;
  onChangeModelData: (data: any) => void;
}

const ACCEPT = ['zip', 'tgz', 'tar'];
const fileSize1G = 1024 * 1024 * 1024;
const MODEL_TITLE: any = {
  [TYPE_CREATE]: intl.get('modelLibrary.importNewModel'),
  [TYPE_OVER]: intl.get('modelLibrary.importCoverModel'),
  [TYPE_EDIT]: intl.get('modelLibrary.editModels')
};

const ImportModel = (props: any) => {
  const { modelData } = props;
  const { onOk, onCancel, onChangeModelData } = props;
  const [form] = Form.useForm();

  const [fileName, setFileName] = useState(null);
  const [selectOption, setSelectOption] = useState([]);
  const [networkStatus, setNetworkStatus] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');

  const { type = TYPE_CREATE, data: updateData = {} } = modelData || {};
  const isCreate = type === TYPE_CREATE;
  const isEdit = type === TYPE_EDIT;
  const isCover = type === TYPE_OVER;

  useEffect(() => {
    const updateOnlineStatus = () => {
      const condition = navigator.onLine ? 'ONLINE' : 'OFFLINE';
      setNetworkStatus(condition || 'ONLINE');
    };
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // 获取标签待选项
  useEffect(() => {
    const getTags = async () => {
      try {
        const result = await serviceModelLibrary.modelGetTags();
        if (!result.res) return;
        setSelectOption(result.res?.tags || []);
      } catch (error) {}
    };
    getTags();
  }, []);

  /** 导入文件确定事件 */
  const onHandelOk = () => {
    form.validateFields().then(async (values: any) => {
      try {
        if (networkStatus === 'OFFLINE') {
          message.warning(intl.get('modelLibrary.unableToConnect'));
          return;
        }
        const { file, name, tags, description } = values || {};
        const file_suffix = file?.file?.name?.split('.').pop();
        const postData: any = { name, file_suffix };
        if (tags) postData.tags = tags;
        if (description) postData.description = description;
        if (isCreate || isCover) postData.size = file.file.size;
        if (isCover || isEdit) postData.model_id = Number(values.modelId) || updateData?.id;

        let result = null;
        if (isCreate || isCover) result = await serviceModelLibrary.modelInitMultiUpload(postData);
        if (isEdit) result = await serviceModelLibrary.modelUpdate(postData);

        if (!result?.res) return;
        if (isCreate || isCover) {
          // 从这里开始对象存贮上传
          const modelData = { ...postData, file: file.file, osData: result.res };
          onChangeModelData({ modelData });
        }
        onOk(type);
        if (isEdit) message.success(intl.get('global.editSuccess'));
      } catch (error) {
        const { type, response, data } = error;
        if (data?.ErrorCode === 'Builder.ModelManagement.OsInitMultiUpload.ModelNameExist') {
          form.setFields([{ name: 'name', errors: [intl.get('global.repeatName') || ''] }]);
          return;
        }
        if (type === 'message') return message.error(response?.Description || '');
        message.error(data?.Description);
      }
    });
  };

  return (
    <UniversalModal
      open={true}
      width={480}
      zIndex={9999}
      title={MODEL_TITLE[type]}
      wrapClassName="importModelRoot"
      maskClosable={false}
      okText={intl.get('global.ok')}
      cancelText={intl.get('global.cancel')}
      onOk={onHandelOk}
      onCancel={onCancel}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        { label: intl.get('global.ok'), type: 'primary', onHandle: onHandelOk }
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ tags: updateData.tags || [], name: updateData?.name, description: updateData?.description }}
      >
        {isCover && (
          <Form.Item
            name="modelId"
            label={intl.get('modelLibrary.selectModel')}
            rules={[{ required: true, message: intl.get('modelLibrary.pleaseSelectModel') }]}
          >
            <CoverSelectModel form={form} />
          </Form.Item>
        )}
        <Form.Item
          name="name"
          hidden={isCover}
          label={intl.get('modelLibrary.modelName')}
          rules={[
            { required: true, message: intl.get('global.noNull') },
            { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
            { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') }
          ]}
        >
          <TrimmedInput allowClear autoComplete="off" placeholder={intl.get('modelLibrary.pleaseEnterModelName')} />
        </Form.Item>

        {(isCreate || isCover) && (
          <Form.Item
            name="file"
            label={intl.get('modelLibrary.uploadModelFile')}
            rules={[
              { required: true, message: intl.get('modelLibrary.pleaseSelectFile') },
              {
                validator: async (rule, value) => {
                  if (!value) return;
                  const type = value?.file?.name?.split('.').pop() || '';
                  if (value?.file?.size > fileSize1G * 2) {
                    return Promise.reject([intl.get('modelLibrary.fileLimit')]);
                  }
                  if (!_.includes(ACCEPT, type)) {
                    return Promise.reject([intl.get('modelLibrary.fileTypeError')]);
                  }
                }
              }
            ]}
          >
            <Upload
              accept="application/zip,application/x-compressed,application/x-gtar,application/x-tar"
              className="importInput"
              fileList={[]}
              beforeUpload={(file: any) => {
                setFileName(file?.name);
                return false;
              }}
            >
              <Input
                value={fileName || ''}
                autoComplete="off"
                className="uploadInput"
                prefix={<FolderOpenOutlined style={{ color: '#d9d9d9' }} />}
                placeholder={intl.get('modelLibrary.pleaseSelectFile')}
              />
              <div onClick={(e: any) => e.stopPropagation()}>
                <p className="uploadInputRemark kw-pt-4">{intl.get('modelLibrary.fileFormatRequires')}</p>
                <p className="uploadInputRemark">{intl.get('modelLibrary.limitFile')}</p>
              </div>
            </Upload>
          </Form.Item>
        )}
        <Form.Item name="tags" label={intl.get('modelLibrary.tag')}>
          <Tags onChange={() => {}} value={[]} selectOption={selectOption} />
        </Form.Item>
        <Form.Item
          name="description"
          label={intl.get('modelLibrary.description')}
          validateFirst={true}
          rules={[
            { type: 'string' },
            { max: 255, message: intl.get('modelLibrary.max150', { length: 255 }) },
            {
              pattern: /^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\s]+$/,
              message: intl.get('workflow.basic.desConsists')
            }
          ]}
        >
          <Input.TextArea rows={3} autoComplete="off" />
        </Form.Item>
      </Form>
    </UniversalModal>
  );
};

export default (props: ImportModelType) => {
  if (!props.visible) return null;
  return <ImportModel {...props} />;
};
