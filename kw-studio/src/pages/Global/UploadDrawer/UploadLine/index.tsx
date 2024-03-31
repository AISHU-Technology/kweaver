import React, { useRef, useState, useEffect } from 'react';
import _ from 'lodash';
import axios from 'axios';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Button, Tooltip, message } from 'antd';
import { FileZipOutlined, CheckCircleFilled } from '@ant-design/icons';

import HELPER from '@/utils/helper';
import { PERMISSION_KEYS, PERMISSION_CODES } from '@/enums';
import { PENDING, UPLOADING, SUCCESS, FAIL } from '@/reduxConfig/reducers/uploadFile';
import IconFont from '@/components/IconFont';
import servicesPermission from '@/services/rbacPermission';
import serviceModelLibrary, {
  ModelUploadPartType,
  ModelEndUploadType,
  ModelCompletePartType
} from '@/services/modelLibrary';

import ControllerUploadFile, { fileSize1M, fileSize1G } from '../ControllerUploadFile';

import { FileType } from '../index';

import './style.less';

interface UploadLineType {
  source: any;
  uploadStatus: string;
  networkStatus: 'ONLINE' | 'OFFLINE';
  onCancel: (fileId: string) => void;
  onChangeFileStatus: (fileId: string, status: string) => void;
  onTriggerDrawerSize: (flag: boolean) => void;
  onChangeUploadStatus: (data: { status: string }) => void;
}

const STATUS: any = {
  pending: { label: 'modelLibrary.uploading', icon: '', operation: '', tip: '' },
  uploading: {
    label: 'modelLibrary.uploading',
    icon: '',
    operation: 'icon-guanbiquxiao',
    tip: 'modelLibrary.cancel'
  },
  success: { label: '', icon: <CheckCircleFilled style={{ color: '#52C41A' }} />, operation: '', tip: '' },
  fail: {
    label: 'modelLibrary.importFailed',
    icon: '',
    operation: 'icon-tongyishuaxin',
    tip: 'modelLibrary.reImport'
  }
};

