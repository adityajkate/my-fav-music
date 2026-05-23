// Custom Easing
const easeOutExpo = "expo.out";

// Visualizer Constants
const VIS_BASE_OFFSET = 20;
const VIS_MAX_HEIGHT_BARS = 140;
const VIS_MAX_HEIGHT_WAVE = 100;

// ==========================================
// Track Data Database
// ==========================================
const trackDB = [
    { id: 0, title: "Sun Saawariya", artist: "Authored by Accha Insaann, Yaani Karnawat, Atharva Music", genre: "bollywood", cover: "images/sun_saawariya_1778954616851.png", file: "songs/Sun Saawariya.mp3" },
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

// Mini Player Elements
const trackListEl = document.getElementById('track-list');
const playPauseBtn = document.getElementById('main-play-btn');
const iconPlays = document.querySelectorAll('.icon-play');
const iconPauses = document.querySelectorAll('.icon-pause');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const miniProgressFill = document.getElementById('mini-progress-fill');
const miniProgressBar = document.getElementById('mini-progress-bar');
const npTitle = document.getElementById('np-title');
const npArtist = document.getElementById('np-artist');
const currentCover = document.getElementById('current-cover');
const genreBtns = document.querySelectorAll('.genre-btn');

// Expanded Player Elements
const expandedOverlay = document.getElementById('expanded-overlay');
const closeExpandedBtn = document.getElementById('close-expanded');
const expCover = document.getElementById('expanded-cover');
const expTitle = document.getElementById('expanded-title');
const expArtist = document.getElementById('expanded-artist');
const expCurrentTimeEl = document.getElementById('exp-current-time');
const expTotalTimeEl = document.getElementById('exp-total-time');
const expProgressFill = document.getElementById('exp-progress-fill');
const expProgressBar = document.getElementById('exp-progress-bar');
const expPlayBtn = document.getElementById('exp-play-btn');


// ==========================================
// Canvas Procedural Visualizer (Zero CORS Issues)
// ==========================================
const canvas = document.getElementById('vis-canvas');
const ctx = canvas.getContext('2d');
const visModeBtns = document.querySelectorAll('.vis-mode-btn');

let currentVisMode = 'bars';
let visRAF;
let time = 0;
const numBars = 64;
let barHeights = new Array(numBars).fill(0);
let targetHeights = new Array(numBars).fill(0);

visModeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Stop click from expanding/collapsing overlay
        e.stopPropagation();
        visModeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentVisMode = btn.getAttribute('data-mode');
    });
});

// Canvas roundRect polyfill for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.arcTo(x + width, y, x + width, y + radius, radius);
        this.lineTo(x + width, y + height - radius);
        this.arcTo(x + width, y + height, x + width - radius, y + height, radius);
        this.lineTo(x + radius, y + height);
        this.arcTo(x, y + height, x, y + height - radius, radius);
        this.lineTo(x, y + radius);
        this.arcTo(x, y, x + radius, y, radius);
    };
}

