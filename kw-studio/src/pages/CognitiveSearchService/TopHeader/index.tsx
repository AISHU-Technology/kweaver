import React, { useState, useEffect, useMemo } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import { useHistory } from 'react-router-dom';
import intl from 'react-intl-universal';
import { Menu, Tooltip, Divider } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { getParam } from '@/utils/handleFunction';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';
import KwHeader from '@/components/KwHeader';
import AvatarName from '@/components/Avatar';
import IconFont from '@/components/IconFont';
import { KnwItem } from '../types';

export interface TopHeaderProps {
  onChange: (data: KnwItem) => void;
  setKnwStudio: (data: any) => void;
}

const TopHeader = (props: TopHeaderProps) => {
  const { onChange, setKnwStudio } = props;
  const { knwId } = useMemo(() => {
    const { knw_id } = getParam(['knw_id']);
    return { knwId: parseInt(knw_id) };
  }, [window.location?.search]);

  useEffect(() => {
    getKnwData();
  }, []);

  /**
   * 获取所有知识网络
   */
  const getKnwData = async (isPush = false, id?: any, select = '') => {
    const body = { page: 1, size: 10000, order: 'desc', rule: 'update' };
    try {
      const result = await servicesKnowledgeNetwork.knowledgeNetGet(body);
      if (result?.res?.df) {
        let knw_id = -1;
        if (isPush) {
          knw_id = parseInt(id);
        } else {
          knw_id = knwId;
        }
        const selected = _.find(result.res.df, d => d.id === knw_id);
        if (selected) {
          onChange?.(selected);
        }
      }
    } catch (error) {
      //
    }
  };
  // 面包屑
  const breadcrumb = {
    key: 'breadcrumb',
    label: (
      <div className="kw-align-center">
        <Divider type="vertical" style={{ margin: '0px 16px' }} />
        <div className="componentIcon">
          <IconFont type="icon-color-renzhiyingyong" />
        </div>
        <div className="kw-ml-2">{intl.get('homepage.cognitiveApplication')}</div>
      </div>
    )
  };

  return (
    <KwHeader
      breadcrumb={breadcrumb}
      onClickLogo={() => {
        setKnwStudio('studio');
      }}
    />
  );
};

export default TopHeader;
