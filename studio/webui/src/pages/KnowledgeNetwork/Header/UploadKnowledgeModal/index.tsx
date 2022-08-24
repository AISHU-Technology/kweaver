/**
 * 上传知识网络弹窗
 * @author Jason.ji
 * @date 2022/04/11
 *
 */

import React, { memo, useState, useEffect, useRef } from 'react';
import { ConfigProvider, Modal, Button, Form, Select, Checkbox, message, Empty } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import VirtualList from 'rc-virtual-list';
import SearchInput from '@/components/SearchInput';
import serviceUploadKnowledge from '@/services/uploadKnowledge';
import serverKnowledgeNetwork from '@/services/knowledgeNetwork';
import kongImg from '@/assets/images/kong.svg';
import noResult from '@/assets/images/noResult.svg';
import './style.less';

export interface UploadKnowledgeModalProps {
  kgData: Record<string, any>; // 上传的知识网络
  visible: boolean; // 弹窗是否可见
  onOk?: Function; // 点击确定后的回调
  setVisible: Function; // 控制弹窗是否可见
}

const FormItem = Form.Item;
const { Option } = Select;
const MAX_SIZE = 3000; // 一次性拿取数据
const defaultIpParams = { page: 1, keyword: '', order: 'created', reverse: 1 }; // 获取所有ip地址
const defaultGraphParams = { page: 1, order: 'desc', rule: 'update', upload_graph: true }; // 获取所有图谱
let requestId = 0; // 标记网络请求

