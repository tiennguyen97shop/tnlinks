const API_URL = 'https://script.google.com/macros/s/AKfycby84cmQIndmZpV6WIQrU6Gf1OlHujkJbskazkHETy9piDK8bilci1wANQ5Ecel3WSlx7w/exec';

function calcExpireText(value){
  if(!value) return 'Vĩnh viễn';
  const d = new Date(value) - new Date();
  if(d<=0) return 'Đã hết hạn';
  return `Sau ${Math.ceil(d/86400000)} ngày`;
}

const forever = document.getElementById('forever');
const expireAt = document.getElementById('expireAt');
const lockToggle = document.getElementById('lockToggle');
const passwordWrap = document.getElementById('passwordWrap');
const preview = document.getElementById('preview');
const error = document.getElementById('error');

/*forever.onchange = ()=>{
  expireAt.disabled = forever.checked;
  document.getElementById('expireText').innerText =
    forever.checked ? 'Vĩnh viễn' : calcExpireText(expireAt.value);
};*/

// KHỞI TẠO TRẠNG THÁI BAN ĐẦU
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('expireText').innerText = 'Đang cập nhật dữ liệu';
});
forever.onchange = ()=>{
  expireAt.disabled = forever.checked;

  document.getElementById('expireText').innerText =
    forever.checked
      ? 'Vĩnh viễn'
      : (expireAt.value ? calcExpireText(expireAt.value) : 'Đang cập nhật dữ liệu');
};

lockToggle.onchange = ()=>{
  passwordWrap.style.display = lockToggle.checked ? 'block' : 'none';
};

expireAt.onchange = ()=>{
  document.getElementById('expireText').innerText = calcExpireText(expireAt.value);
};

document.getElementById('create').onclick = async ()=>{
  const data = {
    action:'create',
    url:url.value.trim(),
    slug:slug.value.trim(),
    title:title.value.trim(),
    description:description.value.trim(),
    expire_at: forever.checked ? '' : expireAt.value,
    is_locked: lockToggle.checked ? 'TRUE' : 'FALSE',
    password: lockToggle.checked ? password.value : '',
    max_clicks:''
  };

  if(!data.url || !data.slug){
    //error.innerText='Vui lòng nhập link gốc và slug';
    showToast('⚠️ Vui lòng nhập slug trước khi tạo link', 'warning');
    return;
  }

  error.innerText='';
  cardLoading.style.display='flex';
  // 🔥 HIỆN LOADING
  
  const qs = new URLSearchParams(data).toString();

  try{
    const res = await fetch(`${API_URL}?${qs}`);
    const json = await res.json();
    cardLoading.style.display = 'none';
    // 🔥 TẮT LOADING (THÀNH CÔNG HAY THẤT BẠI ĐỀU TẮT)
    showToast('✅ Tạo link rút gọn thành công!', 'success');
    
    if(!json.success){
      //error.innerText = json.message || 'Có lỗi';
      showToast(json.message || 'Có lỗi xảy ra', 'error');
      return;
    }

    /* ====== UI SAU KHI TẠO THÀNH CÔNG ====== */

    const shortLink = `${location.origin}/go/${data.slug}`;

    // HIỆN CARD KẾT QUẢ
    const resultCard = document.getElementById('resultCard');
    resultCard.style.display = 'block';

    document.getElementById('resultLink').value = shortLink;

    // ẨN SIDE PANEL
    document.getElementById('sidePanel').style.display = 'none';

    // GÁN LINK TRUY CẬP
    document.getElementById('visitBtn').href = shortLink;
    
    //preview.style.display='block';
    //preview.innerHTML = `<strong>Link đã tạo:</strong><br>${location.origin}/r/${data.slug}`;
    
  }catch{
    // 🔥 TẮT LOADING KHI LỖI
    cardLoading.style.display = 'none';
    showToast(json.message || ' Không thể kết nối tới máy chủ của Tiến Nguyễn Shop', 'error');
    //error.innerText='Không thể kết nối máy chủ';
  }
};

document.getElementById('newLinkBtn').addEventListener('click', () => {

  // ẨN CARD KẾT QUẢ
  document.getElementById('resultCard').style.display = 'none';

  // HIỆN SIDE PANEL
  document.getElementById('sidePanel').style.display = 'block';

  // RESET FORM
  document.getElementById('url').value = '';
  document.getElementById('slugSource').value = '';
  document.getElementById('slug').value = '';
  document.getElementById('title').value = '';
  document.getElementById('description').value = '';
  document.getElementById('expireAt').value = '';
  document.getElementById('forever').checked = false;
  document.getElementById('lockToggle').checked = false;
  document.getElementById('password').value = '';
  document.getElementById('passwordWrap').style.display = 'none';

  // RESET TEXT
  document.getElementById('expireText').innerText = 'Vĩnh viễn';
  document.getElementById('error').innerText = '';
  document.getElementById('preview').style.display = 'none';
 
 showToast('🔁 Sẵn sàng tạo link mới', 'info');
 
});

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')                     // tách dấu
    .replace(/[\u0300-\u036f]/g, '')      // xoá dấu
    .replace(/[^a-z0-9\s-]/g, '')         // xoá ký tự đặc biệt
    .trim()
    .replace(/\s+/g, '-')                 // space -> -
    .replace(/-+/g, '-');                 // -- -> -
}

const slugSourceInput = document.getElementById('slugSource');
const slugInput = document.getElementById('slug');

let slugManuallyEdited = false;

// Nếu user sửa slug → ngừng auto
slugInput.addEventListener('input', () => {
  slugManuallyEdited = true;
});

// Khi nhập văn bản → tự sinh slug
slugSourceInput.addEventListener('input', () => {
  if (!slugManuallyEdited) {
    slugInput.value = slugify(slugSourceInput.value);
  }
});

function showToast(text, type = 'info') {
  let bg = '#4f46e5'; // default

  if (type === 'success') bg = '#22c55e';
  if (type === 'error') bg = '#ef4444';
  if (type === 'warning') bg = '#f59e0b';

  Toastify({
    text,
    duration: 3000,
    gravity: "top",
    position: "right",
    close: true,
    backgroundColor: bg,
    stopOnFocus: true,
  }).showToast();
}

const socialToggle = document.getElementById('socialToggle');
const socialDropdown = document.getElementById('socialDropdown');

if (socialToggle && socialDropdown) {
  socialToggle.onclick = () => {
    const isOpen = socialDropdown.style.display === 'flex';

    socialDropdown.style.display = isOpen ? 'none' : 'flex';
    socialToggle.querySelector('.arrow').style.transform =
      isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
  };
}