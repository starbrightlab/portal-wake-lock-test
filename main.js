/**
 * Portal Discovery Tool - Main Logic
 * Implements Phase 1 technical validation tests (T1-T4, T8, T9)
 */

// --- Logger Utility ---
const logOutput = document.getElementById('log-output');
export const logger = {
    log: (msg, type = 'info') => {
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        const time = new Date().toLocaleTimeString();
        entry.innerHTML = `<span class="log-time">[${time}]</span> ${msg}`;
        logOutput.appendChild(entry);
        logOutput.scrollTop = logOutput.scrollHeight;
        console.log(`[${type.toUpperCase()}] ${msg}`);
    },
    success: (msg) => logger.log(msg, 'success'),
    error: (msg) => logger.log(msg, 'error')
};

// Import stress tests lazily
async function getStressTests() {
    return await import('./stress-test.js');
}


document.getElementById('clear-logs').onclick = () => {
    logOutput.innerHTML = '';
};

logger.log('Portal Discovery Suite Initialized');

// --- T9: Feature Detection Battery ---
function runFeatureDetection() {
    const list = document.getElementById('feature-list');
    list.innerHTML = '';

    const tests = [
        { name: 'navigator.wakeLock', check: () => 'wakeLock' in navigator },
        { name: 'document.fullscreenEnabled', check: () => document.fullscreenEnabled },
        { name: 'HTMLVideoElement.prototype.requestFullscreen', check: () => !!HTMLVideoElement.prototype.requestFullscreen },
        { name: 'CSS aspect-ratio', check: () => CSS.supports('aspect-ratio: 1/1') },
        { name: 'JS Array.at', check: () => !!Array.prototype.at },
        { name: 'JS Object.hasOwn', check: () => !!Object.hasOwn },
        { name: 'User Agent', check: () => navigator.userAgent, displayOnly: true }
    ];

    tests.forEach(test => {
        const item = document.createElement('li');
        item.className = 'feature-item';

        let result;
        try {
            result = test.check();
        } catch (e) {
            result = 'Error';
        }

        const statusClass = test.displayOnly ? '' : (result ? 'pass' : 'fail');
        const statusText = test.displayOnly ? result : (result ? 'Supported' : 'Unavailable');

        item.innerHTML = `
            <span>${test.name}</span>
            <span class="feature-status ${statusClass}">${statusText}</span>
        `;
        list.appendChild(item);
    });

    logger.success('T9: Feature detection complete');
}

runFeatureDetection();

// --- Media Wake Lock Implementation (T1 & T2) ---
const video = document.getElementById('lock-video');
const audio = document.getElementById('lock-audio');
const lockStatus = document.getElementById('lock-status');

// Helper to create a minimal silent video data URI (1 frame, black)
// This avoids needing external assets for the initial test
const SILENT_VIDEO_URI = "data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21tcDQxAAAACHZyZWQAAAAId2lkdGgAAAAIaGVpZ2h0AAAAAG1kYXQ="; // Simplified placeholder
// Note: Generating a real valid minimal MP4 in JS is complex. 
// For production tests, the user should provide a real .mp4 file.
// I'll provide a local fallback path.
video.src = "/assets/silent.mp4";
audio.src = "/assets/silent.mp3";

async function toggleWakeLock(type) {
    logger.log(`Attempting ${type} wake lock...`);

    try {
        if (type === 'video') {
            await video.play();
            lockStatus.innerText = 'T1 Video Lock ACTIVE';
            logger.success('T1: Video playback started successfully');
        } else if (type === 'audio') {
            await audio.play();
            lockStatus.innerText = 'T2 Audio Lock ACTIVE';
            logger.success('T2: Audio playback started successfully');
        }
    } catch (err) {
        logger.error(`Lock failed: ${err.message}`);
        logger.log('Note: Most browsers require a user gesture before autoplay.', 'info');
    }
}

document.getElementById('start-t1').onclick = () => toggleWakeLock('video');
document.getElementById('start-t2').onclick = () => toggleWakeLock('audio');
document.getElementById('stop-locks').onclick = () => {
    video.pause();
    audio.pause();
    lockStatus.innerText = 'Locks inactive';
    logger.log('Wake locks stopped');
};

// --- T3: Fullscreen API ---
document.getElementById('toggle-fullscreen').onclick = async () => {
    try {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
            logger.success('Entered fullscreen mode');
        } else {
            await document.exitFullscreen();
            logger.log('Exited fullscreen mode');
        }
    } catch (err) {
        logger.error(`Fullscreen error: ${err.message}`);
    }
};

// --- T8: Synthetic Touch Keepalive ---
document.getElementById('test-touch').onclick = () => {
    logger.log('Simulating synthetic touch event...');
    const event = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        view: window,
        touches: [{ identifier: Date.now(), target: document.body, clientX: 0, clientY: 0 }]
    });
    document.dispatchEvent(event);
    logger.success('T8: Synthetic touch event dispatched');
};



// --- Phase 3: Alternative Wake Locks ---

// T11: Iframe Reload Timer
let iframeInterval;
document.getElementById('start-t11').onclick = () => {
    if (iframeInterval) {
        clearInterval(iframeInterval);
        iframeInterval = null;
        const existingIframe = document.getElementById('wake-lock-iframe');
        if (existingIframe) existingIframe.remove();
        logger.log('T11: Iframe reload timer stopped');
        return;
    }

    logger.log('Starting T11: Iframe Reload Timer...');
    const iframe = document.createElement('iframe');
    iframe.id = 'wake-lock-iframe';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Reload iframe every 2 minutes (120000ms)
    iframeInterval = setInterval(() => {
        iframe.src = window.location.href; // Reload current page in iframe
        logger.log('T11: Iframe reloaded to reset timer', 'info');
    }, 120000);
    logger.success('T11: Active (Reloading hidden iframe every 2m)');
};

