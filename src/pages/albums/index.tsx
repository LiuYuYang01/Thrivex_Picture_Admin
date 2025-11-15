import { useState, useEffect } from 'react';
import { Button, Table, Modal, Form, Input, message, Space, Popconfirm, Image, Card, Empty } from 'antd';
import { AiOutlinePlus, AiOutlineEdit, AiOutlineDelete, AiOutlineFolderOpen } from 'react-icons/ai';
import { useNavigate } from 'react-router';
import { getAlbumListAPI, createAlbumAPI, updateAlbumAPI, deleteAlbumAPI } from '@/api/album';
import type { Album, CreateAlbumParams, UpdateAlbumParams } from '@/types/album';

const { TextArea } = Input;

export default () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  // 加载相册列表
  const loadAlbums = async () => {
    try {
      setLoading(true);
      const {data} = await getAlbumListAPI(pagination);
      setAlbums(data.result);
      setTotal(data.total);
    } catch {
      message.error('加载相册列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlbums();
  }, [pagination]);

  // 打开创建/编辑弹窗
  const handleOpenModal = (album?: Album) => {
    if (album) {
      setEditingAlbum(album);
      form.setFieldsValue({
        name: album.name,
        description: album.description,
        cover: album.cover,
      });
    } else {
      setEditingAlbum(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingAlbum) {
        // 编辑
        await updateAlbumAPI(editingAlbum.id, values as UpdateAlbumParams);
        message.success('更新相册成功');
      } else {
        // 创建
        await createAlbumAPI(values as CreateAlbumParams);
        message.success('创建相册成功');
      }
      setIsModalOpen(false);
      loadAlbums();
    } catch {
      message.error(editingAlbum ? '更新相册失败' : '创建相册失败');
    }
  };

  // 删除相册
  const handleDelete = async (id: number) => {
    try {
      await deleteAlbumAPI(id);
      message.success('删除相册成功');
      loadAlbums();
    } catch {
      message.error('删除相册失败');
    }
  };

  // 查看相册详情
  const handleViewAlbum = (id: number) => {
    navigate(`/albums/${id}`);
  };

  const columns = [
    {
      title: '封面',
      dataIndex: 'cover',
      key: 'cover',
      width: 100,
      render: (cover: string) =>
        cover ? (
          <Image src={cover} width={60} height={60} style={{ objectFit: 'cover', borderRadius: '8px' }} />
        ) : (
          <div className="w-[60px] h-[60px] bg-gray-200 rounded-lg flex items-center justify-center">
            <AiOutlineFolderOpen style={{ fontSize: 24, color: '#999' }} />
          </div>
        ),
    },
    {
      title: '相册名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '照片数量',
      dataIndex: 'photo_count',
      key: 'photo_count',
      render: (count: number) => count || 0,
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
      width: 200,
      render: (_: any, record: Album) => (
        <Space size="small">
          <Button type="link" size="small" icon={<AiOutlineFolderOpen />} onClick={() => handleViewAlbum(record.id)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<AiOutlineEdit />} onClick={() => handleOpenModal(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此相册吗？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<AiOutlineDelete />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card
        title={
          <div className="flex items-center gap-2">
            <AiOutlineFolderOpen style={{ fontSize: 20 }} />
            <span className="text-xl font-semibold">相册管理</span>
          </div>
        }
        extra={
          <Button type="primary" icon={<AiOutlinePlus />} onClick={() => handleOpenModal()}>
            创建相册
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={albums}
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
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    暂无相册，点击
                    <Button type="link" onClick={() => handleOpenModal()}>
                      创建相册
                    </Button>
                  </span>
                }
              />
            ),
          }}
        />
      </Card>

      {/* 创建/编辑弹窗 */}
      <Modal title={editingAlbum ? '编辑相册' : '创建相册'} open={isModalOpen} onOk={handleSubmit} onCancel={() => setIsModalOpen(false)} okText="确定" cancelText="取消" width={600}>
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            label="相册名称"
            name="name"
            rules={[
              { required: true, message: '请输入相册名称' },
              { max: 50, message: '相册名称不能超过50个字符' },
            ]}
          >
            <Input placeholder="请输入相册名称" />
          </Form.Item>
          <Form.Item label="相册描述" name="description" rules={[{ max: 200, message: '相册描述不能超过200个字符' }]}>
            <TextArea rows={4} placeholder="请输入相册描述（可选）" />
          </Form.Item>
          <Form.Item
            label="封面图片URL"
            name="cover"
            rules={[
              { type: 'url', message: '请输入有效的URL地址' },
              { max: 500, message: 'URL不能超过500个字符' },
            ]}
          >
            <Input placeholder="请输入封面图片URL（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
