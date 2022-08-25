import React, { memo, useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { Checkbox, Select, Space, Button, message, ConfigProvider } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

import { wrapperTitle } from '@/utils/handleFunction';
import servicesAuth from '@/services/auth';

import IconFont from '@/components/IconFont';
import ScrollBar from '@/components/ScrollBar';
import SearchInput from '@/components/SearchInput';
import { updateTable, updateChecked, coverResult, generateBody, boolPermitPro } from './assistFunction';

import noResult from '@/assets/images/noResult.svg';
import emptyImg from '@/assets/images/empty.svg';
import loadingSvg from '@/assets/images/jiazai.svg';
import './style.less';

const { Option } = Select;
let requestId = 0; // 标记获取表格数据的网络请求id

const AddMember = props => {
  const history = useHistory();
  const { graphId, setVisible, authLevel, effect } = props;
  const searchInput = useRef(); // 绑定搜索框
  const [checked, setChecked] = useState(false); // 是否仅看已选项
  const [checkedData, setCheckedData] = useState([]); // 已选择项的数据
  const [searchName, setSearchName] = useState(''); // 模糊搜索词
  const [changeKeys, setChangeKeys] = useState([]); // 已修改权限的项
  const [tableData, setTableData] = useState([]); // 表格显示数据
  const [checkedPage, setCheckedPage] = useState(1); // 仅查看已选择项的当前页码
  const [loading, setLoading] = useState(false); // 加载中
  const [selectKey, setSelectKey] = useState(0); // 操作的行背景加深
  const [saveLoading, setSaveloading] = useState(false); // 保存loading
  const [pageSize, setPageSize] = useState(20); // 显示的总数

  // 缓存仅查看选择项的表格数据
  const showCheckedData = useMemo(() => {
    return checkedData.slice((checkedPage - 1) * pageSize, checkedPage * pageSize);
  }, [checkedPage, checkedData]);

  // 挂载时发起请求
  useEffect(() => {
    getTotal(graphId);
    // eslint-disable-next-line
  }, [graphId]);

  /**
   * 获取表格数据
   * @param {Number} id 图谱id
   * @param {String} value 搜索值
   * @param {Number} page 页码
   */
  const fetchData = async (id, size, value = '', page = 1) => {
    setLoading(true);

    const signId = ++requestId;
    const { res, Code } = (await servicesAuth.getAccNotGraph({ id, value, page, size })) || {};

    if (signId < requestId) return;

    setLoading(false);
    setChecked(false);

    if (res) {
      const { sums, accountNotInGraph } = res;
      const newChecked = checkedData.filter(item => item.proId);
      const newData = coverResult(accountNotInGraph, newChecked);

      setTableData(newData);
      setCheckedData(newChecked);
    }

    if (Code === 500346) {
      message.error(intl.get('graphList.authErr'));
      setVisible(false);

      typeof effect === 'function' && effect();
    }
  };

  const getTotal = async id => {
    const value = '';
    const page = 1;
    let size = 20;
    const { res } = (await servicesAuth.getAccNotGraph({ id, value, page, size: pageSize })) || {};

    if (res) {
      const { sums } = res;

      size = sums > 0 ? sums : 20;
      setPageSize(sums);
    }
    fetchData(graphId, size);
  };

  /**
   * 根据属性id显示属性名
   * @param {Number} id 权限属性id
   */
  const switchProName = id => {
    switch (id) {
      // case 0:
      //   return '-';
      case 1:
        return intl.get('userManagement.owner'); // 所有者
      case 2:
        return intl.get('userManagement.manager'); // 管理者
      case 3:
        return intl.get('userManagement.editor'); // 编辑者
      case 4:
        return intl.get('userManagement.viewer'); // 查看者
      default:
        return '-';
    }
  };

  /**
   * 模糊搜索
   */
  const onSearch = () => {
    const { value } = searchInput.current.input;

    setSearchName(value);
    fetchData(graphId, pageSize, value);
  };

  /**
   * 改变权限
   * @param {Number} id 用户id
   * @param {Number} proId 权限id
   * @param {Number} index 该表格数据的索引
   */
  const onProChange = (id, proId, index) => {
    const newTable = updateTable(id, proId, tableData);

    setTableData(newTable);

    // 更新以选择项
    proId && !changeKeys.includes(id) && setChangeKeys(pre => [...pre, id]);
    !proId && changeKeys.includes(id) && setChangeKeys(pre => pre.filter(key => key !== id));

    // 修改或新增属性配置
    const newPro = proId && !changeKeys.includes(id) ? newTable[index] : null;
    const newChecked = updateChecked(id, proId, checkedData, newPro);

    setCheckedData(newChecked);
    document.activeElement.blur();
  };

  // 选中用户
  const selectUser = (e, item) => {
    const newList = checkedData.includes(item)
      ? checkedData.filter(i => i.accountEmail !== item.accountEmail)
      : [...checkedData, item];

    // 给选择的用户默认值 普通用户默认查看，其他默认编辑
    newList.forEach((item, index) => {
      if (!checkedData.includes(item)) {
        item.accountType === 1 ? onProChange(item.accountId, 4, index) : onProChange(item.accountId, 3, index);
      }
    });

    setCheckedData(newList);
  };

  /**
   * 确定按钮 发起请求
   */
  const handleSave = async () => {
    if (saveLoading) return;

    if (changeKeys.length === 0) {
      message.warning(intl.get('memberManage.leastOne'));

      return;
    }

    setSaveloading(true);

    const add_infos = generateBody(checkedData);
    const { res, Code } = (await servicesAuth.postAddMember({ kg_id: graphId, add_infos })) || {};

    if (res) {
      message.success(intl.get('memberManage.addSuccess'));
      setVisible(false, true);
    }

    if (Code) {
      if (typeof effect === 'function' && Code !== 500354) {
        effect();
      }

      // 无权限
      if (Code === 500346) {
        message.error(intl.get('graphList.authErr'));
        setVisible(false);
      }

      // 图谱不存在
      if (Code === 500354) {
        message.error(intl.get('userManagement.noExistAll'));
        history.push('/home/graph-list');
      }

      // 无法执行分配同级以上权限
      if (Code === 500372) {
        message.error(intl.get('userManagement.lowAuth'));
      }

      // 部分无法执行分配同级以上权限
      if (Code === 500377) {
        message.error(intl.get('userManagement.lowAuthPart'));
        setVisible(false);
      }

      // 账号已被删除
      if (Code === 500373) {
        message.error(intl.get('userManagement.userNoExist'));
        setVisible(false);
      }

      // 部分账号已被删除
      if (Code === 500378) {
        message.error(intl.get('userManagement.userNoExistPart'));
        setVisible(false);
      }

      // 账号无法分配相关权限
      if (Code === 500374) {
        message.error(intl.get('userManagement.cannotAssign'));
        setVisible(false);
      }

      // 部分账号无法分配相关权限
      if (Code === 500379) {
        message.error(intl.get('userManagement.cannotAssignPart'));
        setVisible(false);
      }

      // 账号分配权限存在异常
      if (Code === 500375) {
        message.error(intl.get('userManagement.abnormal'));
      }

      // 部分账号分配权限存在异常
      if (Code === 500380) {
        message.error(intl.get('userManagement.abnormalPart'));
        setVisible(false);
      }
    }

    setTimeout(() => {
      setSaveloading(false);
    }, 500);
  };

  // 清除按钮
  const clearChecked = e => {
    const newArr = checkedData.filter(item => item.accountEmail !== e.accountEmail);

    const accountId = newArr.map(item => item.accountId);
    const list = changeKeys.filter(item => accountId.includes(item));

    setCheckedData(newArr);
    setChangeKeys(list);
  };

  // 全部清空
  const clearAll = () => {
    setChangeKeys([]);
    setCheckedData([]);
  };

  // 全部选择
  const selectAll = e => {
    if (e.target.checked) {
      const list = tableData.map(item => item);

      list.forEach((item, index) => {
        if (!checkedData.includes(item)) {
          item.accountType === 1 ? onProChange(item.accountId, 4, index) : onProChange(item.accountId, 3, index);
        }
      });
      setCheckedData(list);
    } else {
      setCheckedData([]);
      setChangeKeys([]);
    }
  };

  return (
    <div className="network-addmember">
      {/* 添加成员 */}
      <div className="header">{intl.get('memberManage.addMember')}</div>

      <div className="network-addmember-content">
        <div className="content-left">
          <div className="input-box">
            <SearchInput
              ref={searchInput}
              className="search-input"
              onPressEnter={onSearch}
              placeholder={intl.get('memberManage.searchHolder')}
            />
          </div>
          <div>
            {tableData.length > 0 ? (
              <>
                <div className="list-top">
                  <span className="top-info">{intl.get('memberManage.countInfo')}</span>
                  <Checkbox onChange={selectAll} checked={checkedData.length === tableData.length}></Checkbox>
                </div>
                <ScrollBar autoHeight autoHeightMax={400} isshowx="false" color="rgb(184,184,184)">
                  <div className="list-box">
                    {tableData.map((item, index) => {
                      const check = checkedData.includes(item);

                      return (
                        <div key={index} className="left-user-list">
                          <div className="user-info-icon" onClick={() => selectUser('', item)}>
                            <div className="acc-icon">
                              <IconFont type="icon-zhanghao" />
                            </div>
                            <div className="user">
                              <p className="name" title={wrapperTitle(item.accountName)}>
                                {item.accountName}
                              </p>
                              <p className="email" title={wrapperTitle(item.accountEmail)}>
                                {item.accountEmail}
                              </p>
                            </div>
                          </div>
                          <div className="check-box">
                            <Checkbox onChange={e => selectUser(e, item)} checked={check}></Checkbox>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollBar>
              </>
            ) : loading ? (
              <div className="loading">
                <img src={loadingSvg} alt="loading" className="loading-img" />
              </div>
            ) : (
              <div className="nodata-box">
                <img src={searchName ? noResult : emptyImg} alt="nodata" className="nodata-img"></img>
                <div className="nodata-text">
                  {searchName ? intl.get('memberManage.addSearchNull') : intl.get('memberManage.emptyDesc')}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="content-right">
          <div className="top">
            <div>
              {intl.get('memberManage.selected')}
              {checkedData.length > 0 && checkedData.length}
            </div>
            <div className="clear-all" onClick={clearAll}>
              {intl.get('memberManage.clearAll')}
            </div>
          </div>
          <ScrollBar autoHeight autoHeightMax={450} isshowx="false" color="rgb(184,184,184)">
            <div className="checked-box">
              {checkedData.map((item, index) => {
                return (
                  <div key={index} className="right-user-list">
                    <div className="user-info-icon">
                      <div className="acc-icon">
                        <IconFont type="icon-zhanghao" />
                      </div>
                      <div className="user">
                        <p className="name" title={wrapperTitle(item.accountName)}>
                          {item.accountName}
                        </p>
                        <p className="email" title={wrapperTitle(item.accountEmail)}>
                          {item.accountEmail}
                        </p>
                      </div>
                    </div>
                    <div className="select-box">
                      <Select
                        className="auth-select"
                        value={item.proId || '编辑者'}
                        bordered={false}
                        onChange={value => onProChange(item.accountId, value, index)}
                        onFocus={() => setSelectKey(item.accountId)}
                        onBlur={() => setSelectKey(0)}
                      >
                        {boolPermitPro(item.accountType, authLevel).map(proId => {
                          return (
                            <Option key={proId} value={proId}>
                              {switchProName(proId)}
                            </Option>
                          );
                        })}

                        {/* {item.proId && (
                        <Option key={0} value={0} title={''}>
                          {'-'}
                        </Option>
                      )} */}
                      </Select>
                    </div>
                    <div className="close-icon">
                      <CloseOutlined onClick={() => clearChecked(item)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollBar>
        </div>
      </div>

      <div className="footer">
        <Space size={8}>
          <ConfigProvider autoInsertSpaceInButton={false}>
            <Button className="ant-btn-default cannal-button" onClick={() => setVisible(false)}>
              {intl.get('userManagement.cancel')}
            </Button>

            <Button type="primary" className="ok-button" onClick={handleSave}>
              {intl.get('userManagement.ok1')}
            </Button>
          </ConfigProvider>
        </Space>
      </div>
    </div>
  );
};

AddMember.defaultProps = {
  userInfo: {},
  graphId: 0,
  setVisible: () => {}
};

AddMember.propTypes = {
  userInfo: PropTypes.object,
  graphId: PropTypes.number,
  setVisible: PropTypes.func
};

export default memo(AddMember);
