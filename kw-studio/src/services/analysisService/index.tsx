import apiService from '@/utils/axios-http/engineServer';
import { request } from '@/utils/axios-http/trialRequest';
import apiOldService from '@/utils/axios-http/oldIndex';

import { API } from '@/services/api';

import { message } from 'antd';

/**
 * 图分析服务列表
 * @param body
 */
const analysisServiceList = async (body: any) => await apiService.axiosGet(API.analysisServiceList, body);

/**
 * 创建图分析服务
 * @param body
 */
const analysisServiceCreate = async (body: any) =>
  await apiService.axiosPost(API.analysisServiceCreate, body, { isHideMessage: true });

/**
 * 获取指定图分析服务
 * @param body
 */
const analysisServiceGet = async (id: string | number, type?: string) => {
  if (type === 'ad') return await apiService.axiosGet(`${API.analysisServiceGet}/${id}`);
  return await apiService.axiosGet(`${API.analysisServiceGet}/${id}`);
};

/**
 * 编辑图分析服务
 * @param body
 */
const analysisServiceEdit = async (body: any) =>
  await apiService.axiosPost(`${API.analysisServiceGet}/${body.id}`, body, { isHideMessage: true });

/**
 * 删除图分析服务
 * @param body
 */
const analysisServiceDelete = async (body: any) =>
  await apiService.axiosPost(`${API.analysisServiceDelete}/${body.service_id}/delete-service`, body);

/**
 * 取消发布服务
 * @param body
 */
const analysisServiceCancel = async (body: any) =>
  await apiService.axiosPost(`${API.analysisServiceCancel}/${body.service_id}/cancel-service`, body);

/**
 * 图分析服务测试
 * @param body
 */
const analysisServiceTest = async (body: any) => {
  return await apiService.axiosPost(API.analysisServiceTest, body, { timeout: 600000 });
};

/**
 * 图分析导入
 */
const analysisServiceImport = async (body: any) => {
  return await apiOldService.axiosPost(API.importService, { type: 'file', ...body }, { isHideMessage: true });
};

/**
 * 导入后解析文件
 */
const analysisServiceInfo = async (body: any) => {
  return await apiService.axiosPost(API.serviceInfo, body);
};

/**
 * 图分析导出
 */
const analysisServiceExport = async (body: any) => {
  try {
    const result = await request({
      method: 'get',
      url: API.exportService(body?.id),
      params: {},
      config: {
        responseType: 'blob'
      }
    });

    if (result?.status !== 200) {
      const fileReader = new FileReader();
      fileReader.readAsText(result?.data);

      fileReader.onload = function (event) {
        const msg = JSON.parse(event?.target?.result as any);
        message.error(msg?.ErrorDetails?.[0]?.detail || msg?.result?.data?.ErrorDetails);
      };
      return false;
    }

    const link = document.createElement('a');
    link.href = URL.createObjectURL(result?.data);
    link.download = `${body?.name}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    return true;
  } catch (err) {
    //
  }
};

/**
 * 模板下载
 */
const analysisServiceDownload = async () => {
  const result = await request({
    method: 'get',
    url: API.analysisTemplate,
    params: {},
    config: {
      responseType: 'blob'
    }
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(result.data);
  link.download = '模板.zip';
  link.click();
  URL.revokeObjectURL(link.href);
};

const analysisService = {
  analysisServiceList,
  analysisServiceCreate,
  analysisServiceGet,
  analysisServiceEdit,
  analysisServiceDelete,
  analysisServiceCancel,
  analysisServiceTest,
  analysisServiceImport,
  analysisServiceExport,
  analysisServiceDownload,
  analysisServiceInfo
};

export default analysisService;
