import { useState, useEffect } from 'react';
import { Card, Button, Image, message, Spin, Empty, Modal, Checkbox, Input, Space, Tag, Breadcrumb, Descriptions } from 'antd';
import { AiOutlineArrowLeft, AiOutlinePlus, AiOutlineDelete, AiOutlineSearch, AiOutlinePicture } from 'react-icons/ai';
import { useParams, useNavigate } from 'react-router';
import { getAlbumDetailAPI, getAlbumPhotosAPI, addPhotosToAlbumAPI, removePhotosFromAlbumAPI } from '@/api/album';
import { getPhotoListAPI } from '@/api/photo';
import type { Album } from '@/types/album';
import type { Photo } from '@/types/photo';

export default () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<number[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 加载相册详情
  const loadAlbumDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await getAlbumDetailAPI(Number(id));
      setAlbum(res.data);
    } catch {
      message.error('加载相册详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载相册照片
  const loadAlbumPhotos = async () => {
    if (!id) return;
    try {
      const { data } = await getAlbumPhotosAPI(Number(id), { page: 1, limit: 100 });
      setPhotos(data.result);
    } catch {
      message.error('加载照片列表失败');
    }
  };

  // 加载所有照片（用于添加照片弹窗）
  const loadAllPhotos = async () => {
    try {
      const { data } = await getPhotoListAPI({ page: 1, limit: 100, keyword: searchKeyword });
      setAllPhotos(data.result);
    } catch {
      message.error('加载照片列表失败');
    }
  };

  useEffect(() => {
    loadAlbumDetail();
    loadAlbumPhotos();
  }, [id]);

  useEffect(() => {
    if (isAddModalOpen) {
      loadAllPhotos();
    }
  }, [isAddModalOpen, searchKeyword]);

  // 添加照片到相册
  const handleAddPhotos = async () => {
    if (selectedPhotoIds.length === 0) {
      message.warning('请选择要添加的照片');
      return;
    }
    try {
      await addPhotosToAlbumAPI(Number(id), { photo_ids: selectedPhotoIds });
      message.success(`成功添加 ${selectedPhotoIds.length} 张照片`);
      setIsAddModalOpen(false);
      setSelectedPhotoIds([]);
      loadAlbumPhotos();
      loadAlbumDetail();
    } catch {
      message.error('添加照片失败');
    }
  };

  // 从相册移除照片
  const handleRemovePhoto = async (photoId: number) => {
    try {
      await removePhotosFromAlbumAPI(Number(id), { photo_ids: [photoId] });
      message.success('移除照片成功');
      loadAlbumPhotos();
      loadAlbumDetail();
    } catch {
      message.error('移除照片失败');
    }
  };

  // 筛选出不在当前相册中的照片
  const availablePhotos = allPhotos.filter((photo) => !photos.some((albumPhoto) => albumPhoto.id === photo.id));

  if (loading && !album) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="p-6">
        <Empty description="相册不存在" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 面包屑导航 */}
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item>
          <a onClick={() => navigate('/albums')}>相册管理</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{album.name}</Breadcrumb.Item>
      </Breadcrumb>

      {/* 相册信息卡片 */}
      <Card className="mb-6">
        <div className="flex items-start gap-6">
          {album.cover ? (
            <Image src={album.cover} width={200} height={200} style={{ objectFit: 'cover', borderRadius: '8px' }} />
          ) : (
            <div className="w-[200px] h-[200px] bg-gray-200 rounded-lg flex items-center justify-center">
              <AiOutlinePicture style={{ fontSize: 64, color: '#999' }} />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-4">{album.name}</h1>
            <Descriptions column={2}>
              <Descriptions.Item label="照片数量">
                <Tag color="blue">{album.photo_count || 0} 张</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{new Date(album.create_time).toLocaleString('zh-CN')}</Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {album.description || '暂无描述'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        </div>
      </Card>

      {/* 照片网格 */}
      <Card
        title={<span className="text-lg font-semibold">相册照片</span>}
        extra={
          <Space>
            <Button icon={<AiOutlineArrowLeft />} onClick={() => navigate('/albums')}>
              返回
            </Button>
            <Button type="primary" icon={<AiOutlinePlus />} onClick={() => setIsAddModalOpen(true)}>
              添加照片
            </Button>
          </Space>
        }
      >
        {photos.length === 0 ? (
          <Empty
            description={
              <span>
                暂无照片，点击
                <Button type="link" onClick={() => setIsAddModalOpen(true)}>
                  添加照片
                </Button>
              </span>
            }
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <Image
                  src={photo.url}
                  alt={photo.name}
                  className="w-full h-40 object-cover rounded-lg"
                  preview={{
                    mask: <div className="text-white">预览</div>,
                  }}
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button type="primary" danger size="small" icon={<AiOutlineDelete />} onClick={() => handleRemovePhoto(photo.id)} />
                </div>
                <div className="mt-2 text-sm text-gray-600 truncate">{photo.name}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 添加照片弹窗 */}
      <Modal
        title="添加照片到相册"
        open={isAddModalOpen}
        onOk={handleAddPhotos}
        onCancel={() => {
          setIsAddModalOpen(false);
          setSelectedPhotoIds([]);
        }}
        okText={`添加 ${selectedPhotoIds.length} 张照片`}
        cancelText="取消"
        width={800}
      >
        <div className="mb-4">
          <Input placeholder="搜索照片名称" prefix={<AiOutlineSearch />} value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} allowClear />
        </div>
        {availablePhotos.length === 0 ? (
          <Empty description="没有可添加的照片" />
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-4 gap-4">
              {availablePhotos.map((photo) => (
                <div
                  key={photo.id}
                  className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${selectedPhotoIds.includes(photo.id) ? 'border-blue-500' : 'border-transparent'}`}
                  onClick={() => {
                    setSelectedPhotoIds((prev) => (prev.includes(photo.id) ? prev.filter((id) => id !== photo.id) : [...prev, photo.id]));
                  }}
                >
                  <img src={photo.url} alt={photo.name} className="w-full h-32 object-cover" />
                  <Checkbox checked={selectedPhotoIds.includes(photo.id)} className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()} />
                  <div className="p-2 bg-white text-xs truncate">{photo.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
