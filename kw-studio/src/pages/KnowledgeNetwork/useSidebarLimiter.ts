import { useState, useEffect } from 'react';
import { message } from 'antd';
import _ from 'lodash';
import serviceLicense from '@/services/license';

const analysisService = '/cognitive-application/domain-analysis'; // 图分析服务
const cognitiveService = '/cognitive-application/domain-intention'; // 认知搜索服务

/**
 * 需要验证菜单路由
 */
const getVerifyMenu = () => {
  return [analysisService, cognitiveService];
};

/**
 * 侧边栏限制器
 * @returns {string[]} 隐藏的侧边栏
 * @returns {Function} 刷新的方法
 */
export default function useSidebarLimiter() {
  const [hidedMenu, setHidedMenu] = useState<string[]>([]);

  useEffect(() => {
    // refresh();
  }, []);

  /**
   * 刷新授权信息
   */
  // const refresh = async () => {
  //   try {
  //     const res = await serviceLicense.getLicenseList({ status: -1, service: -1, lang: 'en' });
  //     boolLicense(res?.res?.data);
  //   } catch (error) {
  //     setHidedMenu(getVerifyMenu());
  //     if (!error.type) return;
  //     const { Description, description } = error.response || {};
  //     const curDesc = Description || description;
  //     curDesc && message.error(curDesc);
  //   }
  // };

  /**
   * 判断授权
   * @param data 授权数据
   */
  const boolLicense = (data: any[]) => {
    if (!data) return;
    // 0: 主模块
    // 1: 主模块
    // 2: 主模块
    // 3: 主模块
    // 4: 主模块
    // 5: 认知搜索服务
    // 6: 智能问答服务
    // 7: 图可视化分析
    // 8: 产业数据API服务
    // 9: 产业数据融合服务
    // 10: 领域认知服务平台
    // 11: 企业画像
    // 12: 产业链招商引资
    // 13: 智能政策助手
    // 14: 测试许可
    // 15: 图分析服务
    const dataKV = _.keyBy(data, 'type');

    if (
      dataKV[14]?.status === 1 || // 测试许可, 开放所有
      dataKV[16]?.status === 1 // AS专用, 开放所有
    ) {
      return setHidedMenu([]);
    }

    const menu = getVerifyMenu();
    if (dataKV[15]?.status === 1) {
      _.remove(menu, analysisService);
    }
    if (dataKV[5]?.status === 1) {
      _.remove(menu, cognitiveService);
    }
    setHidedMenu(menu);
  };

  // return [hidedMenu, refresh] as const;
  return [hidedMenu] as const;
}
