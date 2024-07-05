import React, { useEffect, useRef, useState } from 'react';
import { Button, Modal, Carousel, Pagination } from 'antd';
import { LeftCircleOutlined, RightCircleOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import TextInfo from '../TextInfo';
import GraphInfo from '../GraphInfo';
import './style.less';

const PreviewView = (props: any) => {
  const {
    isVisiblePreview,
    handleModalClose,
    screenShotSlideIndex,
    resData,
    handleScreenShotSlider,
    query_text,
    count,
    setCurrentSlide,
    basicData
  } = props;
  const carouselPreveiwRef = React.createRef<any>();

  useEffect(() => {
    if (carouselPreveiwRef.current) {
      carouselPreveiwRef.current.goTo(screenShotSlideIndex);
      setCurrentSlide(screenShotSlideIndex);
    }
  }, [carouselPreveiwRef]);

  const handleCancel = () => {
    handleModalClose();
  };

  /**
   * 切换图谱
   */
  const handlePreviewSlider = (page: number) => {
    carouselPreveiwRef.current?.goTo(page - 1);
    handleScreenShotSlider(page);
  };

  return (
    <Modal
      title={intl.get('cognitiveSearch.graphQA.viewSub')}
      width={'1000px'}
      bodyStyle={{ height: '720px', padding: 0 }}
      open={isVisiblePreview}
      onCancel={handleCancel}
      footer={null}
      className="view-subgraph-modal-root"
    >
      <Carousel dots={false} ref={carouselPreveiwRef} infinite={false}>
        {resData.map((item: any, index: number) => {
          const { answer, score, kg_name, subgraph, title } = item;
          return (
            <div className="carousel-preview-item" key={index + query_text}>
              <GraphInfo isVisiblePreview={isVisiblePreview} subgraph={subgraph} />
              <div className="carousel-preview-info">
                <TextInfo
                  visible={isVisiblePreview}
                  answer={answer}
                  score={score}
                  kg_name={kg_name}
                  inputTitle={title}
                />
              </div>
            </div>
          );
        })}
      </Carousel>
      <div className="kw-center kw-mt-3">
        <Pagination
          size="small"
          onChange={(e: any) => handlePreviewSlider(e)}
          className="info-extra-pagination"
          simple
          current={screenShotSlideIndex + 1}
          total={count * 10}
        />
      </div>
    </Modal>
  );
};

export default PreviewView;
