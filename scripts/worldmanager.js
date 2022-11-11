let worldManager = null;

async function start(){
    worldManager = new WorldManager();
    await worldManager.LoadAll();
    worldManager.update();
}

class WorldManager {
    constructor(){
        this.levelsAmount = 2;
        this.tick = 10;
        this.finishFlag = false;
        this.mapManager = null;
        this.soundManager = null;
        this.spriteManager = null;

        this.currentLevel = 1;
        this.gameManager =  null;
    }

    async LoadAll(){
        this.mapManager = new MapManager();
        await this.mapManager.loadMap("assets/level"+this.currentLevel+".json");
        this.soundManager = new SoundManager();
        this.soundManager.init();
        await this.soundManager.loadArray(["assets/time_stop_sound.ogg", "assets/time_stop_end_sound.ogg", "assets/spell_sound.ogg", "assets/bear_trap_sound.mp3", "assets/coin_sound.mp3", "assets/pickup_sound.mp3", "assets/potion_use_sound.ogg", "assets/demon_death_sound.ogg", "assets/demon_attack_sound.mp3", "assets/win_sound.ogg"]);
        this.spriteManager = new SpriteManager();
        await this.spriteManager.loadAtlas("assets/sprites.json","assets/spritesheet.png");
        this.gameManager = new GameManager(this.mapManager, this.spriteManager, this.soundManager, this.tick);
        return Promise.resolve();
    }

    async update(){
        this.gameManager.update();
        if (this.gameManager.player != null && this.gameManager.player.healthPoints <= 0){
            this.finishFlag = true;
            window.location.href = "./gameover.html";
        }
        if (this.gameManager.isLevelPassed == true){
            this.currentLevel++;
            if (this.currentLevel > this.levelsAmount) {
                this.finishFlag = true;
                this.gameManager.drawMsg("YOU WIN", "rgb(0, 255, 0)");
                this.gameManager.soundManager.play("assets/win_sound.ogg");
                updateLeaderboard(score);
                setTimeout(()=>window.location.href = "./leaderboard.html", 8500);
            }
            if (this.finishFlag != true) {
                this.mapManager = new MapManager();
                await this.mapManager.loadMap("assets/level"+this.currentLevel+".json");
                this.gameManager.changeMap(this.mapManager);
            }
        }
        if (this.finishFlag != true) setTimeout(()=>{this.update();}, this.tick);
    }

}