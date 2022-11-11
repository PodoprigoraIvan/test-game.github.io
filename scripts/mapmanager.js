class MapManager {
    constructor(){
        this.mapData = null; // хранилище карты
        this.tLayer = null; // ссылка на блоки карты
        this.xCount = 0; // количество блоков по горизонтали
        this.yCount = 0; // количество блоков по вертикали
        this.tSize = {x: 64, y: 64}; // размер блока
        this.mapSize = {x: 64, y: 64}; // размер карты в пикселях
        this.tilesets = new Array(); // массив описаний блоков карты
        let canvas = document.getElementById('canvasid');
        this.view = {x: 0, y: 0, w: canvas.width, h: canvas.height}; // видимая область с координатами левого верхнего угла
        this.obstacles = [3];
        this.nextLevelTileId = 4;
        this.finishTileId = 5;
        this.imgLoadCount = 0;
    }

    parseMap(tilesJSON){
        return new Promise((resolve, reject) => {
            this.mapData = JSON.parse(tilesJSON);
            this.xCount = this.mapData.width;
            this.yCount = this.mapData.height;
            this.tSize.x = this.mapData.tilewidth;
            this.tSize.y = this.mapData.tileheight;
            this.mapSize.x = this.xCount * this.tSize.x;
            this.mapSize.y = this.yCount * this.tSize.y;
            for (let i = 0; i < this.mapData.tilesets.length; i++){
                let img = new Image();
                img.onload = () => {
                    this.imgLoadCount++;
                    if (this.imgLoadCount === this.mapData.tilesets.length)
                        resolve();
                };
                img.src = this.mapData.tilesets[i].image;
                let t = this.mapData.tilesets[i];
                let ts = {
                    firstgid: t.firstgid,
                    image: img,
                    name: t.name,
                    xCount: Math.floor(t.imagewidth/this.tSize.x),
                    yCount: Math.floor(t.imageheight/this.tSize.y),
                };
                this.tilesets.push(ts);
            }
            for (let id = 0; id < this.mapData.layers.length; id++){
                let layer = this.mapData.layers[id];
                if (layer.type === "tilelayer"){
                    this.tLayer = layer;
                    break;
                }
            }
        })
        
    }

    loadMap(path) {
        return new Promise((resolve, reject) =>{
            let request = new XMLHttpRequest();
            request.onreadystatechange = async () => {
                if (request.readyState === 4 && request.status === 200){
                    await this.parseMap(request.responseText); // корректный ответ, результат можно обрабатывать
                    resolve();
                }
            };
            request.open("GET", path, true);
            request.send();
        })
    }

    getTileset(tileIndex){
        for (let i = this.tilesets.length - 1; i >= 0; i--)
            if (this.tilesets[i].firstgid <= tileIndex){
                return this.tilesets[i];
            }
        return null;
    }

    getTile(tileIndex){
        let tile = {
            img: null,
            px: 0, py: 0
        };
        let tileset = this.getTileset(tileIndex);
        tile.img = tileset.image;
        let id = tileIndex - tileset.firstgid;
        let x = id % tileset.xCount;
        let y = Math.floor(id / tileset.xCount);
        tile.px = x * this.tSize.x;
        tile.py = y * this.tSize.y;
        return tile;
    }

    isVisible(x, y, width, height) {
        if (x + width < this.view.x || y + height < this.view.y || x > this.view.x + this.view.w || y > this.view.y + this.view.h)
            return false;
        return true;
    }

    centerAt(x, y, display_scale) {
        this.view.x = x - (this.view.w / 2) / display_scale;
        this.view.y = y - (this.view.h / 2) / display_scale;
        if (this.view.x < 0) this.view.x = 0;
        if (y > this.mapSize.y - (this.view.h / 2) / display_scale) this.view.y = this.mapSize.y - this.view.h / display_scale;
        if (x > this.mapSize.x - (this.view.w / 2) / display_scale) this.view.x = this.mapSize.x - this.view.w / display_scale;
        if (this.view.y < 0) this.view.y = 0;
    }

    draw(ctx) {
        for (let i = 0; i < this.tLayer.data.length; i++){
            if (this.tLayer.data[i] != 0) {
                let tile = this.getTile(this.tLayer.data[i]);
                let pX = (i % this.xCount) * this.tSize.x;
                let pY = Math.floor(i / this.xCount) * this.tSize.y;
                if (!this.isVisible(pX, pY, this.tSize.x, this.tSize.y))
                    continue;
                pX -= this.view.x;
                pY -= this.view.y;
                ctx.drawImage(tile.img, tile.px, tile.py, this.tSize.x, this.tSize.y, pX, pY, this.tSize.x, this.tSize.y);
            }
        }
    }

    getEntities(){
        for (let id = 0; id < this.mapData.layers.length; id++){
            let layer = this.mapData.layers[id];
            if (layer.type === "objectgroup"){
                return layer.objects;
            }
        }
        return [];
    }

    getMapCoordinates(pos_x, pos_y){ //По координатам получить координаты в сетке тайлов
        let map_x = Math.floor(pos_x / this.tSize.x);
        let map_y = Math.floor(pos_y / this.tSize.y);
        return {x: map_x, y: map_y};
    }

    doesCollideWithObstacle(pos_x, pos_y) {
        let mapCoordinates = this.getMapCoordinates(pos_x, pos_y);
        let map_x = mapCoordinates.x;
        let map_y = mapCoordinates.y;
        if (map_x < 0 || map_y < 0 || map_x >= this.xCount || map_y >= this.yCount) return true;
        if (this.obstacles.includes(this.tLayer.data[map_y * this.xCount + map_x])) return true;
        return false;
    }

    doesTouchNextLevelTile(pos_x, pos_y, size_x, size_y){
        let corner = this.getMapCoordinates(pos_x, pos_y);
        if (this.tLayer.data[corner.y * this.xCount + corner.x] == this.nextLevelTileId) return true;
        corner = this.getMapCoordinates(pos_x+size_x, pos_y);
        if (this.tLayer.data[corner.y * this.xCount + corner.x] == this.nextLevelTileId) return true;
        corner = this.getMapCoordinates(pos_x, pos_y+size_y);
        if (this.tLayer.data[corner.y * this.xCount + corner.x] == this.nextLevelTileId) return true;
        corner = this.getMapCoordinates(pos_x+size_x, pos_y+size_y);
        if (this.tLayer.data[corner.y * this.xCount + corner.x] == this.nextLevelTileId) return true;
        return false;
    }

    getCoordinatesToCenterRect(map_x, map_y, size_x, size_y){ //координаты, по которым следует расположить прямоугольник, чтобы он находился по центру тайла
        return {x: (map_x+0.5) * this.tSize.x - size_x/2, y: (map_y+0.5) * this.tSize.y - size_y/2};
    }

    getPathBetweenTwoTiles(x1, y1, x2, y2, maxLength){
        if (x1 == x2 && y1 == y2) return null;
        let from = []; // обратные ссылки
        let visited = []; // посещенные вершины
        let queue = []; // очередь
        let dist = {}; // расстояния от начальной вершины.
        dist[x1+";"+y1] = 0;
        let dest = {x:x2, y:y2};
        queue.push({x:x1, y:y1});
        visited.push({x:x1, y:y1});

        let proceedStep = (x, y, cur) => {
            if (this.doesCollideWithObstacle(x*this.tSize.x, y*this.tSize.y) == false && visited.find(item => (item.x == x && item.y == y)) === undefined) {
                queue.push({x: x, y: y});
                visited.push({x: x, y: y});
                from.push({pos: {x: x, y: y}, from: cur});
                dist[x + ";" + y] = dist[cur.x+";"+cur.y] + 1;
                if ((x === dest.x && y === dest.y) || dist[x + ";" + y] > maxLength) return false;
            }
            return true;
        };

        while (queue.length != 0){
            let cur = queue.shift();
            if (Math.abs(x2-x1) >= Math.abs(y2-y1)){
                if (proceedStep(cur.x+1, cur.y, cur) == false) break;
                if (proceedStep(cur.x-1, cur.y, cur) == false) break;
                if (proceedStep(cur.x, cur.y+1, cur) == false) break;
                if (proceedStep(cur.x, cur.y-1, cur) == false) break;
            } else {
                if (proceedStep(cur.x, cur.y+1, cur) == false) break;
                if (proceedStep(cur.x, cur.y-1, cur) == false) break;
                if (proceedStep(cur.x+1, cur.y, cur) == false) break;
                if (proceedStep(cur.x-1, cur.y, cur) == false) break;
            }
        }
        if (from.find(item => (item.pos.x === dest.x && item.pos.y === dest.y)) === undefined) return null;
        let path = [];
        let cur = (from.find(item => (item.pos.x === dest.x && item.pos.y === dest.y)));
        cur = cur.from;
        path.unshift(dest);
        while (true){
            path.unshift(cur);
            cur = from.find(item => (item.pos.x === cur.x && item.pos.y === cur.y));
            if (cur === undefined) return [{x:x2, y:y2}];
            cur = cur.from;
            if (cur.x === x1 && cur.y === y1) break;
        }
        return path;
    }
}
