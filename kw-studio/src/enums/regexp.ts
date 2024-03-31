/** 中英文数字及键盘上的特殊字符 */
const ONLY_KEYBOARD = /^[\s\u4e00-\u9fa5a-zA-Z0-9!-~？！，、；。……：“”‘’（）｛｝《》【】～￥—·]+$/;
/** 中英文数字及下划线 */
const ONLY_NORMAL_NAME = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/g;

export { ONLY_KEYBOARD, ONLY_NORMAL_NAME };
