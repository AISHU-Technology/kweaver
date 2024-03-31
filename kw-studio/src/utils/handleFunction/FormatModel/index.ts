import intl from 'react-intl-universal';

const GENERAL_MODEL = 'Generalmodel'; // 百科知识模型
const AI_MODEL = 'AImodel'; // AI模型
const AS_MODEL = 'Anysharedocumentmodel'; // 文档知识模型
const CONTRACT_MODEL = 'Contractmodel'; // 合同模型
const OPERATION = 'OperationMaintenanceModel'; // 软件文档知识模型

export const formatModel = (model: string) => {
  switch (model) {
    case GENERAL_MODEL:
      return intl.get('createEntity.Gmodel');
    case AI_MODEL:
      return intl.get('createEntity.AImodel');
    case AS_MODEL:
      return intl.get('createEntity.ASmodel');
    case CONTRACT_MODEL:
      return intl.get('createEntity.Contractdel');
    case OPERATION:
      return intl.get('createEntity.OperationModel');
    default:
      return model;
  }
};
