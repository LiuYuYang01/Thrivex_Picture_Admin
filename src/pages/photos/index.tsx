import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, message, Space, Popconfirm, Image, Tag, Empty, Select } from 'antd';
import { AiOutlineEdit, AiOutlineDelete, AiOutlinePicture, AiOutlineFolderAdd } from 'react-icons/ai';
import { getPhotoListAPI, updatePhotoAPI, deletePhotoAPI } from '@/api/photo';
import { getAlbumListAPI, addPhotosToAlbumAPI } from '@/api/album';
import type { Photo, UpdatePhotoParams } from '@/types/photo';
import type { Album } from '@/types/album';

export default () => {
  const [form] = Form.useForm();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddToAlbumModalOpen, setIsAddToAlbumModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  // 加载照片列表
  const loadPhotos = async () => {
    try {
      setLoading(true);
      const { data } = await getPhotoListAPI({ page: pagination.page, limit: pagination.limit, keyword: searchKeyword });
      setPhotos(data.result);
      setTotal(data.total);
    } catch {
      message.error('加载照片列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载相册列表
  const loadAlbums = async () => {
    try {
      const { data } = await getAlbumListAPI({ page: 1, limit: 100 });
      setAlbums(data.result);
    } catch {
      message.error('加载相册列表失败');
    }
  };

  useEffect(() => {
    loadPhotos();
  }, [pagination, searchKeyword]);

  useEffect(() => {
    loadAlbums();
  }, []);

  // 打开编辑弹窗
  const handleOpenEditModal = (photo: Photo) => {
    setEditingPhoto(photo);
    form.setFieldsValue({
      name: photo.name,
    });
    setIsEditModalOpen(true);
  };

  // 提交编辑表单
  const handleSubmitEdit = async () => {
    if (!editingPhoto) return;
    try {
      const values = await form.validateFields();
      await updatePhotoAPI(editingPhoto.id, values as UpdatePhotoParams);
      message.success('更新照片成功');
      setIsEditModalOpen(false);
      loadPhotos();
    } catch {
      message.error('更新照片失败');
    }
  };

  // 删除照片
  const handleDelete = async (id: number) => {
    try {
      await deletePhotoAPI(id);
      message.success('删除照片成功');
      loadPhotos();
    } catch {
      message.error('删除照片失败');
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的照片');
      return;
    }
    try {
      await Promise.all(selectedRowKeys.map((id) => deletePhotoAPI(id)));
      message.success(`成功删除 ${selectedRowKeys.length} 张照片`);
      setSelectedRowKeys([]);
      loadPhotos();
    } catch {
      message.error('批量删除失败');
    }
  };

  // 添加到相册
  const handleAddToAlbum = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要添加的照片');
      return;
    }
    if (!selectedAlbumId) {
      message.warning('请选择相册');
      return;
    }
    try {
      await addPhotosToAlbumAPI(selectedAlbumId, { photo_ids: selectedRowKeys });
      message.success(`成功添加 ${selectedRowKeys.length} 张照片到相册`);
      setIsAddToAlbumModalOpen(false);
      setSelectedAlbumId(null);
      setSelectedRowKeys([]);
    } catch {
      message.error('添加到相册失败');
    }
  };

  // 搜索
  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    setPagination({ ...pagination, page: 1 });
  };

  const columns = [
    {
      title: '预览',
      dataIndex: 'url',
      key: 'url',
      width: 100,
      render: (url: string, record: Photo) => <Image src={url} width={60} height={60} style={{ objectFit: 'cover', borderRadius: '8px' }} alt={record.name} />,
    },
    {
      title: '照片名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '尺寸',
      key: 'size_dimensions',
      render: (_: any, record: Photo) => (
        <Space direction="vertical" size="small">
          <span>{(record.size / 1024 / 1024).toFixed(2)} MB</span>
          {record.width && record.height && (
            <span className="text-gray-500 text-xs">
              {record.width} × {record.height}
            </span>
          )}
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: '所属相册',
      dataIndex: 'albums',
      key: 'albums',
      render: (albums?: Album[]) => <Space wrap>{albums && albums.length > 0 ? albums.map((album) => <Tag key={album.id}>{album.name}</Tag>) : <span className="text-gray-400">未分类</span>}</Space>,
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      key: 'create_time',
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Photo) => (
        <Space size="small">
          <Button type="link" size="small" icon={<AiOutlineEdit />} onClick={() => handleOpenEditModal(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此照片吗？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<AiOutlineDelete />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys as number[]);
    },
  };

  return (
    <div className="p-6">
      <Card
        title={
          <div className="flex items-center gap-2">
            <AiOutlinePicture style={{ fontSize: 20 }} />
            <span className="text-xl font-semibold">照片管理</span>
          </div>
        }
        extra={
          <Space>
            <Input.Search placeholder="搜索照片名称" onSearch={handleSearch} style={{ width: 250 }} allowClear />
          </Space>
        }
      >
        {/* 批量操作栏 */}
        {selectedRowKeys.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
            <span className="text-blue-600">已选择 {selectedRowKeys.length} 张照片</span>
            <Space>
              <Button icon={<AiOutlineFolderAdd />} onClick={() => setIsAddToAlbumModalOpen(true)}>
                添加到相册
              </Button>
              <Popconfirm title="确定删除选中的照片吗？" onConfirm={handleBatchDelete} okText="确定" cancelText="取消">
                <Button danger icon={<AiOutlineDelete />}>
                  批量删除
                </Button>
              </Popconfirm>
              <Button onClick={() => setSelectedRowKeys([])}>取消选择</Button>
            </Space>
          </div>
        )}

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={photos}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, limit) => setPagination({ page, limit }),
          }}
          locale={{
            emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无照片数据" />,
          }}
        />
      </Card>

      {/* 编辑弹窗 */}
      <Modal title="编辑照片" open={isEditModalOpen} onOk={handleSubmitEdit} onCancel={() => setIsEditModalOpen(false)} okText="确定" cancelText="取消">
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            label="照片名称"
            name="name"
            rules={[
              { required: true, message: '请输入照片名称' },
              { max: 100, message: '照片名称不能超过100个字符' },
            ]}
          >
            <Input placeholder="请输入照片名称" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加到相册弹窗 */}
      <Modal
        title="添加到相册"
        open={isAddToAlbumModalOpen}
        onOk={handleAddToAlbum}
        onCancel={() => {
          setIsAddToAlbumModalOpen(false);
          setSelectedAlbumId(null);
        }}
        okText="确定"
        cancelText="取消"
      >
        <div className="py-4">
          <p className="mb-4 text-gray-600">已选择 {selectedRowKeys.length} 张照片</p>
          <Select
            placeholder="请选择相册"
            value={selectedAlbumId}
            onChange={setSelectedAlbumId}
            style={{ width: '100%' }}
            options={albums.map((album) => ({
              label: album.name,
              value: album.id,
            }))}
          />
        </div>
      </Modal>
    </div>
  );
};