const ModalContent: React.FC<UploadKnowledgeModalProps & { graphData: any[]; setGraphData: Function }> = ({
  kgData,
  onOk,
  setVisible,
  graphData,
  setGraphData
}) => {
  const listRef = useRef<any>(); // 图谱列表
  const searchInputRef = useRef<any>(); // 搜索框
  const [form] = Form.useForm();
  const [ipData, setIpData] = useState<any[]>([]); // ip地址列表
  const [selectedTarget, setSelectedTarget] = useState<any>({}); // 选择的目标地址数据
  const [selectedGraph, setSelectedGraph] = useState<any[]>([]); // 选择的图谱
  const [ellipsisDesc, setEllipsisDesc] = useState(''); // 描述折叠时显示的文本
  const [descBtnStatus, setDescBtnStatus] = useState<null | { isOpen: boolean }>(null); // 描述多行展开按钮
  const [ipLoading, setIpLoading] = useState(false); // 加载ip地址
  const [graphLoading, setGraphLoading] = useState(false); // 加载图谱
  const [virtualHeight, setVirtualHeight] = useState(0); // 虚拟列表高度
  const [keyword, setKeyword] = useState(''); // 搜索关键字

  useEffect(() => {
    getIpList();
    initDesc(kgData.knw_description);
  }, [kgData]);

  // 描述展开收起时重新设置虚拟列表高度
  useEffect(() => {
    setVirtualHeight(listRef.current?.clientHeight);
  }, [descBtnStatus]);

  /**
   * 初始化描述
   */
  const initDesc = (desc = '') => {
    const expectLen = countText(desc);

    // 原样展示
    if (expectLen === desc.length) return;

    setEllipsisDesc(desc.slice(0, expectLen));
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

    // 两行足够显示
    if (node.clientHeight / 22 <= 2) {
      node.remove();

      return text.length;
    }

    // 逐个减少字数计算
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

      // 只有一个地址时直接选中
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

  // 选择上传地址回调
  const onIpChange = (value: string, option: any) => {
    setSelectedTarget(option.data);
  };

  // 搜索
  const onSearch = () => {
    const { value } = searchInputRef.current.input;

    getGraph(value);
  };

  /**
   * 选择图谱
   * @param graph 图谱
   */
  const onCheck = (graph: any) => {
    selectedGraph.includes(graph.id)
      ? setSelectedGraph(pre => pre.filter(id => id !== graph.id))
      : setSelectedGraph(pre => [...pre, graph.id]);
  };

  /**
   * 全选
   * @param e
   */
  const onCheckAll = (e: any) => {
    const { checked } = e.target;

    checked ? setSelectedGraph(graphData.map(item => item.id)) : setSelectedGraph([]);
  };

  // 上传
  const onUpload = async (values: any) => {
    if (!selectedGraph.length) {
      message.error(intl.get('uploadService.tipSelectGraph'));

      return;
    }

    const { res, Description } =
      (await serviceUploadKnowledge.uploadKnowledge({
        knId: kgData.id,
        ip: values.ip,
        token: selectedTarget.token,
        graphIds: selectedGraph,
        identifyId: kgData.identify_id
      })) || {};

    if (res) {
      message.success(intl.get('uploadService.uploading'));
      setVisible(false);
      onOk?.();
    }

    Description && message.error(Description);
  };

  // 点击上传
  const onHandleOk = (e: React.MouseEvent) => {
    form
      .validateFields()
      .then((values: any) => {
        onUpload(values);
      })
      .catch((err: any) => {});
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
          {/* 知识网络信息 */}
          <div className="kg-info">
            <div className="icon-box">
              <div
                className="name-Icon"
                style={{
                  background: `${kgData?.color}15`,
                  color: kgData?.color,
                  border: `1px solid ${`${kgData?.color}10`}`
                }}
              >
                {kgData?.knw_name?.substring(0, 1)}
              </div>
            </div>
            <div className="info-box">
              <h2 className="kg-name ellipsis-one">{kgData.knw_name}</h2>
              <span className="id-span ellipsis-one">【ID:{kgData.id}】</span>
              <p className="kg-desc">
                {descBtnStatus ? (
                  <>
                    {descBtnStatus.isOpen ? (
                      <>
                        {kgData.knw_description}
                        <span className="create-span" onClick={() => setDescBtnStatus({ isOpen: false })}>
                          {intl.get('global.unExpand')}
                        </span>
                      </>
                    ) : (
                      <>
                        {ellipsisDesc}...
                        <span className="create-span" onClick={() => setDescBtnStatus({ isOpen: true })}>
                          {intl.get('global.expand')}
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <>{kgData.knw_description || intl.get('global.notDes')}</>
                )}
              </p>
            </div>
          </div>

          {/* 图谱 */}
          <div className="graph-box">
            <SearchInput
              ref={searchInputRef}
              className="s-input"
              placeholder={intl.get('uploadService.inputGraph')}
              onPressEnter={onSearch}
            />
            <div className="graph-header">
              <span title={intl.get('global.checkAll')}>
                <Checkbox
                  checked={!!graphData.length && selectedGraph.length === graphData.length}
                  indeterminate={!!selectedGraph.length && selectedGraph.length < graphData.length}
                  disabled={!graphData.length}
                  onChange={onCheckAll}
                />
              </span>
              <h2>{intl.get('uploadService.allGraph')}</h2>
            </div>

            <div className="scroll-wrap" ref={listRef}>
              {graphData.length ? (
                <VirtualList className="v-list" data={graphData} itemKey="id" height={virtualHeight} itemHeight={48}>
                  {(item, index) => {
                    const { id, name } = item;

                    return (
                      <div key={id} className="li-item">
                        <div className="g-check">
                          <Checkbox checked={selectedGraph.includes(id)} onChange={() => onCheck(item)} />
                        </div>
                        <p className="g-name ellipsis-one" title={name}>
                          {name}
                        </p>
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
                        {keyword ? intl.get('memberManage.searchNull') : intl.get('global.noData')}
                      </p>
                    </div>
                  )}
                </>
              )}

              {graphLoading && (
                <div className="graph-loading">
                  <LoadingOutlined className="l-icon" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="m-footer">
        <ConfigProvider autoInsertSpaceInButton={false}>
          <Button className="ant-btn-default cancel-btn" onClick={() => setVisible(false)}>
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
  const { visible, setVisible, kgData } = props;
  const [graphData, setGraphData] = useState<any[]>([]); // 全部图谱
  const [selfVisible, setSelfVisible] = useState(false); // 内部弹窗控制

  // 先判断图谱数量, 图谱为空不打开弹窗
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
      setVisible(false);
    };

    init();
  }, [visible, kgData]);

  return (
    <Modal
      className="upload-knowledge-network-modal"
      visible={visible && selfVisible}
      focusTriggerAfterClose={false}
      destroyOnClose
      maskClosable={false}
      onCancel={() => setVisible(false)}
      width={640}
      footer={null}
    >
      <ModalContent {...props} graphData={graphData} setGraphData={setGraphData} />
    </Modal>
  );
};

export default memo(UploadKnowledgeModal);
