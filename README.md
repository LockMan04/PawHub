# PawHub

> Một nơi để lướt mèo, ngắm chó và trì hoãn công việc theo cách có gu.

PawHub là một phòng triển lãm ảnh động vật chạy dài theo cú cuộn chuột. Ảnh bay nhẹ theo hiệu ứng parallax, chữ thỉnh thoảng chen ngang nói linh tinh, còn mày chỉ cần ngồi đó và giả vờ đây là liệu pháp tinh thần.

Hiện tại hội quán có hai khu:

- [cat.lockman.dev](https://cat.lockman.dev) — mèo, thái độ và một lượng lông không thể kiểm soát.
- [dog.lockman.dev](https://dog.lockman.dev) — chó, năng lượng và khả năng phát hiện sóc từ xa.

Cùng một ứng dụng, khác cửa vào, không có cuộc chiến chó mèo nào xảy ra trong quá trình triển khai.

## Vào đây làm gì?

- Cuộn để xem một dòng ảnh mèo hoặc chó được sắp xếp ngẫu nhiên.
- Bấm vào bất kỳ ảnh nào để xem cận cảnh sắc nét, sao chép liên kết (Copy), chia sẻ (Share), tải ảnh về máy (Save) hoặc mở tab ảnh gốc. Rê chuột lên ảnh cũng có sẵn các nút bấm nhanh.
- Bật giao diện sáng/tối tùy tâm trạng và giờ đi ngủ.
- Bấm `+20` khi số động vật hiện tại vẫn chưa đủ chữa lành.
- Làm mới cả đàn bằng nút refresh.
- Tải lại trang trong cùng phiên mà không phải triệu hồi mọi thứ từ đầu.
- Dùng bàn phím và chế độ giảm chuyển động nếu mày không thích giao diện nhảy múa quá nhiều.

Ảnh mèo đến từ [CATAAS](https://cataas.com), còn ảnh chó được gửi sang từ [Dog CEO](https://dog.ceo/dog-api/). PawHub chỉ lo phần dựng sân khấu; các diễn viên bốn chân thuộc về Internet.

## Chạy trên máy

Mày cần Node.js và npm. Sau đó:

```bash
npm install
npm run dev
```

Vite sẽ in địa chỉ local ra terminal, thường là `http://localhost:5173`.

Muốn chọn khu mà không cần dựng hai subdomain local:

- Mèo: `http://localhost:5173/?site=cat`
- Chó: `http://localhost:5173/?site=dog`

Nếu không chọn gì, mèo mặc định tiếp quản màn hình. Điều này hoàn toàn phù hợp với lịch sử loài người.

## Mấy lệnh hữu ích

```bash
npm run dev        # Mở cửa hội quán
npm test           # Kiểm tra xem chó mèo có phá gì không
npm run typecheck  # Soi lỗi TypeScript
npm run build      # Đóng gói bản production
npm run preview    # Xem thử bản vừa đóng gói
```

## Bên trong có gì?

PawHub dùng React, Vite, Tailwind CSS và Motion. Không cần thuộc lòng đống này để thưởng thức ảnh động vật, nhưng nếu mày muốn sửa code thì bản đồ ngắn gọn là:

```text
src/
├── components/  Giao diện và các màn trình diễn
├── core/        Logic dùng chung, âm thầm làm việc phía sau
├── hooks/       Quản lý đàn ảnh, tải thêm và bộ nhớ phiên
├── sites/
│   ├── cat/     Nguồn ảnh, câu chữ và tính cách của mèo
│   └── dog/     Nguồn ảnh, câu chữ và tính cách của chó
├── styles/      Quần áo của toàn bộ hội quán
└── __tests__/   Đội kiểm tra thiệt hại
```

App chọn khu dựa trên hostname (`cat.*`, `dog.*`) hoặc query `?site=...`. Nhờ vậy cả hai khu dùng chung giao diện và cách vận hành, nhưng vẫn có nguồn ảnh cùng lời thoại riêng.

## Muốn thêm một con khác?

Ví dụ ngày mai capybara giành quyền điều hành:

1. Tạo `src/sites/capybara/`.
2. Khai báo nơi lấy ảnh, câu chữ và cấu hình của capybara.
3. Đăng ký nó trong `src/sites/registry.ts`.
4. Thêm test để chắc rằng capybara không làm sập hội quán.

Phần giao diện chung không cần nhân bản. Một repo là đủ; sở thú đã đông rồi, đừng nuôi thêm ba bản code giống nhau.

## Ghi chú nhỏ nhưng có võ

- Ảnh phụ thuộc vào API công cộng, nên đôi lúc Internet có thể dỗi.
- Gallery được lưu trong `sessionStorage`, không phải hồ sơ tuyệt mật của thú cưng.
- Nút tải thêm cố lấy đúng 20 ảnh mới, vì `+20` mà ra `+17` thì mất uy tín.
- Hiệu ứng chuyển động tôn trọng `prefers-reduced-motion`.

Nếu mày vào đây chỉ để xem ảnh chó mèo thì chúc vui. Nếu mày vào để đọc source code thì… cũng chúc vui, nhưng theo một kiểu khác.
