import React, { useState } from 'react';
import _ from 'lodash';
import { Tag, Dropdown, Menu, Popover, message, Tooltip, Button } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import { useHistory } from 'react-router-dom';

import THESAURUS_TEXT from '@/enums/thesaurus_mode';
import { PERMISSION_KEYS, PERMISSION_CODES } from '@/enums';
import HELPER from '@/utils/helper';
import serverThesaurus from '@/services/thesaurus';
import IconFont from '@/components/IconFont';
import Format from '@/components/Format';
import ContainerIsVisible from '@/components/ContainerIsVisible';
import { tipModalFunc } from '@/components/TipModal';

import ErrorModal from './ErrorModal';
import DeleteThesaurusModal from './DeleteThesaurus';
import ModalEdit from './EditThesaurusModal';

import './style.less';
import { sessionStore } from '@/utils/handleFunction';

const THESAURUS_STATUS_COLOR: Record<any, string> = {
  edit: '#336cdb',
  waiting: '#bfbfbf',
  running: '#efb041',
  success: '#52C41A',
  failed: '#ec5b56'
};

export const ERROR_CODE: Record<string, string> = {
  'Builder.LexiconController.GetLexiconById.LexiconIdNotExist': 'ThesaurusManage.nullThesaurusId',
  'Builder.LexiconService.BuilderTask.LexiconIsRunning': 'ThesaurusManage.thesaurusRun',
  'Builder.LexiconService.BuilderTask.ExtractInfoEmptyError': 'ThesaurusManage.sqlEmpty',
  'Builder.LexiconService.BuilderTask.ExtractGraphIdNotExist': 'ThesaurusManage.graphIdEmpty',
  'Builder.LexiconController.KnowledgeCapacityError': 'ThesaurusManage.capacity',
  'Builder.LexiconController.GetLexiconList.KnowledgeIdNotExist': 'ThesaurusManage.nullKnowlegeId'
};

/**
 * 词库状态对应显示的文字
 */
const THESAURUS_STATUS_TEXT: Record<any, string> = {
  edit: intl.get('datamanagement.Editing'),
  waiting: intl.get('global.waiting'),
  running: intl.get('apiTrial.running'),
  success: intl.get('ThesaurusManage.Configured'),
  failed: intl.get('global.failed')
};

