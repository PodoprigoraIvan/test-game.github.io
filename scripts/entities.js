class Entity {
    constructor(name, pos_x, pos_y, gameManager) {
        this.name = name;
        this.healthPoints = 100;
        this.pos_x = pos_x;
        this.pos_y = pos_y;
        this.gameManager = gameManager;
        this.spriteManager = gameManager.spriteManager;
        this.mapManager = gameManager.mapManager;
        this.soundManager = gameManager.soundManager;
        let entitySprite = this.spriteManager.getSprite(name);

        this.size_x = entitySprite.w;
        this.size_y = entitySprite.h;
    }
    getDamage(dmg){
        this.healthPoints -= Math.abs(dmg);
        if (this.healthPoints <= 0) this.kill();
    }
    kill(){
        this.healthPoints = 0;
    }
    draw(ctx) {
        this.spriteManager.drawSprite(ctx, this.mapManager, this.name, this.pos_x, this.pos_y);
    }
    update(tick){}
    onTouchEntity(entity){
        console.log("ME: " + this.name + " TOUCHED: " + entity.constructor.name);
    }
}

class MovingEntity extends Entity {
    constructor(name, pos_x, pos_y, gameManager, speed_x, speed_y, move_x, move_y){
        super(name, pos_x, pos_y, gameManager);
        this.speed_x = speed_x;
        this.speed_y = speed_y;
        this.move_x = move_x;
        this.move_y = move_y;
    }

    update(tick){
        let touchedObstacle = {horizontal: false, vertical: false};
        if ((this.speed_x == 0 && this.speed_y == 0) || (this.move_x == 0 && this.move_y == 0)) return touchedObstacle;

        let noObstacleLeftFlag = ((this.mapManager.doesCollideWithObstacle(this.pos_x-this.speed_x, this.pos_y) === false) && (this.mapManager.doesCollideWithObstacle(this.pos_x-this.speed_x, this.pos_y+this.size_y) === false));
        let noObstacleRightFlag = ((this.mapManager.doesCollideWithObstacle(this.pos_x+this.size_x+this.speed_x, this.pos_y) === false) && (this.mapManager.doesCollideWithObstacle(this.pos_x+this.size_x+this.speed_x, this.pos_y+this.size_y) === false));
        let noObstacleTopFlag = ((this.mapManager.doesCollideWithObstacle(this.pos_x, this.pos_y-this.speed_y) === false) && (this.mapManager.doesCollideWithObstacle(this.pos_x+this.size_x, this.pos_y-this.speed_y) === false));
        let noObstacleBottomFlag = ((this.mapManager.doesCollideWithObstacle(this.pos_x, this.pos_y+this.size_y+this.speed_y) === false) && (this.mapManager.doesCollideWithObstacle(this.pos_x+this.size_x, this.pos_y+this.size_y+this.speed_y) === false));

        if (this.move_x == 1){
            if (noObstacleRightFlag)
                this.pos_x += this.speed_x;
            else
                touchedObstacle.horizontal = true;
        }
        if (this.move_x == -1){
            if (noObstacleLeftFlag)
                this.pos_x -= this.speed_x;
            else
                touchedObstacle.horizontal = true;
        }
        if (this.move_y == 1){
            if (noObstacleBottomFlag)
                this.pos_y += this.speed_y;
            else
                touchedObstacle.vertical = true;
        }
        if (this.move_y == -1){
            if (noObstacleTopFlag)
                this.pos_y -= this.speed_y;
            else
                touchedObstacle.vertical = true;
        }
        return touchedObstacle
    }
}

class MagicBall extends MovingEntity {
    ricochetsCount = 0;
    maxRicochets = 3;
    damage = 20;
    update(tick){
        let touchedObstacle = super.update(tick);
        if (touchedObstacle.horizontal === false && touchedObstacle.vertical === false) return;
        if (touchedObstacle.horizontal === true) this.move_x *= -1;
        if (touchedObstacle.vertical === true) this.move_y *= -1;
        this.ricochetsCount++;
        if (this.ricochetsCount > this.maxRicochets) this.kill();
    }
    onTouchEntity(entity){
        if (entity.constructor.name != "Demon") return;
        entity.getDamage(this.damage);
        this.kill();
    }
}

