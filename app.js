const canvas = document.getElementById('ambient-canvas');
const ctx = canvas.getContext('2d');
const spotlight = document.getElementById('main-spotlight');
let particles = [];
let mouse = { x: null, y: null, radius: 150 };
let lastTime = 0;
let targetSmearY = 0;
let currentSmearY = 0;
let isBlizzard = false;
let isChristmas = false;
let lastScrollTime = Date.now();
let snowAccumulation = 0;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles();
}

class Particle {
    constructor() {
        this.reset();
        this.life = Math.random() * this.maxLife;
    }

    reset(x, y) {
        this.x = x || Math.random() * canvas.width;
        this.y = y || Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.baseOpacity = Math.random() * 0.4 + 0.1;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.pushVx = 0;
        this.pushVy = 0;
        this.maxLife = (Math.random() * 4000) + 3000;
        this.life = 0;
    }

    draw() {
        let fadeFactor = 1;
        const fadeTime = 800;

        if (this.life < fadeTime) {
            fadeFactor = this.life / fadeTime;
        } else if (this.life > this.maxLife - fadeTime) {
            fadeFactor = (this.maxLife - this.life) / fadeTime;
        }

        let dx = this.x - (canvas.width / 2);
        let dy = this.y;
        let normalizedX = dx / (canvas.width * 0.45);
        let normalizedY = dy / (canvas.height * 1.5);
        let distanceToLight = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);

        let lightBoost = 0;
        if (distanceToLight < 1) {
            let currentSpotlightOpacity = parseFloat(spotlight.style.opacity || 0.8);
            lightBoost = Math.pow((1 - distanceToLight), 2) * (currentSpotlightOpacity * 0.8);
        }

        let finalOpacity = (this.baseOpacity + lightBoost) * fadeFactor;

        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, finalOpacity))})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }

    update(dt) {
        this.life += dt;

        if (this.life >= this.maxLife) {
            this.reset();
        }

        if (mouse.x !== null && mouse.y !== null) {
            let dx = this.x - mouse.x;
            let dy = this.y - mouse.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < mouse.radius) {
                let force = (mouse.radius - distance) / mouse.radius;
                this.pushVx += (dx / distance) * force * 0.15;
                this.pushVy += (dy / distance) * force * 0.15;
            }
        }

        this.pushVx *= 0.96;
        this.pushVy *= 0.96;

        let currentVx = this.vx;
        let currentVy = this.vy;

        if (isBlizzard) {
            currentVx = (Math.random() - 0.5) * 15 + 8;
            currentVy = (Math.random() - 0.5) * 15;
        } else if (isChristmas) {
            currentVx = Math.sin(this.life / 300) * 0.8;
            currentVy = 1.5 + (this.size * 0.5);
        }

        this.x += currentVx + this.pushVx;
        this.y += currentVy + this.pushVy;

        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
    }
}

function initParticles() {
    particles = [];
    let numberOfParticles = (canvas.width * canvas.height) / 11000;
    for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle());
    }
}

function updateScrollEffects() {
    const track = document.getElementById('smear-track');
    const aboutHeading = document.getElementById('about-heading');
    const mainContent = document.getElementById('main-content');

    if (track && aboutHeading && mainContent) {
        const offset = aboutHeading.getBoundingClientRect().top - mainContent.getBoundingClientRect().top;
        track.style.top = `${Math.max(0, offset + 6)}px`;

        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = scrollHeight > 0 ? (window.scrollY / scrollHeight) : 0;
        const maxY = track.offsetHeight - 128;
        targetSmearY = scrollPercent * maxY;
    }
}

