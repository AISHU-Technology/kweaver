import apiService from '@/utils/axios-http';
import { API } from '@/services/api';

const swaggerDocGet = async () => await apiService.axiosGet(API.swaggerDocGet);

const servicesSwagger = {
  swaggerDocGet
};

export default servicesSwagger;
