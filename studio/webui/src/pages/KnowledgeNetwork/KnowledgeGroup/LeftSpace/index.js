import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { Input, Button, Dropdown, Menu, Pagination, Tooltip, message } from 'antd';
import { CaretDownOutlined } from '@ant-design/icons';

import { wrapperTitle } from '@/utils/handleFunction';

import IconFont from '@/components/IconFont';
import ScrollBar from '@/components/ScrollBar';

import noResult from '@/assets/images/noResult.svg';
import './index.less';

const PAGESIZE = 20;
const ORDER_MENU = [
  { id: 'create', intlText: 'knowledge.byCreate' },
  { id: 'update', intlText: 'knowledge.byUpdate' },
  { id: 'name', intlText: 'knowledge.byName' }
];
const IMPORT_EXPORT_MENU = [
  { id: 'import', icon: 'icon-daoru', intlText: 'knowledge.import' },
  { id: 'export', icon: 'icon-daochu', intlText: 'knowledge.export' }
];

const LeftSpace = props => {
  const history = useHistory();
  const { graphList, graphListCount, setSelectedGraph, selectedGraph, getGraphList, openModalImport, openModalExport } =
    props;

  const [order, setOrder] = useState('desc'); // 新旧排序
  const [rule, setRule] = useState('update'); // 筛选方式
  const [page, setPage] = useState(1); // 页码
  const [name, setName] = useState(''); // 搜索名称

  useEffect(() => {
    getGraphList({ page, order, rule });
  }, [page, order, rule]);

  const createGraph = () => history.push('/home/workflow/create');

  const searchGraph = e => {
    const { value } = e.target;

    setName(value);

    _.debounce(value => {
      getGraphList({ page: 1, name: value });
      setPage(1);
    }, 300)(value);
  };

  const changePage = page => setPage(page);

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
        const iconDirection = order === 'desc' ? '' : 'direction';

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
    if (menuKey === 'export') {
      if (_.isEmpty(graphList)) {
        return message.warning(intl.get('knowledge.noKnowledgeGraphToExport'));
      }
      openModalExport();
    }
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

  const buttonCreateAndImport = (
    <div className="btn-wrap">
      <Button className="operate-btn" type="primary" onClick={createGraph}>
        <IconFont type="icon-Add" />
        {intl.get('knowledge.create')}
      </Button>
      <Dropdown
        placement="bottomRight"
        overlay={menuImportOrExport}
        getPopupContainer={triggerNode => triggerNode.parentElement}
      >
        <Button className="operate-btn">
          <IconFont type="icon-daoru" origin="new" />
          {intl.get('knowledge.importAndExport')}
          <CaretDownOutlined style={{ marginLeft: 4, fontSize: 12 }} />
        </Button>
      </Dropdown>
    </div>
  );

  return (
    <div className="left-space">
      <div className="knowledge-list">
        <div className="search">
          <Input
            value={name}
            allowClear={true}
            placeholder={intl.get('search.search')}
            prefix={<IconFont type="icon-sousuo" className="search-icon" />}
            onChange={searchGraph}
          />
        </div>
        {graphListCount ? (
          <div className="graph-list">
            {!name && (
              <React.Fragment>
                <div className="head">
                  <h2>{intl.get('global.graph')}</h2>
                  <div className="op">
                    <Tooltip title={intl.get('knowledge.sort')} placement="bottom">
                      <Dropdown
                        overlay={menuRule}
                        trigger={['click']}
                        placement="bottomRight"
                        getPopupContainer={triggerNode => triggerNode.parentElement}
                      >
                        <IconFont type="icon-paixu11" className="order" />
                      </Dropdown>
                    </Tooltip>
                  </div>
                </div>
                {buttonCreateAndImport}
              </React.Fragment>
            )}
            <ScrollBar autoHeight autoHeightMax={830} isshowx="false" color="rgb(184,184,184)">
              <div className="graph-box">
                {_.map(graphList, item => {
                  return (
                    <div
                      key={item.id}
                      className={selectedGraph?.id === item.id ? 'line line-selected' : 'line'}
                      onClick={() => onGraphChange(item)}
                    >
                      <div className="img">
                        <IconFont type="icon-zhishiwangluo" className="icon"></IconFont>
                      </div>
                      <div className="word">
                        <div className="name" title={wrapperTitle(item.name)}>
                          {item.name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollBar>
            <Pagination
              className="pagina"
              current={page}
              pageSize={PAGESIZE}
              total={graphListCount}
              hideOnSinglePage={true}
              onChange={changePage}
            />
          </div>
        ) : name ? (
          <div className="search-none">
            <img src={noResult} alt="noResult" />
            <div className="word">{intl.get('memberManage.searchNull')}</div>
          </div>
        ) : (
          <div className="knowledge-list-table">
            <h2 className="title">{intl.get('global.graph')}</h2>
            {buttonCreateAndImport}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeftSpace;