class Player extends MovingEntity {
    player_speed = 2;
    healthPoints = 200;
    maxHealthPoints = 200;
    manaPoints = 200;
    maxManaPoints = 200;
    healthPotionsAmount = 0;
    manaPotionsAmount = 0;
    magicBallSpellCost = 10;
    timeStopSpellCost = 60;
    manaRegenPerSec = 5;
    healthRegenPerSec = 2;
    update(tick){
        super.update(tick);
        if (this.healthPoints < this.maxHealthPoints) this.healthPoints += this.healthRegenPerSec * tick/1000;
        if (this.manaPoints < this.maxManaPoints) this.manaPoints += this.manaRegenPerSec * tick/1000;
    }

    draw(ctx){
        if (this.move_x >= 0){
            this.spriteManager.drawSprite(ctx, this.mapManager, "player_right", this.pos_x, this.pos_y);
        }
        else {
            this.spriteManager.drawSprite(ctx, this.mapManager, "player_left", this.pos_x, this.pos_y);
        }
    }
    useHealthPotion() {
        if (this.healthPotionsAmount <= 0) return;
        this.soundManager.play("assets/potion_use_sound.ogg");
        this.restoreHealth();
        this.healthPotionsAmount--;
    }
    useManaPotion() {
        if (this.manaPotionsAmount <= 0) return;
        this.soundManager.play("assets/potion_use_sound.ogg");
        this.restoreMana();
        this.manaPotionsAmount--;
    }
    restoreMana(){
        this.manaPoints = this.maxManaPoints;
    }
    restoreHealth(){
        this.healthPoints = this.maxHealthPoints;
    }

}

class Trap extends Entity {
    damage = 50;
    onTouchEntity(entity){
        if (entity.constructor.name != "Player") return;
        if (this.gameManager.timeStopLeft > 0) return;
        this.soundManager.play("assets/bear_trap_sound.mp3");
        entity.getDamage(this.damage);
        this.kill();
    }
}

class HealthPotion extends Entity {
    onTouchEntity(entity){
        if (entity.constructor.name != "Player") return;
        this.soundManager.play("assets/pickup_sound.mp3");
        entity.healthPotionsAmount++;
        this.kill();
    }
}

class ManaPotion extends Entity {
    onTouchEntity(entity){
        if (entity.constructor.name != "Player") return;
        this.soundManager.play("assets/pickup_sound.mp3");
        entity.manaPotionsAmount++;
        this.kill();
    }
}

class Coin extends Entity {
    onTouchEntity(entity){
        if (entity.constructor.name != "Player") return;
        this.soundManager.play("assets/coin_sound.mp3");
        score += 100;
        this.kill();
    }
}

class Demon extends MovingEntity {
    speed = 3;
    maxPathLength = 15;
    maxHealthPoints = 100;
    timeBetweenAttacks = 1500;
    attackTimer = 1500;
    damage = 25;
    constructor(name, pos_x, pos_y, gameManager, speed_x, speed_y, move_x, move_y){
        super(name, pos_x, pos_y, gameManager, speed_x, speed_y, move_x, move_y);
        this.gameManager = gameManager;
    }

    onTouchEntity(entity) {
        if (entity.constructor.name != "Player") return;
        if (this.attackTimer <= 0){
            entity.getDamage(this.damage);
            this.soundManager.play("assets/demon_attack_sound.mp3");
            this.attackTimer = this.timeBetweenAttacks;
        }
    }
    
