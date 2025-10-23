// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------


// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字

// !!! 新增煙火全域變數 !!!
let fireworks = []; // 儲存所有的煙火物件
let percentage = 0; // 全域儲存百分比


window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        // 計算百分比並更新全域變數
        percentage = (finalScore / maxScore) * 100;
        
        console.log("新的分數已接收:", scoreText); 
        
        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 
        // ----------------------------------------
        if (typeof redraw === 'function') {
            // 啟用 draw() 迴圈，以便煙火能夠動起來
            loop(); 
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    // ... (其他設置)
    createCanvas(windowWidth / 2, windowHeight / 2); 
    // 將背景改為黑色 (0) 以模擬夜空
    background(0); 
    // 初始狀態：不進行迴圈繪製，直到收到分數
    noLoop(); 
} 

// score_display.js 中的 draw() 函數片段

function draw() { 
    // *** 修改點 1: 將背景設為黑色 (0) ***
    // 為了讓煙火有殘影效果，使用低透明度的黑背景來淡化前一幀的畫面
    // 例如：background(0, 25);
    background(0, 25); 

    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    
    textSize(80); 
    textAlign(CENTER);
    
    // *** 修改點 2: 文本顏色改為白色，使其在黑底上可見 ***
    fill(255); 
    
    if (percentage >= 90) {
        // 滿分或高分：顯示鼓勵文本，使用鮮豔顏色
        fill(0, 255, 100); // 亮綠色
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
        // !!! 煙火特效 !!!
        // 每隔幾幀發射一個新的煙火 (例如：每 5 幀)
        if (frameCount % 5 === 0) {
            fireworks.push(new Firework());
        }
        
    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本
        fill(255, 200, 50); // 亮黃色
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：顯示警示文本
        fill(255, 50, 50); // 亮紅色
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0
        fill(180); // 灰色
        text(scoreText, width / 2, height / 2);
        
        // 如果還沒有收到分數，停止 draw 迴圈
        noLoop();
    }

    // 顯示具體分數
    textSize(50);
    fill(200); // 淺灰色
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        // 畫一個大圓圈代表完美 [7]
        fill(0, 255, 100, 150); // 帶透明度
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        // 畫一個方形 [4]
        fill(255, 200, 50, 150);
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
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
            // 煙火上升的粒子，給予向上速度
            this.vel = createVector(0, random(-12, -8));
        } else {
            // 爆炸後的粒子，給予隨機放射速度
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 10)); // 隨機速度大小
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
            // 爆炸後的粒子
            strokeWeight(3); // 粒子稍大一點
            // 使用 this.lifespan 作為透明度 (Alpha)
            stroke(this.hu, 255, 255, this.lifespan);
        } else {
            // 煙火主體 (火箭)
            strokeWeight(6); // 火箭更大更亮
            stroke(this.hu, 255, 255);
        }
        point(this.pos.x, this.pos.y);
        
        // 記得切換回 RGB 模式，這樣文字顏色才不會出錯
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
        this.firework = new Particle(random(width/2 - 100, width/2 + 100), height, this.hu, true);
        this.exploded = false;
        this.particles = [];
        this.gravity = createVector(0, 0.2); // 重力
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(this.gravity);
            this.firework.update();
            
            // 判斷是否到達頂點 (y 速度轉為正或 y 座標夠高)
            if (this.firework.vel.y >= 0 || this.firework.pos.y < height * 0.3) {
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
        // 產生多個爆炸粒子 (增加數量讓爆炸效果更豐富)
        for (let i = 0; i < 150; i++) {
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
