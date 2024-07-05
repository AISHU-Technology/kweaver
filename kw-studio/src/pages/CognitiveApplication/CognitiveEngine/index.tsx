import React, { memo, useEffect, useState } from 'react';
import { Menu, Dropdown, Tooltip } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classnames from 'classnames';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';
import servicesPermission from '@/services/rbacPermission';

import Format from '@/components/Format';
import KwKNIcon from '@/components/KwKNIcon';
import CognitiveSearch from './CognitiveSearch';
import './style.less';

const CognitiveEngine: React.FC<any> = props => {
  const [knData, setKnData] = useState<any>({});
  const [kwList, setKwList] = useState<any[]>();

  useEffect(() => {
    getKwList();
  }, []);

  const getKwList = async () => {
    try {
      const params = { size: 1000, page: 1, rule: 'update', order: 'desc' };
      const { res = {}, ErrorCode = '' } = (await servicesKnowledgeNetwork.knowledgeNetGet(params)) || {};
      const dataIds = _.map(res?.df, item => String(item.id));
      // servicesPermission.dataPermission(postData).then((result: any) => {
      //   const codesData = _.keyBy(result?.res, 'dataId');
      //   const authData = _.filter(res?.df, item => {
      //     return _.includes(codesData?.[item.id]?.codes, 'KN_VIEW');
      //   });

      //   setKwList(authData || []);
      //   setKnData(authData?.[0]);
      // });
      setKwList(res?.df || []);
      setKnData(res?.df?.[0]);
    } catch (error) {}
  };

  const onChangeSelectKn = (value: any) => {
    if (value?.id === knData?.id) return;
    setKnData(value);
  };

  // 下拉知识网络列表
  const knSelectMenus = (
    <Menu className="menuSelect">
      {_.map(kwList, item => {
        const { color, knw_name } = item;
        const selected = item?.id === knData?.id;
        return (
          <Menu.Item
            key={item?.id}
            className={classnames({ selected })}
            style={{ height: 40 }}
            onClick={() => onChangeSelectKn(item)}
          >
            <div className="kw-ellipsis kw-align-center" style={{ width: 170 }} title={knw_name}>
              <KwKNIcon style={{ marginRight: 6 }} type={color} />
              <div className="kw-flex-item-full-width kw-ellipsis">{knw_name}</div>
            </div>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  return (
    <div className="kg-cognitive-engine">
      <div className="kw-border-b kw-bg-white kw-flex kw-pl-6 kw-pr-6">
        <Format.Title className="kw-mt-5 kw-mb-5">{intl.get('global.knowledgeSearch')}</Format.Title>
        <div className="kw-align-center kw-pointer kw-ml-4">
          <Dropdown
            overlay={knSelectMenus}
            trigger={['click']}
            placement="bottomLeft"
            getPopupContainer={e => e.parentElement!}
          >
            <div className="kw-align-center">
              <KwKNIcon style={{ marginRight: 6 }} type={knData?.color} />
              <Tooltip placement="right" title={knData?.knw_name}>
                <div className="kw-ellipsis" style={{ maxWidth: 154 }}>
                  {knData?.knw_name}
                </div>
              </Tooltip>
              <DownOutlined style={{ marginLeft: 12 }} />
            </div>
          </Dropdown>
        </div>
      </div>
      <CognitiveSearch key={knData?.id} knData={knData} />
    </div>
  );
};

export default memo(CognitiveEngine);
