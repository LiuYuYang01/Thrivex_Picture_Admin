import { useState, useEffect } from 'react';
import { Button, Modal, Form, Input, message, Card, Empty, Spin, Dropdown } from 'antd';
import { AiOutlinePlus, AiOutlineEdit, AiOutlineDelete, AiOutlineFolderOpen, AiOutlineEllipsis } from 'react-icons/ai';
import { useNavigate } from 'react-router';
import { getAlbumListAPI, createAlbumAPI, updateAlbumAPI, deleteAlbumAPI } from '@/api/album';
import type { Album, CreateAlbumParams, UpdateAlbumParams } from '@/types/album';
import type { MenuProps } from 'antd';

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
      const { data } = await getAlbumListAPI(pagination);
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

  // 获取操作菜单项
  const getMenuItems = (album: Album): MenuProps['items'] => [
    {
      key: 'edit',
      label: <span className="text-[15px]">编辑</span>,
      icon: <AiOutlineEdit className="!text-xl" />,
      onClick: () => handleOpenModal(album),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: <span className="text-[15px]">删除</span>,
      icon: <AiOutlineDelete className="!text-xl" />,
      danger: true,
      onClick: () => {
        Modal.confirm({
          title: '确定删除此相册吗？',
          content: '删除后将无法恢复',
          okText: '确定',
          cancelText: '取消',
          okButtonProps: { danger: true },
          onOk: () => handleDelete(album.id),
        });
      },
    },
  ];

  return (
    <div>
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
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spin size="large" tip="加载中..." />
          </div>
        ) : albums.length === 0 ? (
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
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {albums.map((album) => (
                <div key={album.id} className="relative group cursor-pointer" onClick={() => handleViewAlbum(album.id)}>
                  <div className="bg-white rounded-xl p-4 md:p-5 transition-all duration-300 hover:-translate-y-1 border border-gray-100 overflow-hidden">
                    {/* 封面区域 */}
                    <div className="flex flex-col items-center gap-3 mb-2">
                      {album.cover ? (
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-shadow duration-300">
                          <img src={album.cover} alt={album.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                        </div>
                      ) : (
                        <div className="w-full aspect-square flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl shadow-inner">
                          <AiOutlineFolderOpen style={{ fontSize: 'clamp(48px, 8vw, 72px)', color: '#3b82f6' }} className="drop-shadow-lg transition-transform duration-300 group-hover:scale-110" />
                        </div>
                      )}

                      {/* 相册名称和信息 */}
                      <div className="text-center w-full min-h-[3rem] flex flex-col justify-center">
                        <div className="font-semibold text-gray-800 truncate px-1 text-sm md:text-base group-hover:text-blue-600 transition-colors duration-200" title={album.name}>
                          {album.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1.5 flex items-center justify-center gap-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{album.photo_count || 0} 张</span>
                        </div>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-[-4px] group-hover:translate-y-0">
                      <Dropdown menu={{ items: getMenuItems(album) }} trigger={['click']}>
                        <Button type="text" size="small" icon={<AiOutlineEllipsis />} className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl border-0" onClick={(e) => e.stopPropagation()} />
                      </Dropdown>
                    </div>
                  </div>

                  {/* 描述信息（hover时显示） */}
                  {album.description && (
                    <div className="absolute bottom-full left-0 right-0 mb-3 p-3 border bg-white backdrop-blur-sm text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 transform translate-y-2 group-hover:translate-y-0">
                      <div className="line-clamp-3 leading-relaxed text-gray-700">{album.description}</div>
                      <div className="text-gray-400 mt-2 pt-2 border-t">创建于 {new Date(album.create_time).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 分页 */}
            {total > pagination.limit && (
              <div className="flex justify-center mt-8">
                <Button disabled={pagination.page === 1} onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}>
                  上一页
                </Button>
                <span className="mx-4 flex items-center">
                  第 {pagination.page} / {Math.ceil(total / pagination.limit)} 页，共 {total} 个相册
                </span>
                <Button disabled={pagination.page >= Math.ceil(total / pagination.limit)} onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}>
                  下一页
                </Button>
              </div>
            )}
          </>
        )}
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
