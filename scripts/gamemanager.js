let score = 0;

class GameManager {
    constructor(mapManager, spriteManager, soundManager, tick){
        this.display_scale = 1;
        this.max_display_scale = 3;
        this.canvas = document.getElementById("canvasid");
        this.ctx = this.canvas.getContext("2d");
        this.mapManager = mapManager;
        this.soundManager = soundManager;
        this.spriteManager = spriteManager;

        this.player = null;
        this.loadObjects();

        this.timeStopLeft = 0;
        this.timeStopEffectRadius = 1;
        this.tick = tick;
        this.isLevelPassed = false;

        this.collisionManager = new CollisionManager(this);
        this.eventManager = new EventManager(this);
        this.eventManager.setup();
        this.maxRadius = Math.max(this.mapManager.view.h, this.mapManager.view.w);
    }

    loadObjects(){
        this.entities = [];
        let entitiesDescription = this.mapManager.getEntities();
        for (let object of entitiesDescription){
            if (object.name === "Player"){
                this.player = new Player('player_right', object.x, object.y, this, 0, 0, 0, 0);
                continue;
            }
            let entity = null;
            if (object.name === "Trap") entity = new Trap("Trap", object.x, object.y, this);
            if (object.name === "HealthPotion") entity = new HealthPotion("HealthPotion", object.x, object.y, this);
            if (object.name === "ManaPotion") entity = new ManaPotion("ManaPotion", object.x, object.y, this);
            if (object.name === "Coin") entity = new Coin("Coin", object.x, object.y, this);
            if (object.name === "Demon") entity = new Demon("Demon", object.x, object.y, this, 0, 0, 0, 0);
            if (entity != null) this.entities.push(entity);
        }
    }

    changeMap(mapManager){
        this.mapManager = mapManager;
        let prevPlayerState = this.player;
        this.loadObjects();
        let pos_x = this.player.pos_x;
        let pos_y = this.player.pos_y;
        this.player = prevPlayerState;
        this.player.mapManager = mapManager;
        this.player.pos_x = pos_x;
        this.player.pos_y = pos_y;

        this.timeStopLeft = 0;
        this.timeStopEffectRadius = 1;
        this.isLevelPassed = false;
    }

    change_scale(value){
        if (this.display_scale + value < 1 || this.display_scale + value > this.max_display_scale) return;
        this.display_scale += value;
        this.ctx.setTransform(this.display_scale, 0, 0, this.display_scale, 0, 0);
    }

    doTimeStop(){
        if (this.player.manaPoints < this.player.timeStopSpellCost) return;
        if (this.timeStopLeft <= 0){
            this.soundManager.play("assets/time_stop_sound.ogg", null); 
            this.timeStopLeft = 4000; 
            setTimeout(() => {this.soundManager.play("assets/time_stop_end_sound.ogg", null);}, 4500);
            this.player.manaPoints -= this.player.timeStopSpellCost;
        }
    }

    runBall(click_x, click_y){
        if (this.player.manaPoints < this.player.magicBallSpellCost) return;
        let rect = this.canvas.getBoundingClientRect()
        let pos_x = (click_x-rect.left+this.mapManager.view.x*this.display_scale) / this.display_scale;
        let pos_y = (click_y-rect.top+this.mapManager.view.y*this.display_scale) / this.display_scale;
        this.soundManager.play("assets/spell_sound.ogg", {volume: 0.4});
        let center_x = this.player.pos_x;
        let center_y = this.player.pos_y;
        let dx = pos_x - center_x;
        let dy = pos_y - center_y;
        let move_x = 0;
        let move_y = 0;
        dx > 0 ? move_x = 1 : move_x = -1;
        dy > 0 ? move_y = 1 : move_y = -1;
        let speed = 7;
        let speed_x = Math.abs(dx) / Math.sqrt(dx*dx + dy*dy) * speed;
        let speed_y = Math.abs(dy) / Math.sqrt(dx*dx + dy*dy) * speed;
        let ball = new MagicBall("magic_ball", center_x+move_x*20, center_y+move_y*20, this, speed_x, speed_y, move_x, move_y);
        this.entities.push(ball);
        this.player.manaPoints -= this.player.magicBallSpellCost;
    }

