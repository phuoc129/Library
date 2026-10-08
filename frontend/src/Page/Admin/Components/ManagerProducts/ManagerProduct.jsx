import { Table, Button, Space, Modal, Form, Input, InputNumber, Upload, Select, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';

import styles from './ManagerProduct.module.scss';
import classNames from 'classnames/bind';
import {
  requestCreateProduct,
  requestGetProducts,
  requestUpdateProduct,
  requestUploadImages,
  requestDeleteImage,
  requestDeleteProduct,
} from '../../../../config/request';

import { useStore } from '../../../../hooks/useStore';

const cx = classNames.bind(styles);
const { Search } = Input;

// slug cần kiểm tra
const SGK_SLUG = 'sach-giao-khoa-sgk';

function ManagerProduct() {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [editorContent, setEditorContent] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const { category } = useStore();

  useEffect(() => {
    setCategories(category || []);
  }, [category]);

  // Products
  const [products, setProducts] = useState([]);
  const fetchProducts = async () => {
    const products = await requestGetProducts();
    setProducts(products?.metadata || []);
  };
  useEffect(() => {
    fetchProducts();
  }, []);

  // Theo dõi danh mục đang chọn để biết có phải SGK không
  const currentCategoryId = Form.useWatch('category', form);
  const currentCategory = useMemo(
    () => categories.find((c) => c._id === currentCategoryId),
    [categories, currentCategoryId]
  );
  const isSGK = currentCategory?.slug === SGK_SLUG;

  // Khi chuyển sang SGK -> ép giá cọc = 0 (và disable input)
  useEffect(() => {
    if (isSGK) {
      form.setFieldsValue({ price: 0 });
    }
    // không tự đổi khi rời SGK để tránh mất giá đã nhập trước đó
  }, [isSGK, form]);

  // Filter products based on search keyword
  const filteredProducts = products.filter((product) => {
    const kw = (searchKeyword || '').toLowerCase();
    return (
      product?.nameProduct?.toLowerCase()?.includes(kw) ||
      product?.description?.toLowerCase()?.includes(kw)
    );
  });

  const handleSearch = (value) => setSearchKeyword(value);

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    setFileList([]);
    setEditorContent('');
    setIsModalOpen(true);
  };


  const handleEdit = (record) => {
    setEditingProduct(record);

    form.setFieldsValue({
      nameProduct: record.nameProduct,
      price: record.price,
      stock: record.stock,
      category: record.category, // là _id của category
      description: record.description,
      publisher: record.publisher,
      publishingHouse: record.publishingHouse,
      coverType: record.coverType,
      id: record.id,
    });

    // Nếu category của record là SGK -> set giá cọc = 0
    const cat = categories.find((c) => c._id === record.category);
    if (cat?.slug === SGK_SLUG) {
      form.setFieldsValue({ price: 0 });
    }

    // Set images
    const imageList = Array.isArray(record.images) ? record.images : (record.images ? [record.images] : []);
    setFileList(
      imageList.map((img, index) => ({
        uid: `-${index}`,
        name: `image-${index}`,
        status: 'done',
        url: img,
      }))
    );

    setEditorContent(record.description || '');
    setIsModalOpen(true);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa sách "${record.nameProduct}"?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        await requestDeleteProduct({ id: record._id });
        await fetchProducts();
        message.success('Đã xóa sách');
      },
    });
  };

  const handleModalOk = async () => {
    setLoading(true);

    form
      .validateFields()
      .then(async (values) => {
        try {
          let imageUrls = [];

          // Ảnh mới (có file), ảnh cũ (url)
          const newImages = fileList.filter((file) => file.originFileObj);
          const oldImageUrls = fileList.filter((file) => !file.originFileObj && file.url).map((f) => f.url);

          if (newImages.length > 0) {
            const formData = new FormData();
            newImages.forEach((file) => formData.append('images', file.originFileObj));
            const resImages = await requestUploadImages(formData);
            imageUrls = [...oldImageUrls, ...(resImages?.metadata || [])];
          } else {
            imageUrls = [...oldImageUrls];
          }

          // Nếu là SGK, đảm bảo price = 0
          const finalPrice = isSGK ? 0 : values.price;

          const data = {
            ...values,
            price: 1,
            description: editorContent,
            images: imageUrls,
          };

          if (editingProduct) {
            data.id = editingProduct._id;
            await requestUpdateProduct(data);
          } else {
            await requestCreateProduct(data);
          }

          await fetchProducts();
          form.resetFields();
          setFileList([]);
          setEditorContent('');
          message.success(`${editingProduct ? 'Cập nhật' : 'Thêm'} sách thành công`);
          setIsModalOpen(false);
        } catch (error) {
          console.error('Error:', error);
          message.error(`Lỗi khi ${editingProduct ? 'cập nhật' : 'thêm'} sách`);
        } finally {
          setLoading(false);
        }
      })
      .catch((info) => {
        console.log('Validate Failed:', info);
        message.error(info?.response?.data?.message || 'Dữ liệu không hợp lệ');
        setLoading(false);
      });
  };

  const uploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: () => false, // chặn auto upload
    onChange: (info) => setFileList(info.fileList),
    fileList,
    multiple: true,
  };

  const handleRemoveImage = async (file, id) => {
    if (!id || !file?.url) return;
    await requestDeleteImage({ id, image: file.url });
    await fetchProducts();
  };

  const columns = [
    {
      title: 'Ảnh sách',
      dataIndex: 'images',
      key: 'images',
      render: (images) => {
        const src =
          (Array.isArray(images) && images[0]) ||
          'https://via.placeholder.com/100x100/f0f0f0/666?text=No+Image';
        return (
          <img
            src={src}
            alt="Ảnh sách"
            style={{ width: 100, height: 100, borderRadius: 10, objectFit: 'cover' }}
            onError={(e) => {
              e.currentTarget.src =
                'https://via.placeholder.com/100x100/f0f0f0/666?text=No+Image';
            }}
          />
        );
      },
    },
    {
      title: 'Tên sách',
      dataIndex: 'nameProduct',
      key: 'nameProduct',
    },
    {
      title: 'Kho',
      dataIndex: 'stock',
      key: 'stock',
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="primary" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={cx('wrapper')}>
      <div className={cx('header')}>
        <h2>Quản lý sách</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm sách
        </Button>
      </div>

      <div className={cx('search-container')} style={{ marginBottom: 20 }}>
        <Search
          placeholder="Tìm kiếm sách..."
          allowClear
          enterButton
          size="large"
          onSearch={handleSearch}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ maxWidth: 500 }}
        />
      </div>

      <Table columns={columns} dataSource={filteredProducts} rowKey="_id" />

      <Modal
        title={editingProduct ? 'Sửa sách' : 'Thêm sách mới'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={800}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" className={cx('form')}>
          <div className={cx('form-full.........................')}>
            <Form.Item
              name="nameProduct"
              label="Tên sách"
              rules={[{ required: true, message: 'Vui lòng nhập tên sách!' }]}
            >
              <Input />
            </Form.Item>
          </div>

          <div className={cx('form-row')}>
            <Form.Item
              name="category"
              label="Danh mục"
              rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
            >
              <Select
                onChange={(value) => {
                  const cat = categories.find((c) => c._id === value);
                  if (cat?.slug === SGK_SLUG) {
                    form.setFieldsValue({ price: 0 });
                    // Không hiển thị bất kỳ note nào “không phải trả phí…”
                  }
                }}
              >
                {categories.map((item) => (
                  <Select.Option key={item._id} value={item._id}>
                    {item.nameCategory}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="stock"
              label="Số lượng trong kho"
              rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </div>

          <div className={cx('form-row')}>
            <Form.Item
              name="publisher"
              label="Tác giả"
              rules={[{ required: true, message: 'Vui lòng nhập tên tác giả!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="publishingHouse"
              label="Nhà xuất bản"
              rules={[{ required: true, message: 'Vui lòng nhập nhà xuất bản!' }]}
            >
              <Input />
            </Form.Item>
          </div>

          <div className={cx('form-row')}>
            <Form.Item
              name="coverType"
              label="Loại bìa"
              rules={[{ required: true, message: 'Vui lòng chọn loại bìa!' }]}
            >
              <Select>
                <Select.Option value="paperback">Bìa mềm</Select.Option>
                <Select.Option value="hardcover">Bìa cứng</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
          >
            <Editor
              apiKey="hfm046cu8943idr5fja0r5l2vzk9l8vkj5cp3hx2ka26l84x"
              init={{
                plugins:
                  'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
                toolbar:
                  'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
              }}
              initialValue="Mô tả chi tiết sách"
              onEditorChange={(content) => {
                setEditorContent(content);
                form.setFieldsValue({ description: content });
              }}
            />
          </Form.Item>

          <Form.Item
            name="images"
            label="Hình ảnh"
            rules={[
              {
                required: !editingProduct,
                message: 'Vui lòng tải lên ít nhất 1 hình ảnh!',
              },
            ]}
          >
            <Upload
              {...uploadProps}
              listType="picture-card"
              onRemove={(file) => handleRemoveImage(file, editingProduct?._id)}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Tải ảnh</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ManagerProduct;
