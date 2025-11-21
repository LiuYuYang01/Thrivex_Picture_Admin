import { useState, useEffect } from 'react';
import { Card, Upload, message, Select, Button, Progress, Space, Alert, Image, Tag } from 'antd';
import { AiOutlineInbox, AiOutlineUpload, AiOutlineDelete, AiOutlineCheckCircle } from 'react-icons/ai';
import type { UploadProps, UploadFile } from 'antd';
import { uploadFileAPI } from '@/api/upload';
import { getAlbumListAPI } from '@/api/album';
import type { Album } from '@/types/album';
import { useNavigate } from 'react-router';

const { Dragger } = Upload;

interface UploadedPhoto {
  id: number;
  name: string;
  url: string;
  size: number;
}

export default () => {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);
  const [quality, setQuality] = useState<number>(100);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const qualityOptions = [
    { label: '原图 (100)', value: 100 },
    { label: '高清 (90)', value: 90 },
    { label: '均衡 (80)', value: 80 },
    { label: '压缩 (70)', value: 70 },
    { label: '极致压缩 (60)', value: 60 },
  ];

  // 加载相册列表
  const loadAlbums = async () => {
    try {
      const { data } = await getAlbumListAPI({ page: 1, limit: 100 });
      setAlbums(data.result);
      // 如果有相册，默认选择第一个
      if (data.result.length > 0 && !selectedAlbumId) {
        setSelectedAlbumId(data.result[0].id);
      }
    } catch {
      message.error('加载相册列表失败');
    }
  };

  useEffect(() => {
    loadAlbums();
  }, []);

  // 上传前检查
  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件！');
      return Upload.LIST_IGNORE;
    }
    const isLt30M = file.size / 1024 / 1024 < 30;
    if (!isLt30M) {
      message.error('图片大小不能超过 30MB！');
      return Upload.LIST_IGNORE;
    }
    return false; // 阻止自动上传
  };

  // 文件列表变化
  const handleChange: UploadProps['onChange'] = (info) => {
    let newFileList = [...info.fileList];
    // 过滤掉状态为 error 的文件
    newFileList = newFileList.filter((file) => file.status !== 'error');
    setFileList(newFileList);
  };

  // 移除文件
  const handleRemove = (file: UploadFile) => {
    const index = fileList.indexOf(file);
    const newFileList = fileList.slice();
    newFileList.splice(index, 1);
    setFileList(newFileList);
  };

  // 开始上传
  const handleUpload = async () => {
    if (!selectedAlbumId) {
      message.error('请选择目标相册');
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

      // 如果需要压缩，先压缩所有图片
      let filesToUpload: File[] = [];

      if (quality < 100) {
        message.loading({ content: '正在压缩图片...', key: 'compressing', duration: 0 });

        try {
          // 并行压缩所有图片
          const compressPromises = originalFiles.map(async (file, index) => {
            try {
              const compressed = await compressImage(file, quality);
              // 更新压缩进度
              const progress = Math.floor(((index + 1) / originalFiles.length) * 30);
              setUploadProgress(progress);
              return compressed;
            } catch (error) {
              console.error(`压缩 ${file.name} 失败:`, error);
              // 如果压缩失败，使用原图
              return file;
            }
          });

          filesToUpload = await Promise.all(compressPromises);

          // 计算压缩率
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

      // 上传图片
      setUploadProgress(30);

      // 模拟上传进度
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
        albumId: selectedAlbumId,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      message.success(`成功上传 ${result.data.length} 张照片`);
      setUploadedPhotos(result.data);
      setFileList([]);

      // 2秒后重置进度条
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

  // 清空已上传列表
  const handleClearUploaded = () => {
    setUploadedPhotos([]);
  };

  /**
   * 压缩图片
   * @param file 原始文件
   * @param quality 压缩质量 (0-100)
   * @returns 压缩后的文件
   */
  const compressImage = (file: File, quality: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      // 如果是原图质量，直接返回原文件
      if (quality === 100) {
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

          // 设置 canvas 尺寸为图片原始尺寸
          canvas.width = img.width;
          canvas.height = img.height;

          // 绘制图片到 canvas
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // 转换为 blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('图片压缩失败'));
                return;
              }

              // 创建新的 File 对象
              const compressedFile = new File([blob], file.name, {
                type: file.type || 'image/jpeg',
                lastModified: Date.now(),
              });

              resolve(compressedFile);
            },
            file.type || 'image/jpeg',
            quality / 100
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
    <div className="p-6 max-w-6xl mx-auto space-y-3">
      {albums.length === 0 ? (
        <Alert
          message="暂无相册"
          description={
            <p>
              <span>请先</span>
              <a href="/albums" className="text-blue-500 ml-1">
                创建相册
              </a>
            </p>
          }
          type="warning"
          showIcon
        />
      ) : (
        <div className="space-y-3">
          {/* 上传配置区域 */}
          <div>
            <Card title="上传配置" className="mb-6">
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <label className="block mb-2 font-medium">目标相册</label>

                  <Select
                    placeholder="请选择相册"
                    value={selectedAlbumId}
                    onChange={setSelectedAlbumId}
                    style={{ width: '100%' }}
                    size="large"
                    options={albums.map((album) => ({
                      label: (
                        <Space>
                          <span>{album.name}</span>
                          <Tag color="blue">{album.photo_count || 0} 张</Tag>
                        </Space>
                      ),
                      value: album.id,
                    }))}
                  />

                  {selectedAlbumId && <Alert message="上传提示" description="支持拖拽上传，可一次选择多个文件。支持 JPG、PNG、GIF、WEBP 等格式，单个文件不超过 30MB。" type="info" showIcon className="!mt-3" />}
                </div>
                <div>
                  <label className="block mb-2 font-medium">输出质量</label>
                  <Select placeholder="请选择输出质量" value={quality} onChange={setQuality} style={{ width: '100%' }} size="large" options={qualityOptions} />
                  <p className="text-sm text-gray-500 mt-2">不选择或 100 表示原图，数值越高越清晰，越低越模糊，可用于节省空间。</p>
                </div>
              </Space>
            </Card>
          </div>

          {/* 上传区域 */}
          <div>
            <Card title="选择文件" className="mb-6">
              <Dragger multiple fileList={fileList} beforeUpload={beforeUpload} onChange={handleChange} onRemove={handleRemove} disabled={!selectedAlbumId || uploading} accept="image/*" listType="picture">
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
                    <Button type="primary" icon={<AiOutlineUpload />} onClick={handleUpload} loading={uploading} disabled={!selectedAlbumId}>
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
            </Card>
          </div>
        </div>
      )}

      {/* 上传成功列表 */}
      {uploadedPhotos.length > 0 && (
        <Card
          title={
            <Space>
              <AiOutlineCheckCircle style={{ color: '#52c41a' }} />
              <span>上传成功</span>
              <Tag color="success">{uploadedPhotos.length} 张</Tag>
            </Space>
          }
          extra={
            <Space>
              <Button onClick={() => navigate(`/albums/${selectedAlbumId}`)}>查看相册</Button>
              <Button type="primary" danger icon={<AiOutlineDelete />} onClick={handleClearUploaded}>
                清空列表
              </Button>
            </Space>
          }
        >
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {uploadedPhotos.map((photo) => (
              <div key={photo.id} className="relative group">
                <Image src={photo.url} alt={photo.name} className="w-full h-40 object-cover rounded-lg" preview />
                <div className="mt-2">
                  <div className="text-sm text-gray-800 truncate">{photo.name}</div>
                  <div className="text-xs text-gray-500">{(photo.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
