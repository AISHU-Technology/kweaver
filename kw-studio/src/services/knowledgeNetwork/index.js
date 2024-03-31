/**
 * @description 知识网络接口
 * @author Haiyan
 * @date 2022/03/18
 */
import React from 'react';
import { Modal, message } from 'antd';
import intl from 'react-intl-universal';
import { ExclamationCircleFilled } from '@ant-design/icons';

import { API } from '@/services/api';
import apiService from '@/utils/axios-http/oldIndex';

/**
 * @description 根据名称搜索知识网络列表
 */
const knowledgeNetGet = async data => await apiService.axiosGetData(API.knowledgeNetGet, data);

/**
 * @description 获取知识网络列表
 */
const knowledgeNetGetByName = async data => await apiService.axiosGetData(API.knowledgeNetGetByName, data);

/**
 * @description 新建知识网络
 */
const knowledgeNetCreate = async data => await apiService.axiosPost(API.knowledgeNetCreate, data);

/**
 * @description 编辑知识网络
 */
const knowledgeNetEdit = async data => await apiService.axiosPost(API.knowledgeNetEdit, data);

/**
 * @description 删除知识网络
 */
const knowledgeNetDelete = async knw_id => await apiService.axiosPost(API.knowledgeNetDelete, { knw_id });

/**
 * @description 根据知识网络id获取其下面的知识图谱
 */
const graphGetByKnw = async data => {
  const getData = {
    filter: 'all', // 修改筛选规则
    ...data
  };
  return await apiService.axiosGetData(API.graphGetByKnw, getData);
};

/**
 * @description 知识网络导出接口
 */
const ERROR_OBJECT_OUTPUT = {
  'Builder.controller.graph_controller.check_config_id.config_not_exists': {
    type: 'message',
    text: '操作失败，该知识图谱已被删除!'
  },
  'Builder.controller.graph_config.ids_length.too_much_id': { type: 'message', text: '传入id数目超过1' },
  'Builder.controller.graph_config.get_otlDsList.not_permission': {
    type: 'modal',
    text: intl.get('knowledge.notHavePermission')
  },
  'Builder.controller.graph_config.task_status.task_running': {
    type: 'message',
    text: '操作失败，该知识图谱状态无法支持导出，请检查后重试!'
  }
};
const graphOutput = async (data, fileName) => {
  try {
    const result = await apiService.axiosPost(API.graphOutput, data, { responseType: 'blob' });
    if (!result) return false;
    return new Promise(resolve => {
      const fileReader = new FileReader();
      if (result.type === 'application/json') {
        fileReader.onloadend = () => {
          const jsonData = JSON.parse(fileReader.result);
          const errorObject = ERROR_OBJECT_OUTPUT?.[jsonData.ErrorCode] || {};
          if (JSON.stringify(errorObject) === '{}') {
            resolve({ isSuccess: true });
            const csvType =
              '.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel';
            const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: csvType });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `${fileName}.json`;
            link.style.display = 'none';
            link.href = url;
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(link.href);
            document.body.removeChild(link);
          } else if (errorObject?.type === 'modal') {
            Modal.error({
              title: intl.get('knowledge.tips'),
              icon: <ExclamationCircleFilled />, // eslint-disable-line
              content: errorObject?.text || jsonData.ErrorCode,
              onOk: () => {
                resolve({ isSuccess: false });
              }
            });
          } else {
            if (errorObject?.text) message.error(errorObject?.text);
            resolve({ isSuccess: false });
          }
        };
        fileReader.readAsText(result);
      } else {
        resolve({ isSuccess: true });
        const csvType =
          '.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel';
        const blob = new Blob([result], { type: csvType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${fileName}.txt`;
        link.style.display = 'none';
        link.href = url;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(link.href);
        document.body.removeChild(link);
      }
    });
  } catch (e) {
    return false;
  }
};

/**
 * @description 知识网络导入接口
 */
const ERROR_OBJECT_INPUT = {
  'Builder.controller.graph_config.getuuid.uuidNotFound': '在头部未发现uuid',
  'Builder.controller.graph_config.check_knw.knw_not_exists': '知识网络id不存在',
  'Builder.controller.graph_config.check_graph_db.graph_db_not_exists': '选择的graph_db不存在',
  'Builder.controller.graph_config.get_file.unexpect_error': '导入文件不存在',
  'Builder.controller.graph_service.save_ontology.AddResourceError': '权限增加本体资源失败',
  'Builder.controller.graph_service.save_graph.AddResourceError': '权限增加图谱资源失败',
  'Builder.controller.graph_service.save_ontology.AddPermissionError': '权限增加本体权限失败',
  'Builder.controller.graph_service.save_graph.AddPermissionError': '权限增加图谱权限失败',
  'Builder.controller.graph_service.load_data_error.not_json_structed': '非json结构数据',
  'Builder.controller.graph_service.get_running_task.task_running': '运行中的图谱不能执行覆盖操作',
  'Builder.controller.graph_config_input.InsufficientCapacity': '操作失败，当前知识量容量已达上限',
  'Builder.controller.graph_service.get_value_error.key_not_in_ds_map': '数据源映射缺失部分内容',
  'Builder.controller.graph_service.no_permission.can_not_input_to_knw': '没有对知识网络的KN_ADD_KG权限',
  'Builder.controller.graph_service.no_permission.can_not_use_data_source': '没有对数据源的使用权限',
  'Builder.controller.graph_service.get_value_error.missing_ds_id_map': '缺少数据源映射信息',
  'Builder.controller.graph_service.get_value_error.json_info_error': 'json文件中内容错误'
};

const INPUT_ERROR = [
  'Builder.controller.graph_service.graph_input.versionNotFound',
  'Builder.controller.graph_service.graph_input.versionNotSupported',
  'Builder.controller.jsonUtil.update.updateError'
];
const graphInput = async data => {
  try {
    const result = await apiService.axiosPost(
      `${API.graphInput}`,
      { type: 'file', ...data },
      { headers: { knw_id: data?.knw_id } }
    );
    return new Promise(resolve => {
      if (!result) return resolve({ type: 'fail', message: ERROR_OBJECT_INPUT?.[error] || error || '' });
      const { ErrorCode = '', Cause = '', Description } = result || {};
      const error = ErrorCode || Cause;
      if (error) {
        resolve({
          type: 'fail',
          message: ERROR_OBJECT_INPUT?.[error] || (INPUT_ERROR.includes(ErrorCode) ? Description : error)
        });
      } else {
        resolve({ type: 'success', message: 'success', data: result?.graph_id });
      }
    });
  } catch (e) {
    return false;
  }
};

/** 系统信息 当前AD接入图数据库的类型 ECeph是否可用 */
const getSysConfig = async () => {
  return await apiService.axiosGetData(API.getSysConfig, {});
};

export default {
  knowledgeNetGet,
  knowledgeNetGetByName,
  knowledgeNetCreate,
  knowledgeNetEdit,
  knowledgeNetDelete,
  graphGetByKnw,
  graphOutput,
  graphInput,
  getSysConfig
};
