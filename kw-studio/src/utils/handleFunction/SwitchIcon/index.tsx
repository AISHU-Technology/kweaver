/**
 * 根据文件后缀名显示文件对应的图标
 */

import React from 'react';
import IconFont from '@/components/IconFont';
import { getPostfix } from '@/utils/handleFunction';

const excelList = ['xlsx', 'et', 'xlsm', 'xlsb', 'xls', 'xltx', 'xltm', 'xlt', 'xml', 'ods', 'xla'];
const pptList = ['pptx', 'ppt', 'pot', 'pps', 'ppsx', 'pptm', 'potx', 'potm', 'ppsm', 'dps', 'odp', 'ppam', 'ppa'];
const wordList = ['doc', 'docx', 'dotx', 'dot', 'odt', 'wps', 'docm', 'dotm', 'ott'];
const txtList = ['txt', 'rtf', 'dic', 'log', 'md'];
const imgList = ['bmp', 'jpg', 'png', 'tif', 'gif', 'tga', 'raw', 'svg', 'webp', 'ico', 'jpeg', 'wmf', 'emf'];
const videoList = [
  'mp4',
  'avi',
  'flv',
  'mkv',
  'rmvb',
  'rm',
  'wif',
  'vob',
  'mpeg',
  'mpg',
  'asf',
  'mov',
  'wmv',
  '3gp',
  'mts',
  'mt2s'
];
const audioList = [
  'mp3',
  'wma',
  'wav',
  'ogg',
  'm4a',
  'flac',
  'ape',
  'aac',
  'wv',
  'mp2',
  'ac3',
  'mpc',
  'mka',
  'mpa',
  'dts',
  'mid'
];
const aiList = ['ai'];
const psList = ['ps', 'psd', 'psb'];
const compressList = [
  'zip',
  '7z',
  'rar',
  'tgz',
  'tar',
  'gz',
  'gz2',
  'bz',
  'bz2',
  'iso',
  'cab',
  'tgz',
  'uue',
  'jar',
  'ace',
  'lzh',
  'arj',
  'gzip',
  'rpm'
];
const cadList = ['cad', 'dwg', 'dxf'];
const exeList = ['exe', 'msi', 'bat'];

interface CustomIconProps {
  size: number;
}

const DirIcon: React.FC<CustomIconProps> = ({ size }) => <IconFont type="icon-Folder" style={{ fontSize: size }} />;
const SheetIcon: React.FC<CustomIconProps> = ({ size }) => (
  <IconFont type="icon-DataSheet" style={{ fontSize: size }} />
);
const SqlIcon: React.FC<CustomIconProps> = ({ size }) => <IconFont type="icon-SQL" style={{ fontSize: size }} />;
const WordArIcon: React.FC<CustomIconProps> = ({ size }) => (
  <IconFont type="icon-shitushuju" style={{ fontSize: size }} />
);
const WordIcon: React.FC<CustomIconProps> = ({ size }) => <IconFont type="icon-word" style={{ fontSize: size }} />;
const CsvIcon: React.FC<CustomIconProps> = ({ size }) => <IconFont type="icon-csv" style={{ fontSize: size }} />;
const JsonIcon: React.FC<CustomIconProps> = ({ size }) => <IconFont type="icon-json" style={{ fontSize: size }} />;
const XlsIcon: React.FC<CustomIconProps> = ({ size }) => <IconFont type="icon-xls" style={{ fontSize: size }} />;
const TextIcon: React.FC<CustomIconProps> = ({ size }) => <IconFont type="icon-txt" style={{ fontSize: size }} />;
const PdfIcon: React.FC<CustomIconProps> = ({ size }) => <IconFont type="icon-pdf" style={{ fontSize: size }} />;
const PptIcon: React.FC<CustomIconProps> = ({ size }) => <IconFont type="icon-ppt" style={{ fontSize: size }} />;
const HtmlIcon: React.FC<CustomIconProps> = ({ size }) => <IconFont type="icon-html" style={{ fontSize: size }} />;
const VideoIcon: React.FC<CustomIconProps> = ({ size }) => <IconFont type="icon-shipin" style={{ fontSize: size }} />;
const AudioIcon: React.FC<CustomIconProps> = ({ size }) => <IconFont type="icon-yinpin" style={{ fontSize: size }} />;
const AiIcon: React.FC<CustomIconProps> = ({ size }) => <IconFont type="icon-ai" style={{ fontSize: size }} />;
const ImgIcon: React.FC<CustomIconProps> = ({ size }) => <IconFont type="icon-tupian" style={{ fontSize: size }} />;
const ExeIcon: React.FC<CustomIconProps> = ({ size }) => <IconFont type="icon-exechengxu" style={{ fontSize: size }} />;
const PsIcon: React.FC<CustomIconProps> = ({ size }) => <IconFont type="icon-ps" style={{ fontSize: size }} />;
const PressIcon: React.FC<CustomIconProps> = ({ size }) => <IconFont type="icon-yasuo" style={{ fontSize: size }} />;
const CadIcon: React.FC<CustomIconProps> = ({ size }) => <IconFont type="icon-cad" style={{ fontSize: size }} />;
const UnknownIcon: React.FC<CustomIconProps> = ({ size }) => (
  <IconFont type="icon-file-unknown" style={{ fontSize: size }} />
);
UnknownIcon.displayName = 'UnknownIcon';

/**
 * 根据文件后缀显示图标
 * @param {String} type 文件夹'dir', 数据表'sheet', 文件'file'
 * @param {String} fileName 带文件后缀的文件名
 * @param {Number} size 图标大小, 即font-size, 默认20px
 */
const switchIcon = (type = 'file', fileName = '', size = 20, source = '') => {
  if (type === 'dir') return <DirIcon size={size} />;

  if (type === 'sheet') {
    return source === 'AnyRobot' ? <WordArIcon size={size} /> : <SheetIcon size={size} />;
  }

  if (type === 'sql') return <SqlIcon size={size} />;

  if (type === 'file') {
    const postfix = getPostfix(fileName);

    if (wordList.includes(postfix)) return <WordIcon size={size} />;
    if (postfix === 'csv') return <CsvIcon size={size} />;
    if (postfix === 'json') return <JsonIcon size={size} />;
    if (txtList.includes(postfix)) return <TextIcon size={size} />;
    if (excelList.includes(postfix)) return <XlsIcon size={size} />;
    if (postfix === 'pdf') return <PdfIcon size={size} />;
    if (pptList.includes(postfix)) return <PptIcon size={size} />;
    if (postfix.includes('htm')) return <HtmlIcon size={size} />;
    if (videoList.includes(postfix)) return <VideoIcon size={size} />;
    if (audioList.includes(postfix)) return <AudioIcon size={size} />;
    if (aiList.includes(postfix)) return <AiIcon size={size} />;
    if (imgList.includes(postfix)) return <ImgIcon size={size} />;
    if (psList.includes(postfix)) return <PsIcon size={size} />;
    if (compressList.includes(postfix)) return <PressIcon size={size} />;
    if (cadList.includes(postfix)) return <CadIcon size={size} />;
    if (exeList.includes(postfix)) return <ExeIcon size={size} />;
    if (postfix === 'sql') return <SheetIcon size={size} />;
  }

  return <UnknownIcon size={size} />;
};

export { switchIcon };
