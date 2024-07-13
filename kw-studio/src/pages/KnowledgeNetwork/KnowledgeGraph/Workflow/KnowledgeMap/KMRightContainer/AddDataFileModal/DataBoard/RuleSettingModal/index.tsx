import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Checkbox, message, Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import Format from '@/components/Format';
import intl from 'react-intl-universal';
import _ from 'lodash';
import TemplateModal from '@/components/TemplateModal';
import UniversalModal from '@/components/UniversalModal';
import SearchInput from '@/components/SearchInput';
import NoDataBox from '@/components/NoDataBox';
import { fuzzyMatch } from '@/utils/handleFunction';
import PartitionConfig from './PartitionConfig';
import './style.less';
import { PreviewColumn } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KMRightContainer/types';

const { Header, Content, Footer, Sider } = Layout;

export interface RuleSettingModalProps {
  visible: boolean;
  data: PreviewColumn[];
  checkedKeys: string[];
  onOk: (keys: string[], type?: any) => void;
  onCancel: () => void;
  partitionMes: any;
  selectFile: any; // 选择的文件
  partitionModal: any;
}

type CheckStatus = {
  isPart: boolean;
  isAll: boolean;
};

/**
 * 判断全选状态
 * @param showData 显示的数据
 * @param keys 勾选的数据
 */
const boolCheckStatus = (showData: PreviewColumn[], keys: string[]): CheckStatus => {
  let isPart = false;
  let isAll = false;
  let count = 0;

  if (!keys.length || !showData.length) return { isPart, isAll };
  const keysMap = _.keyBy(keys);
  _.some(showData, ({ key }) => {
    if (count && !keysMap[key]) return true;
    if (keysMap[key]) {
      isPart = true;
      count += 1;
    }
    return false;
  });
  isAll = count >= showData.length;
  isPart = isAll ? false : isPart;
  return { isPart, isAll };
};