const UploadLine = (props: UploadLineType) => {
  const { source, uploadStatus, networkStatus } = props;
  const { onCancel, onChangeFileStatus, onTriggerDrawerSize, onChangeUploadStatus } = props;
  const partInfos = useRef<any>({});
  const cancelList = useRef<any>({});
  const uploadController = useRef<any>(null);
  const { status: fileStatus = 'uploading' } = source?.file || {};
  const { label = '', icon = '', operation = '', tip = '' } = STATUS?.[fileStatus] || {};

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    initUploadFile(source.file);
    return () => {
      if (!uploadController.current) return;
      // 取消继续上传
      uploadController.current.cancel = true;
      onHandelCancel();
    };
  }, []);
  useEffect(() => {
    if (networkStatus === 'OFFLINE' && uploadController.current) {
      uploadController.current.cancel = true;
      onChangeUploadStatus({ status: FAIL });
      onHandelCancel();
      if (source?.file?.uid && fileStatus === 'uploading') {
        onChangeFileStatus(source?.file?.uid, 'fail');
      }
    }
  }, [networkStatus]);

  /** 取消请求 */
  const onHandelCancel = () => {
    if (_.isEmpty(cancelList.current)) return;
    _.forEach(_.entries(cancelList.current), ([key, cancel]: any) => {
      cancel(intl.get('modelLibrary.cancelRequest'));
      delete cancelList.current[key];
    });
  };

  /** 初始化文件上传管理器 */
  const initUploadFile = (file: FileType) => {
    uploadController.current = new ControllerUploadFile({
      file,
      limitSize: fileSize1G * 2,
      chunkSize: fileSize1M * 20,
      fetch: async (fileData: any) => {
        return new Promise((resolve, reject) => {
          if (uploadStatus !== UPLOADING) onChangeUploadStatus({ status: UPLOADING });

          const postData: ModelUploadPartType = {
            parts: fileData?.key,
            // knw_id: source?.knw_id,
            key: source?.osData?.key,
            upload_id: source?.osData?.upload_id
          };
          if (source?.model_id) {
            postData.model_id = source?.model_id;
            // 判断权限
            const postDataPermission = { dataType: PERMISSION_KEYS.TYPE_MODEL, dataIds: [String(source.model_id)] };
            // servicesPermission.dataPermission(postDataPermission).then(result => {
            //   const codes = result?.res?.[0]?.codes || [];
            //   const hasEdit = HELPER.getAuthorByUserInfo({
            //     roleType: PERMISSION_CODES.ADF_KN_MODEL_EDIT,
            //     userType: PERMISSION_KEYS.MODEL_EDIT,
            //     userTypeDepend: codes
            //   });
            //   if (!hasEdit) {
            //     uploadController.current.cancel = true;
            //     onChangeUploadStatus({ status: FAIL });
            //     onHandelCancel();
            //     if (source?.file?.uid) {
            //       onChangeFileStatus(source?.file?.uid, 'fail');
            //     }
            //   }
            // });
            uploadController.current.cancel = true;
            onChangeUploadStatus({ status: FAIL });
            onHandelCancel();
            if (source?.file?.uid) {
              onChangeFileStatus(source?.file?.uid, 'fail');
            }
          }
          try {
            // 获取需要上传的oss的url、method、header
            serviceModelLibrary
              .modelUploadPart(postData)
              .then((result: any) => {
                const osData = result?.res?.authrequests?.[fileData?.key];
                if (!osData) return reject('fail');
                const { url, method, headers } = osData || {};
                const reader = new FileReader();
                reader.readAsArrayBuffer(fileData.file);
                reader.onload = async (e: Event) => {
                  const bytes = (e.target as any).result;
                  // 上传到 oss
                  axios({
                    url,
                    method,
                    headers,
                    data: bytes,
                    cancelToken: new axios.CancelToken(cancel => {
                      cancelList.current[JSON.stringify(url)] = cancel;
                    })
                  }).then((data: any) => {
                    resolve('success');
                    const etag = data?.headers.etag.replace(/"/g, '');
                    partInfos.current[fileData?.key] = etag;
                  });
                };
              })
              .catch(error => {
                reject(error);
              });
          } catch (error) {
            reject(error);
          }
        });
      },
      onFail: () => {
        onChangeFileStatus(file.uid, 'fail');
        onChangeUploadStatus({ status: FAIL });
      },
      onSuccess: async () => {
        try {
          /** 上传完成创建模型 */
          const postDataComplete: ModelCompletePartType = {
            // knw_id: source?.knw_id,
            key: source?.osData?.key,
            part_infos: partInfos.current,
            upload_id: source?.osData?.upload_id
          };
          if (source?.model_id) postDataComplete.model_id = source?.model_id;
          // 获取oss上传完成的 url, method, body, headers
          const resultComplete: any = await serviceModelLibrary.modelCompletePart(postDataComplete);
          const { url, method, request_body = {}, headers } = resultComplete?.res || {};
          if (url && method && headers) {
            const config: any = { url, method, headers };
            if (method.toUpperCase === 'GET') config.params = request_body;
            if (method.toUpperCase !== 'GET') config.data = request_body;
            // 调用oss上传完成接口
            await axios(config);
          }
          /** 上传结束 */
          const postDataEnd: ModelEndUploadType = {
            name: source.name,
            size: source.file.size,
            key: source?.osData?.key,
            // knw_id: source?.knw_id,
            file_suffix: source?.file_suffix
          };
          if (source?.tags) postDataEnd.tags = source?.tags;
          if (source?.model_id) postDataEnd.model_id = source?.model_id;
          if (source?.description) postDataEnd.description = source?.description;
          await serviceModelLibrary.modelEndUpload(postDataEnd);
          // 弹窗最小化
          onTriggerDrawerSize(true);

          onChangeFileStatus(file.uid, 'success');
          onChangeUploadStatus({ status: SUCCESS });
        } catch (error) {
          const { type, response, data } = error;
          if (type === 'message') return message.error(response?.Description || '');
          message.error(data?.Description);
          onChangeFileStatus(file.uid, 'fail');
          onChangeUploadStatus({ status: FAIL });
        }
      },
      onProgress: (progress: number) => {
        setProgress(progress);
      }
    });
    onChangeFileStatus(file.uid, 'uploading');
    onChangeUploadStatus({ status: PENDING });
    uploadController.current.onEmit();
  };

  const disabled = fileStatus === 'fail' && uploadStatus === UPLOADING;

  return (
    <div className="uploadLineRoot">
      <div
        className={classnames('progress', { isShow: fileStatus === 'uploading' })}
        style={{ width: `${progress}%` }}
      />
      <div className={classnames('progressBack', { isShow: fileStatus === 'uploading' })} />
      <div className="kw-align-center">
        <IconFont className="kw-mr-2" type="icon-yasuo" style={{ fontSize: 24 }} />
        <Tooltip title={source.file?.name}>
          <div className="kw-ellipsis" style={{ maxWidth: 296 }}>
            {source.file?.name}
          </div>
        </Tooltip>
      </div>
      <div className="info">
        <div style={{ width: 100, textAlign: 'center' }}>{HELPER.formatFileSize(source?.file?.size)}</div>
        <div style={{ width: 100, textAlign: 'center' }}>
          {fileStatus === 'uploading' ? `${progress}%` : icon || intl.get(label)}
        </div>
        <div style={{ width: 50, textAlign: 'center' }}>
          {operation && (
            <Tooltip title={intl.get(tip) || ''}>
              <Button
                type="link"
                style={{ margin: 0, padding: 0, minWidth: 0, ...(disabled ? {} : { color: '#000' }) }}
                disabled={disabled}
                onClick={() => {
                  if (fileStatus === 'fail') {
                    onChangeFileStatus(source.file.uid, 'uploading');
                    onChangeUploadStatus({ status: PENDING });
                    uploadController.current.onReUpload();
                  } else {
                    onCancel(source.file.uid);
                  }
                }}
              >
                <IconFont type={operation} />
              </Button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadLine;
