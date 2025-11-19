import { useState } from 'react';
import { Upload, message, Select, Button, Progress, Space, Alert } from 'antd';
import { AiOutlineInbox, AiOutlineUpload } from 'react-icons/ai';
import type { UploadProps, UploadFile } from 'antd';
import { uploadFileAPI } from '@/api/upload';

const { Dragger } = Upload;

interface UploadComponentProps {
  albumId?: number | null;
  onUploaded?: (photos: any[]) => void;
}

const qualityOptions = [
  { label: '原图 (100)', value: 100 },
  { label: '高清 (90)', value: 90 },
  { label: '均衡 (80)', value: 80 },
  { label: '压缩 (70)', value: 70 },
  { label: '极致压缩 (60)', value: 60 },
];

const UploadPanel = ({ albumId, onUploaded }: UploadComponentProps) => {
  const [quality, setQuality] = useState<number>(100);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件！');
      return Upload.LIST_IGNORE;
    }
    const isLt20M = file.size / 1024 / 1024 < 20;
    if (!isLt20M) {
      message.error('图片大小不能超过 20MB！');
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const handleChange: UploadProps['onChange'] = (info) => {
    let newFileList = [...info.fileList];
    newFileList = newFileList.filter((file) => file.status !== 'error');
    setFileList(newFileList);
  };

  const handleRemove = (file: UploadFile) => {
    const index = fileList.indexOf(file);
    const newFileList = fileList.slice();
    newFileList.splice(index, 1);
    setFileList(newFileList);
  };

  const handleUpload = async () => {
    if (!albumId) {
      message.error('未提供目标相册 ID');
      return;
    }

    if (fileList.length === 0) {
      message.warning('请先选择要上传的文件');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const originalFiles = fileList.map((file) => file.originFileObj as File);
      let filesToUpload: File[] = [];

      if (quality < 100) {
        message.loading({ content: '正在压缩图片...', key: 'compressing', duration: 0 });

        try {
          const compressPromises = originalFiles.map(async (file, index) => {
            try {
              const compressed = await compressImage(file, quality);
              const progress = Math.floor(((index + 1) / originalFiles.length) * 30);
              setUploadProgress(progress);
              return compressed;
            } catch (error) {
              console.error(`压缩 ${file.name} 失败:`, error);
              return file;
            }
          });

          filesToUpload = await Promise.all(compressPromises);

          const originalSize = originalFiles.reduce((acc, file) => acc + file.size, 0);
          const compressedSize = filesToUpload.reduce((acc, file) => acc + file.size, 0);
          const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

          message.destroy('compressing');
          message.success(`图片压缩完成，压缩率: ${ratio}%`);
        } catch {
          message.destroy('compressing');
          message.warning('部分图片压缩失败，将使用原图上传');
          filesToUpload = originalFiles;
        }
      } else {
        filesToUpload = originalFiles;
      }

      setUploadProgress(30);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await uploadFileAPI({
        files: filesToUpload,
        albumId,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      message.success(`成功上传 ${result.data.length} 张照片`);
      setFileList([]);
      onUploaded?.(result.data);

      setTimeout(() => {
        setUploadProgress(0);
      }, 2000);
    } catch (error) {
      console.error('上传失败:', error);
      message.error('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const compressImage = (file: File, qualityValue: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      if (qualityValue === 100) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target?.result as string;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('无法获取 canvas context'));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('图片压缩失败'));
                return;
              }

              const compressedFile = new File([blob], file.name, {
                type: file.type || 'image/jpeg',
                lastModified: Date.now(),
              });

              resolve(compressedFile);
            },
            file.type || 'image/jpeg',
            qualityValue / 100
          );
        };

        img.onerror = () => {
          reject(new Error('图片加载失败'));
        };
      };

      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
    });
  };

  return (
    <div className="space-y-3">
      {!albumId && <Alert type="warning" showIcon message="未指定目标相册" description="请在父级页面传入有效的相册 ID 后再使用上传功能" />}

      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <label className="block mb-2 font-medium">输出质量</label>
          <Select placeholder="请选择输出质量" value={quality} onChange={setQuality} style={{ width: '100%' }} size="large" options={qualityOptions} />
          <p className="text-sm text-gray-500 mt-2">不选择或 100 表示原图，数值越高越清晰，越低越模糊，可用于节省空间。</p>
        </div>
        <Alert message="上传提示" description="支持拖拽上传，可一次选择多个文件。支持 JPG、PNG、GIF、WEBP 等格式，单个文件不超过 20MB。" type="info" showIcon />
      </Space>

      <Dragger multiple fileList={fileList} beforeUpload={beforeUpload} onChange={handleChange} onRemove={handleRemove} disabled={!albumId || uploading} accept="image/*" listType="picture">
        <div className="flex justify-center items-center">
          <AiOutlineInbox className="text-blue-500 text-6xl" />
        </div>
        <p className="ant-upload-text !my-3">点击或拖拽文件到此区域上传</p>
      </Dragger>

      {fileList.length > 0 && (
        <div className="mt-6 flex justify-between items-center">
          <span className="text-gray-600">
            已选择 {fileList.length} 个文件，总大小：
            {(fileList.reduce((acc, file) => acc + (file.size || 0), 0) / 1024 / 1024).toFixed(2)} MB
          </span>
          <Space>
            <Button onClick={() => setFileList([])}>清空</Button>
            <Button type="primary" icon={<AiOutlineUpload />} onClick={handleUpload} loading={uploading} disabled={!albumId}>
              开始上传
            </Button>
          </Space>
        </div>
      )}

      {uploading && uploadProgress > 0 && (
        <div className="mt-6">
          <Progress percent={uploadProgress} status={uploadProgress === 100 ? 'success' : 'active'} />
        </div>
      )}
    </div>
  );
};

export default UploadPanel;
