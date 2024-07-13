import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Button, Tooltip, Form, Upload, Input } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import UniversalModal from '@/components/UniversalModal';
import { getParam } from '@/utils/handleFunction';
import analysisService from '@/services/analysisService';
import { useHistory } from 'react-router-dom';

import './style.less';

type ImportModalContentType = {
  onHandleCancel: () => void;
  // knData: KnwItem;
  onSetIsImporting: (e: boolean) => void;
};

const ImportModalContent = forwardRef((props: ImportModalContentType, ref) => {
  const { onHandleCancel, onSetIsImporting: setIsImporting } = props;
  const history = useHistory();
  const [form] = Form.useForm();
  const [fileData, setFileData] = useState<any>([]); // 上传的文件
  // const [isImporting, setIsImporting] = useState(false); // 导入操作(控制按钮样式及文字)
  const [isShow, setIsShow] = useState(false);

  useImperativeHandle(ref, () => ({
    onImport
  }));

  /**
   * 下载模板
   */
  const download = async () => {
    await analysisService.analysisServiceDownload();
  };
  const beforeUpload = (file: Blob, fileList: any) => {
    setFileData(fileList);
  };

  /**
   * 导入
   */
  const onImport = async () => {
    form.validateFields().then(async () => {
      setIsImporting(true);
      try {
        const { id } = getParam(['id']);
        const { res, ErrorDetails } = await analysisService.analysisServiceImport({
          knw_id: parseInt(id),
          file: fileData
        });
        if (res) {
          setIsImporting(false);
          onHandleCancel();
          history.push(`/cognitive/config?action=import&config_id=${res}`);
        }
        if (ErrorDetails) {
          setIsImporting(false);
          form.setFields([{ name: 'file', errors: [intl.get('analysisService.importService.incorrect')] }]);
        }
      } catch (err) {
        //
      }
    });
  };

  /**
   * 删除文件
   */
  const onDeleteFile = () => {
    form.setFieldsValue({ file: [] });
    form.validateFields(['file']);
    setFileData([]);
  };

  const onMouseOver = () => {
    setIsShow(true);
  };

  return (
    <div className="import-modal-content">
      <div className="import-file">
        <Form form={form} layout={'vertical'}>
          <Form.Item
            name="file"
            label={intl.get('analysisService.importService.pleaseSelectFile')}
            rules={[
              {
                validator: async (rule: any, value: any) => {
                  if (_.isEmpty(value?.file)) {
                    throw new Error(intl.get('analysisService.importService.pleaseSelect'));
                  }
                  if (value?.file.size > 1024 * 1024 * 10) {
                    throw new Error(intl.get('analysisService.importService.onlyOne'));
                  }
                  if (value?.file.type !== 'application/json') {
                    throw new Error(intl.get('analysisService.importService.notJson'));
                  }
                  Promise.resolve();
                }
              }
            ]}
          >
            <Upload
              fileList={[]}
              accept=".json"
              multiple={false}
              customRequest={() => false}
              beforeUpload={beforeUpload}
            >
              <Input
                onMouseOver={onMouseOver}
                onMouseLeave={() => setIsShow(false)}
                prefix={<FolderOpenOutlined style={{ opacity: '0.45', color: 'rgba(0,0,0,0.65)' }} />}
                value={fileData?.[0]?.name}
                placeholder={intl.get('analysisService.importService.pleaseUpload')}
                className="file-input"
              />
            </Upload>
          </Form.Item>
        </Form>

        {_.isEmpty(fileData) ? null : (
          <div
            onMouseOver={onMouseOver}
            onMouseLeave={() => setIsShow(false)}
            className={classNames('close-icon kw-pointer', { show: isShow })}
            onClick={onDeleteFile}
          >
            <IconFont type="icon-shibai" style={{ fontSize: 12, paddingTop: 5, opacity: '0.45' }} />
          </div>
        )}

        <div className="importWords-extraBox">
          <div className="fileExtra kw-flex">
            <div className="tip-point">•</div>{' '}
            <div className="kw-ml-1">{intl.get('analysisService.importService.require')}</div>
          </div>
          <div className="fileExtra kw-flex kw-mt-2">
            <div className="tip-point">•</div>
            <div className="kw-ml-1">{intl.get('analysisService.importService.onlyOne')}</div>
          </div>
          <div className="kw-flex fileExtra kw-mt-2">
            <div className="tip-point">•</div>
            <span className="down-style kw-ml-1">
              {intl.get('analysisService.importService.download').split('|')[0]}
              <span className="kw-c-primary kw-pointer" onClick={() => download()}>
                {intl.get('analysisService.importService.download').split('|')[1]}
              </span>
            </span>
          </div>
        </div>
      </div>
      {/* <UniversalModal.Footer
        source={
          <>
            <Button onClick={onHandleCancel}>{intl.get('analysisService.importService.cancel')}</Button>
            <Button type="primary" disabled={isImporting} onClick={onImport}>
              {isImporting
                ? intl.get('analysisService.importService.opening')
                : intl.get('analysisService.importService.import')}
            </Button>
          </>
        }
      /> */}
    </div>
  );
});

const ImportModal = (props: any) => {
  const { visible, onHandleCancel } = props;
  const [isImporting, setIsImporting] = useState(false); // 导入操作(控制按钮样式及文字)
  const ImportModalContentRef = useRef(null);

  const titleContent = () => {
    return (
      <div className="kw-flex title-tips">
        <Format.Title className="kw-mr-1">{intl.get('analysisService.importService.importService')}</Format.Title>
        <Tooltip title={intl.get('analysisService.importService.intoCreate')}>
          <IconFont type="icon-wenhao" style={{ opacity: '0.45' }} />
        </Tooltip>
      </div>
    );
  };
  return (
    <UniversalModal
      onCancel={onHandleCancel}
      className="analysis-import-modal-root"
      open={visible}
      width={480}
      footerData={
        <>
          <Button onClick={onHandleCancel}>{intl.get('analysisService.importService.cancel')}</Button>
          <Button
            type="primary"
            disabled={isImporting}
            onClick={() => (ImportModalContentRef.current as any).onImport()}
          >
            {isImporting
              ? intl.get('analysisService.importService.opening')
              : intl.get('analysisService.importService.import')}
          </Button>
        </>
      }
      destroyOnClose={true}
      maskClosable={false}
      title={titleContent()}
    >
      <ImportModalContent
        ref={ImportModalContentRef}
        onHandleCancel={onHandleCancel}
        onSetIsImporting={setIsImporting}
      />
    </UniversalModal>
  );
};

export default ImportModal;
