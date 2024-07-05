import React, { useState, useEffect, useRef } from 'react';
import { Checkbox, Button, Dropdown, Divider, Empty, ConfigProvider } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';
import { fuzzyMatch } from '@/utils/handleFunction';
import { GraphGroupItem } from '../../types/items';
import kongImg from '@/assets/images/kong.svg';
import './style.less';

export interface FooterToolProps {
  disabled: boolean; // 禁用
  checked: boolean; // 是否全选
  indeterminate: boolean; // 是否半选
  groupList: any[]; // 分组列表
  onCheckAll: (isChecked: boolean) => void; // 全选回调
  onDelete: () => void; // 删除回调
  onGroupChange: (ids: number[], name: string) => void; // 确认添加分组回调
  onCreateGroup: () => void; // 新建分组
}

const FooterTool = (props: FooterToolProps) => {
  const { disabled, checked, indeterminate, groupList, onCheckAll, onDelete, onGroupChange, onCreateGroup } = props;
  const ungrouped = useRef<any>({}); // 未分组数据缓存
  const [showList, setShowList] = useState<any[]>([]);
  const [selectGroup, setSelectGroup] = useState<GraphGroupItem>({} as GraphGroupItem);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const gIds = groupList.map(g => {
      if (g.isUngrouped) ungrouped.current = { ...g };
      return g.id;
    });
    const matchData = groupList.filter(g => fuzzyMatch(keyword, g.name));
    setShowList(matchData);
    setSelectGroup(pre => (gIds.includes(pre.id) ? pre : ({} as GraphGroupItem)));
  }, [groupList, keyword]);

  const onSearch = _.debounce(e => {
    setKeyword(e.target.value);
  }, 300);

  /**
   * 选择单个分组
   * @param item 分组
   * @param isCheck 是否选择
   */
  const onSelect = (item: GraphGroupItem, isCheck: boolean) => {
    setSelectGroup(isCheck ? item : ({} as GraphGroupItem));
  };

  /**
   * 确认添加分组
   */
  const onConfirmAdd = () => {
    if (!selectGroup.id) return;
    onGroupChange(selectGroup.id === ungrouped.current.id ? [] : [selectGroup.id], selectGroup.name);
    setSelectGroup({} as GraphGroupItem);
  };

  /**
   * 关闭清除已选
   * @param visible
   */
  const onVisibleChange = (visible: boolean) => {
    !visible && setSelectGroup({} as GraphGroupItem);
  };

  return (
    <div className="summary-footer-tool kw-space-between">
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
          onOpenChange={onVisibleChange}
          overlay={
            <div className="group-dropdown-content">
              <div className="kw-p-2">
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
              <Divider className="kw-m-0" />
              <div className="list-wrap">
                {showList.length ? (
                  <>
                    {showList.map(item => {
                      const groupChecked = selectGroup.id === item.id;
                      return (
                        <div
                          key={item.id}
                          className={classNames('group-item kw-space-between', { checked: groupChecked })}
                          onClick={e => {
                            e.stopPropagation();
                            onSelect(item, !groupChecked);
                          }}
                        >
                          <div className="g-name kw-pointer kw-c-header kw-ellipsis">{item.name}</div>
                          {groupChecked && <CheckOutlined className="kw-c-primary" />}
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <Empty className="kw-mb-4" image={kongImg} description={intl.get('global.noContent')} />
                )}
              </div>
              <Divider className="kw-m-0" />
              <div style={{ textAlign: 'right' }}>
                <span
                  className={classNames('f-btn kw-c-subtext kw-pointer')}
                  onClick={() => setSelectGroup({} as GraphGroupItem)}
                >
                  {intl.get('global.cancel')}
                </span>
                <span className={classNames('f-btn kw-c-header kw-pointer kw-ml-2 kw-mr-3')} onClick={onConfirmAdd}>
                  {intl.get('global.ok')}
                </span>
              </div>
            </div>
          }
        >
          <Button type="primary" className="kw-ml-2">
            {intl.get('createEntity.addToGroup')}
          </Button>
        </Dropdown>
      </div>
    </div>
  );
};

export default FooterTool;
