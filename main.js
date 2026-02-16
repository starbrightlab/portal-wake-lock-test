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
