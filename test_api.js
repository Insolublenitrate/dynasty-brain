const fetch = require('node-fetch');

async function test() {
    try {
        const res = await fetch("http://127.0.0.1:8000/api/stats/advanced_player_metrics?year=2025");
        const data = await res.json();
        const offense = data.filter(p => ['QB','RB','WR','TE'].includes(p.position));
        console.log(`Offense players: ${offense.length}`);
        if(offense.length > 0) {
            console.log(offense[0]);
        }
    } catch(e) {
        console.error(e);
    }
}
test();
