import React, { useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { connect } from 'react-redux';
import { Menu, Dropdown, Tooltip, Popover, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

import IconFont from '@/components/IconFont';
import { wrapperTitle } from '@/utils/handleFunction';
import UploadKnowledgeModal from './UploadKnowledgeModal';
import EditModal from './editModal';
import DeleteModal from './deleteModal';
import './index.less';

const NetworkHeader = props => {
  const history = useHistory();
  const { userInfo, knowledgeList, selectedKnowledge, changeSelectedKnowledge, initKnowledgeList, onRefreshLeftSpace } =
    props;

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [opSelected, setOpSelected] = useState(false); // 右边操作
  const [infoClicked, setInfoClicked] = useState(false); // 控制信息卡片

  const [uploadVisible, setUploadVisible] = useState(false); // 上传弹窗

  const onClick = e => {
    if (parseInt(e.key) === selectedKnowledge?.id) {
      onRefreshLeftSpace();
      return;
    }
    history.push(`${window.location.pathname}?id=${e.key}`);
    onRefreshLeftSpace();
    changeSelectedKnowledge(parseInt(e.key));
  };

  const leftMenu = (
    <Menu onClick={onClick}>
      {_.map(knowledgeList, item => {
        return (
          <Menu.Item key={item.id} data={item}>
            <span
              className="box"
              style={{ color: item.color, background: `${item.color}15`, border: `1px solid ${`${item.color}10`}` }}
            >
              {item.knw_name.substring(0, 1)}
            </span>
            <span className="item-name" title={wrapperTitle(`${item?.knw_name}【ID:${item?.id}】`)}>
              {item.knw_name}
              <span className="id">【ID:{item?.id}】</span>
            </span>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  const infoMenu = (
    <Menu>
      <Menu.Item key="1" className="userInfo">
        {intl.get('knowledge.createUser')}
        {selectedKnowledge.creator_name}
      </Menu.Item>
      <Menu.Item key="2" className="userInfo">
        {intl.get('knowledge.createTime')}
        {selectedKnowledge.creation_time}
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="3"
        className="edit"
        onClick={() => {
          setOpSelected(false);
          if (userInfo.email !== selectedKnowledge.creator_email) {
            message.error(intl.get('graphList.editperMissionError'));
            return;
          }
          setEditModalVisible(true);
        }}
      >
        {intl.get('knowledge.edit')}
      </Menu.Item>

      <Menu.Item
        key="4"
        className="edit"
        onClick={() => {
          setOpSelected(false);
          if (userInfo.email !== selectedKnowledge.creator_email) {
            message.error(intl.get('graphList.delperMissionError'));
            return;
          }
          setDeleteModalVisible(true);
        }}
      >
        {intl.get('knowledge.delete')}
      </Menu.Item>
    </Menu>
  );
  const back = () => {
    history.push('/home/graph-list');
  };

  // 上传之后刷新图谱列表状态
  const onAfterUpload = () => {
    onRefreshLeftSpace();
  };

  return (
    <div className="networkHeader">
      <div className="networkHeader-box">
        <div className="networkHeader-box-left">
          <div className="back">
            <IconFont type="icon-shangfanye" className="back-icon" onClick={back} />
          </div>
          <Dropdown
            overlay={leftMenu}
            trigger={['click']}
            overlayClassName="network-overlay-list"
            getPopupContainer={triggerNode => triggerNode.parentElement}
          >
            <div className="dropDown-left">
              <div
                className="box"
                style={{
                  background: `${selectedKnowledge.color}15`,
                  color: selectedKnowledge.color,
                  border: `1px solid ${`${selectedKnowledge.color}10`}`
                }}
              >
                {selectedKnowledge?.knw_name?.substring(0, 1)}
              </div>
              <div
                className="overlay-list-name"
                title={wrapperTitle(`${selectedKnowledge?.knw_name}【ID:${selectedKnowledge?.id}】`)}
              >
                {selectedKnowledge?.knw_name}
                <span className="id">【ID:{selectedKnowledge?.id}】</span>
              </div>
              <IconFont type="icon-fanye" className="down-icon" />
            </div>
          </Dropdown>
          <div
            className={infoClicked ? 'knw-network-info knw-network-info-select' : 'knw-network-info'}
            onClick={() => {
              setInfoClicked(true);
            }}
          >
            <Popover
              placement="bottomLeft"
              title={null}
              visible={infoClicked}
              content={
                <div>
                  <div className="network-info-name">
                    <div
                      className="color-box"
                      style={{
                        background: `${selectedKnowledge.color}15`,
                        color: selectedKnowledge.color,
                        border: `1px solid ${`${selectedKnowledge.color}10`}`
                      }}
                    >
                      {selectedKnowledge?.knw_name?.substring(0, 1)}
                    </div>
                    <div>
                      <div className="info-name-box">
                        <div className="network-name" title={wrapperTitle(`${selectedKnowledge?.knw_name}`)}>
                          {selectedKnowledge?.knw_name}
                        </div>
                        {userInfo.email === selectedKnowledge.creator_email && (
                          <IconFont
                            type="icon-edit"
                            className="edit-icon"
                            onClick={() => {
                              setInfoClicked(false);
                              setEditModalVisible(true);
                            }}
                          />
                        )}
                      </div>
                      <div className="id">ID：{selectedKnowledge?.id}</div>
                    </div>
                  </div>
                  <div className="network-des-box">
                    {selectedKnowledge?.knw_description ? (
                      <div>{selectedKnowledge?.knw_description}</div>
                    ) : (
                      <div className="des-null">{intl.get('graphList.notDes')}</div>
                    )}
                  </div>
                </div>
              }
              trigger="click"
              getPopupContainer={triggerNode => triggerNode.parentElement}
              onVisibleChange={visible => (visible ? setInfoClicked(true) : setInfoClicked(false))}
            >
              <ExclamationCircleOutlined className="network-info-icon" />
            </Popover>
          </div>
        </div>
        <div className="networkHeader-box-right">
          {userInfo.type !== 1 && (
            <span className="upload-btn" onClick={() => selectedKnowledge.id && setUploadVisible(true)}>
              <IconFont origin="adf" type="icon-shangchuan" className="btn-icon" />
              <span className="btn-text">{intl.get('uploadService.upload')}</span>
            </span>
          )}

          <Dropdown
            overlay={infoMenu}
            overlayClassName="info-overlay-list"
            trigger={['click']}
            onVisibleChange={visible => (visible ? setOpSelected(true) : setOpSelected(false))}
          >
            <Tooltip title={intl.get('configSys.op')} placement="bottom">
              <div className={opSelected ? 'bg info-icon' : 'info-icon'}>
                <IconFont type="icon-caozuoxinxi" />
              </div>
            </Tooltip>
          </Dropdown>
        </div>
      </div>

      {userInfo.type !== 1 && (
        <UploadKnowledgeModal
          visible={uploadVisible}
          kgData={selectedKnowledge}
          setVisible={setUploadVisible}
          onOk={onAfterUpload}
        />
      )}

      {/* 编辑知识网路弹窗 */}
      <EditModal
        visible={editModalVisible}
        setVisible={setEditModalVisible}
        editNetwork={selectedKnowledge}
        changeSelectedKnowledge={changeSelectedKnowledge}
        initKnowledgeList={initKnowledgeList}
      />

      <DeleteModal visible={deleteModalVisible} setVisible={setDeleteModalVisible} delId={selectedKnowledge.id} />
    </div>
  );
};

const mapStateToProps = state => ({
  userInfo: state.getIn(['changeUserInfo', 'userInfo']).toJS()
});

export default connect(mapStateToProps)(NetworkHeader);
