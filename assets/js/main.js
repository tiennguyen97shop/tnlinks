const API_URL = 'https://script.google.com/macros/s/AKfycby84cmQIndmZpV6WIQrU6Gf1OlHujkJbskazkHETy9piDK8bilci1wANQ5Ecel3WSlx7w/exec';

/* ================= EXPIRE TEXT ================= */
function calcExpireText(value){
  if(!value){
    document.getElementById('expireText').innerText = 'Vĩnh viễn';
    return;
  }
  startExpireCountdown(value, 'expireText', 'expireDate');
}

/* ================= ELEMENTS ================= */
const forever = document.getElementById('forever');
const expireAt = document.getElementById('expireAt');
const lockToggle = document.getElementById('lockToggle');
const passwordWrap = document.getElementById('passwordWrap');
const preview = document.getElementById('preview');
const error = document.getElementById('error');

/* ================= EVENTS ================= */
forever.onchange = () => {
  expireAt.disabled = forever.checked;
  document.getElementById('expireText').innerText =
    forever.checked ? 'Vĩnh viễn' : 'Đang cập nhật dữ liệu…';
};

lockToggle.onchange = () => {
  passwordWrap.style.display = lockToggle.checked ? 'block' : 'none';
};

expireAt.onchange = () => {
  calcExpireText(expireAt.value);
};

/* ================= CREATE LINK ================= */
document.getElementById('create').onclick = async () => {
  const data = {
    action: 'create',
    url: url.value.trim(),
    slug: slug.value.trim(),
    title: title.value.trim(),
    description: description.value.trim(),
    expire_at: forever.checked ? '' : expireAt.value,
    is_locked: lockToggle.checked ? 'TRUE' : 'FALSE',
    password: lockToggle.checked ? password.value : '',
    max_clicks: ''
  };

  if (!data.url || !data.slug) {
    showToast('⚠️ Vui lòng nhập đầy đủ URL và Slug', 'warning');
    return;
  }

  if (lockToggle.checked && !data.password) {
    showToast('⚠️ Đã bật khoá nhưng chưa nhập mật khẩu', 'warning');
    return;
  }

  showLoading(true);

  try {
    const res = await fetch(API_URL + '?' + new URLSearchParams(data));
    const json = await res.json();
    showLoading(false);

    if (!json.success) {
      showToast(json.message || 'Tạo link thất bại', 'error');
      return;
    }

    const shortLink = `${location.origin}/go/${data.slug}`;
    document.getElementById('resultCard').style.display = 'block';
    document.getElementById('resultLink').value = shortLink;
    document.getElementById('visitBtn').href = shortLink;
    document.getElementById('sidePanel').style.display = 'none';

    showToast('✅ Tạo link rút gọn thành công!', 'success');

  } catch (e) {
    showLoading(false);
    showToast('❌ Không thể kết nối máy chủ', 'error');
  }
};

/* ================= NEW LINK ================= */
document.getElementById('newLinkBtn').onclick = () => {
  document.getElementById('resultCard').style.display = 'none';
  document.getElementById('sidePanel').style.display = 'block';

  ['url','slugSource','slug','title','description','password'].forEach(id=>{
    document.getElementById(id).value = '';
  });

  expireAt.value = '';
  forever.checked = false;
  lockToggle.checked = false;
  passwordWrap.style.display = 'none';
  document.getElementById('expireText').innerText = 'Vĩnh viễn';

  showToast('🔁 Sẵn sàng tạo link mới', 'info');
};

/* ================= COPY ================= */
document.getElementById('copyBtn').onclick = () => {
  navigator.clipboard.writeText(document.getElementById('resultLink').value);
  showToast('✅ Đã sao chép link!', 'success');
};

/* ================= SLUG AUTO ================= */
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const slugSourceInput = document.getElementById('slugSource');
const slugInput = document.getElementById('slug');
let slugManuallyEdited = false;

slugInput.addEventListener('input', () => slugManuallyEdited = true);

slugSourceInput.addEventListener('input', () => {
  if (!slugManuallyEdited) {
    slugInput.value = slugify(slugSourceInput.value);
  }
});

/* ================= TOAST ================= */
function showToast(text, type = 'info') {
  let bg = '#4f46e5';
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
    stopOnFocus: true
  }).showToast();
}

/* ================= SOCIAL TOGGLE ================= */
const socialToggle = document.getElementById('socialToggle');
const socialDropdown = document.getElementById('socialDropdown');

if (socialToggle && socialDropdown) {
  socialToggle.onclick = () => {
    const open = socialDropdown.style.display === 'flex';
    socialDropdown.style.display = open ? 'none' : 'flex';

    const arrow = socialToggle.querySelector('.arrow');
    if (arrow) arrow.style.transform = open ? 'rotate(0deg)' : 'rotate(180deg)';
  };
}


function showLoading(show){
  const loading = document.getElementById('cardLoading');
  if(!loading) return;
  loading.style.display = show ? 'flex' : 'none';
}