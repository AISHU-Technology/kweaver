import React from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { Tooltip } from 'antd';

import IconFont from '@/components/IconFont';
import cognitiveEngineIcon from '@/assets/images/cognitiveEngine.svg';
import './index.less';

const ICON_ARRAY = [
  {
    id: 1,
    icon: <IconFont type="icon-graph" style={{ fontSize: 16, color: 'rgba(0, 0, 0, 0.85)' }} />,
    intlText: 'configSys.graph',
    url: '/knowledge/network'
  },
  {
    id: 2,
    icon: <img src={cognitiveEngineIcon} alt="search" />,
    intlText: 'global.cognitiveEngine',
    url: '/knowledge/engine'
  },
  {
    id: 3,
    icon: <IconFont type="icon-data" style={{ fontSize: 16, color: 'rgba(0, 0, 0, 0.85)' }} />,
    intlText: 'global.dataManage',
    url: '/knowledge/source'
  },
  {
    id: 4,
    icon: <IconFont type="icon-ciku" style={{ fontSize: 16, color: 'rgba(0, 0, 0, 0.85)' }} />,
    intlText: 'global.thesaurusManagement',
    url: '/knowledge/thesaurus'
  },
];

type SidebarType = {
  selectedKnowledgeId: number | string;
};
const Sidebar = (props: SidebarType) => {
  const { selectedKnowledgeId } = props;
  const history = useHistory();

  return (
    <div className="left-nav">
      {_.map(ICON_ARRAY, item => {
        const { id, icon, intlText, url } = item;
        const pathname = history?.location?.pathname || '';
        return (
          <div
            key={id}
            className={classnames('nav-item', { select: pathname === url })}
            onClick={() => history.push(`${url}?id=${selectedKnowledgeId || '1'}`)}
          >
            <Tooltip title={intl.get(intlText)} placement="right">
              {icon}
            </Tooltip>
          </div>
        );
      })}
    </div>
  );
};

export default Sidebar;
