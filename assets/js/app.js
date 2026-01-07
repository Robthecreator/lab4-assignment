const DATA_PATH = 'assets/data/library.json';
let albums = [];
const albumRow = document.getElementById('album-row');
const searchInput = document.getElementById('search');
const sortSelect = document.getElementById('sort');
const modalEl = document.getElementById('exampleModal');
const modalTitle = document.getElementById('exampleModalLabel');
const modalBody = document.getElementById('modal-body');
const playBtn = document.getElementById('play-spotify-btn');

const modalDialog = modalEl.querySelector('.modal-dialog');
modalDialog.classList.add('modal-dialog-scrollable', 'modal-xl');

async function loadAlbums(){
  try{
    const res = await fetch(DATA_PATH);
    albums = await res.json();
    renderAlbums(albums);
  }catch(e){
    albumRow.innerHTML = '<div class="col-12">Failed to load library.json</div>';
    console.error(e);
  }
}

function formatSeconds(totalSeconds){
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600)/60);
  const secs = totalSeconds % 60;
  if(hrs>0) return `${hrs}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  return `${mins}:${String(secs).padStart(2,'0')}`;
}

function parseLength(len){
  const parts = len.split(':').map(Number);
  if(parts.length===2) return parts[0]*60 + parts[1];
  if(parts.length===3) return parts[0]*3600 + parts[1]*60 + parts[2];
  return 0;
}

function renderAlbums(list){
  albumRow.innerHTML = '';
  list.forEach(album => {
    const col = document.createElement('div');
    col.className = 'col-xl-2 col-md-3 col-sm-6 col-12 mb-4';

    const card = document.createElement('div');
    card.className = 'card h-100';

    const imgWrap = document.createElement('div');
    imgWrap.className = 'img-overlay';
    const img = document.createElement('img');
    img.className = 'card-img-top';
    img.src = `assets/img/${album.thumbnail}`;
    img.alt = `${album.artist} - ${album.album}`;
    imgWrap.appendChild(img);

    const overlay = document.createElement('div');
    overlay.className = 'overlay-text';
    overlay.textContent = album.album;
    imgWrap.appendChild(overlay);

    const body = document.createElement('div');
    body.className = 'card-body d-flex flex-column';
    const title = document.createElement('h5');
    title.className = 'card-title';
    title.textContent = album.artist;
    const text = document.createElement('p');
    text.className = 'card-text text-truncate';
    text.textContent = album.album;

    const footer = document.createElement('div');
    footer.className = 'card-footer';
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary view-btn';
    btn.type = 'button';
    btn.textContent = 'View Tracklist';
    btn.dataset.id = album.id;

    footer.appendChild(btn);
    body.appendChild(title);
    body.appendChild(text);

    card.appendChild(imgWrap);
    card.appendChild(body);
    card.appendChild(footer);
    col.appendChild(card);
    albumRow.appendChild(col);
  });
}

albumRow.addEventListener('click', (e)=>{
  const btn = e.target.closest('.view-btn');
  if(!btn) return;
  const id = Number(btn.dataset.id);
  const album = albums.find(a=>a.id===id);
  if(album) openModalWithAlbum(album);
});

function openModalWithAlbum(album){
  modalTitle.textContent = `${album.artist} - ${album.album}`;
  const tracks = album.tracklist || [];
  const totalTracks = tracks.length;
  const seconds = tracks.reduce((s,t)=> s + parseLength(t.trackLength), 0);
  const avg = totalTracks? Math.round(seconds/totalTracks):0;
  let longest = null;
  let shortest = null;
  tracks.forEach(t=>{
    const s = parseLength(t.trackLength);
    if(longest===null || s>parseLength(longest.trackLength)) longest = t;
    if(shortest===null || s<parseLength(shortest.trackLength)) shortest = t;
  });

  const statsHTML = `
    <div class="mb-3">
      <strong>Total tracks:</strong> ${totalTracks} &nbsp; • &nbsp;
      <strong>Total duration:</strong> ${formatSeconds(seconds)} &nbsp; • &nbsp;
      <strong>Average:</strong> ${formatSeconds(avg)}
      <div><strong>Longest:</strong> ${longest? `${longest.title} (${longest.trackLength})` : '—'} &nbsp; • &nbsp; <strong>Shortest:</strong> ${shortest? `${shortest.title} (${shortest.trackLength})` : '—'}</div>
    </div>
  `;

  let rows = tracks.map(t=>{
    return `<tr>
      <th scope="row">${t.number}</th>
      <td><a class="link-primary" href="${t.url}" target="_blank" rel="noopener noreferrer">${t.title}</a></td>
      <td class="text-end">${t.trackLength}</td>
    </tr>`;
  }).join('');

  const table = `
    <div class="table-responsive">
      <table class="table table-sm align-middle">
        <thead><tr><th>#</th><th>Title</th><th class="text-end">Length</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

  modalBody.innerHTML = statsHTML + table;

  if(tracks.length>0 && tracks[0].url){
    playBtn.disabled = false;
    playBtn.onclick = ()=> window.open(tracks[0].url, '_blank');
  } else {
    playBtn.disabled = true;
    playBtn.onclick = null;
  }

  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

searchInput.addEventListener('input', ()=> applyFilters());
sortSelect.addEventListener('change', ()=> applyFilters());

function applyFilters(){
  const q = searchInput.value.trim().toLowerCase();
  let filtered = albums.filter(a=> {
    if(!q) return true;
    return a.artist.toLowerCase().includes(q) || a.album.toLowerCase().includes(q);
  });

  const sort = sortSelect.value;
  if(sort==='artist-asc') filtered.sort((a,b)=> a.artist.localeCompare(b.artist));
  if(sort==='album-asc') filtered.sort((a,b)=> a.album.localeCompare(b.album));
  if(sort==='tracks-asc') filtered.sort((a,b)=> a.tracklist.length - b.tracklist.length);
  if(sort==='tracks-desc') filtered.sort((a,b)=> b.tracklist.length - a.tracklist.length);

  renderAlbums(filtered);
}

loadAlbums();
