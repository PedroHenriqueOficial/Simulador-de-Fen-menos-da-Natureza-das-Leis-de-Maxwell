// --- NOVO: Carregar a textura da Terra ---
const earthTexture = new Image();
let earthTextureLoaded = false;

earthTexture.onload = function() {
    earthTextureLoaded = true;
    console.log("Textura da Terra carregada!");
};
// IMPORTANTE: Mude 'sua-textura-aqui.png' para o nome do seu arquivo
earthTexture.src = 'Earth.png'; 


// Aguarda a página carregar
window.onload = function() {

    // --- 1. CONFIGURAÇÃO INICIAL (AURORA) ---
    const canvas = document.getElementById('simulationCanvas');
    const ctx = canvas.getContext('2d');
    
    let width, height, pole;
    let numStars, stars = [];

    const earthRadius = 130; 
    const atmosphereRadius = 135; // O anel onde as partículas ficarão presas

    const particleCharge = -1; 
    const particleMass = 1;     
    
    let particles = []; 
    const particleLifetime = 15; 

    // --- 2. CLASSE DA PARTÍCULA (Com estado 'trapped') ---
    class Particle {
        constructor(x, y, vx, vy) {
            this.x = x; this.y = y; this.vx = vx; this.vy = vy;
            this.path = []; 
            this.lifetime = 0; 
            this.isAlive = true; 

            this.state = 'traveling'; // 'traveling' ou 'trapped'
            this.oscillationTime = Math.random() * 10; 
            this.oscillationSpeed = 2 + Math.random() * 3; 
            this.oscillationWidth = 0.5 + Math.random() * 0.5; 
            this.baseAngle = 0; 
        }

        update(dt) {
            if (!this.isAlive) return; 

            this.lifetime += dt;
            if (this.lifetime > particleLifetime) {
                this.isAlive = false; 
                return;
            }

            // --- LÓGICA DE ESTADO (Simplificada) ---
            if (this.state === 'traveling') {
                let dx = this.x - pole.x;
                let dy = this.y - pole.y;
                let r = Math.sqrt(dx*dx + dy*dy);

                // --- Lógica de Captura ---
                if (r < atmosphereRadius) {
                    this.state = 'trapped';
                    this.baseAngle = Math.atan2(dy, dx); 
                } else {
                    // A partícula agora apenas viaja em linha reta
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                }

            } else if (this.state === 'trapped') {
                // Estado 2: Presa e oscilando no contorno
                this.oscillationTime += dt;
                let offset = Math.sin(this.oscillationTime * this.oscillationSpeed) * this.oscillationWidth;
                let currentAngle = this.baseAngle + offset;
                this.x = pole.x + atmosphereRadius * Math.cos(currentAngle);
                this.y = pole.y + atmosphereRadius * Math.sin(currentAngle);
            }
            
            // Atualiza o rastro
            this.path.push({x: this.x, y: this.y});
            if (this.path.length > 200) { 
                this.path.shift(); 
            }
        }

        draw(ctx) {
            if (!this.isAlive) return;

            // Rastro
            ctx.beginPath();
            ctx.strokeStyle = '#FFFFFF'; 
            ctx.lineWidth = 1;          
            if (this.path.length > 0) {
                 ctx.moveTo(this.path[0].x, this.path[0].y);
                for (let i = 1; i < this.path.length; i++) {
                    ctx.lineTo(this.path[i].x, this.path[i].y);
                }
                ctx.stroke();
            }

            // Partícula
            ctx.beginPath();
            ctx.fillStyle = '#00FF00'; 
            ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // --- 3. FUNÇÕES DE DESENHO E CONTROLE (AURORA) ---
    
    // --- MUDANÇA: Partículas vêm de qualquer lugar ---
    function addParticle() {
        let startX, startY;
        
        // 1. Sorteia um lado da tela (0=topo, 1=direita, 2=baixo, 3=esquerda)
        let side = Math.floor(Math.random() * 4);

        if (side === 0) { // Topo
            startX = Math.random() * width;
            startY = -50; 
        } else if (side === 1) { // Direita
            startX = width + 50; 
            startY = Math.random() * height;
        } else if (side === 2) { // Baixo
            startX = Math.random() * width;
            startY = height + 50; 
        } else { // Esquerda
            startX = -50; 
            startY = Math.random() * height;
        }
        
        // 2. Define um PONTO ALVO aleatório no topo da atmosfera
        let targetAngle = -(Math.random() * (Math.PI * 0.5) + (Math.PI * 0.25));
        let targetX = pole.x + (atmosphereRadius + 5) * Math.cos(targetAngle); 
        let targetY = pole.y + (atmosphereRadius + 5) * Math.sin(targetAngle);

        // 3. Calcula a velocidade necessária para ir do início ao alvo
        let dx = targetX - startX;
        let dy = targetY - startY;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        let speed = 150 + (Math.random() * 50); 
        
        let startVX = (dx / dist) * speed;
        let startVY = (dy / dist) * speed;
        
        particles.push(new Particle(startX, startY, startVX, startVY));
    }


    function drawStars() {
        ctx.fillStyle = 'white';
        for (const star of stars) {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // --- 'drawScene' (Opção 1: COM IMAGEM) ---
    function drawScene() {
        // 1. Fundo azul (caso a imagem falhe ou não cubra tudo)
        ctx.fillStyle = '#002266';
        ctx.beginPath();
        ctx.arc(pole.x, pole.y, earthRadius, 0, Math.PI * 2);
        ctx.fill();

        // 2. Desenha a Terra (a imagem)
        ctx.save(); 
        ctx.beginPath(); 
        ctx.arc(pole.x, pole.y, earthRadius, 0, Math.PI * 2); 
        ctx.clip(); // Limita o desenho ao círculo
        
        // Tenta desenhar a imagem, centralizada
        if (earthTextureLoaded) {
            try {
                ctx.drawImage(
                    earthTexture, 
                    pole.x - earthRadius, // Posição X
                    pole.y - earthRadius, // Posição Y
                    earthRadius * 2,      // Largura
                    earthRadius * 2       // Altura
                );
            } catch (e) {
                console.error("Erro ao desenhar a textura da Terra:", e);
                // Se der erro, desenha o oceano de antes
                drawOceanGradient();
            }
        } else {
            // Se a imagem ainda não carregou, desenha o oceano
            drawOceanGradient();
        }
        
        ctx.restore(); // Remove o clip

        // 3. Atmosfera (Anel da Aurora)
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.5)';
        ctx.lineWidth = 3;
        ctx.arc(pole.x, pole.y, atmosphereRadius, 0, Math.PI * 2);
        ctx.stroke();
    }

    // --- NOVA FUNÇÃO AUXILIAR ---
    // (Apenas para não repetir o código do gradiente)
    function drawOceanGradient() {
        const oceanGradient = ctx.createRadialGradient(
            pole.x - (earthRadius * 0.3), pole.y - (earthRadius * 0.3), 
            earthRadius * 0.2, pole.x, pole.y, earthRadius
        );
        oceanGradient.addColorStop(0, '#60a0ff'); 
        oceanGradient.addColorStop(1, '#002266'); 
        ctx.fillStyle = oceanGradient; 
        ctx.beginPath();
        ctx.arc(pole.x, pole.y, earthRadius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        width = canvas.width;
        height = canvas.height;
        pole = { x: width / 2, y: height / 2 };
        stars.length = 0; 
        numStars = Math.floor((width * height) / 4000);
        for (let i = 0; i < numStars; i++) {
            stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 1.5
            });
        }
    }

    // --- 4. O LOOP DA SIMULAÇÃO ---
    let lastTime = 0;
    function simulationLoop(timestamp) {
        let dt = (timestamp - lastTime) / 1000; 
        lastTime = timestamp;

        if (isNaN(dt) || dt > 0.1) {
            dt = 0.0166;
        }

        ctx.clearRect(0, 0, width, height);
        drawStars();
        drawScene(); 
        
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.update(dt);
            p.draw(ctx);

            if (!p.isAlive) {
                particles.splice(i, 1);
            }
        }
        
        requestAnimationFrame(simulationLoop);
    }

    // --- 5. LÓGICA DO AVATAR E GUIA (Sem mudanças) ---
    const avatarArea = document.getElementById('avatar-area');
    const topicTitleElement = document.getElementById('topic-title');
    const explanationTextElement = document.getElementById('explanation-text');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const stepCounter = document.getElementById('step-counter');

    const topics = [
        {
            title: "Bem-vindo ao Simulador!",
            explanation: "Olá! Sou seu guia. Esta é uma simulação da Aurora Boreal. Vamos explorar como o campo magnético da Terra interage com as partículas solares."
        },
        {
            title: "Leis de Maxwell!",
            explanation: "Este fenômeno combina as leis de Maxwell com a física de plasmas. A aurora é causada por partículas carregadas, elétrons e prótons, do vento solar que são capturadas pelo campo magnético da Terra, a magnetosfera."
        },
        {
            title: "O Vento Solar",
            explanation: "O Sol constantemente emite partículas carregadas. Clique no botão 'Partícula' para simular uma dessas partículas vindo do espaço!"
        },
        {
            title: "A Força de Lorentz",
            explanation: "É essa força que 'agarra' as partículas do vento solar! Ela age sobre cargas elétricas (q) que estão em movimento (v) dentro de um campo magnético (B). É ela que força as partículas a mudarem de direção e espiralarem em direção aos polos. A fórmula da força magnética é: <span class=\"highlight\">F = q(v x B)</span>"
        },
        {
            title: "Captura Magnética",
            explanation: "A partícula viaja em direção à Terra. Quando ela chega perto da atmosfera (o anel verde), ela é 'capturada' pelo campo magnético, um dipolo, cuja existência é explicada pela Lei de Ampère-Maxwell que age como um 'funil', guiando as partículas em trajetórias espirais ao longo das linhas de campo magnético em direção aos polos."
        },
        {
            title: "A Cor das Auroras",
            explanation: "Ao colidirem com átomos na atmosfera, oxigênio e nitrogênio, essas partículas excitam os átomos, que então emitem luz (fótons) de cores específicas."
        },
        {
            title: "O Efeito Aurora",
            explanation: "Veja! A partícula agora está presa, oscilando para a esquerda e direita ao longo do anel. É exatamente assim que as partículas criam as 'cortinas' de luz da Aurora!"
        },
        {
            title: "A Colisão (A Luz)",
            explanation: "Cada partícula verde representa um feixe de partículas do vento solar colidindo com os gases da atmosfera. Essa colisão libera energia na forma de luz."
        },
        {
            title: "Explore!",
            explanation: "Agora é com você! Clique várias vezes no botão 'Partícula' para ver como elas se juntam e formam um anel de luz oscilante sobre o polo!"
        }
    ];

    let currentTopicIndex = 0;
    let speechSynth = window.speechSynthesis;
    let utterance = null;

    function speakText(text) {
        if (speechSynth.speaking) {
            speechSynth.cancel();
        }
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;
        const plainText = tempDiv.textContent || tempDiv.innerText || '';
        utterance = new SpeechSynthesisUtterance(plainText);
        utterance.lang = 'pt-BR';
        utterance.onstart = () => { avatarArea.classList.add('talking'); };
        utterance.onend = () => { avatarArea.classList.remove('talking'); };
        utterance.onerror = (event) => {
            console.error('SpeechSynthesisUtterance.onerror', event);
            avatarArea.classList.remove('talking');
        };
        speechSynth.speak(utterance);
    }

    function showTopic(index) {
        if (index < 0 || index >= topics.length) return;
        currentTopicIndex = index;
        const topic = topics[index];
        topicTitleElement.textContent = topic.title;
        explanationTextElement.innerHTML = topic.explanation;
        stepCounter.textContent = `${index + 1} / ${topics.length}`;
        speakText(topic.explanation);

        prevBtn.disabled = (index === 0);
        nextBtn.disabled = (index === topics.length - 1); 
    }

    nextBtn.addEventListener('click', () => {
        showTopic(currentTopicIndex + 1);
    });

    prevBtn.addEventListener('click', () => {
        showTopic(currentTopicIndex - 1);
    });
    
    // --- 6. INICIAR TUDO (Sem mudanças) ---
    
    document.getElementById('startButton').onclick = addParticle;
    window.addEventListener('resize', resizeCanvas);
    
    resizeCanvas();
    showTopic(0);
    requestAnimationFrame(simulationLoop); 
};