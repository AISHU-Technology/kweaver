import intl from 'react-intl-universal';

const GENERAL_MODEL = 'Generalmodel';
const AI_MODEL = 'AImodel';
const AS_MODEL = 'Anysharedocumentmodel';
const CONTRACT_MODEL = 'Contractmodel';
const OPERATION = 'OperationMaintenanceModel';

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
