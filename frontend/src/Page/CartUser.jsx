import React, { useEffect, useMemo, useState } from 'react';
import {
  Button, InputNumber, Card, Row, Col, Empty, Badge, Tooltip, message, Tag, Modal, DatePicker, Segmented, Alert, Badge as AntBadge
} from 'antd';
import {
  ReadOutlined, CalendarOutlined, ScheduleOutlined, ExclamationCircleOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import Header from '../Components/Header/Header';
import { useStore } from '../hooks/useStore';
import dayjs from 'dayjs';
import { requestDeleteItem, requestUpdateQuantity, requestExtendBorrow } from '../config/request';

const fmtVND = (n) => Number(n || 0).toLocaleString('vi-VN') + '₫';
const daysBetween = (a, b) => b.startOf('day').diff(a.startOf('day'), 'day');

const STATUS_META = {
  active:   { color: '#10b981', tag: 'green',  border: '#dcfce7', bg: 'bg-emerald-50/60' },
  upcoming: { color: '#3b82f6', tag: 'blue',   border: '#dbeafe', bg: 'bg-blue-50/60' },
  overdue:  { color: '#ef4444', tag: 'red',    border: '#fee2e2', bg: 'bg-red-50/60'  },
  unknown:  { color: '#9ca3af', tag: 'default',border: '#f3f4f6', bg: 'bg-gray-50'   },
};

export default function BorrowCart() {
  const { dataCart, fetchCart } = useStore();

  const [extendOpen, setExtendOpen] = useState(false);
  const [extendItem, setExtendItem] = useState(null);
  const [extendDate, setExtendDate] = useState(null);
  const [saving, setSaving] = useState(false);

  const [statusFilter, setStatusFilter] = useState('Tất cả');

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const items = Array.isArray(dataCart) ? dataCart : [];
  const isEmpty = items.length === 0;
  const today = dayjs();

  const decorate = (it) => {
    const p = it?.product || null;
    const start = it?.startDate ? dayjs(it.startDate) : null;
    const end = it?.endDate ? dayjs(it.endDate) : null;

    let status = 'unknown';
    let badge = <Tag>—</Tag>;
    let helper = '';

    if (start && end) {
      if (today.isBefore(start, 'day')) {
        status = 'upcoming';
        const d = daysBetween(today, start);
        badge = <Tag color="blue">Sắp mượn</Tag>;
        helper = `Bắt đầu sau ${d} ngày`;
      } else if (today.isAfter(end, 'day')) {
        status = 'overdue';
        const d = daysBetween(end, today);
        badge = <Tag color="red">Quá hạn</Tag>;
        helper = `Quá hạn ${d} ngày`;
      } else {
        status = 'active';
        const d = daysBetween(today, end);
        badge = <Tag color="green">Đang mượn</Tag>;
        helper = `Còn ${d} ngày`;
      }
    }

    const qty = Number(it?.quantity) || 1;
    const unitPrice = Number(p?.price) || 0;
    const lineTotal = typeof it?.totalPrice === 'number' ? it.totalPrice : unitPrice * qty;

    return {
      ...it,
      _decor: { status, badge, helper, start, end, unitPrice, lineTotal, p }
    };
  };

  const decos = items.map(decorate);

  const counters = useMemo(() => {
    let active = 0, upcoming = 0, overdue = 0;
    decos.forEach(d => {
      if (d._decor.status === 'active') active++;
      else if (d._decor.status === 'upcoming') upcoming++;
      else if (d._decor.status === 'overdue') overdue++;
    });
    return { active, upcoming, overdue, total: decos.length };
  }, [decos]);

  const filtered = useMemo(() => {
    if (statusFilter === 'Tất cả') return decos;
    const map = { 'Đang mượn': 'active', 'Sắp mượn': 'upcoming', 'Quá hạn': 'overdue' };
    return decos.filter(d => d._decor.status === map[statusFilter]);
  }, [decos, statusFilter]);

  // Trả sách (thay cho "Gỡ")
  const returnBook = (id) => {
    Modal.confirm({
      title: 'Trả sách',
      content: 'Bạn có chắc muốn trả sách này?',
      okText: 'Trả sách',
      cancelText: 'Huỷ',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await requestDeleteItem({ productId: id });
          message.success('Đã trả sách thành công');
          fetchCart();
        } catch (e) {
          message.error(e?.response?.data?.message || 'Trả sách thất bại');
        }
      },
    });
  };

  const updateQuantity = async (id, quantity) => {
    try {
      await requestUpdateQuantity({ productId: id, quantity });
      fetchCart();
    } catch {
      message.error('Cập nhật số bản mượn thất bại');
    }
  };

  // Gia hạn
  const openExtend = (item) => {
    setExtendItem(item);
    const base = item?._decor?.end ? dayjs(item._decor.end) : today;
    setExtendDate(base.add(1, 'day'));
    setExtendOpen(true);
  };
  const disabledExtendDate = (current) => {
    if (!extendItem) return false;
    const start = extendItem?._decor?.start;
    const endNow = extendItem?._decor?.end;
    const minDay = endNow || start || today;
    return current && current.startOf('day').isBefore(dayjs(minDay).startOf('day'));
  };
  const saveExtend = async () => {
    if (!extendItem) return;
    const productId = extendItem.productId || extendItem?.product?._id;
    const start = extendItem?._decor?.start;
    if (!extendDate) return message.warning('Vui lòng chọn ngày trả mới');
    if (start && extendDate.startOf('day').isBefore(start.startOf('day')))
      return message.error('Ngày trả mới không được trước ngày mượn');
    const endNow = extendItem?._decor?.end;
    if (endNow && extendDate.startOf('day').isBefore(endNow.startOf('day')))
      return message.error('Ngày trả mới phải sau hoặc bằng ngày trả hiện tại');

    try {
      setSaving(true);
      await requestExtendBorrow({ productId, endDate: extendDate.toISOString() });
      message.success('Gia hạn thành công');
      setExtendOpen(false); setExtendItem(null); setExtendDate(null);
      fetchCart();
    } catch (e) {
      message.error(e?.response?.data?.message || 'Gia hạn thất bại');
    } finally { setSaving(false); }
  };

  // header gradient + toolbar
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-90"
             style={{background: 'radial-gradient(1200px 500px at 10% 0%, #dbeafe, #f0f9ff 60%, #ffffff)'}} />
        <Header />
        <div className="relative w-[90%] mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl grid place-items-center bg-white shadow-sm">
              <ReadOutlined className="text-blue-600 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight m-0">
                Sách đã mượn
              </h1>
              <div className="text-slate-500 text-sm">
                Đang mượn <b>{counters.active}</b> • Sắp mượn <b>{counters.upcoming}</b> • Quá hạn <b className="text-red-500">{counters.overdue}</b>
              </div>
            </div>
            <AntBadge count={counters.total} style={{ backgroundColor: '#111827' }} className="ml-2" />
          </div>

          {!isEmpty && (
            <Segmented
              options={['Tất cả', 'Đang mượn', 'Sắp mượn', 'Quá hạn']}
              value={statusFilter}
              onChange={setStatusFilter}
              size="large"
            />
          )}
        </div>
      </div>

      <main className="w-[90%] mx-auto px-4 pb-10">
        {counters.overdue > 0 && (
          <Alert
            className="mb-5"
            type="error"
            showIcon
            icon={<ExclamationCircleOutlined />}
            message="Bạn có sách quá hạn"
            description="Vui lòng gia hạn hoặc trả sách để tránh phát sinh phí."
          />
        )}

        <Row gutter={[20, 20]}>
          <Col span={24}>
            {isEmpty ? (
              <Card className="border-0 shadow-sm rounded-2xl">
                <Empty
                  imageStyle={{ height: 80 }}
                  description={<span className="text-slate-500">Chưa có sách nào được mượn</span>}
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filtered.map((item) => {
                  const { _decor } = item;
                  const p = _decor.p;
                  const name = item?.nameProduct || p?.nameProduct || 'Sách không xác định';
                  const imgSrc =
                    (Array.isArray(item?.image) && item.image[0]) ||
                    (Array.isArray(p?.images) && p.images[0]) ||
                    'https://via.placeholder.com/80x104/f0f0f0/666?text=No+Image';
                  const author = p?.author || p?.publisher || '—';
                  const publishingHouse = p?.publishingHouse || '—';
                  const stock = Number(p?.stock) || 0;
                  const qty = Number(item?.quantity) || 1;

                  const meta = STATUS_META[_decor.status] || STATUS_META.unknown;
                  const CardInner = (
                    <div
                      className={[
                        'relative rounded-2xl p-5 bg-white border transition-all duration-200',
                        'hover:shadow-lg hover:-translate-y-[2px]',
                      ].join(' ')}
                      style={{ borderColor: meta.border }}
                    >
                      {/* Accent bar */}
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl" style={{ background: meta.color }} />

                      {/* Ribbon overdue */}
                      {_decor.status === 'overdue' && (
                        <div className="absolute -right-2 -top-2">
                          <AntBadge.Ribbon text="Quá hạn" color="red" />
                        </div>
                      )}

                      <Row gutter={[16, 16]} align="middle">
                        {/* Cover */}
                        <Col flex="88px">
                          <div className="relative rounded-xl overflow-hidden ring-1 ring-slate-100">
                            <img
                              src={imgSrc}
                              alt={name}
                              className="w-22 h-28 object-cover"
                              onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/88x112/f0f0f0/666?text=No+Image'; }}
                            />
                          </div>
                        </Col>

                        {/* Info */}
                        <Col flex="auto">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="m-0 text-slate-800 font-semibold leading-tight">{name}</h3>
                                {_decor.badge}
                              </div>
                              <div className="text-sm text-slate-500 flex flex-wrap gap-3 mt-1">
                                <span>Tác giả: {author}</span>
                                <span>NXB: {publishingHouse}</span>
                              </div>

                              <div className="flex items-center flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 mt-2">
                                <span className="inline-flex items-center gap-1">
                                  <CalendarOutlined /> Mượn:{' '}
                                  <b>{_decor.start ? _decor.start.format('DD/MM/YYYY') : '—'}</b>
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <ScheduleOutlined /> Trả:{' '}
                                  <b>{_decor.end ? _decor.end.format('DD/MM/YYYY') : '—'}</b>
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-xs"
                                      style={{ background: meta.border, color: meta.color }}>
                                  {_decor.helper}
                                </span>
                              </div>
                            </div>

                            {/* Price */}
                          </div>

                          <div className="mt-3 flex items-end justify-between gap-3">
                            {/* Quantity */}
                            <div className="space-y-1">
                              <div className="text-xs text-slate-500">Số bản mượn</div>
                              <div className="flex items-center gap-2">
                                <InputNumber
                                  min={1}
                                  max={stock || 9999}
                                  value={qty}
                                  onChange={(v) => updateQuantity(item.productId, v || 1)}
                                  size="small"
                                />
                                <span className="text-xs text-orange-500">{stock ? `Còn ${stock} bản` : 'Không thể mượn'}</span>
                              </div>
                            </div>

                            {/* Line total + actions */}
                            <div className="flex items-center gap-2">
                              <Tooltip title="Gia hạn ngày trả">
                                <Button icon={<ClockCircleOutlined />} onClick={() => openExtend(item)}>
                                  Gia hạn
                                </Button>
                              </Tooltip>

                              {/* <Tooltip title="Trả sách">
                                <Button danger onClick={() => returnBook(item.productId)}>
                                  Trả sách
                                </Button>
                              </Tooltip> */}
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  );

                  return <div key={item._id}>{CardInner}</div>;
                })}
              </div>
            )}
          </Col>
        </Row>
      </main>

      {/* Modal Gia hạn */}
      <Modal
        title="Gia hạn ngày trả"
        open={extendOpen}
        onOk={saveExtend}
        okText="Lưu"
        confirmLoading={saving}
        onCancel={() => { setExtendOpen(false); setExtendItem(null); setExtendDate(null); }}
        destroyOnClose
      >
        {extendItem && (
          <div className="space-y-3">
            <div className="text-sm">
              Sách: <strong>{extendItem?.product?.nameProduct || extendItem?.nameProduct || '—'}</strong>
            </div>
            <div className="text-sm">
              Ngày mượn:{' '}
              <strong>{extendItem?._decor?.start ? extendItem._decor.start.format('DD/MM/YYYY') : '—'}</strong>
              {'  '}— Ngày trả hiện tại:{' '}
              <strong>{extendItem?._decor?.end ? extendItem._decor.end.format('DD/MM/YYYY') : '—'}</strong>
            </div>

            <div className="text-sm">Chọn ngày trả mới:</div>
            <DatePicker
              value={extendDate}
              onChange={(d) => setExtendDate(d)}
              format="DD/MM/YYYY"
              className="w-full"
              disabledDate={disabledExtendDate}
            />
            <div className="text-xs text-gray-500">
              * Không thể chọn trước ngày mượn hoặc sớm hơn ngày trả hiện tại.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
