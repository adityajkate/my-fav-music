// Custom Easing
const easeOutExpo = "expo.out";

// ==========================================
// Track Data Database
// ==========================================
const trackDB = [
    { id: 0, title: "Sun Saawariya", artist: "Unknown", genre: "bollywood", cover: "images/sun_saawariya_1778954616851.png", file: "songs/Sun Saawariya.mp3" },
    { id: 1, title: "Beautiful Things", artist: "Benson Boone", genre: "pop", cover: "images/beautiful_things_1778954631791.png", file: "songs/Beautiful Things.mp3" },
    { id: 2, title: "Perfect", artist: "Ed Sheeran", genre: "pop", cover: "images/perfect_1778954647114.png", file: "songs/Perfect.mp3" },
    { id: 3, title: "Tum Hi Ho", artist: "Arijit Singh", genre: "bollywood", cover: "images/tum_hi_ho_1778954680336.png", file: "songs/Tum Hi Ho.mp3" },
    { id: 4, title: "Photograph", artist: "Ed Sheeran", genre: "acoustic", cover: "images/photograph_1778954662822.png", file: "songs/Photograph.mp3" }
];

let currentTracks = [...trackDB];
let currentTrackIndex = 0; // Index relative to currentTracks array
let isPlaying = false;
let globalActiveTrackId = trackDB[0].id; // Keep track of the actual playing song regardless of filter

// Audio Engine
const audio = new Audio();
audio.src = trackDB[0].file;

const trackListEl = document.getElementById('track-list');
const playPauseBtn = document.getElementById('main-play-btn');
const iconPlay = document.querySelector('.icon-play');
const iconPause = document.querySelector('.icon-pause');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const progressFill = document.querySelector('.progress-fill');
const progressBar = document.querySelector('.progress-bar');

const npTitle = document.getElementById('np-title');
const npArtist = document.getElementById('np-artist');
const currentCover = document.getElementById('current-cover');
const genreBtns = document.querySelectorAll('.genre-btn');

// ==========================================
// Rendering & Filtering
// ==========================================
function renderTracks(tracksToRender) {
    trackListEl.innerHTML = '';
    
    if (tracksToRender.length === 0) {
        trackListEl.innerHTML = '<p style="text-align:center; color: var(--color-text-tertiary); margin-top: 2rem;">No tracks found.</p>';
        return;
    }

    tracksToRender.forEach((track, idx) => {
        const isActive = track.id === globalActiveTrackId;
        const isPlayingClass = (isActive && isPlaying) ? 'playing' : '';
        const activeClass = isActive ? 'active' : '';

        const article = document.createElement('article');
        article.className = `track-item ${activeClass} ${isPlayingClass}`;
        article.setAttribute('data-index', idx);
        
        article.innerHTML = `
            <img src="${track.cover}" alt="${track.title}" class="track-img">
            <div class="track-info">
                <h3>${track.title}</h3>
                <p>${track.artist}</p>
            </div>
            <div class="playing-bars">
                <span></span><span></span><span></span>
            </div>
        `;
        
        article.addEventListener('click', () => {
            selectTrack(idx);
        });

        trackListEl.appendChild(article);
    });

    gsap.fromTo('.track-item', 
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: easeOutExpo }
    );
}

function filterByGenre(genre) {
    if (genre === 'all') {
        currentTracks = [...trackDB];
    } else {
        currentTracks = trackDB.filter(t => t.genre === genre);
    }
    
    const newIdx = currentTracks.findIndex(t => t.id === globalActiveTrackId);
    if (newIdx !== -1) {
        currentTrackIndex = newIdx;
    } else {
        currentTrackIndex = -1; 
    }

    renderTracks(currentTracks);
}

// ==========================================
// 1. App Load Choreography
// ==========================================
function initEntryAnimation() {
    gsap.fromTo('.reveal-anim', 
        { y: 30, opacity: 0 },
        { 
            y: 0, 
            opacity: 1, 
            duration: 1.2, 
            stagger: 0.1, 
            ease: easeOutExpo,
            delay: 0.1
        }
    );
}