const RuleSettingModal = (props: RuleSettingModalProps) => {
  const { visible, data, checkedKeys, onOk, onCancel, partitionMes, selectFile, partitionModal } = props;
  const saveConfigRef = useRef<any>();
  const [showData, setShowData] = useState<PreviewColumn[]>([]); // 显示的属性
  const [innerKeys, setInnerKeys] = useState<string[]>([]); // 已选key
  const [keyword, setKeyword] = useState(''); // 搜索关键字
  const [isChange, setIsChange] = useState<any>([]); // 是否更新
  const [hiveSave, setHiveSave] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState<any>([]); // 填入的分区变量
  const [selectData, setSelectData] = useState<any>([]); // 下拉框数据
  const [handleSelectData, setHandleSelectData] = useState<any>([]); // 处理选择框中的数据 选择一个删除一个
  const checkStatus = useMemo(() => boolCheckStatus(showData, innerKeys), [showData, innerKeys]); // 全选状态
  const [tabKey, setTabKey] = useState('extraction'); // 菜单选择
  const [radioOpen, setRadioOpen] = useState(0);

  useEffect(() => {
    if (partitionMes || selectFile?.partition_infos) {
      const keysArr = Object.keys(partitionMes || selectFile?.partition_infos);
      setHandleSelectData(keysArr);
    }
  }, []);

  useEffect(() => {
    if (!partitionModal) return;
    setTabKey('partition');
  }, [partitionModal]);

  useEffect(() => {
    if (!keyword) return setShowData([...data]);
    const matchData = data.filter(item => fuzzyMatch(keyword, item.name));
    setShowData(matchData);
  }, [data, keyword]);

  useEffect(() => {
    const totalKeys = _.map(data, d => d.key);
    const keys = checkedKeys.filter(k => totalKeys.includes(k));
    setInnerKeys(keys);
  }, [checkedKeys, data]);

  const onSearch = _.debounce(e => {
    setKeyword(e.target.value);
  }, 300);

  const handleOk = async () => {
    if (tabKey === 'partition') {
      const mes = await saveConfigRef?.current?.onSave();
      if (_.isEmpty(mes)) {
        return;
      }
      onOk(mes, 'partition');
      onCancel();
      return;
    }
    if (!innerKeys.length) {
      // message.error(intl.get('workflow.information.leastRule'));
      message.error({
        content: intl.get('workflow.information.leastRule'),
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
      return;
    }
    onOk(innerKeys, 'extraction');
    onCancel();
  };

  const onCheckAll = () => {
    const showKeys = showData.map(d => d.key);
    const newKeys = checkStatus.isAll
      ? innerKeys.filter(k => !showKeys.includes(k))
      : _.uniq([...innerKeys, ...showKeys]);
    setInnerKeys(newKeys);
  };

  const onCheck = (isCheck: boolean, key: string) => {
    if (!isCheck && innerKeys.length === 1) {
      // return message.error(intl.get('workflow.information.leastRule'));
      return message.error({
        content: intl.get('workflow.information.leastRule'),
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
    }
    setInnerKeys(pre => (isCheck ? [...pre, key] : pre.filter(k => k !== key)));
  };

  /**
   * 菜单变更
   */
  const onMenuChange = (e: any) => {
    setTabKey(e.key);
  };

  return (
    <UniversalModal
      className="extract-rule-setting-modal"
      open={visible}
      title={intl.get('workflow.information.extraction')}
      onOk={handleOk}
      okText={intl.get('workflow.information.save2')}
      forceRender
      width={'1000px'}
      onCancel={onCancel}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        { label: intl.get('workflow.information.save2'), type: 'primary', onHandle: handleOk }
      ]}
    >
      <div className="m-box kw-flex-column kw-w-100">
        <div className="setting-left" style={{ height: 'calc(100% - 52px)' }}>
          <Layout hasSider style={{ minHeight: '100%' }}>
            <Sider theme="light" style={{ borderRight: '1px solid rgba(0, 0, 0, 0.1)', width: '200px' }}>
              <Menu
                mode="inline"
                defaultSelectedKeys={partitionModal ? ['partition'] : ['extraction']}
                onClick={onMenuChange}
              >
                <Menu.Item key={'extraction'}>{intl.get('workflow.information.extrRules')}</Menu.Item>
                <Menu.Item
                  key={'partition'}
                  style={
                    selectFile?.data_source !== 'hive' || selectFile.extract_type === 'sqlExtraction'
                      ? { color: 'rgba(0,0,0,0.25)' }
                      : {}
                  }
                  disabled={selectFile?.data_source !== 'hive' || selectFile.extract_type === 'sqlExtraction'}
                >
                  {intl.get('workflow.information.partition')}
                </Menu.Item>
              </Menu>
            </Sider>
            <Layout className="site-layout">
              <Content style={{ background: '#fff', padding: '20px 24px' }}>
                {tabKey === 'extraction' && (
                  <>
                    <Format.Title className="kw-mb-4 title">{intl.get('workflow.information.extrRules')}</Format.Title>
                    <div className="input-box">
                      <SearchInput
                        autoWidth
                        placeholder={intl.get('workflow.information.searchPro')}
                        onChange={e => {
                          e.persist();
                          onSearch(e);
                        }}
                      />
                    </div>
                    <div className="check-box">
                      <div className="check-all" style={{ display: !showData.length ? 'none' : undefined }}>
                        <Checkbox
                          className="kw-c-header"
                          checked={checkStatus.isAll}
                          indeterminate={checkStatus.isPart}
                          onChange={onCheckAll}
                        >
                          {intl.get('global.checkAll')}
                        </Checkbox>
                      </div>
                      <div className="rule-list">
                        {_.map(showData, (item, i) => {
                          const { key, name, columns = [] } = item;
                          const isCheck = _.includes(innerKeys, key);
                          return (
                            <div
                              key={key + i}
                              className="rule-item kw-align-center kw-pointer"
                              onClick={() => onCheck(!isCheck, key)}
                            >
                              <Checkbox className="kw-ml-2 kw-mr-2" checked={isCheck} />
                              <div className="pro-name kw-c-header kw-ellipsis kw-mr-7" title={name}>
                                {name}
                              </div>
                              <div className="pro-text kw-c-subtext kw-ellipsis" title={columns[0]}>
                                {columns[0]}
                              </div>
                            </div>
                          );
                        })}
                        {!showData.length && <NoDataBox type="NO_RESULT" />}
                      </div>
                    </div>
                  </>
                )}
                {tabKey === 'partition' && (
                  <PartitionConfig
                    setIsChange={setIsChange}
                    isChange={isChange}
                    ref={saveConfigRef}
                    partitionMes={partitionMes}
                    selectFile={selectFile}
                    setHiveSave={setHiveSave}
                    setSearchQuery={setSearchQuery}
                    searchQuery={searchQuery}
                    hiveSave={hiveSave}
                    handleSelectData={handleSelectData}
                    setHandleSelectData={setHandleSelectData}
                    selectData={selectData}
                    setSelectData={setSelectData}
                    radioOpen={radioOpen}
                    setRadioOpen={setRadioOpen}
                  />
                )}
              </Content>
            </Layout>
          </Layout>
        </div>
      </div>
    </UniversalModal>
  );
};

export default (props: RuleSettingModalProps) => (props.visible ? <RuleSettingModal {...props} /> : null);
