// import { FacebookFilled, YoutubeFilled } from 'antd/es/icons';

function Footer() {
    return (
        <footer className="bg-white border-t border-gray-200 mt-8 w-[95%] mx-auto">
            <div className="mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm text-gray-700">
                {/* Hỗ trợ sinh viên */}
                <div>
                    <h3 className="font-semibold mb-2">Hỗ trợ sinh viên</h3>
                    <div className="mb-1">
                        Hotline: <span className="font-semibold">0935498457</span>
                    </div>
                    <div className="mb-1 text-xs text-gray-500">(Từ 8h đến 5h; kể cả T7, CN)</div>
                    <ul className="space-y-1 mt-2">
                        <li>Giới thiệu Trường THPT Hòa Vang</li>
                        <li>Giới thiệu hệ thống quản lý thư viện</li>
                        <li>Tầm nhìn và mục tiêu hoạt động của thư viện</li>
                        <li>Nội quy mượn – trả sách</li>
                        <li>Hướng dẫn sử dụng hệ thống quản lý</li>
                        <li>Báo lỗi bảo mật: nhan_2051220082@dau.edu.vn</li>
                    </ul>
                </div>
                {/* Hỗ trợ người dùng */}
                <div>
                    <h3 className="font-semibold mb-2">Hỗ trợ người dùng</h3>
                    <ul className="space-y-1">
                        <li>Câu hỏi thường gặp (FAQ)</li>
                        <li>Hướng dẫn mượn / trả sách</li>
                        <li>Hướng dẫn mượn và trả sách trực tuyến</li>
                        <li>Cách tra cứu tài liệu nhanh</li>
                        <li>Liên hệ quản trị viên</li>
                        <li>Báo lỗi – Góp ý hệ thống</li>
                    </ul>
                </div>
                {/* Chính sách & Quy định */}
                <div>
                    <h3 className="font-semibold mb-2">Chính sách & Quy định</h3>
                    <ul className="space-y-1">
                        <li>Chính sách bảo mật thông tin</li>
                        <li>Quy định mượn và hoàn trả sách</li>
                        <li>Quy định sử dụng tài khoản</li>
                        <li>Hướng dẫn xử lý sự cố</li>
                    </ul>
                    <h3 className="font-semibold mt-4 mb-2">Chứng nhận bởi</h3>
                    <div className="flex space-x-2 items-center">
                        <img
                            src="https://frontend.tikicdn.com/_desktop-next/static/img/footer/bo-cong-thuong-2.png"
                            alt="Bộ Công Thương"
                            className="h-8"
                        />
                        <img
                            src="https://frontend.tikicdn.com/_desktop-next/static/img/footer/bo-cong-thuong.svg"
                            alt="Đã đăng ký"
                            className="h-8"
                        />
                        <img
                            src="https://images.dmca.com/Badges/dmca_protected_sml_120y.png?ID=388d758c-6722-4245-a2b0-1d2415e70127"
                            alt="DMCA"
                            className="h-8"
                        />
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold mb-2">Kết nối với chúng tôi</h3>
                    <div className="flex space-x-3 mb-4">
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Icon_of_Zalo.svg/2048px-Icon_of_Zalo.svg.png"
                            alt=""
                            className="h-10"
                        />
                        <img
                            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiXN9xSEe8unzPBEQOeAKXd9Q55efGHGB9BA&s"
                            alt=""
                            className="h-10"
                        />
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
