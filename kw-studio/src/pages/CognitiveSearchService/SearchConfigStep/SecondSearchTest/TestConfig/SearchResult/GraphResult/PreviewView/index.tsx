import React, { useEffect } from 'react';
import { Carousel, Pagination } from 'antd';
import intl from 'react-intl-universal';
// import UniversalModal from '@/components/UniversalModal';
import TemplateModal from '@/components/TemplateModal';
import TextInfo from '../TextInfo';
import GraphInfo from '../GraphInfo';
import ExploreGraphInfo from '../ExploreGraphInfo';
import LazyRender from './LazyRender';
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
    shouldExplore = true, // 子图是否可探索, 默认可探索
    basicData,
    advGaConfig,
    isUpdate
  } = props;
  const carouselPreveiwRef = React.useRef<any>();

  useEffect(() => {
    if (!isVisiblePreview) return;
    setTimeout(() => {
      carouselPreveiwRef.current?.goTo?.(screenShotSlideIndex);
    }, 0);
  }, [isVisiblePreview, carouselPreveiwRef]);

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
    <TemplateModal
      title={intl.get('cognitiveSearch.graphQA.viewSub')}
      visible={isVisiblePreview}
      onCancel={handleCancel}
      footer={null}
      className="view-subgraph-modal-root"
    >
      <Carousel dots={false} ref={carouselPreveiwRef} infinite={false} easing="none" effect="fade">
        {resData.map((item: any, index: number) => {
          const { answer, score, kg_name, subgraph, kg_id, title, intent } = item;
          return (
            <LazyRender key={index + query_text} ready={index === screenShotSlideIndex}>
              <div className="carousel-preview-item">
                <div className="carousel-preview-info">
                  <TextInfo
                    visible={isVisiblePreview}
                    answer={answer}
                    score={score}
                    kg_name={kg_name}
                    inputTitle={title}
                  />
                  <div className="kw-center kw-mt-2">
                    <Pagination
                      size="small"
                      onChange={(e: any) => handlePreviewSlider(e)}
                      className="info-extra-pagination"
                      simple
                      current={screenShotSlideIndex + 1}
                      total={count * 10}
                    />
                  </div>
                </div>
                <div className="rightCanvas">
                  {shouldExplore ? (
                    <ExploreGraphInfo
                      graphId={kg_id}
                      subgraph={subgraph}
                      basicData={basicData}
                      advGaConfig={advGaConfig}
                      intent={intent}
                      isUpdate={isUpdate}
                    />
                  ) : (
                    <GraphInfo isVisiblePreview={isVisiblePreview} subgraph={subgraph} />
                  )}
                </div>
              </div>
            </LazyRender>
          );
        })}
      </Carousel>
    </TemplateModal>
  );
};

export default PreviewView;
