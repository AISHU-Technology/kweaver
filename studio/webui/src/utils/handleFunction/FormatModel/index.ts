import intl from 'react-intl-universal';

const GENERALMODEL = 'Generalmodel'; // 百科知识模型
const AIMODEL = 'AImodel'; // AI模型
const ASMODEL = 'Anysharedocumentmodel'; // 文档知识模型
const CONTRACTDEL = 'Contractmodel'; // 合同模型
const OPERATION = 'OperationMaintenanceModel'; // 软件文档知识模型

export const formatModel = (model: string) => {
  switch (model) {
    case GENERALMODEL: return intl.get('createEntity.Gmodel');
    case AIMODEL: return intl.get('createEntity.AImodel');
    case ASMODEL: return intl.get('createEntity.ASmodel');
    case CONTRACTDEL: return intl.get('createEntity.Contractdel');
    case OPERATION: return intl.get('createEntity.OperationModel');
    default: return model;
  }
};
