export const fileSize1K = 1024;
export const fileSize1M = 1024 * 1024;
export const fileSize1G = 1024 * 1024 * 1024;

interface ThreadType {
  key: string;
  file: Blob;
}
interface Retry {
  limit: number;
}

interface UploadFileType {
  file: Blob;
  limitSize: number;
  chunkSize: number;
  accept?: string[];
  retryCfg?: Retry;
  concurrency?: number;
  onFail?: (data: any) => void;
  onSuccess?: (data: any) => void;
  onProgress?: (data: any) => void;
  fetch?: (data: ThreadType) => Promise<string>;
}

class ControllerUploadFile {
  /** 待上传文件 */
  _file: Blob;
  /** 校验文件类型 */
  accept: string[];
  /** 文件限制大小 */
  limitSize: number;
  /** 文件分片大小 */
  chunkSize: number;
  /** 上传重试配置 */
  retryCfg?: Retry;
  /** 上传分片的并发数量 */
  concurrency?: number;
  /** 已重试的次数 */
  retriedTime: number;
  /** 自定义的上传接口 */
  _fetch: (data: any) => Promise<string>;
  /** 上传失败回调 */
  onFail: (data: any) => void;
  /** 上传成功回调 */
  onSuccess: (data: any) => void;
  /** 上传进度回调 */
  onProgress: (data: any) => void;

  /** 是否中断请求 */
  _cancel: boolean;
  /** 文件分片的列表 */
  fileChunks: ThreadType[];
  /** 文件分片上传失败的列表 */
  errorChunks: ThreadType[];
  /** 文件分片上传成功的列表 */
  successChunks: ThreadType[];
  /** 文件上传进度 */
  progress: number;
  /** 文件上传的状态 */
  status: 'pending' | 'uploading' | 'success' | 'fail';
  /** 网络状态 */
  networkStatus: 'ONLINE' | 'OFFLINE';

  constructor(init: UploadFileType) {
    const {
      file,
      accept,
      limitSize,
      chunkSize,
      concurrency = 4,
      retryCfg = { limit: 3 },
      fetch = () => new Promise(resolve => resolve('success')),
      onFail,
      onSuccess,
      onProgress
    } = init;
    this._file = file;
    this.accept = accept || [];
    this.limitSize = limitSize || fileSize1G / 2;
    this.chunkSize = chunkSize || fileSize1M * 20;
    this.retriedTime = 0;
    this.retryCfg = retryCfg;
    this.concurrency = concurrency || 4;
    this._fetch = fetch;
    this.onFail = onFail || function () {};
    this.onSuccess = onSuccess || function () {};
    this.onProgress = onProgress || function () {};

    this._cancel = false;
    this.fileChunks = [];
    this.errorChunks = [];
    this.successChunks = [];
    this.progress = 0;
    this.status = 'pending';
    this.networkStatus = 'ONLINE';

    // window.addEventListener('online', this.updateOnlineStatus);
    // window.addEventListener('offline', this.updateOnlineStatus);
  }

  updateOnlineStatus() {
    const condition = navigator.onLine ? 'ONLINE' : 'OFFLINE';
    this.networkStatus = condition || 'ONLINE';
  }

  removeEventListener() {
    window.removeEventListener('online', this.updateOnlineStatus);
    window.removeEventListener('offline', this.updateOnlineStatus);
  }

  init() {
    this._cancel = false;
    this.fileChunks = [];
    this.errorChunks = [];
    this.successChunks = [];
    this.progress = 0;
    this.status = 'pending';
  }

  get file() {
    return this._file;
  }
  set file(data: Blob) {
    this.init();
    this._file = data;
  }

  get fetch() {
    return this._fetch;
  }
  set fetch(data: any) {
    this._fetch = data;
  }

  get cancel() {
    return this._cancel;
  }
  set cancel(data: boolean) {
    this._cancel = data;
  }

  /** 报错信息 */
  createError(code: number, detail?: string) {
    const errors: any = {
      1001: '文件不存在。',
      1002: `文件类型。${detail}`,
      1003: `文件过大。${detail}`
    };
    const defaultError = '出现错误。';

    return errors[code] || defaultError;
  }

