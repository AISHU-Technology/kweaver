import apiService from '@/utils/axios-http/engineServer';

import { API } from '@/services/api';

/**
 *
 * @param data 知识网络id
 * @returns
 */
const getExchangeAccount = async () => await apiService.axiosGet(API.getSubscribeAccount);

/**
 * 编辑授权信息
 * @param data
 * @returns
 */
const editExchangeAccount = async () => await apiService.axiosPost(API.editSubscribeAccount, {});

const Subscriptionservice = {
  getExchangeAccount,
  editExchangeAccount
};
export default Subscriptionservice;
