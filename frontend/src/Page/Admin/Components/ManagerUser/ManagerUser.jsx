import { useEffect, useState } from 'react';
import { Table, Button, message, Modal, Upload, Tag, Select } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import classNames from 'classnames/bind';
import styles from './ManagerUser.module.scss';
import { requestGetUsers, requestImportUser } from '../../../../config/request';

const cx = classNames.bind(styles);
const { Option } = Select;

function ManagerUser() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isImportVisible, setIsImportVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all'); 

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await requestGetUsers();
      setUsers(res.metadata || []);
    } catch (error) {
      console.error('fetchUsers error', error);
      message.error('Lỗi khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleImport = async () => {
    if (!file) {
      message.warning('Vui lòng chọn file Excel hoặc CSV!');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const data = await requestImportUser(formData);
      message.success(data.message || 'Import thành công');
      setReport(data.metadata || null);
      await fetchUsers();
    } catch (err) {
      console.error('import error', err);
      const msg = err?.response?.data?.message || err.message || 'Có lỗi khi import người dùng';
      message.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const getFilteredUsers = () => {
    if (roleFilter === 'all') return users;
    return users.filter((u) => u.role === roleFilter);
  };

  const columns = [
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: 'Lớp',
      dataIndex: 'class',
      key: 'class',
      render: (_, record) => (
        <span>
          { record.class ||  ''}
        </span>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (_, record) => {
        let color = 'default';
        let label = 'Không xác định';

        if (record.role === 'admin') {
          color = 'red';
          label = 'Thủ thư';
        } else if (record.role === 'teacher') {
          color = 'blue';
          label = 'Giáo viên';
        } else if (record.role === 'student') {
          color = 'green';
          label = 'Học sinh';
        }

        return <Tag color={color}>{label}</Tag>;
      },
    },
  ];

  return (
    <div className={cx('wrapper')}>
      <div className={cx('header')}>
        <h2 className={cx('title')}>Quản lý người dùng</h2>

        <div className={cx('actions')}>
          {/* Lọc theo quyền */}
          <Select
            value={roleFilter}
            onChange={setRoleFilter}
            style={{ width: 180, marginRight: 12 }}
          >
            <Option value="all">Tất cả vai trò</Option>
            <Option value="admin">Thủ thư</Option>
            <Option value="teacher">Giáo viên</Option>
            <Option value="student">Học sinh</Option>
          </Select>

          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setIsImportVisible(true)}
          >
            Import User
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={getFilteredUsers()}
        rowKey="_id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} người dùng`,
        }}
      />

      <Modal
        title="Import người dùng"
        open={isImportVisible}
        onOk={handleImport}
        okText="Import"
        cancelText="Đóng"
        confirmLoading={uploading}
        onCancel={() => {
          setIsImportVisible(false);
          setFile(null);
          setReport(null);
        }}
      >
        <Upload
          beforeUpload={(file) => {
            setFile(file);
            return false;
          }}
          accept=".xlsx,.xls,.csv"
          maxCount={1}
        >
          <Button icon={<UploadOutlined />}>Chọn file Excel hoặc CSV</Button>
        </Upload>
        <p style={{ marginTop: 10, color: '#888' }}>
          File cần có các cột:&nbsp;
          <b>fullName, email, password, phone, role, class, address</b>
        </p>

        {report && (
          <div
            style={{
              marginTop: 16,
              borderTop: '1px solid #f0f0f0',
              paddingTop: 12,
            }}
          >
            <p>
              <b>Tổng số dòng:</b> {report.totalRows}
            </p>
            <p>
              <b>Đã thêm:</b> <Tag color="green">{report.insertedCount}</Tag>&nbsp;
              <b>Trùng:</b> <Tag color="orange">{report.duplicateCount}</Tag>&nbsp;
              <b>Lỗi:</b> <Tag color="red">{report.invalidCount}</Tag>
            </p>

            {report.duplicates?.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <b>Danh sách email trùng:</b>
                <ul style={{ margin: '6px 0 0 16px' }}>
                  {report.duplicates.slice(0, 5).map((d, idx) => (
                    <li key={idx}>{d.email}</li>
                  ))}
                </ul>
                {report.duplicates.length > 5 && (
                  <span style={{ color: '#999' }}>
                    ...và {report.duplicates.length - 5} dòng khác
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ManagerUser;
