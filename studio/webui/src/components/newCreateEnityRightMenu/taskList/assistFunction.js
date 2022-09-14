import csvImage from '@/assets/images/csv.svg';
import jsonImage from '@/assets/images/json.svg';
import DataSheet from '@/assets/images/DataSheet.svg';
import folderImage from '@/assets/images/Folder-blue.svg';

const getFileType = type => {
  if (type === 'table') {
    return DataSheet;
  }

  if (type === 'files') {
    return folderImage;
  }

  if (type === 'json') {
    return jsonImage;
  }

  if (type === 'csv') {
    return csvImage;
  }

  if (type === 'multi-files') {
    return folderImage;
  }

  if (type === 'mysql') {
    return DataSheet;
  }

  if (type === 'hive') {
    return DataSheet;
  }
};

// /**
//  * @description 删除任务的时候删除点
//  */
// const deleteNode = (createGraphData, taskId) => {
//   let { nodes, edges } = createGraphData;
//   let uniqueMarker = [];

//   nodes = nodes.filter((item, index) => {
//     return !(item.task_id && item.task_id === taskId && item.source_type !== 'manual');
//   });

//   nodes.forEach((item, index) => {
//     uniqueMarker = [...uniqueMarker, item];
//   });

//   edges = edges.filter((item, index) => {
//     return uniqueMarker.includes(item.start) && uniqueMarker.includes(item.end);
//   });

//   return { nodes, edges };
// };

/**
 * @description 是否显示加载
 */
// const isLoadType = (pathname, search) => {
//   if (pathname === '/home/create-entity' && search) {
//     if (search.split('&')[1] === 'type=edit') {
//       return true;
//     }
//   }

//   return false;
// };

/**
 * @description 是否在流程中
 */
const isFlow = () => {
  if (window.location.pathname === '/home/workflow/edit' || window.location.pathname === '/home/workflow/create') {
    return true;
  }

  return false;
};

const analyUrl = url => {
  if (isFlow()) {
    return { name: '', type: '' };
  }

  if (url === '') {
    return { name: '', type: '' };
  }

  return { name: url.split('&')[0].substring(13), type: url.split('&')[1].substring(5) };
};

export { getFileType, analyUrl, isFlow };