// ==========================================
// 2. Magnetic Buttons
// ==========================================
function initMagneticButtons() {
    const magneticBtns = document.querySelectorAll('.magnetic-btn');

    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const position = btn.getBoundingClientRect();
            const x = e.pageX - position.left - position.width / 2;
            const y = e.pageY - position.top - position.height / 2;

            gsap.to(btn, {
                x: x * 0.3,
                y: y * 0.3,
                duration: 0.6,
                ease: "power3.out"
            });
        });

        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.6,
                ease: "elastic.out(1, 0.3)"
            });
        });
    });
}

// ==========================================
// 3. Real Music Player Logic
// ==========================================
function formatTime(secs) {
    if (isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function updateMiniPlayerUI(track) {
    npTitle.textContent = track.title;
    npArtist.textContent = track.artist;
    
    gsap.to(currentCover, {
        opacity: 0.5,
        duration: 0.2,
        onComplete: () => {
            currentCover.src = track.cover;
            gsap.to(currentCover, { opacity: 1, duration: 0.2 });
        }
    });
}

function selectTrack(index) {
    const track = currentTracks[index];
    
    if (globalActiveTrackId === track.id) {
        isPlaying ? pauseTrack() : playTrack();
        return;
    }

    currentTrackIndex = index;
    globalActiveTrackId = track.id;
    
    audio.src = track.file;
    audio.currentTime = 0;
    
    updateMiniPlayerUI(track);

    document.querySelectorAll('.track-item').forEach(item => {
        item.classList.remove('active', 'playing');
    });
    
    const activeItem = document.querySelector(`.track-item[data-index="${index}"]`);
    if(activeItem) activeItem.classList.add('active');

    playTrack();
}

function playTrack() {
    audio.play().then(() => {
        isPlaying = true;
        iconPlay.style.display = 'none';
        iconPause.style.display = 'block';
        
        const activeItem = document.querySelector(`.track-item[data-index="${currentTrackIndex}"]`);
        if(activeItem) activeItem.classList.add('playing');
    }).catch(e => {
        console.error("Playback failed:", e);
    });
}

function pauseTrack() {
    audio.pause();
    isPlaying = false;
    iconPlay.style.display = 'block';
    iconPause.style.display = 'none';
    
    const activeItem = document.querySelector(`.track-item[data-index="${currentTrackIndex}"]`);
    if(activeItem) activeItem.classList.remove('playing');
}

function nextTrack() {
    if (currentTracks.length === 0) return;
    let nextIndex = currentTrackIndex + 1;
    if (nextIndex >= currentTracks.length) nextIndex = 0;
    selectTrack(nextIndex);
}

function prevTrack() {
    if (currentTracks.length === 0) return;
    let prevIndex = currentTrackIndex - 1;
    if (prevIndex < 0) prevIndex = currentTracks.length - 1;
    selectTrack(prevIndex);
}

// Audio Event Listeners
audio.addEventListener('loadedmetadata', () => {
    totalTimeEl.textContent = formatTime(audio.duration);
});

audio.addEventListener('timeupdate', () => {
    currentTimeEl.textContent = formatTime(audio.currentTime);
    if (audio.duration) {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = `${progress}%`;
    }
});

audio.addEventListener('ended', nextTrack);

// Click on progress bar to seek
progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
});

// UI Event Listeners
playPauseBtn.addEventListener('click', () => {
    isPlaying ? pauseTrack() : playTrack();
});

document.getElementById('next-btn').addEventListener('click', nextTrack);
document.getElementById('prev-btn').addEventListener('click', prevTrack);

genreBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        genreBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const genre = btn.getAttribute('data-genre');
        filterByGenre(genre);
    });
});

// ==========================================
// Init All
// ==========================================
window.addEventListener('load', () => {
    renderTracks(currentTracks);
    updateMiniPlayerUI(currentTracks[0]); 
    
    initEntryAnimation();
    initMagneticButtons();
});
