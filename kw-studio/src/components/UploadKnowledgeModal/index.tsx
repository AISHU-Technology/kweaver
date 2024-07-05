/**
 * 上传知识网络弹窗
 */

import React, { memo, useState, useEffect, useRef } from 'react';
import { ConfigProvider, Modal, Button, Form, Select, Checkbox, message, Empty, Tooltip } from 'antd';
import { LoadingOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import VirtualList from 'rc-virtual-list';
import SearchInput from '@/components/SearchInput';
import IconFont from '@/components/IconFont';
import serviceUploadKnowledge from '@/services/uploadKnowledge';
import serverKnowledgeNetwork from '@/services/knowledgeNetwork';
import kongImg from '@/assets/images/kong.svg';
import noResult from '@/assets/images/noResult.svg';
import './style.less';

export interface UploadKnowledgeModalProps {
  kgData: Record<string, any>;
  visible: boolean;
  onOk?: Function;
  onCancel: Function;
}

const FormItem = Form.Item;
const { Option } = Select;
const MAX_SIZE = 3000;
const defaultIpParams = { page: 1, keyword: '', order: 'created', reverse: 1 };
const defaultGraphParams = { page: 1, order: 'desc', rule: 'update', filter: 'upload' };
let requestId = 0;

const ModalContent: React.FC<UploadKnowledgeModalProps & { graphData: any[]; setGraphData: Function }> = ({
  kgData,
  onOk,
  onCancel,
  graphData,
  setGraphData
}) => {
  const listRef = useRef<any>();
  const searchInputRef = useRef<any>();
  const [form] = Form.useForm();
  const [ipData, setIpData] = useState<any[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<any>({});
  const [selectedGraph, setSelectedGraph] = useState<any[]>([]);
  const [descBtnStatus, setDescBtnStatus] = useState<null | { isOpen: boolean }>(null);
  const [ipLoading, setIpLoading] = useState(false);
  const [graphLoading, setGraphLoading] = useState(false);
  const [virtualHeight, setVirtualHeight] = useState(0);
  const [keyword, setKeyword] = useState('');

  const ERROR_CODE: Record<string, string> = {
    'DataIO.Common.KgNotFoundException': intl.get('uploadService.graphNotFount'),
    'DataIO.Common.UploadUnsupportedException': intl.get('uploadService.abnormalGraph')
  };

  useEffect(() => {
    getIpList();
    initDesc(kgData.knw_description);
  }, [kgData]);

  useEffect(() => {
    setVirtualHeight(listRef.current?.clientHeight);
  }, [descBtnStatus]);

  /**
   * 初始化描述
   */
  const initDesc = (desc = '') => {
    const expectLen = countText(desc);
    if (expectLen === desc.length) return;
    setDescBtnStatus({ isOpen: false });
  };

  /**
   * 计算描述是否过长, 内容过长则截断
   * @param text 描述文字
   * @returns 截断的索引
   */
  const countText = (text = '') => {
    let curText = text;
    const node = document.createElement('p');

    node.style.cssText = 'position: absolute;visibility: hidden; width: 480px;font-size: 14px;line-height: 22px;';
    node.innerHTML = text;
    document.body.appendChild(node);

    if (node.clientHeight / 22 <= 2) {
      node.remove();
      return text.length;
    }

    while (node.clientHeight / 22 > 2) {
      curText = curText.slice(0, -1);
      node.innerHTML = `${curText}...<span>${intl.get('global.expand')}</span>`;
    }

    node.remove();

    return curText.length;
  };

  /**
   * 获取所有地址数据
   */
  const getIpList: Function = async (size: number = MAX_SIZE) => {
    setIpLoading(true);

    const params = { ...defaultIpParams, size };
    const { res }: any = (await serviceUploadKnowledge.uploadServiceGet(params)) || {};

    if (res) {
      const { data, total } = res;

      if (total > size) {
        return getIpList(total);
      }

      setIpData(data);

      if (total === 1) {
        setSelectedTarget(data[0]);
        form.setFieldsValue({ ip: data[0].ip });
      }
    }
    setIpLoading(false);
  };

  /**
   * 获取图谱
   * @param name 搜索名称
   * @param size 返回数量
   */
  const getGraph: Function = async (name: '', size = MAX_SIZE) => {
    setGraphLoading(true);
    setKeyword(name);

    const signId = ++requestId;
    const params = { ...defaultGraphParams, knw_id: kgData.id, size, name };
    const { res } = (await serverKnowledgeNetwork.graphGetByKnw(params)) || {};

    if (signId < requestId) return;

    if (res) {
      if (res.count > size) {
        return getGraph(name, res.count);
      }

      setGraphData(res.df);
    }

    setGraphLoading(false);
  };

  const onIpChange = (value: string, option: any) => {
    setSelectedTarget(option.data);
  };

  /**
   * 选择图谱
   * @param graph 图谱
   */
  const onCheck = (graph: any) => {
    selectedGraph.includes(graph.kgconfid)
      ? setSelectedGraph(pre => pre.filter(id => id !== graph.kgconfid))
      : setSelectedGraph(pre => [...pre, graph.kgconfid]);
  };

  /**
   * 全选
   * @param e
   */
  const onCheckAll = (e: any) => {
    const { checked } = e.target;

    checked ? setSelectedGraph(graphData.map(item => item.kgconfid)) : setSelectedGraph([]);
  };

  const onUpload = async (values: any) => {
    if (!selectedGraph.length) {
      message.error(intl.get('uploadService.tipSelectGraph'));

      return;
    }

    const { res, Description, ErrorCode } =
      (await serviceUploadKnowledge.uploadKnowledge({
        knId: kgData.id,
        ip: values.ip,
        token: selectedTarget.token,
        graphIds: selectedGraph,
        identifyId: kgData.identify_id
      })) || {};

    if (res) {
      message.success(intl.get('uploadService.uploadingTip'));
      onCancel(false);
      onOk?.();
    }
    if (ErrorCode) {
      ERROR_CODE[ErrorCode] ? message.error(ERROR_CODE[ErrorCode]) : message.error(Description);
    }
  };

  const onHandleOk = () => {
    form
      .validateFields()
      .then((values: any) => {
        onUpload(values);
      })
      .catch(() => {});
  };

  const onSearchChange = (e: any) => {
    getGraph(e?.target?.value);
  };

  return (
    <div>
      <div className="m-title">
        <h1>{intl.get('uploadService.uploadKg')}</h1>
      </div>

      <div className="main">
        {/* 地址选择 */}
        <div className="addr-selector">
          <Form layout="vertical" form={form}>
            {/* ||  */}
            <FormItem label={intl.get('graphList.tablename')}>
              <Select
                labelInValue
                value={{
                  label: (
                    <div className="kw-ellipsis" title={kgData?.knw_name}>
                      {kgData?.knw_name}
                    </div>
                  )
                }}
                disabled
              ></Select>
            </FormItem>
            <div className="form-row">
              <FormItem
                label={<span className="form-label">{intl.get('uploadService.targetIp')}</span>}
                name="ip"
                validateFirst={true}
                rules={[
                  {
                    required: true,
                    message: intl.get('uploadService.tiSelectIp')
                  }
                ]}
              >
                <Select
                  placeholder={intl.get('uploadService.tiSelectIp')}
                  onChange={onIpChange}
                  getPopupContainer={triggerNode => triggerNode.parentElement}
                  notFoundContent={
                    ipLoading ? (
                      <div className="loading-wrap">
                        <LoadingOutlined className="loading-icon" />
                      </div>
                    ) : (
                      <div className="select-empty">
                        <Empty image={kongImg} description={intl.get('global.noData')} />
                      </div>
                    )
                  }
                >
                  {ipData.map((item: any) => (
                    <Option key={item.id} value={item.ip} data={item}>
                      {item.ip}
                    </Option>
                  ))}
                </Select>
              </FormItem>
            </div>
          </Form>
        </div>

        <div className="flex-box">
          {/* 图谱 */}
          <div className="g-box">
            <div>
              <span className="kw-c-error">*</span>
              {intl.get('uploadService.selectKnow')}
              <Tooltip
                getPopupContainer={triggerNode => triggerNode!}
                placement="top"
                title={intl.get('uploadService.selectKnowTip')}
              >
                <QuestionCircleOutlined className="kw-c-watermark kw-ml-2 kw-pointer" />
              </Tooltip>
            </div>
            <SearchInput
              ref={searchInputRef}
              className="s-input"
              placeholder={intl.get('uploadService.inputGraph')}
              onChange={onSearchChange}
              debounce
            />

            <Checkbox
              checked={!!graphData.length && selectedGraph.length === graphData.length}
              indeterminate={!!selectedGraph.length && selectedGraph.length < graphData.length}
              disabled={!graphData.length}
              onChange={onCheckAll}
            >
              {intl.get('global.all')}
            </Checkbox>

            <div className="scroll-wrap" ref={listRef}>
              {graphData.length ? (
                <VirtualList className="v-list" data={graphData} itemKey="id" height={virtualHeight} itemHeight={48}>
                  {item => {
                    const { kgconfid, name, kgDesc } = item;

                    return (
                      <div key={kgconfid} className="li-item kw-align-center">
                        <div className="g-check">
                          <Checkbox checked={selectedGraph.includes(kgconfid)} onChange={() => onCheck(item)} />
                        </div>

                        <div className="kw-align-center">
                          <div className="img kw-center kw-border">
                            <IconFont type="icon-zhishiwangluo" className="icon"></IconFont>
                          </div>
                          <div className="kw-ml-3">
                            <div className="kw-ellipsis kw-c-text" style={{ width: 500 }} title={name}>
                              {name}
                            </div>
                            <div className="kw-ellipsis kw-c-subtext" style={{ width: 500 }} title={kgDesc}>
                              {kgDesc || '- -'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                </VirtualList>
              ) : (
                <>
                  {!graphLoading && (
                    <div className="nodata-box">
                      <img className="nodata-img" src={keyword ? noResult : kongImg} alt="no data" />
                      <p className="nodata-text">
                        {keyword ? intl.get('global.noResult2') : intl.get('global.noData')}
                      </p>
                    </div>
                  )}
                </>
              )}

              {graphLoading && (
                <div className="g-loading">
                  <LoadingOutlined className="l-icon" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="m-footer">
        <ConfigProvider autoInsertSpaceInButton={false}>
          <Button className="ant-btn-default cancel-btn" onClick={() => onCancel(false)}>
            {intl.get('global.cancel')}
          </Button>
          <Button type="primary" className="create-btn" onClick={onHandleOk}>
            {intl.get('uploadService.upload')}
          </Button>
        </ConfigProvider>
      </div>
    </div>
  );
};

const UploadKnowledgeModal: React.FC<UploadKnowledgeModalProps> = props => {
  const { visible, onCancel, kgData } = props;
  const [graphData, setGraphData] = useState<any[]>([]);
  const [selfVisible, setSelfVisible] = useState(false);

  useEffect(() => {
    if (!visible || !kgData.id) {
      !visible && setSelfVisible(false);

      return;
    }

    const init: Function = async (size = MAX_SIZE) => {
      const params = { ...defaultGraphParams, knw_id: kgData.id, size, name: '' };
      const { res } = (await serverKnowledgeNetwork.graphGetByKnw(params)) || {};

      if (res) {
        if (res.count > size) {
          return init(res.count);
        }

        if (res.df.length) {
          setGraphData(res.df);
          setSelfVisible(true);

          return;
        }
      }

      message.error(intl.get('uploadService.unSupport'));
      onCancel(false);
    };

    init();
  }, [visible, kgData]);

  return (
    <Modal
      className="upload-knowledge-network-modal"
      open={visible && selfVisible}
      focusTriggerAfterClose={false}
      destroyOnClose
      maskClosable={false}
      onCancel={() => onCancel(false)}
      width={640}
      footer={null}
    >
      <ModalContent {...props} graphData={graphData} setGraphData={setGraphData} />
    </Modal>
  );
};

export default memo(UploadKnowledgeModal);
