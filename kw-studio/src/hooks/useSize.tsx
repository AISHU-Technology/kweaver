import { useState, useEffect } from 'react';
import { getTargetElement } from '@/utils/handleFunction';

const useSize = (target: any) => {
  const [state, setState] = useState({
    width: 0,
    height: 0
  });

  useEffect(() => {
    const targetElement = getTargetElement(target);
    if (!targetElement) {
      return;
    }
    const observer = new ResizeObserver((entries: any[]) => {
      entries.forEach(entry => {
        const { width, height } = entry.target.getBoundingClientRect();
        setState({
          width,
          height
        });
      });
    });
    observer.observe(targetElement);
    return () => {
      observer.disconnect();
    };
  }, [target]);

  return {
    ...state
  };
};

export default useSize;
