/**
 * TNLink Redirect System - 2025
 * Fix: Lỗi bỏ qua password & lỗi so sánh kiểu dữ liệu (Boolean/String/Number)
 */

const API_URL = 'https://script.google.com/macros/s/AKfycby84cmQIndmZpV6WIQrU6Gf1OlHujkJbskazkHETy9piDK8bilci1wANQ5Ecel3WSlx7w/exec';

// 1. Lấy slug từ query string (?dithoi=...)
const params = new URLSearchParams(location.search);
const slug = params.get('dithoi'); 

const loadingBox = document.getElementById('loadingBox');
const infoBox    = document.getElementById('infoBox');
const lockBox    = document.getElementById('lockBox');
const errorBox   = document.getElementById('errorBox');

if (!slug) {
  showError('Slug không hợp lệ');
} else {
  // 2. Lấy thông tin link từ Apps Script
  fetch(`${API_URL}?action=get&slug=${slug}`)
    .then(r => r.json())
    .then(res => {
      loadingBox.style.display = 'none';

      if (res.error) {
        showError(mapError(res.error));
        return;
      }

      // Cập nhật thông tin giao diện
      document.getElementById('linkTitle').innerText = res.title || 'TNLink Redirect';
      document.getElementById('linkDesc').innerText  = res.description || 'Vui lòng chờ giây lát...';

      // 3. XỬ LÝ KHÓA MẬT KHẨU
      // Lấy mật khẩu từ server, ép về kiểu chuỗi và xóa khoảng trắng
      //const passwordFromServer = res.password ? String(res.password).trim() : '';
      const passwordFromServer = res.password != null ? String(res.password) : '';
      // Điều kiện hiện màn hình khóa: is_locked là TRUE HOẶC có mật khẩu trong ô F
      if (passwordFromServer.trim() !== '') {
        lockBox.style.display = 'block';
        handleUnlockLogic(passwordFromServer, res.url, slug);
        return; // QUAN TRỌNG: Dừng lại tại đây để chờ nhập pass
      } else {
      // 4. TRƯỜNG HỢP KHÔNG CÓ KHÓA
      showRedirectInfo(res.url, slug, res.expire_at);
    })
    .catch(() => {
      loadingBox.style.display = 'none';
      showError('Không thể kết nối máy chủ');
    });
}

/**
 * Xử lý logic nhập mật khẩu
 */
function handleUnlockLogic(correctPassword, targetUrl, slug) {
  const unlockBtn = document.getElementById('unlockBtn');
  const passInput = document.getElementById('passwordInput');
  const lockError = document.getElementById('lockError');

  unlockBtn.onclick = () => {
    const userInput = passInput.value.trim();
    
    // So sánh chuỗi để khớp với cả mật khẩu là số (ví dụ: 123456)
    if (String(userInput) !== String(correctPassword)) {
      lockError.innerText = '❌ Mật khẩu không chính xác';
      passInput.focus();
      return;
    }
    
    // Mật khẩu đúng
    lockBox.style.display = 'none';
    showRedirectInfo(targetUrl, slug);
  };

  // Cho phép nhấn phím Enter để mở khóa
  passInput.onkeypress = (e) => {
    if (e.key === 'Enter') unlockBtn.click();
  };
}

/**
 * Hiển thị đếm ngược và chuyển hướng
 */
function showRedirectInfo(url, slug, expireAt) {
  infoBox.style.display = 'block';
  
  // Hiển thị thời gian hết hạn (nếu có)
  const countdownText = document.getElementById('countdown');
  if (expireAt) {
    startCountdownTimer(expireAt, countdownText);
  } else {
    countdownText.innerText = 'Vĩnh viễn';
  }

  startAutoRedirect(url, slug);
}

function startAutoRedirect(url, slug) {
  let sec = 5;
  const countEl = document.getElementById('count');
  countEl.innerText = sec;

  const timer = setInterval(() => {
    sec--;
    countEl.innerText = sec;
    if (sec <= 0) {
      clearInterval(timer);
      performHitAndGo(url, slug);
    }
  }, 1000);

  document.getElementById('goNow').onclick = () => {
    clearInterval(timer);
    performHitAndGo(url, slug);
  };
}

function performHitAndGo(url, slug) {
  // Gửi tín hiệu click về server
  fetch(`${API_URL}?action=click&slug=${slug}`);
  location.href = url;
}

function showError(msg) {
  errorBox.style.display = 'block';
  document.getElementById('errorMsg').innerText = msg;
}

function mapError(code) {
  const errors = {
    'not_found': 'Link không tồn tại',
    'expired': 'Link này đã hết hạn',
    'disabled': 'Link đã bị vô hiệu hóa'
  };
  return errors[code] || 'Không thể truy cập link';
}

function startCountdownTimer(expireAt, element) {
  const interval = setInterval(() => {
    const diff = new Date(expireAt) - new Date();
    if (diff <= 0) {
      clearInterval(interval);
      element.innerText = 'Đã hết hạn';
      return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    element.innerText = `${days}d ${hours}:${mins}:${secs}`;
  }, 1000);
}
