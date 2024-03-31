import React, { useState, useEffect, useMemo } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import { useHistory } from 'react-router-dom';
import { Menu, Tooltip, Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { getParam } from '@/utils/handleFunction';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';
import CHeader from '@/components/Header';
import AvatarName from '@/components/Avatar';

export interface TopHeaderProps {
  selectValue: any;
  onChange: (data: any) => void;
  setKnwStudio: (data: any) => void;
}

const TopHeader = (props: TopHeaderProps) => {
  const { selectValue, onChange, setKnwStudio } = props;
  const history = useHistory();
  const [kgList, setKgList] = useState<any[]>([]);
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
  const getKnwData = async (isPush = false, id?: any) => {
    const body = { page: 1, size: 10000, order: 'desc', rule: 'update' };
    try {
      const result = await servicesKnowledgeNetwork.knowledgeNetGet(body);
      if (result?.res?.df) {
        setKgList(result.res.df);
        let knw_id = -1;
        if (isPush) {
          knw_id = parseInt(id);
        } else {
          knw_id = knwId;
        }
        const selected = _.find(result.res.df, d => d.id === knw_id);
        selected && onChange?.(selected);
      }
    } catch (error) {
      //
    }
  };

  const onChangeSelectKn = (value: any) => {
    const newSearch = `id=${value.key}`;
    getKnwData(true, value.key);
    const url = `/knowledge/studio-network?${newSearch}`;

    history.push(url);
  };

  // 下拉知识网络列表
  const knSelectMenus = (
    <Menu className="knowledgeNetworkRootMenuSelect" onClick={onChangeSelectKn}>
      {_.map(kgList, item => {
        const { color, knw_name } = item;
        const selected = item?.id === knwId;
        return (
          <Menu.Item key={item?.id} className={classnames({ selected })} style={{ height: 40 }}>
            <Tooltip placement="right" title={knw_name}>
              <div className="kw-ellipsis" style={{ width: 198 }}>
                <AvatarName
                  size={24}
                  str={knw_name}
                  color={color}
                  style={{ fontSize: 14, marginRight: 8, display: 'inline-grid' }}
                />
                {knw_name}
              </div>
            </Tooltip>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  // 面包屑
  const breadcrumb = {
    key: 'breadcrumb',
    label: (
      <div className="kw-align-center">
        <div className="kw-pointer">
          <Dropdown overlay={knSelectMenus} trigger={['click']} placement="bottomLeft">
            <div className="kw-align-center kw-pl-2 kw-pr-2">
              <Tooltip placement="bottom" title={selectValue?.knw_name}>
                <div className="kw-ellipsis" style={{ maxWidth: 198 }}>
                  {selectValue?.knw_name}
                </div>
              </Tooltip>
              <DownOutlined style={{ color: '#fff', marginLeft: 12 }} />
            </div>
          </Dropdown>
        </div>
      </div>
    )
  };

  return (
    <CHeader
      // breadcrumb={knwId ? breadcrumb : ''}
      onClickLogo={() => {
        setKnwStudio('studio');
      }}
    />
  );
};

export default TopHeader;