    kill(){
        super.kill();
        score += 50;
        this.soundManager.play("assets/demon_death_sound.ogg");
    }
    draw(ctx){
        super.draw(ctx);
        let margin = 2;
        let barHeight = 4;
        let border = 1;
        ctx.fillStyle = "black";
        ctx.fillRect(this.pos_x - this.mapManager.view.x, this.pos_y-margin-barHeight - this.mapManager.view.y, this.size_x, barHeight);
        let healthBarWidth = this.size_x - 2*border;
        let curHealthWidth = (this.healthPoints / this.maxHealthPoints) * healthBarWidth;
        ctx.fillStyle = "rgb(125, 11, 11)";
        ctx.fillRect(this.pos_x+border - this.mapManager.view.x, this.pos_y - margin - barHeight + border - this.mapManager.view.y, healthBarWidth, barHeight - 2*border);
        ctx.fillStyle = "red";
        ctx.fillRect(this.pos_x+border - this.mapManager.view.x, this.pos_y - margin - barHeight + border - this.mapManager.view.y, curHealthWidth, barHeight - 2*border);
    }

    update(tick) {
        this.attackTimer -= tick;
        let playerMapCoordinates = this.mapManager.getMapCoordinates(this.gameManager.player.pos_x, this.gameManager.player.pos_y);
        let ownMapCoordinates = this.mapManager.getMapCoordinates(this.pos_x, this.pos_y);

        if (Math.abs(ownMapCoordinates.x - playerMapCoordinates.x) + Math.abs(ownMapCoordinates.y - playerMapCoordinates.y) > this.maxPathLength) {
            this.move_x = 0; this.move_y = 0; this.speed_x = 0; this.speed_y = 0;
            return;
        }
        let path = this.mapManager.getPathBetweenTwoTiles(ownMapCoordinates.x, ownMapCoordinates.y, playerMapCoordinates.x, playerMapCoordinates.y, this.maxPathLength);

        let nextTile = ownMapCoordinates;
        if (path != null) nextTile = path[0];
        let toCenter = this.mapManager.getCoordinatesToCenterRect(nextTile.x, nextTile.y, this.size_x, this.size_y);
        let dx = Math.min(this.speed, Math.abs(this.pos_x-toCenter.x));
        let dy = Math.min(this.speed, Math.abs(this.pos_y-toCenter.y));
        if (nextTile.x != ownMapCoordinates.x){ //если нужно двигаться влево или вправо - выравнивается по вертикали
            if (this.pos_y != toCenter.y){
                if (this.pos_y < toCenter.y) {this.move_y = 1; this.speed_y = dy; this.move_x = 0; this.speed_x = 0}
                if (this.pos_y > toCenter.y) {this.move_y = -1; this.speed_y = dy; this.move_x = 0; this.speed_x = 0}
            } else {
                if (this.pos_x < toCenter.x) {this.move_x = 1; this.speed_x = dx; this.move_y = 0; this.speed_y = 0}
                if (this.pos_x > toCenter.x) {this.move_x = -1; this.speed_x = dx; this.move_y = 0; this.speed_y = 0}
            }
        }
        else if (nextTile.y != ownMapCoordinates.y){ //если нужно двигаться вверх ил вниз - выравнивается по горизонтали
            if (this.pos_x != toCenter.x){
                if (this.pos_x < toCenter.x) {this.move_x = 1; this.speed_x = dx; this.move_y = 0; this.speed_y = 0}
                if (this.pos_x > toCenter.x) {this.move_x = -1; this.speed_x = dx; this.move_y = 0; this.speed_y = 0}
            } else {
                if (this.pos_y < toCenter.y) {this.move_y = 1; this.speed_y = dy; this.move_x = 0; this.speed_x = 0}
                if (this.pos_y > toCenter.y) {this.move_y = -1; this.speed_y = dy; this.move_x = 0; this.speed_x = 0}
            }   
        } else {
            if (this.pos_y < toCenter.y) {this.move_y = 1; this.speed_y = dy;}
            if (this.pos_y > toCenter.y) {this.move_y = -1; this.speed_y = dy;}
            if (this.pos_x < toCenter.x) {this.move_x = 1; this.speed_x = dx; }
            if (this.pos_x > toCenter.x) {this.move_x = -1; this.speed_x = dx; }
            if (this.pos_y == toCenter.y && this.pos_x == toCenter.x) {this.move_x = 0; this.move_y = 0; this.speed_x = 0; this.speed_y = 0;}
            
        }
        super.update(tick);
    }
}