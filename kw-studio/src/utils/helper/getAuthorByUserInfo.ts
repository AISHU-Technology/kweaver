import _ from 'lodash';
import { localStore } from '@/utils/handleFunction';

const getAuthorByUserInfo = (permissionData?: any) => {
  const { roleType = '', userType = '', userTypeDepend = [] } = permissionData || {};
  if (!roleType && !userType) return true;
  const roleCodes = localStore.get('roleCodes') || [];

  let haveThePermission = false;
  if (userType && !_.isEmpty(userTypeDepend)) {
    // 如果有用户权限参数，优先使用用户的权限,
    haveThePermission = _.includes(userTypeDepend, userType);
    // 还要判断一下粗粒度权限
    if (haveThePermission && roleType) haveThePermission = _.includes(roleCodes, roleType);
  } else {
    // 没有用户权限参数，则使用角色的权限
    haveThePermission = _.includes(roleCodes, roleType);
  }

  // return haveThePermission;
  return true;
};

export default getAuthorByUserInfo;
