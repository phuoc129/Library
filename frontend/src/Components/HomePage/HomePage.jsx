import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { BookOutlined } from '@ant-design/icons';
import Cardbody from '../Cardbody/Cardbody';
import { useStore } from '../../hooks/useStore';
import { requestGetCategoryById, requestGetProducts } from '../../config/request';

// Bảng màu cho category
const colorOptions = [
  { color: 'from-purple-500 to-pink-500', bgColor: 'bg-purple-50 hover:bg-purple-100', textColor: 'text-purple-600' },
  { color: 'from-blue-500 to-cyan-500',   bgColor: 'bg-blue-50 hover:bg-blue-100',     textColor: 'text-blue-600'   },
  { color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-50 hover:bg-green-100', textColor: 'text-green-600'  },
  { color: 'from-orange-500 to-red-500',  bgColor: 'bg-orange-50 hover:bg-orange-100', textColor: 'text-orange-600' },
  { color: 'from-pink-500 to-rose-500',   bgColor: 'bg-pink-50 hover:bg-pink-100',     textColor: 'text-pink-600'   },
  { color: 'from-indigo-500 to-purple-500', bgColor: 'bg-indigo-50 hover:bg-indigo-100', textColor: 'text-indigo-600' },
  { color: 'from-gray-500 to-slate-500',  bgColor: 'bg-gray-50 hover:bg-gray-100',     textColor: 'text-gray-600'   },
];

function HomePage() {
  const { category } = useStore(); // danh mục từ Provider
  const [styledCategories, setStyledCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [books, setBooks] = useState([]);            // tất cả sách (trước đây là products)
  const [filteredBooks, setFilteredBooks] = useState([]); // sau sắp xếp/lọc
  const [sortOrder, setSortOrder] = useState('');    // 'title-az' | 'newest' | 'most-borrowed' | 'available-first'

  // Gắn màu + icon + count cho category
  useEffect(() => {
    if (Array.isArray(category) && category.length > 0) {
      const styled = category.map((cat) => {
        const randomStyle = colorOptions[Math.floor(Math.random() * colorOptions.length)];
        const count =
          (Array.isArray(cat.products) && cat.products.length) ||
          Number(cat.count) || 0
        return {
          ...cat,
          icon: <BookOutlined />,
          count,
          ...randomStyle,
        };
      });
      setStyledCategories(styled);
    }
  }, [category]);

  // Fetch tất cả sách
  const fetchAllBooks = async () => {
    const res = await requestGetProducts();
    const list = res?.metadata || [];
   
   console.log('Fetched all books:', list);
    setBooks(list);
    setFilteredBooks(list);
  };

  // Fetch sách theo category
  const fetchBooksByCategory = async (id) => {
    const res = await requestGetCategoryById(id);
    const list = res?.metadata?.products || [];
    setBooks(list);
    setFilteredBooks(list);
  };

  // Lần đầu vào trang → lấy tất cả
  useEffect(() => {
    fetchAllBooks();
  }, []);

  // Khi chọn/ bỏ chọn category
  useEffect(() => {
    if (selectedCategory) {
      fetchBooksByCategory(selectedCategory);
    } else {
      fetchAllBooks();
    }
  }, [selectedCategory]);

  // Sắp xếp theo lựa chọn
  useEffect(() => {
    let result = [...books];

    switch (sortOrder) {
      case 'title-az':
        result.sort((a, b) => (a?.nameProduct || '').localeCompare(b?.nameProduct || '', 'vi', { sensitivity: 'base' }));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
        break;
      case 'most-borrowed':
        // fallback dùng sold nếu chưa có borrowedCount
        result.sort(
          (a, b) => (b?.borrowedCount ?? b?.sold ?? 0) - (a?.borrowedCount ?? a?.sold ?? 0)
        );
        break;
      case 'available-first':
        // ưu tiên stock > 0
        result.sort((a, b) => (Number(b?.stock) > 0) - (Number(a?.stock) > 0));
        break;
      default:
        // giữ nguyên
        break;
    }

    setFilteredBooks(result);
  }, [books, sortOrder]);

  const handleSortChange = (e) => setSortOrder(e.target.value);

  return (
    <div className="w-[95%] mx-auto grid grid-cols-12 gap-6 py-6">
      {/* Sidebar */}
      <div className="col-span-12 lg:col-span-3">
        <div className="sticky top-6 space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <BookOutlined className="text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Danh mục sách</h3>
                  <p className="text-blue-100 text-sm">Khám phá thế giới tri thức</p>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="p-4 space-y-2">
              {styledCategories.map((cat) => (
                <div
                  key={cat._id}
                  className={`group relative overflow-hidden rounded-xl p-4 cursor-pointer transition-all duration-300 transform hover:scale-105 ${cat.bgColor} ${
                    selectedCategory === cat._id ? 'ring-2 ring-blue-500 shadow-lg' : ''
                  }`}
                  onClick={() => setSelectedCategory(selectedCategory === cat._id ? null : cat._id)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${cat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${cat.bgColor.split(' ')[0]} transition-all group-hover:scale-110`}>
                        <span className={`text-lg ${cat.textColor}`}>{cat.icon}</span>
                      </div>
                      <div>
                        <span className={`font-medium ${cat.textColor} group-hover:font-semibold`}>
                          {cat.nameCategory}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {Number(cat.count).toLocaleString()} đầu sách
                        </div>
                      </div>
                    </div>
                    <div
                      className={`transform transition-all duration-300 ${
                        selectedCategory === cat._id ? 'rotate-90' : ''
                      } ${cat.textColor}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${cat.color} transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="col-span-12 lg:col-span-9">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedCategory
                  ? styledCategories.find((c) => c._id === selectedCategory)?.nameCategory || 'Sách nổi bật'
                  : 'Tất cả sách'}
              </h2>
              <p className="text-gray-500 mt-1">
                Hiển thị {filteredBooks.length} trong số {books.length} đầu sách
              </p>
            </div>
            <div>
              {/* <select
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={handleSortChange}
                value={sortOrder}
              >
                <option value="">Sắp xếp theo</option>
                <option value="title-az">Tên sách (A → Z)</option>
                <option value="newest">Mới nhất</option>
                <option value="most-borrowed">Được mượn nhiều</option>
                <option value="available-first">Ưu tiên còn bản</option>
              </select> */}
            </div>
          </div>

          {/* Lưới sách */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.length > 0 ? (
              filteredBooks.map((book) => (
                <Link
                  key={book._id}
                  to={`/product/${book._id}`} // giữ nguyên route hiện tại để không ảnh hưởng các trang khác
                  className="transform hover:scale-105 transition-transform duration-200"
                >
                  {/* Cardbody nên hiển thị theo ngữ cảnh sách (tên, tác giả, còn/het bản) */}
                  <Cardbody product={book} />
                </Link>
              ))
            ) : (
              <div className="col-span-full py-8 text-center">
                <p className="text-lg text-gray-500">Không tìm thấy sách phù hợp với bộ lọc</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
