import { useState, useEffect } from 'react';
import { Card, Button, Image, message, Spin, Empty, Modal, Checkbox, Input, Space } from 'antd';
import { AiOutlineArrowLeft, AiOutlinePlus, AiOutlineDelete, AiOutlineSearch, AiOutlineEdit } from 'react-icons/ai';
import { useParams, useNavigate } from 'react-router';
import { getAlbumDetailAPI, getAlbumPhotosAPI, addPhotosToAlbumAPI, removePhotosFromAlbumAPI } from '@/api/album';
import { getPhotoListAPI, updatePhotoAPI, deletePhotoAPI } from '@/api/photo';
import type { Album } from '@/types/album';
import type { Photo } from '@/types/photo';
import { Tooltip } from '@heroui/react';
import UploadPanel from '@/components/Upload';

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editPhotoName, setEditPhotoName] = useState('');
  const [editPhotoDescription, setEditPhotoDescription] = useState('');

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

  // 打开编辑照片弹窗
  const handleEditPhoto = (photo: Photo) => {
    setEditingPhoto(photo);
    setEditPhotoName(photo.name);
    setEditPhotoDescription(photo.description || '');
    setIsEditModalOpen(true);
  };

  // 更新照片名称
  const handleUpdatePhoto = async () => {
    if (!editingPhoto) return;
    if (!editPhotoName.trim()) {
      message.warning('照片名称不能为空');
      return;
    }
    try {
      await updatePhotoAPI(editingPhoto.id, { name: editPhotoName, description: editPhotoDescription });
      message.success('修改照片名称成功');
      setIsEditModalOpen(false);
      setEditingPhoto(null);
      setEditPhotoName('');
      loadAlbumPhotos();
    } catch {
      message.error('修改照片名称失败');
    }
  };

  // 删除照片（提供两种删除方式）
  const handleDeletePhoto = (photo: Photo) => {
    Modal.confirm({
      title: '删除照片',
      content: (
        <div className="space-y-2">
          <p className="text-gray-600">
            <b>从相册移除：</b>只从当前相册中移除，照片依然保留在系统中
          </p>
          <p className="text-red-600">
            <b>彻底删除：</b>从系统中完全删除此照片（不可恢复）
          </p>
        </div>
      ),
      okText: '彻底删除',
      cancelText: '取消',
      okType: 'danger',
      maskClosable: true, // 允许点击遮罩层关闭
      onCancel: () => {
        Modal.destroyAll();
      },
      onOk: async () => {
        try {
          await deletePhotoAPI(photo.id);
          message.success('照片已彻底删除');
          loadAlbumPhotos();
          loadAlbumDetail();
        } catch {
          message.error('删除照片失败');
        }
      },
      footer: (_, { OkBtn }) => (
        <div className="flex justify-end gap-2">
          <Button
            onClick={async () => {
              Modal.destroyAll();
              try {
                await removePhotosFromAlbumAPI(Number(id), { photo_ids: [photo.id] });
                message.success('已从相册中移除');
                loadAlbumPhotos();
                loadAlbumDetail();
              } catch {
                message.error('移除失败');
              }
            }}
          >
            从相册移除
          </Button>
          <OkBtn />
        </div>
      ),
    });
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
    <div className="space-y-2">
      <div>
        <Card className="[&>.ant-card-body]:!p-4 [&>.ant-card-body]:!py-2">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold">{album.name}</h1>
            <span className="text-sm text-gray-500">{album.description}</span>
          </div>
        </Card>
      </div>

      {/* 照片网格 */}
      <div>
        <Card
          title={<Button icon={<AiOutlineArrowLeft />} onClick={() => navigate('/albums')} />}
          extra={
            <Space size={10}>
              <Button onClick={() => setIsAddModalOpen(true)}>添加照片</Button>
              <Button type="primary" onClick={() => setIsUploadModalOpen(true)}>
                上传照片
              </Button>
            </Space>
          }
          className="[&_.ant-card-body]:min-h-[calc(100vh-235px)]"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
              {photos.map((photo) => (
                <Tooltip
                  key={photo.id}
                  content={
                    photo.description ? (
                      <div className="px-1 py-2 max-w-xs">
                        <div className="text-small font-semibold mb-2">{photo.name}</div>
                        <div className="text-tiny leading-relaxed mb-2">{photo.description}</div>
                        <div className="text-tiny text-default-400 pt-2 border-t border-default-200">上传于 {new Date(photo.create_time).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      </div>
                    ) : (
                      <div className="px-1 py-2">
                        <div className="text-small font-semibold">{photo.name}</div>
                        <div className="text-tiny text-default-400 mt-1">上传于 {new Date(photo.create_time).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      </div>
                    )
                  }
                  placement="top"
                  delay={300}
                  closeDelay={0}
                  classNames={{
                    base: 'max-w-md',
                    content: 'bg-content1 border border-default-200 shadow-xl',
                  }}
                >
                  <div className="relative group">
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 shadow-md hover:shadow-xl transition-all duration-300">
                      <Image
                        src={photo.url}
                        alt={photo.name}
                        className="!absolute !inset-0 !w-full !h-full !object-cover"
                        wrapperClassName="!absolute !inset-0 !w-full !h-full"
                        preview={{
                          mask: <div className="text-white">预览</div>,
                        }}
                      />
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none z-10" />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 z-20">
                        <Space>
                          <Button size="small" icon={<AiOutlineEdit />} onClick={() => handleEditPhoto(photo)} className="shadow-lg" />
                          <Button type="primary" size="small" icon={<AiOutlineDelete />} onClick={() => handleDeletePhoto(photo)} className="shadow-lg" />
                        </Space>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-700 truncate px-1 font-medium">{photo.name}</div>
                  </div>
                </Tooltip>
              ))}
            </div>
          )}
        </Card>
      </div>

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

      {/* 编辑照片弹窗 */}
      <Modal
        title="编辑照片"
        open={isEditModalOpen}
        onOk={handleUpdatePhoto}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingPhoto(null);
          setEditPhotoName('');
        }}
        okText="保存"
        cancelText="取消"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">照片名称</label>
            <Input placeholder="请输入照片名称" value={editPhotoName} onChange={(e) => setEditPhotoName(e.target.value)} onPressEnter={handleUpdatePhoto} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">照片描述</label>
            <Input placeholder="请输入照片描述" value={editPhotoDescription} onChange={(e) => setEditPhotoDescription(e.target.value)} onPressEnter={handleUpdatePhoto} />
          </div>
        </div>
      </Modal>

      {/* 上传照片弹窗 */}
      <Modal title="上传照片" open={isUploadModalOpen} onCancel={() => setIsUploadModalOpen(false)} footer={null} width={600}>
        <UploadPanel
          albumId={album?.id ?? null}
          onUploaded={() => {
            setIsUploadModalOpen(false);
            loadAlbumPhotos();
            loadAlbumDetail();
          }}
        />
      </Modal>
    </div>
  );
};