function renderProceduralVisualizer() {
    // Only continue animation if overlay is active
    if (!expandedOverlay.classList.contains('active')) {
        visRAF = null;
        return;
    }

    visRAF = requestAnimationFrame(renderProceduralVisualizer);
    
    // Auto-resize canvas to match container
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Only animate if playing and visible
    if (!isPlaying || !expandedOverlay.classList.contains('active')) {
        // dampen to zero smoothly
        for(let i=0; i<numBars; i++) targetHeights[i] = 0;
    } else {
        time += 0.05;
        // Generate new random targets every few frames
        if (Math.random() < 0.25) {
            for(let i=0; i<numBars; i++) {
                // Procedurally simulate a frequency spectrum
                const base = Math.sin(time + i * 0.1) * 0.5 + 0.5;
                const noise = Math.random();
                const energy = (1 - (i/numBars)*0.4); // slightly taper off towards the right
                targetHeights[i] = (base * 0.6 + noise * 0.4) * energy;
            }
        }
    }
    
    // Ease current height to target height (smooths out the visualizer)
    for(let i=0; i<numBars; i++) {
        barHeights[i] += (targetHeights[i] - barHeights[i]) * 0.15;
    }
    
    const w = canvas.width;
    const h = canvas.height;
    
    // Find where the progress bar is to position the visualizer perfectly below it
    const progressRect = expProgressBar.getBoundingClientRect();
    const overlayRect = expandedOverlay.getBoundingClientRect();

    // Start drawing below the progress bar
    const visBaseY = progressRect.bottom - overlayRect.top + VIS_BASE_OFFSET;

    if (currentVisMode === 'bars') {
        // Draw colorful vertical bars tightly clustered
        const barWidth = Math.min(8, w / numBars);
        const padding = 2;
        const totalWidth = numBars * (barWidth + padding);
        const startX = (w - totalWidth) / 2;

        for(let i=0; i<numBars; i++) {
            const bh = barHeights[i] * VIS_MAX_HEIGHT_BARS;
            const x = startX + i * (barWidth + padding);
            const y = visBaseY;

            const gradient = ctx.createLinearGradient(0, y, 0, y+bh);
            gradient.addColorStop(0, `hsl(${i * (300/numBars)}, 100%, 60%)`);
            gradient.addColorStop(1, `hsl(${i * (300/numBars) + 30}, 100%, 40%)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, Math.max(2, bh), barWidth/2);
            ctx.fill();
        }
    } else if (currentVisMode === 'wave') {
        // Draw double overlapping solid waves downwards from below the progress bar
        const drawW = w * 0.9;
        const startX = (w - drawW) / 2;

        ctx.fillStyle = 'rgba(255, 77, 0, 0.4)';
        ctx.beginPath();
        ctx.moveTo(startX, visBaseY);
        for(let i=0; i<=numBars; i++) {
            const x = startX + (i/numBars) * drawW;
            const bh = (barHeights[i] || 0) * VIS_MAX_HEIGHT_WAVE;
            ctx.lineTo(x, visBaseY + bh);
        }
        ctx.lineTo(startX + drawW, visBaseY);
        ctx.fill();

        ctx.fillStyle = 'rgba(147, 51, 234, 0.3)';
        ctx.beginPath();
        ctx.moveTo(startX, visBaseY);
        for(let i=0; i<=numBars; i++) {
            const x = startX + (i/numBars) * drawW;
            const bh = (barHeights[numBars - i] || 0) * (VIS_MAX_HEIGHT_WAVE * 0.7);
            ctx.lineTo(x, visBaseY + bh + 10);
        }
        ctx.lineTo(startX + drawW, visBaseY);
        ctx.fill();
    } else if (currentVisMode === 'aura') {
        // Circular relaxing aura drawn perfectly behind the album cover art
        const avg = barHeights.reduce((a,b)=>a+b, 0) / numBars;
        const minRadius = Math.min(w, h) * 0.25;
        const radius = minRadius + avg * (minRadius * 1.5);
        
        const overlayRect = expandedOverlay.getBoundingClientRect();
        const coverRect = expCover.getBoundingClientRect();
        const auraX = coverRect.left - overlayRect.left + coverRect.width/2;
        const auraY = coverRect.top - overlayRect.top + coverRect.height/2;
        
        const grad = ctx.createRadialGradient(auraX, auraY, minRadius*0.4, auraX, auraY, radius);
        grad.addColorStop(0, 'rgba(255, 77, 0, 0.5)');
        grad.addColorStop(1, 'rgba(255, 77, 0, 0)');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(auraX, auraY, radius, 0, Math.PI*2);
        ctx.fill();
    }
}

function startVisualizer() {
    if (!visRAF) {
        renderProceduralVisualizer();
    }
}

function stopVisualizer() {
    if (visRAF) {
        cancelAnimationFrame(visRAF);
        visRAF = null;
    }
}


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
// App Load Choreography
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
// Magnetic Buttons
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
// Real Music Player Logic
// ==========================================
function formatTime(secs) {
    if (isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function updatePlayerUI(track) {
    // Mini Player
    npTitle.textContent = track.title;
    npArtist.textContent = track.artist;
    
    // Expanded Player
    expTitle.textContent = track.title;
    expArtist.textContent = track.artist;
    expCover.src = track.cover;
    
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

    updatePlayerUI(track);

    document.querySelectorAll('.track-item').forEach(item => {
        item.classList.remove('active', 'playing');
    });

    const activeItem = document.querySelector(`.track-item[data-index="${index}"]`);
    if(activeItem) activeItem.classList.add('active');

    playTrack();
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 77, 0, 0.9);
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        z-index: 1000;
        font-family: var(--font-body);
        font-size: 0.9rem;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
        errorDiv.style.transition = 'opacity 0.3s ease';
        errorDiv.style.opacity = '0';
        setTimeout(() => errorDiv.remove(), 300);
    }, 3000);
}

function updatePlayPauseIcons() {
    if (isPlaying) {
        iconPlays.forEach(i => i.style.display = 'none');
        iconPauses.forEach(i => i.style.display = 'block');
    } else {
        iconPlays.forEach(i => i.style.display = 'block');
        iconPauses.forEach(i => i.style.display = 'none');
    }
}

function playTrack() {
    audio.play().then(() => {
        isPlaying = true;
        updatePlayPauseIcons();

        const activeItem = document.querySelector(`.track-item[data-index="${currentTrackIndex}"]`);
        if(activeItem) activeItem.classList.add('playing');
    }).catch(e => {
        showError("Failed to play audio. File may be missing or corrupted.");
        isPlaying = false;
        updatePlayPauseIcons();
    });
}

function pauseTrack() {
    audio.pause();
    isPlaying = false;
    updatePlayPauseIcons();
    
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
    const total = formatTime(audio.duration);
    totalTimeEl.textContent = total;
    expTotalTimeEl.textContent = total;
});

audio.addEventListener('error', (e) => {
    showError("Failed to load audio file.");
    isPlaying = false;
    updatePlayPauseIcons();
});

audio.addEventListener('timeupdate', () => {
    const current = formatTime(audio.currentTime);
    currentTimeEl.textContent = current;
    expCurrentTimeEl.textContent = current;
    
    if (audio.duration) {
        const progress = (audio.currentTime / audio.duration) * 100;
        miniProgressFill.style.width = `${progress}%`;
        expProgressFill.style.width = `${progress}%`;
    }
});

audio.addEventListener('ended', nextTrack);

// Click on progress bar to seek
function seek(e, barElement) {
    if (!audio.duration || isNaN(audio.duration)) return;
    const rect = barElement.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = percent * audio.duration;
}

miniProgressBar.addEventListener('click', (e) => seek(e, miniProgressBar));
expProgressBar.addEventListener('click', (e) => seek(e, expProgressBar));

// UI Event Listeners
playPauseBtn.addEventListener('click', () => { isPlaying ? pauseTrack() : playTrack(); });
expPlayBtn.addEventListener('click', () => { isPlaying ? pauseTrack() : playTrack(); });

document.getElementById('next-btn').addEventListener('click', nextTrack);
document.getElementById('prev-btn').addEventListener('click', prevTrack);
document.getElementById('exp-next-btn').addEventListener('click', nextTrack);
document.getElementById('exp-prev-btn').addEventListener('click', prevTrack);

genreBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        genreBtns.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const genre = btn.getAttribute('data-genre');
        filterByGenre(genre);
    });
});

// Expanded Overlay Logic
document.querySelector('.now-playing-mini').addEventListener('click', (e) => {
    // Don't expand if clicking on the control buttons directly
    if(e.target.closest('.control-btn') || e.target.closest('.progress-wrapper')) return;
    expandedOverlay.classList.add('active');
    startVisualizer();
});

closeExpandedBtn.addEventListener('click', () => {
    expandedOverlay.classList.remove('active');
    stopVisualizer();
});

// ==========================================
// Cleanup
// ==========================================
window.addEventListener('beforeunload', () => {
    stopVisualizer();
    audio.pause();
    audio.src = '';
});

// ==========================================
// Init All
// ==========================================
window.addEventListener('load', () => {
    if (currentTracks.length > 0) {
        renderTracks(currentTracks);
        updatePlayerUI(currentTracks[0]);
    } else {
        showError("No tracks available.");
    }

    initEntryAnimation();
    initMagneticButtons();
});