    drawInterface(){
        let barWidth = this.mapManager.view.w/5/this.display_scale;
        let margin = 10/this.display_scale;
        let barHeight = 20/this.display_scale;
        let border = 2/this.display_scale;        
        let healthWidth = (this.player.healthPoints / this.player.maxHealthPoints) * (barWidth-border*2);
        let manaWidth = (this.player.manaPoints / this.player.maxManaPoints) * (barWidth-border*2);

        this.ctx.fillStyle = "black";
        this.ctx.fillRect(margin, margin, barWidth, barHeight);
        this.ctx.fillStyle = "rgb(125, 11, 11)";
        this.ctx.fillRect(margin+border, margin+border, barWidth-border*2, barHeight - border*2);
        this.ctx.fillStyle = "red";
        this.ctx.fillRect(margin+border, margin+border, healthWidth, barHeight - border*2);

        this.ctx.fillStyle = "black";
        this.ctx.fillRect(margin, margin + barHeight + border, barWidth, barHeight);
        this.ctx.fillStyle = "rgb(0, 0, 100)";
        this.ctx.fillRect(margin+border, margin + barHeight+border*2, barWidth-border*2, barHeight - border*2);
        this.ctx.fillStyle = "blue";
        this.ctx.fillRect(margin+border, margin + barHeight+border*2, manaWidth, barHeight - border*2);

        this.ctx.font = (20/this.display_scale) + "px bold Arial";
        this.ctx.fillStyle = "black";
        this.ctx.fillText("Health potions: " + this.player.healthPotionsAmount, margin, (barHeight+border) * 3 + border);
        this.ctx.fillText("Mana potions: " + this.player.manaPotionsAmount, margin, (barHeight+border) * 4 + border);
        this.ctx.fillText("Score: " + score, margin, barHeight*6+border);
    }

    drawMsg(msg, color){
        this.ctx.fillStyle = color;
        this.ctx.font = (40/this.display_scale) + "px bold Arial";
        this.ctx.fillText(msg, this.mapManager.view.w * 0.4 / this.display_scale, this.mapManager.view.h * 0.5 / this.display_scale);
    }

    update(){
        if (this.isLevelPassed == false) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.player.update(this.tick);
            this.entities = this.entities.filter(entity => (entity.healthPoints > 0));
            if (this.timeStopLeft <= 0) 
                for (let i of this.entities) i.update(this.tick);
            this.collisionManager.update();
            this.mapManager.centerAt(this.player.pos_x+(this.player.size_x/2), this.player.pos_y+(this.player.size_y/2), this.display_scale);
            this.mapManager.draw(this.ctx);
            
            for (let entity of this.entities) entity.draw(this.ctx);

            if (this.timeStopLeft > 0){
                this.ctx.fillStyle = "rgba(15, 15, 70, 0.7)";
                this.ctx.beginPath();
                this.ctx.arc(this.mapManager.view.w/2/this.display_scale, this.mapManager.view.h/2/this.display_scale, this.timeStopEffectRadius, 0, 2 * Math.PI, false);
                this.ctx.fill();
                if (this.timeStopEffectRadius < this.maxRadius)
                    this.timeStopEffectRadius += 10;
                this.timeStopLeft -= this.tick;
            } else {
                this.timeStopEffectRadius = 1;
            }
            this.player.draw(this.ctx);
            this.drawInterface();

            if (this.mapManager.doesTouchNextLevelTile(this.player.pos_x, this.player.pos_y, this.player.size_x, this.player.size_y))
                if (this.entities.find(item=>item.name == "Demon") === undefined)
                    this.isLevelPassed = true; // Игрок коснулся места перехода на следующий уровень и убил всех врагов
                else 
                    this.drawMsg("Level not cleared", "red");
        }
    }

}