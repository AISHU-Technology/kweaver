import React from 'react';
export const onPreventMouseDown = (event?: any) => {
  event?.preventDefault();
  event?.stopPropagation();
};
