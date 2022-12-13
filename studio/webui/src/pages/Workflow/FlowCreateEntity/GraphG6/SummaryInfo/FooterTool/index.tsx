import React, { useState, useEffect, useRef } from 'react';
import { Checkbox, Button, Dropdown, Divider, Empty, ConfigProvider } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';
import { fuzzyMatch } from '@/utils/handleFunction';
import kongImg from '@/assets/images/kong.svg';
import './style.less';

export interface FooterToolProps {
  disabled: boolean; // 禁用
  checked: boolean; // 是否全选
  indeterminate: boolean; // 是否半选
  groupList: any[]; // 分组列表
  onCheckAll: (isChecked: boolean) => void; // 全选回调
  onDelete: () => void; // 删除回调
  onGroupChange: (ids: string[]) => void; // 确认添加分组回调
  onCreateGroup: () => void; // 新建分组
}

const FooterTool = (props: FooterToolProps) => {
  const { disabled, checked, indeterminate, groupList, onCheckAll, onDelete, onGroupChange, onCreateGroup } = props;
  const ungrouped = useRef<any>({}); // 未分组数据缓存
  const [showList, setShowList] = useState<any[]>([]);
  const [selectGroup, setSelectGroup] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const gIds = groupList.map(g => {
      if (g.isUngrouped) ungrouped.current = { ...g };
      return g.id;
    });
    const matchData = groupList.filter(g => fuzzyMatch(keyword, g.name));
    setShowList(matchData);
    setSelectGroup(pre => pre.filter(id => gIds.includes(id)));
  }, [groupList, keyword]);

  const onSearch = _.debounce(e => {
    setKeyword(e.target.value);
  }, 300);

  /**
   * 选择单个分组
   * @param id 分组id
   * @param isCheck 是否选择
   */
  const onSelect = (id: string, isCheck: boolean) => {
    setSelectGroup(isCheck ? [id] : []);
  };

  /**
   * 确认添加分组
   */
  const onConfirmAdd = () => {
    if (!selectGroup.length) return;
    onGroupChange(selectGroup.filter(i => i !== ungrouped.current.id));
    setSelectGroup([]);
  };

  /**
   * 关闭清除已选
   * @param visible
   */
  const onVisibleChange = (visible: boolean) => {
    !visible && setSelectGroup([]);
  };

  return (
    <div className="summary-footer-tool ad-space-between">
      <Checkbox checked={checked} indeterminate={indeterminate} onChange={() => onCheckAll(!checked)}>
        {intl.get('global.checkAll')}
      </Checkbox>
      <div>
        <ConfigProvider autoInsertSpaceInButton={false}>
          <Button type="default" disabled={disabled} onClick={onDelete}>
            {intl.get('global.delete')}
          </Button>
        </ConfigProvider>

        <Dropdown
          className="group-dropdown-menu"
          getPopupContainer={triggerNode => triggerNode.parentElement!}
          destroyPopupOnHide // WARMING [antd@4.18.7]受flex布局影响, 需要设置关闭后销毁, 否则重新打开会抖动
          placement="topRight"
          trigger={['click']}
          disabled={disabled || !groupList.length}
          onVisibleChange={onVisibleChange}
          overlay={
            <div className="group-dropdown-content">
              <div className="ad-p-2">
                <SearchInput
                  placeholder={intl.get('createEntity.searchGroup')}
                  autoWidth
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onChange={e => {
                    e.persist();
                    onSearch(e);
                  }}
                />
              </div>
              <Button type="link" block style={{ textAlign: 'left' }} onClick={onCreateGroup}>
                <IconFont type="icon-Add" />
                {intl.get('createEntity.createGroupBtn')}
              </Button>
              <Divider className="ad-m-0" />
              <div className="list-wrap">
                {showList.length ? (
                  <>
                    {showList.map(item => {
                      const groupChecked = selectGroup.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          className={classNames('group-item ad-space-between', { checked: groupChecked })}
                          onClick={e => {
                            e.stopPropagation();
                            onSelect(item.id, !groupChecked);
                          }}
                        >
                          <div className="g-name ad-pointer ad-c-header ad-ellipsis">{item.name}</div>
                          {groupChecked && <CheckOutlined className="ad-c-primary" />}
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <Empty className="ad-mb-4" image={kongImg} description={intl.get('global.noData')} />
                )}
              </div>
              <Divider className="ad-m-0" />
              <div style={{ textAlign: 'right' }}>
                <span className={classNames('f-btn ad-c-subtext ad-pointer')} onClick={() => setSelectGroup([])}>
                  {intl.get('global.cancel')}
                </span>
                <span className={classNames('f-btn ad-c-header ad-pointer ad-ml-2 ad-mr-3')} onClick={onConfirmAdd}>
                  {intl.get('global.ok')}
                </span>
              </div>
            </div>
          }
        >
          <Button type="primary" className="ad-ml-2">
            {intl.get('createEntity.addToGroup')}
          </Button>
        </Dropdown>
      </div>
    </div>
  );
};

export default FooterTool;
