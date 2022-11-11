class EventManager {
    constructor(gameManager){
        this.gameManager = gameManager;
        this.player = gameManager.player;
    }
    setup(){
        document.addEventListener('keydown', (event) => {
            if(event.key == "=") this.gameManager.change_scale(0.1);
            if(event.key == "-") this.gameManager.change_scale(-0.1);
            if (event.code == "KeyW" || event.code == "ArrowUp") {this.player.move_y = -1; this.player.speed_y = this.player.player_speed;}
            if (event.code == "KeyA" || event.code == "ArrowLeft") {this.player.move_x = -1; this.player.speed_x = this.player.player_speed;}
            if (event.code == "KeyS" || event.code == "ArrowDown") {this.player.move_y = 1; this.player.speed_y = this.player.player_speed;}
            if (event.code == "KeyD" || event.code == "ArrowRight") {this.player.move_x = 1; this.player.speed_x = this.player.player_speed;}
            if (event.code == "Digit1") this.player.useHealthPotion(); 
            if (event.code == "Digit2") this.player.useManaPotion(); 
            if (event.code == "Space") this.gameManager.doTimeStop();
        });
        document.addEventListener('keyup', (event) => {
            if (event.code == "KeyW" || event.code == "ArrowUp") {this.player.move_y = 0; this.player.speed_y = 0;}
            if (event.code == "KeyA" || event.code == "ArrowLeft") {this.player.move_x = 0; this.player.speed_x = 0;}
            if (event.code == "KeyS" || event.code == "ArrowDown") {this.player.move_y = 0; this.player.speed_y = 0;}
            if (event.code == "KeyD" || event.code == "ArrowRight") {this.player.move_x = 0; this.player.speed_x = 0;}
        });

        this.gameManager.canvas.addEventListener('mousedown', (event) => {
            this.gameManager.runBall(event.clientX, event.clientY);
        });

        this.gameManager.canvas.addEventListener('wheel', (event) => {
            if (event.deltaY < 0) this.gameManager.change_scale(0.1);
            else this.gameManager.change_scale(-0.1);
        });
    }
}