// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------


// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字

// !!! 煙火全域變數 !!!
let fireworks = []; // 儲存所有的煙火物件
let percentage = 0; // 全域儲存百分比


window.addEventListener('message', function (event) {
    // 執行來源驗證...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // 更新全域變數
        finalScore = data.score; 
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        // 計算百分比
        percentage = (finalScore / maxScore) * 100;
        
        console.log("新的分數已接收:", scoreText); 
        
        // 啟用 draw() 迴圈，以便煙火能夠動起來
        if (typeof loop === 'function') {
            loop(); 
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數與特效 (在 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    // ★★★ 關鍵修改點 1: 設置固定的 Canvas 尺寸 400x300 ★★★
    let canvas = createCanvas(400, 300); 
    
    // ★★★ 關鍵修改點 2: 將 Canvas 附加到 #h5pContainer 內 ★★★
    canvas.parent('h5pContainer'); 
    
    background(0); 
    // 初始狀態：不進行迴圈繪製，直到收到分數
    noLoop(); 
} 

function draw() { 
    // ★★★ 關鍵修改點 3: 低透明度的黑背景，創造煙火殘影效果 ★★★
    // 數字越小，殘影越明顯
    background(0, 25); 

    // -----------------------------------------------------------------
    // A. 繪製文本
    // -----------------------------------------------------------------
    
    textSize(30); // 調整字體大小以適應 400x300 畫布
    textAlign(CENTER);
    
    // Canvas 中心座標
    const centerX = width / 2;
    const centerY = height / 2;

    if (percentage >= 90) {
        // 高分：觸發煙火，並顯示鼓勵文本
        fill(0, 255, 100); 
        text("恭喜！優異成績！", centerX, centerY - 50);
        
        // 煙火特效 - 每 5 幀發射一個新的煙火
        if (frameCount % 5 === 0) {
            fireworks.push(new Firework());
        }
        
    } else if (percentage >= 60) {
        // 中等分數
        fill(255, 200, 50); 
        text("成績良好，請再接再厲。", centerX, centerY - 50);
        
    } else if (percentage > 0) {
        // 低分
        fill(255, 50, 50); 
        text("需要加強努力！", centerX, centerY - 50);
        
    } else {
        // 尚未收到分數
        fill(180); 
        text(scoreText, centerX, centerY);
        noLoop();
    }

    // 顯示具體分數
    textSize(25); // 調整字體大小
    fill(200); 
    text(`得分: ${finalScore}/${maxScore}`, centerX, centerY);
    
    
    // -----------------------------------------------------------------
    // B. 繪製幾何圖形反映 (略為調整位置適應 300 高度)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        fill(0, 255, 100, 150); // 帶透明度
        noStroke();
        circle(centerX, centerY + 80, 80); // 調整圓圈大小和位置
        
    } else if (percentage >= 60) {
        fill(255, 200, 50, 150);
        rectMode(CENTER);
        rect(centerX, centerY + 80, 80, 80); // 調整方形大小和位置
    }
    
    
    // -----------------------------------------------------------------
    // C. 繪製並更新煙火 (如果分數 >= 90)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        for (let i = fireworks.length - 1; i >= 0; i--) {
            fireworks[i].update();
            fireworks[i].show();
            
            // 移除已「燃盡」的煙火
            if (fireworks[i].isFinished()) {
                fireworks.splice(i, 1);
            }
        }
    }
}


// =================================================================
// 步驟三：定義煙火和粒子類別 (Particle System)
// -----------------------------------------------------------------

class Particle {
    constructor(x, y, hue, firework) {
        this.pos = createVector(x, y);
        this.firework = firework;
        this.lifespan = 255;
        this.hu = hue;
        
        if (this.firework) {
            // 煙火上升 (速度略快，使升空效果明顯)
            this.vel = createVector(0, random(-8, -6)); // 調整速度適應 300 高度
        } else {
            // 爆炸後的粒子，給予隨機放射速度 (四面八方噴濺)
            this.vel = p5.Vector.random2D();
            // 提高隨機速度範圍，增強噴濺的爆發感
            this.vel.mult(random(3, 10)); 
        }
        
        this.acc = createVector(0, 0);
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.firework) {
            // 爆炸後的粒子受重力影響並逐漸消失
            this.vel.mult(0.95); // 空氣阻力
            this.lifespan -= 4; // 減少生命值 (透明度)
        }
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 清除加速度
    }

    show() {
        // 確保煙火是彩色的，使用 HSB
        colorMode(HSB); 
        
        if (!this.firework) {
            // 爆炸後的粒子 (四面八方噴濺的碎片)
            strokeWeight(3); 
            stroke(this.hu, 255, 255, this.lifespan);
        } else {
            // 煙火主體 (往上升空的火箭)
            strokeWeight(6); 
            stroke(this.hu, 255, 255);
        }
        point(this.pos.x, this.pos.y);
        
        // 記得切換回 RGB 模式
        colorMode(RGB); 
    }
    
    isFinished() {
        return this.lifespan < 0;
    }
}

class Firework {
    constructor() {
        // 隨機顏色
        this.hu = random(255); 
        // 初始位置在畫布底部中央附近
        this.firework = new Particle(random(width/2 - 50, width/2 + 50), height, this.hu, true);
        this.exploded = false;
        this.particles = [];
        this.gravity = createVector(0, 0.2); // 重力
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(this.gravity);
            this.firework.update();
            
            // 判斷是否到達頂點 (y 速度轉為正或 y 座標夠高)
            // 由於畫布變小，將最高點判斷調整到 height * 0.25
            if (this.firework.vel.y >= 0 || this.firework.pos.y < height * 0.25) {
                this.exploded = true;
                this.explode();
            }
        }
        
        // 更新爆炸後的粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].applyForce(this.gravity);
            this.particles[i].update();
            if (this.particles[i].isFinished()) {
                this.particles.splice(i, 1);
            }
        }
    }

    explode() {
        // 增強爆炸效果: 產生 200 個粒子
        for (let i = 0; i < 200; i++) {
            let p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
            this.particles.push(p);
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show();
        }
        
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].show();
        }
    }
    
    isFinished() {
        // 判斷整個煙火是否結束 (主體已爆炸且所有粒子已燃盡)
        return this.exploded && this.particles.length === 0;
    }
}
