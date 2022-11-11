class CollisionManager {
    constructor(gameManager){
        this.gameManager = gameManager;
    }
    update(){
        let entities = this.gameManager.entities;
        let player = this.gameManager.player;
        for(let i = 0; i < entities.length; i++){
            let entity = entities[i];
            if (this.twoEntitiesCollision(player, entity)){
                entity.onTouchEntity(player);
            }
        }

        for(let i = 0; i < entities.length - 1; i++){
            let firstEntity = entities[i];
            for (let j = i + 1; j < entities.length; j++){
                if (firstEntity.healthPoints <= 0) break;
                let secondEntity = entities[j];
                if (secondEntity.healthPoints <= 0) continue;
                if (this.twoEntitiesCollision(firstEntity, secondEntity)){
                    firstEntity.onTouchEntity(secondEntity);
                    secondEntity.onTouchEntity(firstEntity);
                }
            }
        }
    }

    twoEntitiesCollision(firstEntity, secondEntity){
        if (
            firstEntity.pos_x < secondEntity.pos_x + secondEntity.size_x &&
            firstEntity.pos_x + firstEntity.size_x > secondEntity.pos_x &&
            firstEntity.pos_y < secondEntity.pos_y + secondEntity.size_y &&
            firstEntity.size_y + firstEntity.pos_y > secondEntity.pos_y
        ) return true;
          else return false;
    }
}