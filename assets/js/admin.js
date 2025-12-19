const API_URL = 'https://script.google.com/macros/s/AKfycby84cmQIndmZpV6WIQrU6Gf1OlHujkJbskazkHETy9piDK8bilci1wANQ5Ecel3WSlx7w/exec';
const table = document.getElementById('linkTable');

fetch(`${API_URL}?action=list`)
  .then(r=>r.json())
  .then(data=>{
    data.forEach(row=>{
      const tr=document.createElement('tr');

      const short=`${location.origin}/r/${row.slug}`;
      const status =
        row.status==='expired'?'status-expired':
        row.is_locked==='TRUE'?'status-locked':'status-active';

      tr.innerHTML=`
        <td>${row.slug}</td>
        <td class="muted">${row.url}</td>
        <td>${row.clicks}</td>
        <td>${row.expire_at||'∞'}</td>
        <td class="${status}">${row.status}</td>
        <td>
          <button class="btn btn-outline" onclick="copy('${short}')">Copy</button>
          <button class="btn danger-btn" onclick="remove('${row.slug}')">Xoá</button>
        </td>
      `;
      table.appendChild(tr);
    });
  });

function copy(text){
  navigator.clipboard.writeText(text);
  toast('Đã copy link');
}

function remove(slug){
  if(!confirm('Xoá link này?'))return;
  fetch(`${API_URL}?action=delete&slug=${slug}`)
    .then(()=>location.reload());
}

document.getElementById('clearAllBtn').onclick=()=>{
  if(confirm('XOÁ TOÀN BỘ DỮ LIỆU?')){
    fetch(`${API_URL}?action=clear`).then(()=>{
      toast('Đã xoá toàn bộ dữ liệu');
      setTimeout(()=>location.reload(),1000);
    });
  }
};

function toast(text){
  Toastify({text,duration:3000,gravity:'bottom',position:'right'}).showToast();
}