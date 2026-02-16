/**
 * Portal Discovery Tool - Stress Test Logic
 * Implements Phase 2 technical validation tests (T6, T10)
 */

import { logger } from './main.js';

export async function runPhotoSlideshow(onExit) {
    logger.log('Starting T10/T17: Photo Slideshow...');

    const container = document.createElement('div');
    container.id = 'slideshow-container';
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: black;
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
    `;

    const statusOverlay = document.createElement('div');
    statusOverlay.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 20px;
        color: white;
        background: rgba(0,0,0,0.5);
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
    `;

    document.body.appendChild(container);
    container.appendChild(statusOverlay);

    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'Exit Slideshow';
    closeBtn.className = 'btn small';
    closeBtn.style.cssText = 'position: absolute; top: 20px; right: 20px; z-index: 10000;';
    closeBtn.onclick = () => {
        document.body.removeChild(container);
        logger.log('Slideshow terminated');
        if (onExit) onExit();
    };
    container.appendChild(closeBtn);


    // Mock photos using Unsplash or similar placeholder
    const photos = Array.from({ length: 10 }, (_, i) => `https://picsum.photos/1920/1080?random=${i}`);

    let currentIndex = 0;
    const img1 = new Image();
    const img2 = new Image();
    [img1, img2].forEach(img => {
        img.style.cssText = 'position: absolute; width: 100%; height: 100%; object-fit: contain; transition: opacity 2s;';
    });

    container.appendChild(img1);
    container.appendChild(img2);

    async function nextSlide() {
        const nextPhoto = photos[currentIndex % photos.length];
        const activeImg = currentIndex % 2 === 0 ? img1 : img2;
        const inactiveImg = currentIndex % 2 === 0 ? img2 : img1;

        activeImg.src = nextPhoto;
        await activeImg.decode(); // Ensure decoded before showing

        activeImg.style.opacity = '1';
        inactiveImg.style.opacity = '0';

        statusOverlay.innerText = `Photo ${currentIndex + 1} | Memory: ${performance.memory ? (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}`;

        currentIndex++;
    }

    await nextSlide();
    const interval = setInterval(nextSlide, 5000);

    closeBtn.addEventListener('click', () => clearInterval(interval));
}

export function runResourceStressTest() {
    logger.log('Starting T6: Resource Stress Test...');
    logger.log('Allocating 50MB of dummy data every 30 seconds...');

    const leaks = [];
    const interval = setInterval(() => {
        // Allocate ~10MB
        const data = new Array(1024 * 1024).fill('LEAK').join('');
        leaks.push(data);
        logger.log(`T6 Status: Allocated ${leaks.length * 10}MB total. | JS Heap: ${performance.memory ? (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}`);

        if (leaks.length > 50) {
            logger.error('Stress test reached 500MB limit. Clearing memory.');
            leaks.length = 0;
        }
    }, 30000);

    return () => clearInterval(interval);
}
