const API_URL = 'https://script.google.com/macros/s/AKfycby84cmQIndmZpV6WIQrU6Gf1OlHujkJbskazkHETy9piDK8bilci1wANQ5Ecel3WSlx7w/exec';
let ADMIN_KEY = '';
let allLinks = [];
let currentPage = 1;
const rowsPerPage = 5;

document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const adminKeyInput = document.getElementById('adminKey');

  // ===== LOGIN =====
  loginBtn.onclick = async () => {
    ADMIN_KEY = adminKeyInput.value.trim();
    if(!ADMIN_KEY){
      showToast('Vui lòng nhập Admin Key', 'warning');
      return;
    }

    // Hiệu ứng spinner
    loginBtn.disabled = true;
    const originalText = loginBtn.innerText;
    loginBtn.innerText = 'Đang tải...';

    await loadLinks();

    loginBtn.disabled = false;
    loginBtn.innerText = originalText;
  };
});

// ===== LOAD LINKS =====
async function loadLinks(){
  try{
    showLoading(true);
    const res = await fetch(`${API_URL}?action=list&admin_key=${ADMIN_KEY}`);
    const data = await res.json();
    showLoading(false);
    if(!Array.isArray(data)){
      showToast('Admin Key sai hoặc không có quyền', 'error');
      return;
    }
    document.getElementById('loginCard').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    allLinks = data.sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
    currentPage = 1;
    //updateStats();
    showPage(currentPage);
  }catch(err){
    showLoading(false);
    console.error(err);
    showToast('Không thể tải dữ liệu từ server', 'error');
  }
}

// ===== PAGINATION & RENDER =====
function showPage(page){
  const tbody = document.getElementById('linkTable');
  tbody.innerHTML = '';
  const start = (page-1)*rowsPerPage;
  const end = start + rowsPerPage;
  const pageLinks = allLinks.slice(start, end);
  let total=allLinks.length, active=0, locked=0, expired=0;
  pageLinks.forEach(link=>{
   const expireText = getExpireStatus(link);
   const lockText = getLockStatus(link);
  tbody.innerHTML += `
      <tr>
        <td>${link.slug}</td>
        <td>${link.url}</td>
        <td>${expireText}</td>
        <td>${lockText}</td>
        <td></td>
      </tr>
    `;
  });
  //Cập Nhật Dữ Liệu Hệ Thống
  allLinks.forEach(link=>{
    const pwd = link.password != null ? String(link.password) : '';
    const diff = link.expire_at ? (new Date(link.expire_at) - now) : null;
    if(pwd.trim() !== '') {
      locked++;
    }
    if(diff !== null && diff <= 0){
      expired++;
    }
    // Active = không khoá và chưa hết hạn
    if(pwd.trim() === '' && (diff === null || diff > 0)){
      active++;
    }
  });
  document.getElementById('totalLinks').innerText = total;
  document.getElementById('activeLinks').innerText = active;
  document.getElementById('lockedLinks').innerText = locked;
  document.getElementById('expiredLinks').innerText = expired;
  
  // Tạo pagination nếu cần
  const totalPages = Math.ceil(allLinks.length / rowsPerPage);
  let paginationEl = document.getElementById('pagination');
  if(!paginationEl){
    paginationEl = document.createElement('div');
    paginationEl.id = 'pagination';
    paginationEl.style.textAlign = 'center';
    paginationEl.style.marginTop = '12px';
    document.getElementById('dashboard').appendChild(paginationEl);
  }

  paginationEl.innerHTML = `
    <button ${page<=1?'disabled':''} onclick="showPage(${page-1})">&laquo; Prev</button>
    ${page} / ${totalPages}
    <button ${page>=totalPages?'disabled':''} onclick="showPage(${page+1})">Next &raquo;</button>
  `;
}

// ===== EXPIRE INFO =====
function getExpireStatus(link){
  const now = new Date();
  if(!link.expire_at) return 'Link Vô Hạn';
  const diff = new Date(link.expire_at) - now;
  if(diff <= 0) return 'Link Đã Hết Hạn';
  const days = Math.ceil(diff/86400000);
  return `Link Còn ${days} Ngày Hết Hạn`;
}
function getLockStatus(link){
  const pwd = link.password != null ? String(link.password) : '';
  return (typeof pwd==='string' && pwd.trim()!=='') ? 'Đang khoá' : 'Mở';
}

/*function getExpireInfo(link){
  const now = new Date();
  //const pwd = link.password || '';
  const pwd = link.password != null ? String(link.password) : '';

  if(typeof pwd === 'string' && pwd.trim()!==''){
    return {
      text: '🔒 Link đang khoá',
      status: 'locked',
      badge: '<span class="badge badge-lock">Đang khoá</span>'
    };
  }

  if(!link.expire_at){
    return {
      text: '♾ Link tồn tại theo dòng lịch sử Việt Nam',
      status: 'active',
      badge: '<span class="badge badge-forever">Đang Mở</span>'
    };
  }

  const d = new Date(link.expire_at) - now;
  if(d<=0){
    return {
      text: '⛔ Link đã hết hạn',
      status: 'expired',
      badge: '<span class="badge badge-expired">Hết hạn</span>'
    };
  }

  const days = Math.ceil(d/86400000);
  return {
    text: `⏳ Còn ${days} ngày`,
    status: 'active',
    badge: '<span class="badge badge-open">Đang mở</span>'
  };
}*/

// ===== DELETE LINK =====
function deleteLink(slug){
  if(!confirm('Xoá link này?')) return;
  fetch(`${API_URL}?action=delete&slug=${slug}&admin_key=${ADMIN_KEY}`)
    .then(()=>loadLinks());
}

// ===== CLEAN =====
function cleanExpired(){
  fetch(`${API_URL}?action=cleanExpired&admin_key=${ADMIN_KEY}`)
    .then(()=>loadLinks());
}

function cleanAll(){
  if(confirm('Xoá tất cả link?')){
    fetch(`${API_URL}?action=cleanAll&admin_key=${ADMIN_KEY}`)
      .then(()=>loadLinks());
  }
}

// ===== LOADING & TOAST =====
function showLoading(show=true){
  let el = document.getElementById('loadingOverlay');
  if(!el){
    el = document.createElement('div');
    el.id = 'loadingOverlay';
    el.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;z-index:9999;
    `;
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.style.cssText = `
      border:4px solid #f3f3f3;border-top:4px solid #4f46e5;
      border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;
    `;
    el.appendChild(spinner);
    document.body.appendChild(el);

    // CSS animation
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}
    `;
    document.head.appendChild(style);
  }
  el.style.display = show?'flex':'none';
}

function showToast(text, type='info'){
  let bg = '#4f46e5';
  if(type==='success') bg='#22c55e';
  if(type==='error') bg='#ef4444';
  if(type==='warning') bg='#f59e0b';

  Toastify({
    text,
    duration:3000,
    gravity:'top',
    position:'right',
    close:true,
    backgroundColor:bg,
    stopOnFocus:true
  }).showToast();
}