const Contentheader = (props: any) => {
  const { knowledge, selectedThesaurus, getThesaurusList, showInfo, setShowInfo, onClearInput, collapse, setCollapse } =
    props;
  const history = useHistory();
  const { setImportModalVisible, setAddWordsVisible, setOpWordsType } = props;
  const [authThesaurusData, setAuthThesaurusData] = useState<any>(null);
  const [delThesaurusVisible, setdelThesaurusVisible] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [isErrorModal, setIsErrorModal] = useState(false); // 失败详情弹窗

  /**
   * 导出词库
   */
  const exportData = async () => {
    if (selectedThesaurus?.status === 'running') {
      message.warning(intl.get('ThesaurusManage.editwordsError'));
      return;
    }
    try {
      const data = {
        id_list: [selectedThesaurus?.id]
      };
      serverThesaurus.thesaurusExport(data);
    } catch (err) {
      //
    }
  };

  // 打开编辑词库
  const editThesaurus = () => {
    setEditModalVisible(true);
  };

  // 打开导入弹窗
  const importThesaurus = () => {
    if (selectedThesaurus?.status === 'running') {
      message.warning(intl.get('ThesaurusManage.editwordsError'));
      return;
    }
    setImportModalVisible(true);
  };

  // 关闭编辑弹窗
  const closeModal = () => setEditModalVisible(false);

  // 关闭删除弹窗
  const closeDelModal = () => setdelThesaurusVisible(false);

  /**
   * 错误弹窗
   */
  const handleCancel = () => setIsErrorModal(false);

  const menu = (
    <Menu className="operator-menu">
      <ContainerIsVisible
        isVisible={
          HELPER.getAuthorByUserInfo({
            roleType: PERMISSION_CODES.ADF_KN_LEXICON_EDIT,
            userType: PERMISSION_KEYS.LEXICON_EDIT,
            userTypeDepend: selectedThesaurus?.__codes
          })
          // && !['entity_link', 'std'].includes(selectedThesaurus?.mode)
        }
      >
        <Menu.Item
          key="1"
          onClick={() => editThesaurus()}
          disabled={['waiting', 'running'].includes(selectedThesaurus?.status)}
        >
          {intl.get('datamanagement.edit')}
        </Menu.Item>
      </ContainerIsVisible>
      <ContainerIsVisible
        isVisible={HELPER.getAuthorByUserInfo({
          roleType: PERMISSION_CODES.ADF_KN_LEXICON_EDIT,
          userType: PERMISSION_KEYS.LEXICON_VIEW,
          userTypeDepend: selectedThesaurus?.__codes
        })}
      >
        <Menu.Item
          key="2"
          onClick={() => exportData()}
          disabled={_.isEmpty(selectedThesaurus?.columns) || ['waiting', 'running'].includes(selectedThesaurus?.status)}
        >
          {intl.get('uploadService.export')}
        </Menu.Item>
      </ContainerIsVisible>
      <ContainerIsVisible
        isVisible={HELPER.getAuthorByUserInfo({
          roleType: PERMISSION_CODES.ADF_KN_LEXICON_DELETE,
          userType: PERMISSION_KEYS.LEXICON_DELETE,
          userTypeDepend: selectedThesaurus?.__codes
        })}
      >
        <Menu.Item key="4" onClick={() => setdelThesaurusVisible(true)}>
          {intl.get('knowledge.delete')}
        </Menu.Item>
      </ContainerIsVisible>
      {/* <ContainerIsVisible
        isVisible={HELPER.getAuthorByUserInfo({
          roleType: PERMISSION_CODES.ADF_KN_LEXICON_MEMBER,
          userType: PERMISSION_KEYS.LEXICON_EDIT_PERMISSION,
          userTypeDepend: selectedThesaurus?.__codes
        })}
      >
        <Menu.Item
          key="3"
          // onClick={() => setAuthThesaurusData(selectedThesaurus)}
          onClick={() =>
            history.push(
              `/knowledge/word-auth?lexicon_id=${selectedThesaurus.id}&lexicon_name=${selectedThesaurus.lexicon_name}`
            )
          }
        >
          {intl.get('knowledge.authorityManagement')}
        </Menu.Item>
      </ContainerIsVisible> */}
    </Menu>
  );

  /**
   * 编辑配置
   */
  const onEditConfig = () => {
    history.push(
      `/knowledge/knowledge-thesaurus-create?action=edit&mode=${selectedThesaurus?.mode}&thesaurus_name=${
        selectedThesaurus?.lexicon_name
      }&type=${selectedThesaurus?.status}&thesaurus_id=${selectedThesaurus?.id}&knw_id=${knowledge?.id}&description=${
        selectedThesaurus?.description || ''
      }`
    );
  };

  /**
   * 运行
   */
  const onRun = async () => {
    const isOk = await tipModalFunc({
      title: intl.get('ThesaurusManage.runTitle'),
      content: intl.get('ThesaurusManage.runContent')
    });
    if (!isOk) return;
    try {
      const { res, ErrorDetails, ErrorCode } = await serverThesaurus.thesaurusBuild({
        lexicon_id: Number(selectedThesaurus?.id)
      });
      if (res) {
        message.success(intl.get('ThesaurusManage.runReturn'));
        getThesaurusList({});
      }
      if (ErrorCode === 'Builder.LexiconService.BuildTask.KnowledgeCapacityError') {
        message.error(intl.get('license.operationFailed'));
        return;
      }
      ErrorDetails && message.error(ErrorDetails);
    } catch (err) {
      //
    }
  };

  /**
   * 展开
   */
  const onExpand = () => {
    setCollapse(false);
    sessionStore.remove('thesaurusList');
  };

  return (
    <div className="thesaurus-header-wrap">
      <div className="thesaurus-info">
        <div className="thesaurus-head-info-left kw-flex">
          {collapse && (
            <Format.Button className="kw-mr-3" tip={intl.get('global.expand')} type="icon" onClick={onExpand}>
              <IconFont type="icon-zhankai1" style={{ fontSize: 12, transform: 'rotate(180deg)' }} />
            </Format.Button>
          )}
          <IconFont type="icon-ciku1" className="kw-mr-2" style={{ fontSize: '18px' }} />
          <div className="kw-ellipsis thesaurusName" title={selectedThesaurus?.lexicon_name}>
            {selectedThesaurus?.lexicon_name}
          </div>
          <div className="line">|</div>
          <div
            className="thesaurus-status kw-ml-3 kw-mr-2"
            style={{ background: THESAURUS_STATUS_COLOR[selectedThesaurus?.status] }}
          ></div>
          <div>{THESAURUS_STATUS_TEXT[selectedThesaurus?.status]}</div>
          {selectedThesaurus?.status === 'failed' ? (
            <IconFont
              type="icon-wendang-xianxing"
              className="kw-ml-2 kw-pointer"
              onClick={() => setIsErrorModal(true)}
            />
          ) : null}
          <div className="kw-ml-3">
            {intl.get('subscriptionService.updateTime')}：{selectedThesaurus?.update_time}
          </div>
        </div>

        <div className="thesaurus-op kw-flex" id="thesaurus-op">
          <Format.Button className="kw-align-center" onClick={() => setShowInfo(!showInfo)} type="icon-text">
            <IconFont type="icon-iconzhengli_dangan" />
            {intl.get('ThesaurusManage.overView')}
          </Format.Button>
          {selectedThesaurus?.mode ? (
            <>
              {selectedThesaurus?.__codes?.length === 1 &&
              selectedThesaurus?.__codes.includes('LEXICON_VIEW') ? null : (
                <>
                  <Format.Button
                    disabled={['edit', 'waiting', 'running'].includes(selectedThesaurus?.status)}
                    className="kw-align-center"
                    type="icon-text"
                    onClick={onRun}
                  >
                    <IconFont type="icon-qidong" />
                    {intl.get('ThesaurusManage.run')}
                  </Format.Button>
                  <Format.Button
                    className="kw-align-center"
                    type="icon-text"
                    disabled={['waiting', 'running'].includes(selectedThesaurus?.status)}
                    onClick={onEditConfig}
                  >
                    <IconFont type="icon-setting" />
                    {intl.get('ThesaurusManage.editConfig')}
                  </Format.Button>
                </>
              )}
            </>
          ) : (
            <ContainerIsVisible
              isVisible={HELPER.getAuthorByUserInfo({
                roleType: PERMISSION_CODES.ADF_KN_LEXICON_EDIT,
                userType: PERMISSION_KEYS.LEXICON_EDIT,
                userTypeDepend: selectedThesaurus?.__codes
              })}
            >
              <Format.Button
                onClick={importThesaurus}
                className="kw-align-center"
                type="icon-text"
                disabled={['waiting', 'running'].includes(selectedThesaurus?.status)}
              >
                <IconFont type="icon-shangchuan" />
                {intl.get('ThesaurusManage.importTwo')}
              </Format.Button>
            </ContainerIsVisible>
          )}

          <Dropdown
            className="drop-button"
            overlay={menu}
            trigger={['click']}
            placement="bottomRight"
            getPopupContainer={() => document.getElementById('thesaurus-op') || document.body}
          >
            <Format.Button className="kw-align-center" type="icon-text">
              {/* <IconFont type="icon-caozuo1" /> */}
              <EllipsisOutlined />
              {intl.get('ThesaurusManage.more')}
            </Format.Button>
          </Dropdown>
        </div>
      </div>

      <ModalEdit
        isVisible={editModalVisible}
        closeModal={closeModal}
        knowledge={knowledge}
        getThesaurusList={getThesaurusList}
        selectedThesaurus={selectedThesaurus}
        onClearInput={onClearInput}
      />
      <DeleteThesaurusModal
        isVisible={delThesaurusVisible}
        closeModal={closeDelModal}
        thesaId={selectedThesaurus?.id}
        getThesaurusList={getThesaurusList}
        onClearInput={onClearInput}
      />
      <ErrorModal isErrorModal={isErrorModal} handleCancel={handleCancel} errorDes={selectedThesaurus?.error_info} />
    </div>
  );
};
export default Contentheader;
