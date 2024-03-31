import React, { useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { Input, Button, Dropdown, Menu, Tooltip, message, Avatar } from 'antd';
import { CaretDownOutlined } from '@ant-design/icons';

import HOOKS from '@/hooks';
import { PERMISSION_KEYS, PERMISSION_CODES } from '@/enums';
import HELPER from '@/utils/helper';
import { sessionStore, wrapperTitle } from '@/utils/handleFunction';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import ScrollBar from '@/components/ScrollBar';
import ContainerIsVisible from '@/components/ContainerIsVisible';

import noResult from '@/assets/images/noResult.svg';
import './index.less';
import SearchInput from '@/components/SearchInput';
import classNames from 'classnames';

const ORDER_MENU = [
  { id: 'create', intlText: 'knowledge.byCreate' },
  { id: 'update', intlText: 'knowledge.byUpdate' },
  { id: 'name', intlText: 'knowledge.byName' }
];
const IMPORT_EXPORT_MENU = [
  { id: 'add', icon: 'icon-Add', intlText: 'knowledge.create' },
  { id: 'import', icon: 'icon-daoru', intlText: 'knowledge.import' }
];

const LeftSpace = props => {
  const history = useHistory();
  const {
    graphList,
    setSelectedGraph,
    selectedGraph,
    getGraphList,
    selectedKnowledge,
    openModalImport,
    openModalExport,
    collapsed,
    setCollapsed
  } = props;

  const [order, setOrder] = useState('desc'); // 新旧排序
  const [rule, setRule] = useState('update'); // 筛选方式
  const [name, setName] = useState(''); // 搜索名称

  HOOKS.useUpdateEffect(() => {
    getGraphList({ order: 'desc', rule: 'create' }, true);
  }, [order, rule]);

  /**
   * @description 创建知识图谱
   */
  const createGraph = async () => {
    history.push(`/knowledge/workflow/create?knId=${selectedKnowledge?.id}`);
  };

  /**
   * @description 搜索知识图谱
   */
  const searchGraph = e => {
    const { value } = e.target;
    setName(value);
    getGraphList({ name: value }, true);
  };

  /**
   * 切换图谱
   * @param {object} item 图谱
   */
  const onGraphChange = item => {
    setSelectedGraph(item);
    message.destroy(); // 销毁报错信息
  };

  const selectMenu = e => {
    setSelectedGraph('');
    if (e.key === rule) return setOrder(order === 'desc' ? 'asc' : 'desc');
    setRule(e.key);
  };

  const menuRule = (
    <Menu className="menu-select" onClick={selectMenu}>
      {_.map(ORDER_MENU, item => {
        const { id, intlText } = item;
        const isSelectClass = rule === id ? 'menu-selected' : '';
        const iconDirection = order === 'desc' ? 'direction' : '';

        return (
          <Menu.Item key={id} className={isSelectClass}>
            <div className="select">
              <div className="icon">
                {rule === id ? <IconFont type="icon-fanhuishangji" origin="adf" className={iconDirection} /> : null}
              </div>
              <div>{intl.get(intlText)}</div>
            </div>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  const onSelectImportOrExportMenu = e => {
    const menuKey = e.key;
    if (menuKey === 'import') openModalImport();
    if (menuKey === 'add') createGraph();
  };
  const menuImportOrExport = (
    <Menu className="menu-select" onClick={onSelectImportOrExportMenu}>
      {_.map(IMPORT_EXPORT_MENU, item => {
        const { id, icon, intlText } = item;

        return (
          <Menu.Item key={id}>
            <div className="select">
              <div className="icon">
                <IconFont className="icon" type={icon} origin="new" />
              </div>
              {intl.get(intlText)}
            </div>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  const onExport = () => {
    if (_.isEmpty(graphList)) {
      return message.warning(intl.get('knowledge.noKnowledgeGraphToExport'));
    }
    openModalExport();
  };

  const buttonCreateAndImport = (
    <div className="btn-wrap">
      <ContainerIsVisible
        isVisible={HELPER.getAuthorByUserInfo({
          roleType: PERMISSION_CODES.ADF_KN_KG_CREATE,
          userType: PERMISSION_KEYS.KN_ADD_KG,
          userTypeDepend: selectedKnowledge?.__codes
        })}
      >
        <Dropdown
          placement="bottomRight"
          overlay={menuImportOrExport}
          getPopupContainer={triggerNode => triggerNode.parentElement}
        >
          <Button className="operate-btn" type="primary">
            <IconFont type="icon-Add" />
            {intl.get('knowledge.create')}
            <CaretDownOutlined />
          </Button>
        </Dropdown>
      </ContainerIsVisible>
      <ContainerIsVisible
        isVisible={HELPER.getAuthorByUserInfo({
          roleType: PERMISSION_CODES.ADF_KN_KG_CREATE,
          userType: PERMISSION_KEYS.KN_ADD_KG,
          userTypeDepend: selectedKnowledge?.__codes
        })}
      >
        <div style={{ width: 15 }} />
      </ContainerIsVisible>
      <ContainerIsVisible
        isVisible={HELPER.getAuthorByUserInfo({
          roleType: PERMISSION_CODES.ADF_KN_KG_EXPORT
        })}
      >
        <Button className="operate-btn" onClick={onExport}>
          <IconFont type="icon-daochu" />
          {intl.get('knowledge.export')}
        </Button>
      </ContainerIsVisible>
    </div>
  );

  return (
    <div className={classNames('left-space kw-border-r kw-h-100')} style={{ marginLeft: !collapsed ? 0 : -320 }}>
      <div className="knowledge-list kw-h-100 kw-flex-column">
        <div className="kw-align-center">
          <SearchInput
            debounce
            autoWidth
            allowClear={true}
            placeholder={intl.get('knowledge.search')}
            onChange={searchGraph}
          />
          <Format.Button
            className="kw-ml-2 left-space-unExpend"
            onClick={() => {
              sessionStore.set('graphListCollapse', '1');
              setCollapsed(true);
            }}
            type="icon"
            tip={intl.get('global.unExpand')}
          >
            <IconFont type="icon-zhankai1" style={{ fontSize: 12 }} />
          </Format.Button>
        </div>
        <div className="g-list kw-flex-column kw-flex-item-full-height">
          <div className="head kw-align-center kw-mt-2">
            <span style={{ fontWeight: 600 }} className="kw-c-text">
              {intl.get('configSys.graph')}
            </span>
            <span>
              <ContainerIsVisible
                isVisible={HELPER.getAuthorByUserInfo({
                  roleType: PERMISSION_CODES.ADF_KN_KG_CREATE,
                  userType: PERMISSION_KEYS.KN_ADD_KG,
                  userTypeDepend: selectedKnowledge?.__codes
                })}
              >
                <Format.Button onClick={openModalImport} type="icon" size="small" tip={intl.get('knowledge.import')}>
                  <IconFont type="icon-daoru" style={{ fontSize: 14 }} />
                </Format.Button>
              </ContainerIsVisible>

              <ContainerIsVisible
                isVisible={HELPER.getAuthorByUserInfo({
                  roleType: PERMISSION_CODES.ADF_KN_KG_EXPORT
                })}
              >
                <Format.Button
                  disabled={_.isEmpty(graphList)}
                  onClick={onExport}
                  type="icon"
                  size="small"
                  tip={intl.get('knowledge.export')}
                >
                  <IconFont type="icon-daochu" style={{ fontSize: 14 }} />
                </Format.Button>
              </ContainerIsVisible>

              <ContainerIsVisible
                isVisible={HELPER.getAuthorByUserInfo({
                  roleType: PERMISSION_CODES.ADF_KN_KG_CREATE,
                  userType: PERMISSION_KEYS.KN_ADD_KG,
                  userTypeDepend: selectedKnowledge?.__codes
                })}
              >
                <Format.Button onClick={createGraph} type="icon" size="small" tip={intl.get('knowledge.create')}>
                  <IconFont type="icon-Add" style={{ fontSize: 14 }} />
                </Format.Button>
              </ContainerIsVisible>
            </span>
          </div>
          {!_.isEmpty(graphList) ? (
            <div className="g-box kw-flex-item-full-height">
              {_.map(graphList, item => {
                return (
                  <div
                    key={item.id}
                    className={classNames('kw-align-center line kw-mt-1', {
                      'line-selected': selectedGraph?.id === item.id
                    })}
                    onClick={() => onGraphChange(item)}
                  >
                    <IconFont type="icon-color-zhishitupu11" style={{ fontSize: 16 }} />
                    {/* <img src={require('@/assets/images/knGraph.svg')} alt="" />*/}
                    <span className="kw-ml-2 kw-flex-item-full-width kw-ellipsis" title={wrapperTitle(item.name)}>
                      {item.name}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : name ? (
            <div className="search-none">
              <img src={noResult} alt="noResult" />
              <div className="word">{intl.get('global.noResult2')}</div>
            </div>
          ) : undefined}
        </div>
      </div>
    </div>
  );
};

export default LeftSpace;
