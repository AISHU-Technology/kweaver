import React, { useEffect, useRef, useState } from 'react';
import { Pagination, Carousel } from 'antd';
import _ from 'lodash';
import IconPreRender from '@/components/IconPreRender';
import TextInfo from './TextInfo';
import PreviewView from './PreviewView';
import './style.less';

const GraphResult = (props: any) => {
  const {
    res: { count, data: resData, exploration_switch },
    basicData,
    advGaConfig,
    isUpdate
  } = props;
  const [isVisiblePreview, setIsVisiblePreview] = useState<any>(false);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [slideCount, setSlideCount] = useState<number>();
  const qaWrapperRef = useRef<any>();
  const carouselRef = React.createRef<any>();
  const [operateType, setOperateType] = useState('qa'); // subGraph-查看子图 qa-搜索结果qa展示

  useEffect(() => {
    if (_.isEmpty(resData)) return;
    if (resData?.length) setSlideCount(resData?.length - 1);
  }, [resData]);

  const handleCancel = () => {
    setIsVisiblePreview(false);
    setOperateType('qa');
  };
  const showModalCallback = () => {
    setIsVisiblePreview(true);
    setOperateType('subGraph');
  };
  const onChange = (index: number) => {
    setCurrentSlide(index);
  };

  /**
   * 切换页数
   */
  const handleScreenShotSlider = (direct: number) => {
    carouselRef.current?.goTo(direct - 1);
    setCurrentSlide(direct - 1);
  };

  return (
    <>
      {count ? (
        <>
          <IconPreRender />
          <div className="searchResult-wrapper" ref={qaWrapperRef}>
            <Carousel afterChange={onChange} dots={false} ref={carouselRef} infinite={false}>
              {resData.map((item: any, index: number) => {
                const { answer, score, kg_name, title } = item;
                return (
                  <div className="carousel-item" key={index}>
                    <TextInfo
                      answer={answer}
                      score={score}
                      count={count}
                      kg_name={kg_name}
                      visible={isVisiblePreview}
                      showModalCallback={showModalCallback}
                      operateType={operateType}
                      inputTitle={title}
                    />
                  </div>
                );
              })}
            </Carousel>
            <div className="kw-center kw-w-100">
              <Pagination
                size="small"
                onChange={(e: any) => handleScreenShotSlider(e)}
                className="info-extra-pagination kw-mt-6"
                simple
                current={currentSlide + 1}
                total={count * 10}
              />
            </div>
          </div>
          <PreviewView
            isVisiblePreview={isVisiblePreview}
            count={count}
            handleModalClose={handleCancel}
            screenShotSlideIndex={currentSlide}
            resData={resData}
            shouldExplore={exploration_switch}
            slideCount={slideCount}
            handleScreenShotSlider={handleScreenShotSlider}
            setOperateType={setOperateType}
            basicData={basicData}
            advGaConfig={advGaConfig}
            isUpdate={isUpdate}
          />
        </>
      ) : null}
    </>
  );
};

export default GraphResult;
