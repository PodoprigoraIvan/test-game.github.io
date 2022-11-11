function storeUsername(form) {
    localStorage["username"] = form.elements['username'].value;
}

function updateLeaderboard(score) {
    if (localStorage['leaderboard'] == null) {
        localStorage['leaderboard'] = JSON.stringify([{username: localStorage['username'], score: score}]);
    } else {
        let leaderboardList = JSON.parse(localStorage['leaderboard']);
        leaderboardList.push({username: localStorage['username'], score: score});
        leaderboardList.sort((a,b) => (b.score > a.score) ? 1 : ((a.score > b.score) ? -1 : ((a.username > b.username) ? 1 : ((b.username > a.username) ? -1 : 0))));
        if (leaderboardList.length > 10) leaderboardList.pop();
        localStorage['leaderboard'] = JSON.stringify(leaderboardList);
    }
}

function displayLeaderboard() {
    let leaderboardTable = document.getElementById('leaderboardTable');
    let leaderboardList = JSON.parse(localStorage['leaderboard']);
    let row = leaderboardTable.insertRow();
    let cell = row.insertCell();
    cell.innerHTML = "№";
    cell = row.insertCell();
    cell.innerHTML = "Имя игрока";
    cell = row.insertCell();
    cell.innerHTML = "Счёт";
    for (let i = 0; i < leaderboardList.length; i++){
        row = leaderboardTable.insertRow();
        cell = row.insertCell();
        cell.innerHTML = i + 1;
        cell = row.insertCell();
        cell.innerHTML = leaderboardList[i].username;
        cell = row.insertCell();
        cell.innerHTML = leaderboardList[i].score;
    }
}