// T12: Dynamic Canvas Noise
let canvasInterval;
document.getElementById('start-t12').onclick = () => {
    if (canvasInterval) {
        clearInterval(canvasInterval);
        canvasInterval = null;
        const existingCanvas = document.getElementById('wake-lock-canvas');
        if (existingCanvas) existingCanvas.remove();
        logger.log('T12: Canvas noise stopped');
        return;
    }

    logger.log('Starting T12: Dynamic Canvas Noise...');
    const canvas = document.createElement('canvas');
    canvas.id = 'wake-lock-canvas';
    canvas.width = 1;
    canvas.height = 1;
    canvas.style.opacity = '0.01'; // Almost invisible but rendered
    canvas.style.position = 'absolute';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    canvasInterval = setInterval(() => {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, 0, 1, 1);
        // Log every 5 mins to avoid spam
    }, 1000); // Update every second
    logger.success('T12: Active (1Hz canvas updates)');
};

// T13: Web Audio Oscillator
let audioContext;
let oscillator;
document.getElementById('start-t13').onclick = async () => {
    if (audioContext) {
        if (audioContext.state !== 'closed') await audioContext.close();
        audioContext = null;
        oscillator = null;
        logger.log('T13: Web Audio Oscillator stopped');
        return;
    }

    logger.log('Starting T13: Web Audio Oscillator...');
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
            throw new Error('Web Audio API not supported');
        }

        audioContext = new AudioContext();
        oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(0.1, audioContext.currentTime); // Inaudible low frequency

        gainNode.gain.setValueAtTime(0.01, audioContext.currentTime); // Very quiet

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        logger.success('T13: Active (Sub-audible oscillator running)');

        // Handle iOS/Chrome autoplay policy
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
            logger.log('T13: AudioContext resumed successfully');
        }
    } catch (err) {
        logger.error(`T13 Failed: ${err.message}`);
    }
};

// --- Phase 4: Combined Strategies ---

// T14: Kitchen Sink (Video + Canvas + Audio + Network)
let t14Active = false;
document.getElementById('start-t14').onclick = () => {
    if (t14Active) {
        // Reload page to stop everything cleanly
        window.location.reload();
        return;
    }

    t14Active = true;
    logger.log('Starting T14: Kitchen Sink (MAXIMUM OVERDRIVE)...');

    // 1. Start Video
    document.getElementById('start-t1').click();

    // 2. Start Canvas Noise
    document.getElementById('start-t12').click();

    // 3. Start Audio Oscillator
    document.getElementById('start-t13').click();

    // 4. Periodic Network Request (every 15s)
    setInterval(() => {
        fetch(window.location.href, { method: 'HEAD' })
            .then(() => logger.log('T14: Network keepalive sent', 'info'))
            .catch(e => logger.error(`T14 Net Error: ${e.message}`));
    }, 15000);

    document.getElementById('start-t14').innerText = 'Stop T14 (Reloads Page)';
    document.getElementById('start-t14').classList.replace('primary', 'error-color');
    logger.success('T14: All subsystems engaged');
};



// --- Phase 5: Community Fixes ---

// T15: YouTube Embed (168h Timer)
let player;
document.getElementById('start-t15').onclick = () => {
    logger.log('Starting T15: YouTube Embed (168h Timer)...');

    if (window.YT) {
        initPlayer();
        return;
    }

    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
        logger.log('YouTube API Ready');
        initPlayer();
    };
};

function initPlayer() {
    if (player) {
        player.destroy();
    }

    player = new YT.Player('youtube-container', {
        height: '100%',
        width: '100%',
        videoId: 'gSvU-flG6FY', // 168 Hour Timer
        playerVars: {
            'playsinline': 1,
            'autoplay': 1,
            'controls': 0,
            'enablejsapi': 1,
            'loop': 1, // Playlist workaround for looping
            'playlist': 'gSvU-flG6FY'
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

function onPlayerReady(event) {
    logger.success('T15: YouTube Player Ready');
    event.target.playVideo();
}

function onPlayerStateChange(event) {
    // 1 = Playing, 2 = Paused, 0 = Ended
    if (event.data === YT.PlayerState.PLAYING) {
        logger.success('T15: YouTube Video PLAYING (Heartbeat Active)');
    } else if (event.data === YT.PlayerState.PAUSED) {
        logger.log('T15: YouTube Video PAUSED', 'error');
    } else if (event.data === YT.PlayerState.ENDED) {
        logger.log('T15: YouTube Video ENDED', 'error');
        event.target.playVideo(); // Force restart
    }
}

function onPlayerError(event) {
    logger.error(`T15: YouTube Player Error: ${event.data}`);
}

// --- Phase 2: Stress Tests ---


document.getElementById('start-t10').onclick = async () => {
    const { runPhotoSlideshow } = await getStressTests();
    runPhotoSlideshow();
};

document.getElementById('start-t6').onclick = async () => {
    const { runResourceStressTest } = await getStressTests();
    runResourceStressTest();
};

// --- T4: Interaction Tracking ---
window.addEventListener('touchstart', (e) => {

    if (e.isTrusted) {
        logger.log('User touch detected (Trusted)', 'info');
    }
}, true);
