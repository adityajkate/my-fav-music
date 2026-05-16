// Custom Easing
const easeOutExpo = "expo.out";

// ==========================================
// Track Data Database
// ==========================================
const trackDB = [
    { id: 0, title: "Sun Sawariya", artist: "Unknown Artist", genre: "bollywood", duration: "3:42", seconds: 222, cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop" },
    { id: 1, title: "Beautiful Things", artist: "Benson Boone", genre: "pop", duration: "3:00", seconds: 180, cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=200&auto=format&fit=crop" },
    { id: 2, title: "Perfect", artist: "Ed Sheeran", genre: "pop", duration: "4:23", seconds: 263, cover: "https://images.unsplash.com/photo-1493225457124-a1a2a5f5f458?q=80&w=200&auto=format&fit=crop" },
    { id: 3, title: "Tum Hi Ho", artist: "Arijit Singh", genre: "bollywood", duration: "4:22", seconds: 262, cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=200&auto=format&fit=crop" },
    { id: 4, title: "Photograph", artist: "Ed Sheeran", genre: "acoustic", duration: "4:34", seconds: 274, cover: "https://images.unsplash.com/photo-1460036521480-ff4afceb6fb7?q=80&w=200&auto=format&fit=crop" },
    { id: 5, title: "Guitar Hero", artist: "John Doe", genre: "acoustic", duration: "2:15", seconds: 135, cover: "https://images.unsplash.com/photo-1510915361894-faa8b3625dd8?q=80&w=200&auto=format&fit=crop" }
];

let currentTracks = [...trackDB];
let currentTrackIndex = 0; // Index relative to currentTracks array
let isPlaying = false;
let progressInterval;
let currentSeconds = 0;
let globalActiveTrackId = trackDB[0].id; // Keep track of the actual playing song regardless of filter

const trackListEl = document.getElementById('track-list');
const playPauseBtn = document.getElementById('main-play-btn');
const iconPlay = document.querySelector('.icon-play');
const iconPause = document.querySelector('.icon-pause');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const progressFill = document.querySelector('.progress-fill');

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

    // Small reveal animation on re-render
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
    
    // Find where the currently playing song went in the new list, if it exists
    const newIdx = currentTracks.findIndex(t => t.id === globalActiveTrackId);
    if (newIdx !== -1) {
        currentTrackIndex = newIdx;
    } else {
        // If the currently playing song is not in the filtered list, we just keep playing it silently in the background
        // but currentTrackIndex might be invalid for the current view.
        // For simplicity, we just won't be able to click 'next' smoothly if it's not in the list.
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
// 3. Music Player Logic
// ==========================================
function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function updateMiniPlayerUI(track) {
    npTitle.textContent = track.title;
    npArtist.textContent = track.artist;
    totalTimeEl.textContent = track.duration;
    
    // Smooth image crossfade
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
    
    // If clicking the same track
    if (globalActiveTrackId === track.id) {
        isPlaying ? pauseTrack() : playTrack();
        return;
    }

    // Change track
    currentTrackIndex = index;
    globalActiveTrackId = track.id;
    currentSeconds = 0;
    progressFill.style.width = '0%';
    currentTimeEl.textContent = '0:00';
    
    updateMiniPlayerUI(track);

    // Update UI selection classes
    document.querySelectorAll('.track-item').forEach(item => {
        item.classList.remove('active', 'playing');
    });
    
    const activeItem = document.querySelector(`.track-item[data-index="${index}"]`);
    if(activeItem) activeItem.classList.add('active');

    playTrack();
}

function playTrack() {
    isPlaying = true;
    iconPlay.style.display = 'none';
    iconPause.style.display = 'block';
    
    const activeItem = document.querySelector(`.track-item[data-index="${currentTrackIndex}"]`);
    if(activeItem) activeItem.classList.add('playing');
    
    clearInterval(progressInterval);
    progressInterval = setInterval(() => {
        // Find the actual track object globally
        const track = trackDB.find(t => t.id === globalActiveTrackId);
        if(!track) return;

        currentSeconds++;
        const total = track.seconds;
        
        if (currentSeconds >= total) {
            nextTrack();
            return;
        }

        currentTimeEl.textContent = formatTime(currentSeconds);
        progressFill.style.width = `${(currentSeconds / total) * 100}%`;
    }, 1000);
}

function pauseTrack() {
    isPlaying = false;
    iconPlay.style.display = 'block';
    iconPause.style.display = 'none';
    
    const activeItem = document.querySelector(`.track-item[data-index="${currentTrackIndex}"]`);
    if(activeItem) activeItem.classList.remove('playing');
    clearInterval(progressInterval);
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

// Event Listeners
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
    updateMiniPlayerUI(currentTracks[0]); // Initial set
    
    initEntryAnimation();
    initMagneticButtons();
});
