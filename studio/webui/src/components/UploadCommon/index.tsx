import React, { useState, useEffect, useMemo } from 'react';
import _ from 'lodash';
import { Button, Upload } from 'antd';

import HELPER from '@/utils/helper';
import { UPLOAD_FAIL_TYPE } from '@/enums';

const { OVER_MAX_FILES_COUNT, OVER_ALL_FILES_SIZE, OVER_SINGLE_FILE_SIZE } = UPLOAD_FAIL_TYPE;
const constructFileUid = (fileList: { name: string; size: number; lastModified: string }[]) => {
  const uid = _.reduce(
    fileList,
    (total, current) => {
      const { name = '', size = '', lastModified = '' } = current || {};
      return `${total},${name}-${size}-${lastModified}`;
    },
    ''
  );
  return uid;
};

/**
 * 上传组件
 * @param {Boolean} disabled - 是否禁用, 默认为: false
 * @param {String} accept - 上传文件类型
 * @param {Number} limitSize - 单个文件上传大小限制, 104857600, // 1024 * 1024 * 100 // 100M
 * @param {Number} limitSizeAll - 总文件上传大小限制 104857600, // 1024 * 1024 * 100 // 100M
 * @param {Boolean} multiple - 是否可以多选, 默认为: true
 * @param {Number} largestFileCount - 最大文件数量, 5
 * @param {Object} uploadDraggerStyle - 上传组件的style样式
 * @param {String} renderButton - 自定义上传文件按钮
 * @param {Object} uploadConfig - 自定义的antd组件Upload的其他配置参数
 * @param {Function} onCallBackFileChange - 选择文件变后的回调, return [{ uid:'', name:'', size:123, type:'' }]
 * @param {Function} onError - 报错返回，return [{ type:'', message:'' }]
 */
const UploadCommon = (props: any) => {
  const { value } = props;
  const {
    disabled,
    accept = '',
    limitSize = 1024 * 1024 * 1000, // 100M,
    limitSizeAll = 1024 * 1024 * 1000, // 100M,
    multiple = true,
    largestFileCount,
    uploadDraggerStyle = {},
    renderButton = null,
    uploadConfig = {},
    onCallBackFileChange,
    onError = () => {}
  } = props;

  const [pendingUploadFiles, setPendingUploadFiles] = useState<any>([]);
  const filesDependency = constructFileUid(pendingUploadFiles);

  useEffect(() => {
    if (value) setPendingUploadFiles(value || []);
  }, [value]);

  useEffect(() => {
    if (onCallBackFileChange) {
      onCallBackFileChange(pendingUploadFiles);
    }
  }, [filesDependency]);

  /**
   * 选中文件后只执行一次的处理函数
   */
  const onChangeExecuteOnce = _.debounce(fileList => {
    const _fileNames: any = {};
    const allFilesList = _.filter([...fileList, ...pendingUploadFiles], item => {
      if (_fileNames[item.name]) return false;
      _fileNames[item.name] = 'true';
      return item;
    });
    const currentFilesLength = fileList?.length + pendingUploadFiles?.length;
    const allFilesSize = _.reduce(allFilesList, (sum, n) => sum + (n?.size || 0), 0);

    const isOverMaxFilesCount = currentFilesLength > largestFileCount;
    const isOverAllFilesSize = allFilesSize > limitSizeAll;

    // 限制 上传输和总文件大小
    if (isOverMaxFilesCount && isOverAllFilesSize) {
      onError([
        {
          type: `${OVER_MAX_FILES_COUNT}-${OVER_ALL_FILES_SIZE}`,
          message: `上传文件不能超过${largestFileCount}个, 上传总文件不能超过${HELPER.formatFileSize(limitSizeAll)}`
        }
      ]);
      return false;
    }

    // 限制 上传文件个数
    if (isOverMaxFilesCount) {
      onError([{ type: OVER_MAX_FILES_COUNT, message: `上传文件不能超过${largestFileCount}个` }]);
      return false;
    }

    // 限制 上传总文件大小
    if (isOverAllFilesSize) {
      onError([{ type: OVER_ALL_FILES_SIZE, message: `上传总文件不能超过${HELPER.formatFileSize(limitSizeAll)}` }]);
      return false;
    }

    setPendingUploadFiles(allFilesList);
  }, 10);

  /**
   * 上传文件之前的钩子
   * @returns false
   */
  const beforeUpload = (file: any, fileList: any) => {
    // 限制 上传单个文件大小
    if (props.limitSize) {
      const isOverSingleFileSize = file.size > limitSize;
      if (isOverSingleFileSize) {
        onError([{ type: OVER_SINGLE_FILE_SIZE, message: `上传单个文件不能超过${HELPER.formatFileSize(limitSize)}` }]);
        return false;
      }
    }

    onChangeExecuteOnce(fileList);
    return false;
  };

  return (
    <Upload
      disabled={disabled}
      multiple={multiple}
      fileList={[]}
      accept={accept}
      beforeUpload={beforeUpload}
      customRequest={() => false}
      style={uploadDraggerStyle}
      {...uploadConfig}
    >
      {renderButton ? _.isFunction(renderButton) ? renderButton(value) : renderButton : <Button>上传文件</Button>}
    </Upload>
  );
};

export default UploadCommon;