  /** 更新上传进度 */
  updateProgress() {
    const step = Number((100 / this.fileChunks.length).toFixed(2));
    this.progress = Number((this.successChunks.length * step).toFixed(2));

    if (this.progress < 0) this.progress = 0;
    if (this.progress > 100) this.progress = 100;
    if (this.status === 'success') this.progress = 100;
    this.onProgress(this.progress);
  }

  /** 更新上传状态 */
  updateStatus(status: 'pending' | 'uploading' | 'success' | 'fail') {
    this.status = status;
  }

  onHandelFail(data: { message: string; detail: string; data?: any }) {
    this.updateStatus('fail');
    this.updateProgress();
    this.onFail(data);
  }

  onHandelSuccess(data: { message: string; detail: string }) {
    this.updateStatus('success');
    this.updateProgress();
    this.onSuccess(data);
  }

  /** 文件校验 */
  checkFile = (file: any) => {
    return new Promise((resolve, reject) => {
      if (file) {
        reject(this.createError(1001));
        return;
      }
      if (Array.isArray(this.accept) && this.accept.length > 0 && !this.accept.includes(file.type)) {
        reject(this.createError(1002, `可接受类型为：${this.accept.join('、')}`));
        return;
      }
      if (this.limitSize < file.size) {
        reject(this.createError(1003, `文件大小不得超过：${this.limitSize}`));
        return;
      }
      resolve(true);
    });
  };

  /** 文件切片 */
  sliceFile = (file: Blob = this.file, size: number = this.chunkSize): Promise<ThreadType[]> => {
    return new Promise((resolve, reject) => {
      if (!file) reject(this.createError(1001));
      const result: ThreadType[] = [];
      let key = 1;
      for (let i = 0; i < file.size; i += size) {
        result.push({ key: String(key++), file: file.slice(i, i + size) });
      }
      this.fileChunks = result;
      resolve(result);
    });
  };

  /** 文件分片上传 */
  onUpload(files: ThreadType[], type?: string) {
    if (type === 'start' && (!Array.isArray(files) || files.length === 0)) {
      this.onHandelFail({ message: 'fail', detail: 'no file' });
    }

    const firstController = Math.min(files.length, this.concurrency || 4);
    let delayedCompletedNumber = 0;
    let chunksIndex = firstController;

    // 开始任务
    const thread = async (_index: number) => {
      if (this._cancel) return;
      const chunkFile = files[_index];
      try {
        // if (this.networkStatus === 'OFFLINE') {
        //   this.onHandelFail({ message: 'fail', detail: 'network offline' });
        //   return;
        // }
        await this._fetch(chunkFile);
        this.successChunks.push(chunkFile);
      } catch (error: any) {
        this.errorChunks.push(chunkFile);
      }

      this.updateProgress();

      if (chunksIndex < files.length) {
        thread(chunksIndex++);
        return;
      }

      delayedCompletedNumber += 1;
      if (delayedCompletedNumber === firstController) {
        if (this.errorChunks.length === 0) {
          // 文件分片全部且没有报错的分片
          this.onHandelSuccess({ message: 'success', detail: 'upload completed' });
          this.init();
        } else {
          if (this.retryCfg && (this.retriedTime < this.retryCfg?.limit || 0)) {
            this.retriedTime += 1;
            this.onRetry();
            return;
          }
          this.onHandelFail({ message: 'fail', detail: 'some chunks upload fail', data: this.errorChunks });
        }
      }
    };

    this.updateStatus('uploading');
    for (let index = 0; index < firstController; index++) {
      thread(index);
    }
  }

  onJus() {}

  /** 失败的分片重试 */
  onRetry() {
    const files = this.errorChunks;
    this.errorChunks = [];
    this.onUpload(files, 'retry');
  }

  /** 重新上传 */
  onReUpload() {
    this.init();
    this.onEmit(this.fileChunks);
  }

  /** 开始上传文件 */
  onEmit(files: ThreadType[] = this.fileChunks) {
    if (!files || files.length === 0) {
      this.sliceFile()
        .then((result: ThreadType[]) => {
          this.onEmit(result);
          this.updateProgress();
        })
        .catch((error: any) => {
          this.onHandelFail({ message: 'fail', detail: error });
        });
      return;
    }
    this.onUpload(files, 'start');
    this.updateProgress();
  }
}

export default ControllerUploadFile;
