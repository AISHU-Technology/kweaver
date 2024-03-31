import _ from 'lodash';
import intl from 'react-intl-universal';
import React, { useEffect, useState } from 'react';
import { Modal, Form, message, Button } from 'antd';

import { UPLOAD_FAIL_TYPE } from '@/enums';
import serverKnowledgeNetwork from '@/services/knowledgeNetwork';
import servicesCreateEntity from '@/services/createEntity';
import apiService from '@/utils/axios-http/oldIndex';

import UploadCommon from '@/components/UploadCommon';
import UniversalModal from '@/components/UniversalModal';

import './index.less';

import FileSelResult from './FileSelResult';
import Format from '@/components/Format';

const layout = { labelCol: { span: 24 }, wrapperCol: { span: 24 } };

const { OVER_MAX_FILES_COUNT, OVER_ALL_FILES_SIZE } = UPLOAD_FAIL_TYPE;
const UPLOAD_ERROR = {
  [OVER_MAX_FILES_COUNT]: intl.get('knowledge.fileCountMessage'),
  [OVER_ALL_FILES_SIZE]: intl.get('knowledge.allLimitMessage'),
  [`${OVER_MAX_FILES_COUNT}-${OVER_ALL_FILES_SIZE}`]: intl.get('knowledge.allLimitMessage')
};
const TEMPLATE_TYPE = {
  XLSX: 'xlsx',
  JSON: 'json'
};

// 取消请求
const cancelRequest = () => {
  Object.keys(apiService.sources).forEach(key => {
    if (key.includes('/onto/import_task')) {
      (apiService.sources as any)[key]('取消请求');
    }
  });
};

/**
 * 导入弹窗
 */
