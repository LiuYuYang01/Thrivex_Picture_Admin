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
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);

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
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('图片大小不能超过 10MB！');
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

      const files = fileList.map((file) => file.originFileObj as File);

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
        files,
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
    } catch {
      message.error('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  // 清空已上传列表
  const handleClearUploaded = () => {
    setUploadedPhotos([]);
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

                  {selectedAlbumId && <Alert message="上传提示" description="支持拖拽上传，可一次选择多个文件。支持 JPG、PNG、GIF、WEBP 等格式，单个文件不超过 10MB。" type="info" showIcon className="!mt-3" />}
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
              <Button onClick={() => navigate('/photos')}>查看所有照片</Button>
              <Button icon={<AiOutlineDelete />} onClick={handleClearUploaded}>
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
