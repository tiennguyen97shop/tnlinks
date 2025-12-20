const API_URL = 'https://script.google.com/macros/s/AKfycby84cmQIndmZpV6WIQrU6Gf1OlHujkJbskazkHETy9piDK8bilci1wANQ5Ecel3WSlx7w/exec';

// Lấy slug từ cuối URL
// Ví dụ: https://tiennguyen.github.io/tnlinks/go/abc123
const pathParts = location.pathname.split('/').filter(Boolean);
const goIndex = pathParts.indexOf('go'); // tìm vị trí 'go'
const slug = goIndex >= 0 && goIndex < pathParts.length-1 ? pathParts[goIndex+1] : '';

const loadingBox = document.getElementById('loadingBox');
const infoBox    = document.getElementById('infoBox');
const lockBox    = document.getElementById('lockBox');
const errorBox   = document.getElementById('errorBox');

fetch(`${API_URL}?action=get&slug=${slug}`)
  .then(r=>r.json())
  .then(res=>{
    loadingBox.style.display='none';

    if(res.error){
      showError(mapError(res.error));
      return;
    }

    // HIỂN THỊ THÔNG TIN
    document.getElementById('linkTitle').innerText = res.title || 'SmartLink Redirect';
    document.getElementById('linkDesc').innerText  = res.description || 'Bạn sẽ được chuyển hướng an toàn';

    // LINK KHOÁ
    if(res.is_locked==='TRUE'){
      lockBox.style.display='block';
      handleUnlock(res);
      return;
    }

    // LINK THƯỜNG
    infoBox.style.display='block';
    startRedirect(res.url, slug);
  })
  .catch(()=>{
    loadingBox.style.display='none';
    showError('Không thể kết nối máy chủ');
  });

function startRedirect(url, slug){
  let sec = 5;
  document.getElementById('count').innerText = sec;

  const timer = setInterval(()=>{
    sec--;
    document.getElementById('count').innerText = sec;
    if(sec<=0){
      clearInterval(timer);
      hitAndGo(url, slug);
    }
  },1000);

  document.getElementById('goNow').onclick=()=>{
    clearInterval(timer);
    hitAndGo(url, slug);
  };
}

function handleUnlock(res){
  document.getElementById('unlockBtn').onclick=()=>{
    const val = document.getElementById('passwordInput').value;
    if(val!==res.password){
      document.getElementById('lockError').innerText='Mật khẩu không đúng';
      return;
    }
    startRedirect(res.url, slug);
    lockBox.style.display='none';
    infoBox.style.display='block';
  };
}

function hitAndGo(url, slug){
  fetch(`${API_URL}?action=click&slug=${slug}`);
  location.href = url;
}

function showError(msg){
  errorBox.style.display='block';
  document.getElementById('errorMsg').innerText = msg;
}

function mapError(code){
  return {
    not_found:'Link không tồn tại',
    expired:'Link đã hết hạn',
    disabled:'Link đã bị vô hiệu hoá'
  }[code] || 'Không thể truy cập link';
}

function startRedirectCountdown(expireAt) {
  const countdownEl = document.getElementById('countdown');

  if (!expireAt) {
    countdownEl.innerText = 'Vĩnh viễn';
    return;
  }

  const interval = setInterval(() => {
    const now = new Date();
    const end = new Date(expireAt);
    const diff = end - now;

    if (diff <= 0) {
      clearInterval(interval);
      countdownEl.innerText = 'Hết hạn';
      document.getElementById('visitLink').style.pointerEvents = 'none';
      document.getElementById('visitLink').style.opacity = 0.5;
      return;
    }

    const days = Math.floor(diff / (1000*60*60*24));
    const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
    const minutes = Math.floor((diff % (1000*60*60)) / (1000*60));
    const seconds = Math.floor((diff % (1000*60)) / 1000);

    countdownEl.innerText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }, 1000);
}