function animate(currentTime) {
    let dt = currentTime - lastTime;
    lastTime = currentTime;
    if (dt > 100) dt = 16;

    if (isChristmas && (Date.now() - lastScrollTime) > 2500) {
        snowAccumulation = Math.min(100, snowAccumulation + (dt * 0.02));
    } else {
        snowAccumulation = Math.max(0, snowAccumulation - (dt * 0.8));
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isChristmas && snowAccumulation > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, snowAccumulation / 20)})`;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        for (let x = 0; x <= canvas.width + 50; x += 50) {
            let yOffset = Math.sin(x * 0.01 + currentTime * 0.001) * 8;
            ctx.lineTo(x, canvas.height - snowAccumulation + yOffset);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fill();
    }

    for (let i = 0; i < particles.length; i++) {
        particles[i].draw();
        particles[i].update(dt);
    }

    currentSmearY += (targetSmearY - currentSmearY) * 0.1;
    const smear = document.getElementById('scroll-smear');
    const track = document.getElementById('smear-track');

    if (smear && track) {
        smear.style.transform = `translate3d(-50%, ${currentSmearY}px, 0)`;

        let maxY = track.offsetHeight - 128;
        let peakPercent = (currentSmearY / Math.max(1, maxY)) * 100;
        peakPercent = Math.max(0, Math.min(100, peakPercent));

        smear.style.backgroundImage = `linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) ${peakPercent}%, rgba(255, 255, 255, 0) 100%)`;
    }

    requestAnimationFrame(animate);
}

function flickerLight() {
    if (Math.random() > 0.2) {
        spotlight.style.opacity = (0.8 + Math.random() * 0.16).toString();
        setTimeout(() => {
            spotlight.style.opacity = '0.96';
            if (Math.random() > 0.4) {
                setTimeout(() => {
                    spotlight.style.opacity = (0.8 + Math.random() * 0.1).toString();
                    setTimeout(() => {
                        spotlight.style.opacity = '0.96';
                    }, Math.random() * 80 + 30);
                }, Math.random() * 80 + 30);
            }
        }, Math.random() * 200 + 50);
    }
    setTimeout(flickerLight, Math.random() * 2000 + 800);
}

window.addEventListener('scroll', () => {
    updateScrollEffects();
    lastScrollTime = Date.now();
});

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
});

window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
    }
});

window.addEventListener('touchend', () => {
    mouse.x = null;
    mouse.y = null;
});

function init() {
    resizeCanvas();
    updateScrollEffects();
    currentSmearY = targetSmearY;
    requestAnimationFrame((time) => {
        lastTime = time;
        animate(time);
    });
    setTimeout(flickerLight, 2000);
}

init();

window.addEventListener('load', updateScrollEffects);

window.addEventListener('resize', () => {
    resizeCanvas();
    updateScrollEffects();
});

const burgerBtn = document.getElementById('burger-btn');
const dropdownMenu = document.getElementById('dropdown-menu');
const secretCodeBtn = document.getElementById('secret-code-btn');
const secretModal = document.getElementById('secret-modal');
const secretBackdrop = document.getElementById('secret-backdrop');
const closeModalBtn = document.getElementById('close-modal-btn');
const secretForm = document.getElementById('secret-form');
const secretInput = document.getElementById('secret-input');
const modalContent = document.getElementById('secret-modal-content');

let isMenuOpen = false;

burgerBtn.addEventListener('click', () => {
    isMenuOpen = !isMenuOpen;
    const spans = burgerBtn.querySelectorAll('span');

    if (isMenuOpen) {
        spans[0].style.transform = 'translateY(8px) rotate(45deg)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'translateY(-8px) rotate(-45deg)';
        dropdownMenu.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-2');
    } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
        dropdownMenu.classList.add('opacity-0', 'pointer-events-none', '-translate-y-2');
    }
});

document.addEventListener('click', (e) => {
    if (isMenuOpen && !burgerBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        burgerBtn.click();
    }
});

function openModal() {
    secretModal.classList.remove('opacity-0', 'pointer-events-none');
    modalContent.classList.remove('scale-95');
    secretInput.value = '';
    setTimeout(() => secretInput.focus(), 100);
    if (isMenuOpen) burgerBtn.click();
}

function closeModal() {
    secretModal.classList.add('opacity-0', 'pointer-events-none');
    modalContent.classList.add('scale-95');
}

secretCodeBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
secretBackdrop.addEventListener('click', closeModal);

secretForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = secretInput.value.trim().toLowerCase();
    let validCode = true;
    const hat = document.getElementById('santa-hat');

    if (code === 'dinnerbone') {
        document.body.style.transition = 'transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
        document.body.style.transform = document.body.style.transform === 'rotate(180deg)' ? 'none' : 'rotate(180deg)';
        if (hat) hat.classList.add('opacity-0');
    } else if (code === 'blizzard') {
        isBlizzard = true;
        isChristmas = false;
        if (hat) hat.classList.add('opacity-0');
    } else if (code === 'rainbow') {
        document.body.classList.add('rainbow-mode');
        if (hat) hat.classList.add('opacity-0');
    } else if (code === 'christmas') {
        isChristmas = true;
        isBlizzard = false;
        if (hat) hat.classList.remove('opacity-0');
    } else if (code !== '') {
        validCode = false;
        secretInput.classList.add('invalid-code');
        setTimeout(() => {
            secretInput.classList.remove('invalid-code');
        }, 400);
    }

    if (validCode && code !== '') {
        closeModal();
    }
});