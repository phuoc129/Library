import React, { useState, useEffect, useMemo } from 'react';
import { Table, Tag, Select, message, DatePicker, Row, Col } from 'antd';
import classNames from 'classnames/bind';
import styles from './ManagerOrder.module.scss';
import {
  requestUpdateInfoCartByAdmin,
  requestGetBorrowingBook,
} from '../../../../config/request';
import dayjs from 'dayjs';

const cx = classNames.bind(styles);
const { RangePicker } = DatePicker;

function ManagerOrder() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [userFilter, setUserFilter] = useState('all'); 
  useEffect(() => {
    fetchBorrowingBooks();
  }, []);

  const fetchBorrowingBooks = async () => {
    try {
      setLoading(true);
      const response = await requestGetBorrowingBook();
      console.log('check >>>', response);
      setOrders(response?.metadata || []);
    } catch (error) {
      console.error('Error fetching borrowing books:', error);
      message.error('Lỗi khi tải danh sách sách đang được mượn');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus, record) => {
    try {
      const data = {
        id: record.userId, 
        status: newStatus, 
      };
      await requestUpdateInfoCartByAdmin(data);
      message.success('Cập nhật trạng thái thành công');
      fetchBorrowingBooks();
    } catch (error) {
      console.error('Error updating status:', error);
      message.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const getStatusText = (status) => {
    const safe = (status || '').toLowerCase();
    const map = {
      approved: 'Đang mượn',
      completed: 'Đã trả',
    };
    return map[safe] || 'Không xác định';
  };

  const handleFilterChange = (type, value) => {
    if (type === 'status') {
      setStatusFilter(value);
    } else if (type === 'date') {
      setDateRange(value);
    } else if (type === 'user') {
      setUserFilter(value);
    }
  };

  const userOptions = useMemo(() => {
    const map = new Map();

    orders.forEach((item) => {
      const id = item.userId;
      if (!id) return;

      if (!map.has(id)) {
        map.set(id, {
          userId: id,
          fullName: item.fullName || item.user?.fullName || 'Không rõ',
          phone: item.phone || item.user?.phone || '',
        });
      }
    });

    return Array.from(map.values());
  }, [orders]);

  const getFilteredOrders = () => {
    let filtered = [...orders];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (item) => (item.status || 'approved') === statusFilter
      );
    }

    if (userFilter !== 'all') {
      filtered = filtered.filter((item) => item.userId === userFilter);
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf('day');
      const end = dateRange[1].endOf('day');

      filtered = filtered.filter((item) => {
        const dateStr = item.startDate || item.createdAt;
        if (!dateStr) return false;
        const d = dayjs(dateStr);
        return d.isAfter(start) && d.isBefore(end);
      });
    }

    return filtered;
  };

  const columns = [
    {
      title: 'Mã phiếu',
      dataIndex: 'cartId',
      key: 'cartId',
      width: '14%',
      render: (value, record) => value || record._id || '—',
    },
    {
      title: 'Người mượn',
      dataIndex: 'fullName',
      key: 'fullName',
      width: '14%',
      render: (_, record) => (
        <span className={cx('price')}>
          {record?.fullName || record?.user?.fullName || 'Không rõ'}
        </span>
      ),
    },
    {
      title: 'Lớp',
      dataIndex: 'class',
      key: 'class',
      width: '10%',
      render: (_, record) => (
        <span className={cx('price')}>
          {record?.user?.class || record.class || '—'}
        </span>
      ),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: '12%',
      render: (_, record) => (
        <span className={cx('price')}>
          {record?.phone || record?.user?.phone || '—'}
        </span>
      ),
    },
    {
      title: 'Tên sách',
      dataIndex: 'bookName',
      key: 'bookName',
      width: '20%',
      render: (_, record) => (
        <span className={cx('book-name')}>
          {record?.bookName || record?.productName || 'Sách không tồn tại'}
        </span>
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: '8%',
      align: 'center',
      render: (qty) => <span>{qty || 1}</span>,
    },
    {
      title: 'Thời gian mượn',
      key: 'time',
      width: '18%',
      render: (_, record) => (
        <div className={cx('time-range')}>
          <div>
            Từ:{' '}
            {record.startDate
              ? dayjs(record.startDate).format('DD/MM/YYYY')
              : '—'}
          </div>
          <div>
            Đến:{' '}
            {record.endDate
              ? dayjs(record.endDate).format('DD/MM/YYYY')
              : '—'}
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      dataIndex: 'status',
      width: '14%',
      render: (status, record) => (
        <Select
          value={status || 'approved'}
          style={{ width: 140 }}
          onChange={(newStatus) => handleStatusChange(newStatus, record)}
          className={cx('status-select')}
        >
          <Select.Option value="approved">
            <Tag color="gold">Đang mượn</Tag>
          </Select.Option>
          <Select.Option value="completed">
            <Tag color="blue">Đã trả</Tag>
          </Select.Option>
        </Select>
      ),
    },
  ];

  return (
    <div className={cx('wrapper')}>
      <div className={cx('header')}>
        <h2 className={cx('title')}>Quản lý mượn sách</h2>
      </div>

      <div className={cx('filters')}>
        <Row gutter={16}>
          <Col span={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="Lọc theo trạng thái"
              value={statusFilter}
              onChange={(value) => handleFilterChange('status', value)}
            >
              <Select.Option value="all">Tất cả trạng thái</Select.Option>
              <Select.Option value="approved">Đang mượn</Select.Option>
              <Select.Option value="completed">Đã trả</Select.Option>
            </Select>
          </Col>

          <Col span={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="Lọc theo người mượn"
              value={userFilter}
              onChange={(value) => handleFilterChange('user', value)}
              allowClear={false}
              showSearch
              optionFilterProp="children"
            >
              <Select.Option value="all">Tất cả người mượn</Select.Option>
              {userOptions.map((u) => (
                <Select.Option key={u.userId} value={u.userId}>
                  {u.fullName} {u.phone ? `- ${u.phone}` : ''}
                </Select.Option>
              ))}
            </Select>
          </Col>

          <Col span={8}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['Từ ngày', 'Đến ngày']}
              value={dateRange}
              onChange={(value) => handleFilterChange('date', value)}
              format="DD/MM/YYYY"
            />
          </Col>
        </Row>
      </div>

      <div className={cx('content')}>
        <Table
          columns={columns}
          dataSource={getFilteredOrders()}
          rowKey={(record, index) =>
            record._id ||
            `${record.cartId || 'cart'}_${record.bookId || 'book'}_${index}`
          }
          pagination={{
            pageSize: 10,
            position: ['bottomCenter'],
          }}
          loading={loading}
          className={cx('order-table')}
        />
      </div>
    </div>
  );
}

export default ManagerOrder;
