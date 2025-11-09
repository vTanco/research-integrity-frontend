// Research Integrity Analyzer – Connected to FastAPI backend

const API_BASE_URL = "https://research-integrity-backend.onrender.com";

class ConflictAnalyzer {
    constructor() {
        this.currentAnalysis = null;
        this.analysisHistory = [];
        this.userSettings = this.loadSettings();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeAnimations();
        this.startBackgroundEffects();
    }

    setupEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
            uploadArea.addEventListener('drop', this.handleFileDrop.bind(this));
            uploadArea.addEventListener('click', () => document.getElementById('fileInput').click());
        }

        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) this.analyzeFile(e.target.files[0]);
            });
        }

        const urlInput = document.getElementById('urlInput');
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (urlInput && analyzeBtn) {
            analyzeBtn.addEventListener('click', this.analyzeFromURL.bind(this));
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.analyzeFromURL();
            });
        }

        this.setupNavigation();
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    handleFileDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) this.analyzeFile(files[0]);
    }

    async analyzeFile(file) {
        if (file.type !== 'application/pdf') return this.showError('Please upload a PDF file.');

        this.showAnalysisProgress("Uploading and analyzing PDF...");
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(`${API_BASE_URL}/analyze_pdf`, { method: "POST", body: formData });
            if (!res.ok) throw new Error("Server error");
            const data = await res.json();

            this.completeAnalysis(data.analysis, data.metadata);
        } catch (err) {
            console.error(err);
            this.showError("Analysis failed. Check backend connection.");
        }
    }

    async analyzeFromURL() {
        const url = document.getElementById('urlInput').value.trim();
        if (!url) return;

        this.showAnalysisProgress("Fetching and analyzing URL...");
        try {
            const formData = new FormData();
            formData.append("url", url);

            const res = await fetch(`${API_BASE_URL}/analyze_url`, { method: "POST", body: formData });
            if (!res.ok) throw new Error("Server error");
            const data = await res.json();

            this.completeAnalysis(data.analysis, data.metadata);
        } catch (err) {
            console.error(err);
            this.showError("Could not analyze this URL.");
        }
    }

    showAnalysisProgress(message = "Analyzing...") {
        const container = document.getElementById('analysisProgress');
        const status = document.getElementById('progressStatus');
        if (container) {
            container.style.display = 'block';
            this.animateProgressBar();
        }
        if (status) status.textContent = message;
    }

    animateProgressBar() {
        const bar = document.querySelector('.progress-fill');
        if (bar) {
            bar.style.width = "0%";
            anime({
                targets: bar,
                width: '100%',
                duration: 5000,
                easing: 'easeInOutQuad'
            });
        }
    }

    completeAnalysis(analysis, metadata) {
        document.getElementById('analysisProgress').style.display = 'none';
        if (!analysis) return this.showError("No analysis data returned.");

        const parsed = this.parseAnalysis(analysis);
        this.displayAnalysisResults(parsed, metadata);
        localStorage.setItem('currentAnalysis', JSON.stringify(parsed));
    }

    parseAnalysis(raw) {
        try {
            return typeof raw === "string" ? JSON.parse(raw) : raw;
        } catch {
            return { overall_risk: "medium", score: 50, categories: [], summary: raw };
        }
    }

    displayAnalysisResults(analysis, metadata) {
        this.updateRiskMeter(analysis.overall_risk || "medium");
        this.updateCategoryCards(analysis.categories || []);
        const resultsSection = document.getElementById('analysisResults');
        if (resultsSection) {
            resultsSection.style.display = 'block';
            anime({
                targets: resultsSection,
                opacity: [0, 1],
                translateY: [20, 0],
                duration: 800,
                easing: 'easeOutQuad'
            });
        }
    }

    updateRiskMeter(level) {
        const meter = document.getElementById('riskMeter');
        const text = document.getElementById('riskText');
        if (!meter || !text) return;

        const percentage = this.calculateRiskPercentage(level);
        const color = this.getRiskColor(level);

        anime({
            targets: meter,
            strokeDasharray: `${percentage * 2.51}, 251`,
            stroke: color,
            duration: 1500,
            easing: 'easeOutQuad'
        });

        text.textContent = `${level.toUpperCase()} RISK`;
        text.style.color = color;
    }

    updateCategoryCards(categories) {
        const container = document.getElementById('categoryCards');
        if (!container) return;
        container.innerHTML = '';

        categories.forEach((c, i) => {
            const card = this.createCategoryCard({
                name: c.name || 'Category',
                icon: c.icon || '📄',
                riskLevel: c.level || 'medium',
                score: c.score || 50,
                description: c.description || 'No description provided'
            });
            container.appendChild(card);
            anime({ targets: card, opacity: [0, 1], translateY: [30, 0], delay: i * 150, duration: 600 });
        });
    }

    createCategoryCard(category) {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.innerHTML = `
            <div class="card-header">
                <div class="category-icon">${category.icon}</div>
                <h3>${category.name}</h3>
                <div class="risk-indicator ${category.riskLevel}"></div>
            </div>
            <div class="card-content">
                <p>${category.description}</p>
                <div class="score-display">
                    <span class="score-label">Risk Score:</span>
                    <span class="score-value">${category.score}/100</span>
                </div>
            </div>
        `;
        return card;
    }

    calculateRiskPercentage(risk) {
        const map = { low: 30, medium: 60, high: 90 };
        return map[risk] || 50;
    }

    getRiskColor(risk) {
        const map = { low: '#27ae60', medium: '#f39c12', high: '#e74c3c' };
        return map[risk] || '#7f8c8d';
    }

    loadSettings() {
        const defaults = { riskThreshold: 50, notifications: true, analysisDepth: 'comprehensive' };
        const saved = localStorage.getItem('userSettings');
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const href = item.getAttribute('href');
                if (href) window.location.href = href;
            });
        });
    }

    initializeAnimations() {
        anime({ targets: '.fade-in', opacity: [0, 1], translateY: [20, 0], delay: anime.stagger(100), duration: 800 });
    }

    startBackgroundEffects() {
        if (typeof p5 !== 'undefined') this.initParticleNetwork();
    }

    initParticleNetwork() {
        const sketch = (p) => {
            let particles = [];
            p.setup = () => {
                const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
                canvas.parent('backgroundCanvas');
                for (let i = 0; i < 40; i++)
                    particles.push({ x: p.random(p.width), y: p.random(p.height), vx: p.random(-0.4, 0.4), vy: p.random(-0.4, 0.4) });
            };
            p.draw = () => {
                p.clear();
                p.stroke(74, 144, 226, 40);
                particles.forEach(pt => {
                    pt.x += pt.vx; pt.y += pt.vy;
                    if (pt.x < 0 || pt.x > p.width) pt.vx *= -1;
                    if (pt.y < 0 || pt.y > p.height) pt.vy *= -1;
                    p.noStroke(); p.fill(74, 144, 226, 100);
                    p.circle(pt.x, pt.y, 3);
                });
            };
        };
        new p5(sketch);
    }

    showError(msg) {
        const el = document.createElement('div');
        el.className = 'error-message';
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    }
}

document.addEventListener('DOMContentLoaded', () => new ConflictAnalyzer());
