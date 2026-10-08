import { Carousel, Button, InputNumber, DatePicker, message, Tag } from 'antd';
import { ReadOutlined, CalendarOutlined, InboxOutlined } from '@ant-design/icons';
import Header from '../Components/Header/Header';
import { useState, useRef, useEffect, useMemo } from 'react';
import Footer from '../Components/Footer/Footer';

import { requestCreateCart, requestCreateViewProduct, requestGetProductById } from '../config/request';
import { useParams } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import dayjs from 'dayjs';

// Ảnh dự phòng
const fallbackImage = 'https://via.placeholder.com/400x500/f0f0f0/666666?text=No+Image';
const SGK_SLUG = 'sach-giao-khoa-sgk';

function DetailProduct() {
  const [quantity, setQuantity] = useState(1);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [imageErrors, setImageErrors] = useState({});
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const carouselRef = useRef();
  const [book, setBook] = useState(null);

  const { fetchCart, dataUser, category: categories } = useStore();
  const { id } = useParams();

  // Lỗi ảnh
  const handleImageError = (index) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  // Ảnh có fallback
  const getImageSrc = (index) => {
    const src = Array.isArray(book?.images) ? book.images[index] : undefined;
    return imageErrors[index] ? fallbackImage : (src || fallbackImage);
  };

  // Ngày mượn/kết thúc
  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (endDate && date && endDate.isBefore(date, 'day')) {
      setEndDate(date);
    }
  };
  const handleEndDateChange = (date) => setEndDate(date);
  const disabledStartDate = (current) => current && current < dayjs().startOf('day');
  const disabledEndDate = (current) => (startDate ? (current && current < startDate.startOf('day')) : false);

  // Lấy sách theo id + ghi lượt xem
  useEffect(() => {
    const fetchProductById = async () => {
      try {
        const res = await requestGetProductById(id);
        const detail = res?.metadata;
        setBook(detail);
        if (dataUser?._id && detail?._id) {
          await requestCreateViewProduct({ productId: detail._id });
        }
      } catch (e) {
        message.error('Không tải được thông tin sách.');
      }
    };
    fetchProductById();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Tìm category của sách để biết có phải SGK
  const bookCategory = useMemo(() => {
    if (!book?.category || !Array.isArray(categories)) return null;
    return categories.find((c) => c._id === book.category) || null;
  }, [book, categories]);

  const isSGK = bookCategory?.slug === SGK_SLUG;

  // Giới hạn số bản mượn tối đa theo kho
  const maxBorrow = Math.max(0, Number(book?.stock) || 0);

  const handleAddToBorrowList = async () => {
    if (!startDate || !endDate) {
      message.warning('Vui lòng chọn Ngày mượn và Ngày trả.');
      return;
    }
    if (quantity < 1) {
      message.warning('Số bản mượn phải ít nhất là 1.');
      return;
    }
    if (maxBorrow > 0 && quantity > maxBorrow) {
      message.warning(`Chỉ còn ${maxBorrow} bản trong kho.`);
      return;
    }

    const payload = {
      product: book._id,
      quantity,
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
      price: 0, // BE đang không dùng, giữ 0
    };

    try {
      const res = await requestCreateCart(payload);
      message.success(res?.message || 'Đã thêm vào danh sách mượn');
      fetchCart();
    } catch (error) {
      message.error(error?.response?.data?.message || 'Không thể thêm vào danh sách mượn');
    }
  };

  // Tổng số ngày mượn
  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    // Tính cả ngày bắt đầu → +1
    return endDate.diff(startDate, 'day') + 1;
  }, [startDate, endDate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />

      <div className="w-[90%] mx-auto py-10 px-4 flex flex-col lg:flex-row gap-8">
        {/* Khối ảnh */}
        <div className="lg:w-1/3 flex flex-col items-center">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-lg mb-4 overflow-hidden relative">
            <Carousel
              dots={false}
              afterChange={setCarouselIdx}
              ref={carouselRef}
              className="w-full"
              effect="fade"
            >
              {(book?.images || [fallbackImage]).map((_, idx) => (
                <div key={idx} className="flex items-center justify-center h-[500px] bg-gray-50">
                  <img
                    src={getImageSrc(idx)}
                    alt={`Ảnh sách ${idx + 1}`}
                    className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                    onError={() => handleImageError(idx)}
                    loading="lazy"
                  />
                </div>
              ))}
            </Carousel>
            <div className="absolute top-3 right-3 bg-white bg-opacity-90 rounded-full px-2 py-1 text-xs font-medium text-gray-600">
              {Math.min(carouselIdx + 1, (book?.images?.length || 1))}/{book?.images?.length || 1}
            </div>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 mt-4 flex-wrap justify-center">
            {(book?.images || [fallbackImage]).map((_, idx) => (
              <button
                key={idx}
                className={`border-2 rounded-lg w-16 h-20 flex items-center justify-center overflow-hidden transition-all duration-200 shadow-sm bg-white ${
                  carouselIdx === idx
                    ? 'border-blue-500 ring-2 ring-blue-300 scale-105'
                    : 'border-gray-200 hover:border-blue-400 hover:scale-105'
                }`}
                onClick={() => {
                  setCarouselIdx(idx);
                  carouselRef.current?.goTo?.(idx);
                }}
                aria-label={`Xem ảnh ${idx + 1}`}
              >
                <img
                  src={getImageSrc(idx)}
                  alt={`Thumbnail ${idx + 1}`}
                  className="object-cover h-full w-full rounded"
                  onError={() => handleImageError(idx)}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Thông tin sách */}
        <div className="lg:w-1/2 bg-white rounded-xl shadow-lg p-6 lg:p-8 flex flex-col gap-6">
          <div className="flex items-start justify-between">
            <h1 className="text-xl lg:text-2xl font-bold leading-snug text-gray-800">
              {book?.nameProduct || '—'}
            </h1>
            <div className="flex items-center gap-2">
              {isSGK && <Tag color="green">SGK</Tag>}
              {Number(book?.stock) > 0 ? (
                <Tag color="blue">Còn {book?.stock} bản</Tag>
              ) : (
                <Tag color="red">Hết bản</Tag>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h3 className="font-semibold mb-3 text-gray-700">Thông tin chi tiết</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <div className="flex flex-col sm:col-span-1">
                <span className="text-gray-500 text-sm font-medium">Tác giả</span>
                <span className="text-gray-700 font-semibold">{book?.publisher || '—'}</span>
              </div>
              <div className="flex flex-col sm:col-span-1">
                <span className="text-gray-500 text-sm font-medium">Nhà xuất bản</span>
                <span className="text-gray-700 font-semibold">{book?.publishingHouse || '—'}</span>
              </div>
              <div className="flex flex-col sm:col-span-1">
                <span className="text-gray-500 text-sm font-medium">Tình trạng kho</span>
                <span className="text-gray-700 font-semibold">
                  {Number(book?.stock) ?? 0} bản
                </span>
              </div>
              <div className="flex flex-col sm:col-span-1">
                <span className="text-gray-500 text-sm font-medium">Loại bìa</span>
                <span className="text-gray-700 font-semibold">
                  {book?.coverType === 'hardcover' ? 'Bìa cứng' : 'Bìa mềm'}
                </span>
              </div>
              {bookCategory?.nameCategory && (
                <div className="flex flex-col sm:col-span-1">
                  <span className="text-gray-500 text-sm font-medium">Danh mục</span>
                  <span className="text-gray-700 font-semibold">{bookCategory.nameCategory}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mô tả */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-blue-700">Mô tả sách</h3>
            <div
              className="text-gray-700 whitespace-pre-line text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: book?.description || '' }}
            />
          </div>
        </div>

        {/* Khối mượn */}
        <div className="lg:w-1/4 bg-white rounded-xl shadow-lg p-6 lg:p-8 flex flex-col gap-6 h-fit border border-blue-100 sticky top-24">
          {/* Giá cọc */}
         

          {/* Số bản mượn */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600 font-medium">Số bản mượn</span>
            <InputNumber
              min={1}
              max={maxBorrow || 99}
              value={quantity}
              onChange={(value) => setQuantity(value || 1)}
              className="!w-24"
              size="large"
              disabled={maxBorrow === 0}
            />
          </div>

          {/* Chọn thời gian mượn */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h4 className="font-medium text-gray-700 mb-2 flex items-center">
              <CalendarOutlined className="mr-2 text-blue-500" />
              Thời gian mượn
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Ngày mượn</label>
                <DatePicker
                  placeholder="Chọn ngày mượn"
                  className="w-full"
                  format="DD/MM/YYYY"
                  value={startDate}
                  onChange={handleStartDateChange}
                  disabledDate={disabledStartDate}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Ngày trả</label>
                <DatePicker
                  placeholder="Chọn ngày trả"
                  className="w-full"
                  format="DD/MM/YYYY"
                  value={endDate}
                  onChange={handleEndDateChange}
                  disabledDate={disabledEndDate}
                />
              </div>

              {startDate && endDate && (
                <div className="bg-blue-50 p-2 rounded text-xs text-blue-700 mt-2">
                  Thời gian mượn: {totalDays} ngày
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Button
              icon={<ReadOutlined />}
              className="border-2 border-blue-500 text-blue-500 font-semibold h-12 rounded-lg text-base hover:bg-blue-50 hover:border-blue-600 transition-all duration-200"
              size="large"
              block
              onClick={handleAddToBorrowList}
              disabled={!startDate || !endDate || maxBorrow === 0}
            >
              Yêu cầu mượn
            </Button>
          </div>

          {/* Thông tin bổ sung (ẩn note phí SGK theo yêu cầu) */}
          <div className="pt-2 border-t border-gray-200 text-sm text-gray-600 space-y-2">
            <div className="flex items-center gap-2">
              <InboxOutlined />
              <span>Mỗi bạn có thể mượn nhiều đầu sách nếu còn bản.</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarOutlined />
              <span>Vui lòng trả đúng hạn để tránh khóa lượt mượn.</span>
            </div>
          </div>
        </div>
      </div>

      <footer>
        <Footer />
      </footer>
    </div>
  );
}

export default DetailProduct;
