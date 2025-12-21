const API_URL = 'https://script.google.com/macros/s/AKfycby84cmQIndmZpV6WIQrU6Gf1OlHujkJbskazkHETy9piDK8bilci1wANQ5Ecel3WSlx7w/exec';

const params = new URLSearchParams(location.search);
const slug = params.get('dithoi'); 

const loadingBox = document.getElementById('loadingBox');
const infoBox    = document.getElementById('infoBox');
const lockBox    = document.getElementById('lockBox');
const errorBox   = document.getElementById('errorBox');

if (!slug) {
  showError('Slug không hợp lệ');
} else {
  fetch(`${API_URL}?action=get&slug=${slug}`)
    .then(r => r.json())
    .then(res => {
      loadingBox.style.display = 'none';

      if (res.error) {
        showError(mapError(res.error));
        return;
      }

      // HIỂN THỊ THÔNG TIN CHUNG
      document.getElementById('linkTitle').innerText = res.title || 'SmartLink Redirect';
      document.getElementById('linkDesc').innerText  = res.description || 'Bạn sẽ được chuyển hướng an toàn';
      
      // Khởi chạy đếm ngược thời hạn link (nếu có)
      if(typeof startRedirectCountdown === "function") {
          startRedirectCountdown(res.expire_at);
      }

      // KIỂM TRA KHOÁ (Fix triệt để lỗi Boolean/String)
      const isLocked = res.is_locked === true || String(res.is_locked).toUpperCase() === 'TRUE';

      if (isLocked) {
        lockBox.style.display = 'block';
        handleUnlock(res); // Truyền res vào để lấy mật khẩu
        return; 
      }

      // LINK THƯỜNG
      infoBox.style.display = 'block';
      startRedirect(res.url, slug);
    })
    .catch(() => {
      loadingBox.style.display = 'none';
      showError('Không thể kết nối máy chủ');
    });
}

function handleUnlock(res){
  document.getElementById('unlockBtn').onclick = () => {
    const val = document.getElementById('passwordInput').value.trim();
    
    // Ép kiểu cả 2 về String để so sánh chính xác tuyệt đối (tránh lỗi mật khẩu là số)
    if(String(val) !== String(res.password)){
      document.getElementById('lockError').innerText = '❌ Mật khẩu không đúng';
      return;
    }
    
    // Đúng mật khẩu -> Hiện info và bắt đầu đếm ngược chuyển hướng
    lockBox.style.display = 'none';
    infoBox.style.display = 'block';
    startRedirect(res.url, slug);
  };
}

function startRedirect(url, slug){
  let sec = 5;
  document.getElementById('count').innerText = sec;

  const timer = setInterval(()=>{
    sec--;
    document.getElementById('count').innerText = sec;
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
  fetch(`${API_URL}?action=click&slug=${slug}`);
  location.href = url;
}

function showError(msg){
  errorBox.style.display = 'block';
  document.getElementById('errorMsg').innerText = msg;
}

function mapError(code){
  return {
    not_found: 'Link không tồn tại',
    expired: 'Link đã hết hạn',
    disabled: 'Link đã bị vô hiệu hoá'
  }[code] || 'Không thể truy cập link';
}
