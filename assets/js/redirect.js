const API_URL = 'https://script.google.com/macros/s/AKfycby84cmQIndmZpV6WIQrU6Gf1OlHujkJbskazkHETy9piDK8bilci1wANQ5Ecel3WSlx7w/exec';

// 1. Lấy slug từ query string (dithoi=...)
const params = new URLSearchParams(location.search);
const slug = params.get('dithoi'); 

const loadingBox = document.getElementById('loadingBox');
const infoBox    = document.getElementById('infoBox');
const lockBox    = document.getElementById('lockBox');
const errorBox   = document.getElementById('errorBox');

if (!slug) {
  showError('Slug không hợp lệ');
} else {
  // 2. Gọi API lấy thông tin link
  fetch(`${API_URL}?action=get&slug=${slug}`)
    .then(r => r.json())
    .then(res => {
      loadingBox.style.display = 'none';

      if (res.error) {
        showError(mapError(res.error));
        return;
      }

      // HIỂN THỊ THÔNG TIN CƠ BẢN
      document.getElementById('linkTitle').innerText = res.title || 'TNLink Redirect';
      document.getElementById('linkDesc').innerText  = res.description || 'Vui lòng đợi trong giây lát...';

      // 3. KIỂM TRA TRẠNG THÁI KHOÁ (FIX LỖI BOOLEAN/STRING)
      // Chấp nhận cả giá trị logic true từ Sheets và chuỗi "TRUE" gửi từ form
      const isLocked = res.is_locked === true || String(res.is_locked).toUpperCase() === 'TRUE';

      if (isLocked) {
        lockBox.style.display = 'block';
        handleUnlock(res); // Truyền dữ liệu sang hàm xử lý mật khẩu
        return; 
      }

      // 4. LINK THƯỜNG (KHÔNG KHOÁ)
      showInfoAndRedirect(res);
    })
    .catch(() => {
      loadingBox.style.display = 'none';
      showError('Không thể kết nối máy chủ');
    });
}

// HÀM XỬ LÝ MỞ KHOÁ (FIX LỖI SO SÁNH MẬT KHẨU SỐ)
function handleUnlock(res){
  const unlockBtn = document.getElementById('unlockBtn');
  const passInput = document.getElementById('passwordInput');
  const lockError = document.getElementById('lockError');

  unlockBtn.onclick = () => {
    const val = passInput.value.trim();
    
    // Ép cả 2 về String để "123456" khớp với 123456 trong trang tính
    if(String(val) !== String(res.password)){
      lockError.innerText = '❌ Mật khẩu không chính xác';
      return;
    }
    
    // Đúng mật khẩu
    lockBox.style.display = 'none';
    showInfoAndRedirect(res);
  };

  // Hỗ trợ nhấn phím Enter để mở khoá
  passInput.onkeypress = (e) => {
    if(e.key === 'Enter') unlockBtn.click();
  };
}

// HÀM HIỂN THỊ VÀ BẮT ĐẦU ĐẾM NGƯỢC
function showInfoAndRedirect(res) {
  infoBox.style.display = 'block';
  
  // Khởi chạy đếm ngược thời hạn link
  if(res.expire_at) {
    startRedirectCountdown(res.expire_at);
  } else {
    document.getElementById('countdown').innerText = 'Vĩnh viễn';
  }

  startRedirect(res.url, res.slug);
}

function startRedirect(url, slug){
  let sec = 5;
  const countEl = document.getElementById('count');
  countEl.innerText = sec;

  const timer = setInterval(()=>{
    sec--;
    countEl.innerText = sec;
    if(sec <= 0){
      clearInterval(timer);
      hitAndGo(url, slug);
    }
  }, 1000);

  document.getElementById('goNow').onclick = () => {
    clearInterval(timer);
    hitAndGo(url, slug);
  };
}

function hitAndGo(url, slug){
  // Ghi nhận lượt click vào Trang tính
  fetch(`${API_URL}?action=click&slug=${slug}`);
  location.href = url;
}

function showError(msg){
  errorBox.style.display = 'block';
  document.getElementById('errorMsg').innerText = msg;
}

function mapError(code){
  return {
    not_found: 'Link này không tồn tại trên hệ thống',
    expired: 'Link này đã hết hạn sử dụng',
    disabled: 'Link đã bị tạm dừng hoặc quá lượt truy cập'
  }[code] || 'Lỗi truy cập hệ thống';
}

function startRedirectCountdown(expireAt) {
  const countdownEl = document.getElementById('countdown');
  const interval = setInterval(() => {
    const diff = new Date(expireAt) - new Date();
    if (diff <= 0) {
      clearInterval(interval);
      countdownEl.innerText = 'Hết hạn';
      return;
    }
    const days = Math.floor(diff / (1000*60*60*24));
    const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
    const mins = Math.floor((diff % (1000*60*60)) / (1000*60));
    const secs = Math.floor((diff % (1000*60)) / 1000);
    countdownEl.innerText = `${days} ngày ${hours}:${mins}:${secs}`;
  }, 1000);
}