const ModalOntoImport = (props: any) => {
  const [form] = Form.useForm();
  const [openText, setOpenText] = useState(intl.get('ontoLib.newOpenBtn'));
  const { isVisible, isVisibleModalFeedback } = props;
  const { onOk, onClose, closeModalFeedback, knw_id } = props;

  useEffect(() => {
    if (!isVisibleModalFeedback) form.resetFields(['file']);
  }, [isVisibleModalFeedback]);

  /**
   * 上传，选中文件后回调
   */
  const onCallBackFileChange = (value: Blob) => {
    form.setFieldsValue({ file: value });
  };

  /**
   * 上传，选中文件后的报错信息
   */
  const onError = _.debounce(errorList => {
    if (_.isEmpty(errorList)) return null;
    _.forEach(errorList, item => {
      const { type } = item;
      // return message.warning(UPLOAD_ERROR[type] || item.message);
      return message.warning({
        content: UPLOAD_ERROR[type] || item.message,
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
    });
  }, 300);

  /**
   * 删除一个选中的文件
   */
  const onDeleteFile = (uid: string) => {
    const file = form.getFieldValue('file');
    const newFile = _.filter(file, item => item.uid !== uid);
    form.setFieldsValue({ file: newFile });
  };

  const queryTaskStatus = async (taskId: string) => {
    const data = {
      celery_task_id: taskId,
      knw_id
    };
    const { res } = await servicesCreateEntity.getEntityImportStatus(data);
    if (res.task_status === 'running') {
      queryTaskStatus(taskId);
      setOpenText(intl.get('ontoLib.isOpening'));
    } else {
      closeModalFeedback(res);
      setOpenText(intl.get('ontoLib.newOpenBtn'));
    }
  };
  /**
   * 提交导入数据
   */
  const onSubmit = () => {
    form
      .validateFields()
      .then(async values => {
        setOpenText(intl.get('ontoLib.isOpening'));
        const { file } = values;
        servicesCreateEntity
          .importEntity({ file: file[0], knw: knw_id })
          .then(result => {
            if (result.res) {
              queryTaskStatus(result.res);
            }
          })
          .catch(error => {
            setOpenText(intl.get('ontoLib.newOpenBtn'));
          });
      })
      .catch(errorInfo => {
        const errorField = errorInfo?.errorFields?.[0]?.name?.[0];
        if (errorField) form.scrollToField(errorField);
      });
  };

  const onCancel = () => {
    onClose();
  };

  const onDownLoadTemplate = async (type: string) => {
    switch (type) {
      case TEMPLATE_TYPE.XLSX: {
        const res = await servicesCreateEntity.downloadEntityTemplateXlsx({ format: type });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(res.data);
        link.download = `${intl.get('ontoLib.SampleFile')}.${type}`;
        link.click();
        URL.revokeObjectURL(link.href);
        break;
      }
      case TEMPLATE_TYPE.JSON: {
        // 下载zip
        const res = await servicesCreateEntity.downloadEntityTemplateXlsx({ format: type });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(res.data);
        link.download = `${intl.get('ontoLib.SampleFile')}.zip`;
        link.click();
        URL.revokeObjectURL(link.href);
        break;
        // // 下载json文件
        // const res = await servicesCreateEntity.downloadEntityTemplateJson({ format: type });
        // const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
        // const hideElement = document.createElement('a');
        // hideElement.href = URL.createObjectURL(blob);
        // hideElement.download = `${intl.get('ontoLib.SampleFile')}.${type}`;
        // hideElement.style.display = 'none';
        // document.body.appendChild(hideElement);
        // hideElement.click();
        // break;
      }
      default:
        break;
    }
  };

  const okTextRender = <div>{openText}</div>;

  return (
    <UniversalModal
      visible={isVisible}
      width={480}
      keyboard={false}
      forceRender={true}
      maskClosable={false}
      wrapClassName="modalOntoImportRoot"
      title={intl.get('ontoLib.importOnto')}
      onOk={onSubmit}
      okText={okTextRender}
      okButtonProps={{ disabled: openText === intl.get('ontoLib.isOpening') }}
      cancelText={intl.get('ontoLib.canvasEdge.cancelDelete')}
      onCancel={onCancel}
      afterClose={() => {
        form.resetFields();
        setOpenText(intl.get('ontoLib.newOpenBtn'));
        cancelRequest();
      }}
      footerData={[
        {
          label: intl.get('ontoLib.canvasEdge.cancelDelete'),
          onHandle: onCancel,
          disabled: openText === intl.get('ontoLib.isOpening')
        },
        { label: openText, type: 'primary', onHandle: onSubmit }
      ]}
    >
      <div className="formContainer">
        <div style={{ minHeight: 60 }}>
          <Form {...layout} form={form} name="importForm" requiredMark={false} initialValues={{ method: '1' }}>
            <Form.Item
              label={''}
              name="file"
              rules={[{ required: true, message: intl.get('ontoLib.importPlaceHold') }]}
            >
              <UploadCommon
                className="kw-w-100"
                accept="application/json,.xlsx,.xls"
                largestFileCount={1}
                multiple={false}
                limitSizeAll={1024 * 1024 * 10}
                renderButton={(value: { uid: string; name: string }[]) => (
                  <FileSelResult value={value} onDeleteFile={onDeleteFile} />
                )}
                onError={onError}
                onCallBackFileChange={onCallBackFileChange}
              />
            </Form.Item>
          </Form>
        </div>

        <div className="extraBox">
          {/* <div className="fileExtra-tips kw-mb-1">*/}
          {/*  <Format.Title>{intl.get('ontoLib.importTips')}</Format.Title>*/}
          {/* </div>*/}
          <div className="fileExtra kw-mb-1">{intl.get('ontoLib.importFileTypeLimit')}</div>
          <div className="fileExtra kw-mb-1">{intl.get('ontoLib.importFileNumSizeLimit')}</div>
          <div className="fileExtra kw-mb-1">
            {intl.get('ontoLib.importSampleFile').split('|')[0]}
            <span className="create-span" onClick={() => onDownLoadTemplate('xlsx')}>
              {intl.get('ontoLib.importSampleFile').split('|')[1]}
            </span>
            <span className="create-span" onClick={() => onDownLoadTemplate('json')}>
              {intl.get('ontoLib.importSampleFile').split('|')[2]}
            </span>
          </div>
        </div>
      </div>
    </UniversalModal>
  );
};

export default ModalOntoImport;
