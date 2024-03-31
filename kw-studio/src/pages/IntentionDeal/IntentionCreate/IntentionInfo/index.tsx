import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';

import _ from 'lodash';
import intl from 'react-intl-universal';
import Cookie from 'js-cookie';

import { API } from '@/services/api';
import { useHistory } from 'react-router-dom';
import { Input, Select, Upload, Button, message, Form } from 'antd';
import type { UploadProps } from 'antd';
import { UploadOutlined, PaperClipOutlined } from '@ant-design/icons';
import IconFont from '@/components/IconFont';

import intentionService from '@/services/intention';
import { kwCookie, getParam } from '@/utils/handleFunction';

import './style.less';
import { ONLY_KEYBOARD } from '@/enums';

const { TextArea } = Input;
const FormItem = Form.Item;
const NAME_REG = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
const IntentionInfo: React.ForwardRefRenderFunction<unknown, any> = (
  {
    editMes,
    setNameInput,
    setFileUpLoad,
    slotDes,
    setSlotDes,
    setIconShow,
    docContent,
    setDocContent,
    isUpload,
    docName,
    setDocName,
    setIsUpload,
    intentionList,
    iconShow,
    nameInput,
    fileRef
  },
  ref
) => {
  const history = useHistory();
  const [form] = Form.useForm();
  const [count, setCount] = useState(0);
  const [action, setAction] = useState(''); // 新建|编辑
  const [isShowName, setIsShowName] = useState(false);
  const [isShowDelete, setIsShowDelete] = useState(false); // 删除按钮
  const [isError, setIsError] = useState(false);

  useImperativeHandle(ref, () => ({
    onSave,
    onErrorTip
  }));

  useEffect(() => {
    const { action } = getParam(['action']);
    if (_.isEmpty(editMes)) return;
    if (action === 'edit') {
      const { intentpool_name, description, doc_name, id_uuid } = editMes;
      form.setFieldsValue({ name: intentpool_name, des: description, uid: id_uuid });
      setDocName(doc_name);
      setIsShowName(true);
      setCount(1);
    }
    setAction(action);
  }, [editMes]);

  const onErrorTip = (iconShow: any, nameInput: any) => {
    if (iconShow !== 'table') {
      setIsError(true);
    }
    if (nameInput) {
      form.setFields([{ name: 'name', errors: [intl.get('global.noNull')] }]);
    }
    message.error(intl.get('intention.configuration'));
  };

  /**
   * 保存
   */
  const onSave = async (type: any) => {
    if (
      nameInput &&
      nameInput.length <= 50 &&
      NAME_REG.test(nameInput) &&
      iconShow === 'table' &&
      slotDes.length < 150
    ) {
      return form.validateFields().then(async values => {
        const { des, name } = values;
        const { action } = getParam(['action']);

        const data: any = {
          intentpool_name: name
        };
        if (action === 'create') {
          data.doc_name = docName;
          data.doc_content = docContent.file?.response?.res?.doc_content;
          data.intent_entity_list = intentionList;
          if (des !== undefined) {
            data.description = des;
          }
        }
        if (action === 'edit') {
          data.intentpool_id = editMes?.intentpool_id;
          data.is_upload = isUpload;
          if (des !== undefined) {
            data.description = des;
          }
          if (isUpload) {
            data.doc_name = docName;
            data.doc_content = docContent.file?.response?.res?.doc_content;
            data.intent_entity_list = intentionList;
          }
        }
        try {
          const { res } = await (action === 'create'
            ? intentionService.addIntentPool(data)
            : intentionService.updateIntentPool(data));
          if (res) {
            if (type !== 'train') {
              message.success(intl.get('configSys.saveSuccess'));
              history.push('/model-factory/studio-intentionPool');
              return;
            }
            message.success(intl.get('intention.added'));
            return res;
          }
        } catch (err) {
          if (err?.ErrorCode === 'KnCognition.AlreadyExistsErr') {
            form.setFields([{ name: 'name', errors: [intl.get('global.repeatName')] }]);
            return;
          }
          err?.errorDetail && message.error(err?.errorDetail[0]);
        }
      });
    }
    message.error(intl.get('intention.configuration'));
  };

  /**
   * 下载模板
   */
  const onDownload = async () => {
    try {
      const response = await intentionService.downTemplate();
    } catch (err) {
      err?.ErrorDetails && message.error(err?.ErrorDetails[0].detail);
    }
  };

  const prop: UploadProps = {
    name: 'file',
    accept: '.yaml,.yml',
    action: API.uploadFile, // 上传的地址
    method: 'post',
    data: {},
    maxCount: 1,
    showUploadList: {
      showRemoveIcon: true,
      removeIcon: <IconFont type="icon-guanbiquxiao" />
    },
    beforeUpload(file: any, fileList: any) {
      if (file.size > 1024 * 1024 * 10) {
        message.error(intl.get('intention.support'));
        return false;
      }
    },
    onChange(info: any) {
      let infoMes: any = {};
      if (info.file) {
        infoMes = info;
        setCount(1);
      }
      if (info.file.status === 'error') {
        const errDetail = infoMes.file?.response?.ErrorDetails?.[0]?.detail;
        infoMes.file.response = errDetail;
      }
      let name = '';
      let fileType = '';
      switch (infoMes.file.status) {
        case 'uploading':
          setIconShow('upload');
          setFileUpLoad('');
          setIsShowName(false);
          setIsUpload(true);
          setIsError(false);
          break;
        case 'removed':
          setCount(0);
          setIconShow('empty');
          setIsShowName(false);
          setIsUpload(true);
          setIsError(false);
          break;
        case 'done':
          setIconShow('table');
          setFileUpLoad('done');
          setIsShowName(false);
          setDocContent(info);
          setDocName(info.file.name);
          setIsUpload(true);
          setIsError(false);
          break;
        case 'error':
          setIconShow('fail');
          setIsShowName(false);
          setFileUpLoad('');
          setIsUpload(true);
          setIsError(false);
          name = info.file.name.split('.');
          fileType = name[name.length - 1];
          if (!['yml', 'yaml'].includes(fileType)) {
            message.error(intl.get('intention.format'));
          }
          break;
        default:
          break;
      }
    }
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  /**
   * 名称变化
   */
  const onNameChange = (e: any) => {
    const { value } = e.target;
    if (value) {
      setNameInput(value);
      return;
    }
    setNameInput('');
  };

  /**
   * 描述变化
   */
  const onDesChange = (e: any) => {
    const { value } = e.target;
    const newValue = value.split('\n').join('').replace(/\s*/g, '');
    if (newValue) {
      setSlotDes(newValue);
      return;
    }
    setSlotDes(newValue);
  };

  return (
    <div className="intention-left-component">
      <div className="basic-mes kw-pb-2">{intl.get('intention.basic')}</div>
      <div className="kw-mt-5">
        <div>
          <Form form={form} layout="vertical" initialValues={{ model: 'DIET' }} labelCol={{ span: 8 }}>
            <FormItem
              name="name"
              label={<div className="input-name">{intl.get('intention.intentPoolName')}</div>}
              validateFirst={true}
              rules={[
                { required: true, message: intl.get('global.noNull') },
                { type: 'string', max: 50, message: intl.get('searchConfig.max50') },
                { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: intl.get('createEntity.onlyThreeType') }
              ]}
            >
              <Input autoComplete="off" placeholder={intl.get('intention.enterTwo')} onChange={onNameChange} />
            </FormItem>
            <FormItem
              name="des"
              label={<div className="input-name">{intl.get('intention.description')}</div>}
              validateFirst={true}
              rules={[
                { type: 'string', max: 255, message: intl.get('global.lenErr', { len: 255 }) },
                {
                  pattern: ONLY_KEYBOARD,
                  message: intl.get('global.onlyKeyboard')
                }
              ]}
            >
              <TextArea
                placeholder={intl.get('createEntity.inputDes')}
                className="text-area-des"
                showCount={false}
                onChange={onDesChange}
              />
            </FormItem>
            <div className="basic-mes kw-pb-2">{intl.get('intention.config')}</div>
            <FormItem name="model" label={<div className="kw-mt-4 input-name">{intl.get('intention.model')}</div>}>
              <Select disabled className="select-intention"></Select>
            </FormItem>
            <FormItem
              name="files"
              label={
                <div className="input-name">
                  {intl.get('intention.trainData')} {`(${count || 0}/1)`}
                </div>
              }
              getValueFromEvent={normFile}
              valuePropName="fileList"
            >
              <Upload {...prop}>
                <Button ref={fileRef} icon={<UploadOutlined />}>
                  {intl.get('intention.upload')}
                </Button>
              </Upload>
            </FormItem>
            {isError ? (
              <div style={{ color: 'red', marginTop: '-23px', marginBottom: '1px' }}>
                {intl.get('cognitiveService.neighbors.notNull')}
              </div>
            ) : null}
            {action === 'edit' && isShowName ? (
              <div
                className=" kw-mb-5 doc-name kw-pointer kw-flex"
                onMouseOver={() => setIsShowDelete(true)}
                onMouseLeave={() => setIsShowDelete(false)}
              >
                <PaperClipOutlined className="kw-mr-1" />
                <div className="kw-ellipsis edit-show" title={docName || '--'}>
                  <div>{docName || '--'}</div>
                </div>
                {isShowDelete ? (
                  <IconFont
                    type="icon-guanbiquxiao"
                    onClick={() => {
                      setIconShow('empty');
                      setIsShowName(false);
                      setCount(0);
                    }}
                  />
                ) : null}
              </div>
            ) : null}
          </Form>
        </div>

        <div>
          <div className="intention-tips">{intl.get('intention.tips')}：</div>
          <div className="document-box">
            <div className="document-box-tips">{intl.get('intention.format')}</div>
            <div className="document-box-tips">{intl.get('intention.support')}</div>
            <div className="document-box-tips">
              {intl.get('intention.clickLoad').split('|')[0]}
              <span className="kw-c-primary kw-pointer" onClick={() => onDownload()}>
                {intl.get('intention.clickLoad').split('|')[1]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default forwardRef(IntentionInfo);
