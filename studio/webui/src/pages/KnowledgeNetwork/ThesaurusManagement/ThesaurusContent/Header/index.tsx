import React, { useState } from 'react'
import _ from 'lodash';
import { Tag, Dropdown, Menu, Popover, message, Tooltip, } from 'antd';
import { EllipsisOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';

import serverThesaurus from '@/services/thesaurus';
import IconFont from '@/components/IconFont';
import Format from '@/components/Format';

import DeleteThesaurusModal from './DeleteThesaurus';
import ModalEdit from './EditThesaurusModal';

import './style.less';
const ERROR_CODE: Record<string, string> = {
  'Builder.LexiconController.ExportLexicon.LexiconIdNotExist': 'ThesaurusManage.nullThesaurusId',
  'Builder.LexiconController.ExportLexicon.EmptyLexicon': 'ThesaurusManage.emptyWords'
}
const Contentheader = (props: any) => {
  const { knowledge, selectedThesaurus, getThesaurusList } = props;
  const { setimportModalVisible, setAddWordsVisible, setOpWordsType } = props;
  const [delThesaurusVisible, setdelThesaurusVisible] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [errorInfoVisible, setErrorInfoVisible] = useState(true);

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
      }
      serverThesaurus.thesaurusExport(data);
    } catch (err) {
      //
    }
  }
  // 计算标签展示的个数
  const getLabels = (maxWidth: number) => {
    if (_.isEmpty(selectedThesaurus?.labels)) {
      return;
    }
    const labels = selectedThesaurus?.labels;
    let length = 0;
    let index = labels?.length
    _.forEach(labels, (item, itemindex) => {
      // 字体大小14,标签最多显示6个字符，左右内边距8，外边距8
      const itemLength = item?.length > 6 ? (98 + 24) : item?.length * 14 + 24;
      length += itemLength
      if (length > maxWidth && index === labels?.length) {
        index = itemindex;
      }
    });

    return index + 1;
  }

  const addWords = () => {
    if (selectedThesaurus?.status === 'running') {
      message.warning(intl.get('ThesaurusManage.editwordsError'));
      return;
    }
    setOpWordsType('add');
    setAddWordsVisible(true);
  }

  // 打开编辑词库
  const editThesaurus = () => setEditModalVisible(true);

  // 打开导入弹窗
  const importThesaurus = () => {
    if (selectedThesaurus?.status === 'running') {
      message.warning(intl.get('ThesaurusManage.editwordsError'));
      return;
    }
    setimportModalVisible(true);
  }

  // 关闭编辑弹窗
  const closeModal = () => setEditModalVisible(false)

  // 关闭删除弹窗
  const closeDelModal = () => setdelThesaurusVisible(false);

  const menu = (
    <Menu className="operator-menu">
      <Menu.Item key="1" onClick={() => { editThesaurus() }}>
        {intl.get('datamanagement.edit')}
      </Menu.Item>

      <Menu.Item key="2" onClick={() => exportData()} disabled={_.isEmpty(selectedThesaurus?.columns)}>
        {intl.get('ThesaurusManage.export')}

      </Menu.Item>

      <Menu.Item
        key="3"
        onClick={() => {
          setdelThesaurusVisible(true)
        }}
      >
        {intl.get('knowledge.delete')}
      </Menu.Item>

    </Menu>
  );

  return (
    <div className="thesaurus-header-wrap">
      <div className="thesaurus-info">
        <IconFont type="icon-ciku1" className="thesaurus-icon" />
        <div>
          <div className="ad-flex" title={selectedThesaurus?.lexicon_name} >
            <div className="ad-ellipsis thesaurusName"> {selectedThesaurus?.lexicon_name}</div>
            {(selectedThesaurus?.status === 'failed' && errorInfoVisible) ?
              <div className="ad-c-error" onClick={() => {
                _.debounce(() => {
                  setErrorInfoVisible(false)
                }, 4000)();
              }}>
                <Tooltip placement="right" title={selectedThesaurus?.error_info}>
                  <ExclamationCircleOutlined />
                </Tooltip>
              </div> : null}
          </div>
          <div className="thesaurus-label" id="thesaurus-label">
            <Format.Text className="ad-mr-2">{intl.get('ThesaurusManage.labels')}:</Format.Text>

            {_.map(selectedThesaurus?.labels?.slice(0, getLabels(500)), (item, index) => {
              return (
                <Tag className="ad-ellipsis tag-style" key={index} title={item}>{item}</Tag>
              )
            })}
            {selectedThesaurus?.labels?.length > getLabels(500) && <Popover
              placement="top"
              title={null}
              trigger="hover"
              getPopupContainer={() => document.getElementById('thesaurus-label') || document.body}
              content={
                <div className="popover-content-wrap">
                  {_.map(selectedThesaurus?.labels?.slice(getLabels(500)), (item, index) => {
                    return (
                      <Tag className="ad-ellipsis tag-width" key={index} title={item}>{item}</Tag>
                    )
                  })}
                </div>
              }
            >
              <div className="ad-center more-labels">
                <EllipsisOutlined style={{ color: 'rgba(0, 0, 0, 0.85)' }} />
              </div>
            </Popover>
            }
            {_.isEmpty(selectedThesaurus?.labels) && <span className="ad-c-subtext">{intl.get('ThesaurusManage.noLabels')}</span>}
          </div>
        </div>
      </div>
      <div className="thesaurus-op" id="thesaurus-op">
        <Format.Button className="button ad-mr-2" type="primary" onClick={importThesaurus}>
          <IconFont type="icon-daoru" />
          {intl.get('knowledge.import')}
        </Format.Button>
        <Format.Button
          className="button ad-mr-2"
          disabled={_.isEmpty(selectedThesaurus?.columns)}
          onClick={addWords}>
          <IconFont type="icon-Add" />
          {intl.get('ThesaurusManage.add')}
        </Format.Button>
        <Dropdown
          className="drop-button"
          overlay={menu}
          trigger={['click']}
          placement="bottomRight"
          getPopupContainer={() => document.getElementById('thesaurus-op') || document.body}
        >
          <Tooltip title={intl.get('graphList.more')} placement="top">
            <Format.Button className="more-btn">
              <EllipsisOutlined style={{ color: 'rgba(0, 0, 0, 0.85)' }} />
            </Format.Button>
          </Tooltip>
        </Dropdown>
      </div>

      <ModalEdit
        isVisible={editModalVisible}
        closeModal={closeModal}
        knowledge={knowledge}
        getThesaurusList={getThesaurusList}
        selectedThesaurus={selectedThesaurus}
      />
      <DeleteThesaurusModal
        isVisible={delThesaurusVisible}
        closeModal={closeDelModal}
        thesaId={selectedThesaurus?.id}
        getThesaurusList={getThesaurusList}
      />
    </div >
  )
}
export default Contentheader;
