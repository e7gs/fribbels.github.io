HERO_CACHE = "https://e7-optimizer-game-data.s3-accelerate.amazonaws.com/herodata.json?";
heroData = {};
heroesById = {};
$ = jQuery
dev = false;

loadedHeroData = false;
loadedGwdb = false;

selector0 = null
selector1 = null
selector2 = null
selector3 = null
selector4 = null

buildDefSelector0 = null
buildDefSelector1 = null
buildDefSelector2 = null
buildDefSelector3 = null
buildDefSelector4 = null

jQuery(document).ready(function($){

    translate ();
    //document.title = "Fribbels GW Meta Tracker"
    document.title = "Fribbels 團戰 Meta 紀錄追蹤工具"
    $("#homeLink").attr("href", window.location.href.split('?')[0])

    var options = {
        sortField: 'text',
        width: 'resolve', // need to override the changed default
        //placeholder: "Select hero",
        placeholder: "選擇角色",
        templateResult: formatHeroList,
        theme: "classic",
        allowClear: true
    }
    var includeOptions = {
        sortField: 'text',
        width: 'resolve', // need to override the changed default
        //placeholder: "Include hero",
        placeholder: "包含指定角色",
        templateResult: formatHeroList,
        theme: "classic",
        allowClear: true,
    }
    var excludeOptions = {
        sortField: 'text',
        width: 'resolve', // need to override the changed default
        //placeholder: "Exclude hero",
        placeholder: "排除特定角色",
        templateResult: formatHeroList,
        theme: "classic",
        allowClear: true
    }

    selector0 = $('#heroSelector0').select2(options);
    selector1 = $('#heroSelector1').select2(options);
    selector2 = $('#heroSelector2').select2(options);
    selector3 = $('#heroSelector3').select2(includeOptions);
    selector4 = $('#heroSelector4').select2(excludeOptions);

    buildDefSelector0 = $('#buildDefHeroSelector0').select2(options);
    buildDefSelector1 = $('#buildDefHeroSelector1').select2(options);
    buildDefSelector2 = $('#buildDefHeroSelector2').select2(options);
    buildDefSelector3 = $('#buildDefHeroSelector3').select2(includeOptions);
    buildDefSelector4 = $('#buildDefHeroSelector4').select2(excludeOptions);

    $("#searchButton").click(search)
    $("#buildDefSearchButton").click(buildDefSearch)

    var queryString = window.location.search;
    var urlParams = new URLSearchParams(queryString).get('def');

    if (urlParams) {
        $('#resultRows').html("載入中..")
    } else {
        $('#metaRows').html("載入中...")
    }


    fetchCache(HERO_CACHE).then(x => {
        console.log("herodata", x)
        heroData = x;

        for (var name of Object.keys(heroData)) {
            heroesById[heroData[name].code] = name;
        }

        for (var value of Object.values(heroData)) {
            var img=new Image();
            img.src=value.assets.icon;
        }


        var entries = Object.entries(heroesById).sort(function compare(a, b) {
            if (a[1] < b[1])
                return -1;
            if (a[1] > b[1])
                return 1;
            return 0;
        })

        for (var entry of entries) {
            var data = {
                id: entry[0],
                text: entry[1]
            };

            var newOption0 = new Option(transHero (data.text), data.id, false, false);
            var newOption1 = new Option(transHero (data.text), data.id, false, false);
            var newOption2 = new Option(transHero (data.text), data.id, false, false);
            var newOption3 = new Option(transHero (data.text), data.id, false, false);
            var newOption4 = new Option(transHero (data.text), data.id, false, false);
            $('#heroSelector0').append(newOption0);
            $('#heroSelector1').append(newOption1);
            $('#heroSelector2').append(newOption2);
            $('#heroSelector3').append(newOption3);
            $('#heroSelector4').append(newOption4);

            var buildDefNewOption0 = new Option(transHero (data.text), data.id, false, false);
            var buildDefNewOption1 = new Option(transHero (data.text), data.id, false, false);
            var buildDefNewOption2 = new Option(transHero (data.text), data.id, false, false);
            var buildDefNewOption3 = new Option(transHero (data.text), data.id, false, false);
            var buildDefNewOption4 = new Option(transHero (data.text), data.id, false, false);
            $('#buildDefHeroSelector0').append(buildDefNewOption0);
            $('#buildDefHeroSelector1').append(buildDefNewOption1);
            $('#buildDefHeroSelector2').append(buildDefNewOption2);
            $('#buildDefHeroSelector3').append(buildDefNewOption3);
            $('#buildDefHeroSelector4').append(buildDefNewOption4);
        }

        try {
            if (urlParams) {
                var names = urlParams.split(",")
                var ids = names.map(x => Object.entries(heroesById).find(y => y[1] == x)[0])

                selector0.val(ids[0]).trigger("change");
                selector1.val(ids[1]).trigger("change");
                selector2.val(ids[2]).trigger("change");

                search();
            }
        } catch (e) {
            console.error("Url parsing failed", e);
        }

        loadedHeroData = true;
        checkReady();
    }).catch((e) => {
        console.log(e)
        $('#metaRows').html("</br></br></br>沒有近期團戰資料")
    })

});

function checkReady() {
    if (!loadedHeroData) {
        return;
    }

    showMeta()
}

function showMeta() {
    var queryString = window.location.search;
    var urlParams = new URLSearchParams(queryString).get('def');

    $.ajax({
        url: dev ? "http://127.0.0.1:5000/getMeta" : "https://z4tfy2r5kc.execute-api.us-west-2.amazonaws.com/dev/getMeta",
        //force to handle it as text
        dataType: "text",
        type: "POST",
        crossDomain: true,
        data: "none",
        success: function(data) {
            var json = $.parseJSON(data);
            console.log("meta", json)
            var defenses = json.data
            var offenses = Object.entries(json.offenseData)
            var totalSize = json.totalSize

            // $('#intro').html(`This app tracks data from ${totalSize.toLocaleString("en-US")} attacks from top 50 ranked guild wars. Latest update: ${new Date(json.maxTimestamp*1000).toDateString()}.`)
            $('#intro').html(`此工具紀錄追蹤排名前 50 公會的團戰對戰組合共 ${totalSize.toLocaleString("en-US")} 次攻擊紀錄。最後更新時間：${new Date(json.maxTimestamp*1000).toDateString()}。`)

            if (urlParams) {
                return;
            }

            defenses.sort((a, b) => (b.w+b.l) - (a.w+a.l))
            offenses.sort((a, b) => (b[1].w+b[1].l) - (a[1].w+a[1].l))

            //var html = "</br></br><h2>Top 50 most common meta defenses in past 4 weeks</h2>";
            var html = "</br></br><h2>過去四週，前 50 名常見的團戰防守組合</h2>";
            for (var i = 0; i < 50; i++) {
                var defense = defenses[i];
                var percent = (defense.w/(defense.l + defense.w) * 100).toFixed(1);

                html +=
`
<div class="resultRow">
    <div class="imageRow">
            <a href="${"gw-meta.html?def=" + defense.defense.split(",").map(x => heroesById[x]).join(",")}">
            <div class="metaFightIcons">
                ${imgHtml(defense.defense)}
                <div class="vSpace"></div>
            </div>
            </a>
        <div class="resultsContainer">
            <div class="metaResults W">
                ${defense.w}
            </div>
            <img class="metaAtkImg" src="battle_pvp_icon_def.png"></img>

            <div class="metaResults L">
                ${defense.l}
            </div>
            <img class="metaAtkImg" src="battle_pvp_icon_defeat.png"></img>

            <div class="metaResultsPercent">
                ${isNaN(percent) ? "沒有可用的搜尋結果" : percent + " %"}
            </div>
        </div>
    </div>
</div>
`
            }

            //html += "</br></br><h2>Top 50 most common meta offense units in past 4 weeks</h2>"
            html += "</br></br><h2>過去四週，前 50 名常見的團戰進攻組合</h2>"

            for (var i = 0; i < 50; i++) {
                var offenseName = offenses[i][0];
                var offenseWL = offenses[i][1];
                var percent = (offenseWL.w/(offenseWL.l + offenseWL.w) * 100).toFixed(1);
                // console.log(percent)
                // console.log(offenseWL)
                html +=
`
<div class="resultRow">
    <div class="imageRow">
            <div class="metaFightIconsOffense">
                ${imgHtml(offenseName)}
                <div class="vSpace"></div>
            </div>
            </a>
        <div class="resultsContainer">
            <div class="metaResults W">
                ${offenseWL.w}
            </div>
            <img class="metaAtkImg" src="battle_pvp_icon_win.png"></img>

            <div class="metaResults L">
                ${offenseWL.l}
            </div>
            <img class="metaAtkImg" src="battle_pvp_icon_lose.png"></img>

            <div class="metaResultsPercent">
                ${isNaN(percent) ? "沒有可用的搜尋結果" : percent + " %"}
            </div>
        </div>
    </div>
</div>
`

            }

            $('#metaRows').html(html)
        }
    })
}

function formatHeroList(hero) {
    if (!hero.id) {
        return hero.text
    }
    var originalHero = findTransedHero (hero.text);
    var output = $(`<div class="searchRowContainer"><img src="${heroData[hero.text].assets.icon}" class="heroSearchIcon" />${hero.text}</div>`);

    return output;
};

function search() {
    heroes = [
        $('#heroSelector0').select2('data')[0],
        $('#heroSelector1').select2('data')[0],
        $('#heroSelector2').select2('data')[0]
    ]
    var defenseKey = heroes.map(x => x.id).sort()
    // console.log("defkey", defenseKey);

    $('#resultRows').html("載入中..")
    var defenseHtml = imgHtml(defenseKey.join(","))
    $('#defenseIcons').html("<br/>" + defenseHtml)


    var names = defenseKey.map(x => heroesById[x]).join(",")
    window.history.replaceState(null, null, "?def=" + names);

    $.ajax({
        url: dev ? "http://127.0.0.1:5000/getDef" : "https://z4tfy2r5kc.execute-api.us-west-2.amazonaws.com/dev/getDef",
        //force to handle it as text
        dataType: "text",
        type: "POST",
        crossDomain: true,
        data: defenseKey.join(","),
        success: function(data) {
            //data downloaded so we call parseJSON function
            //and pass downloaded data
            var json = $.parseJSON(data);
            //now json variable contains data in json format
            //let's display a few items
            console.log("getDefResponse", json);

            offenseComps = json.data;

            if (!offenseComps) {
                $('#resultRows').html("沒有可用的搜尋結果")
                return
            }


            include = $('#heroSelector3').select2('data')[0].id
            exclude = $('#heroSelector4').select2('data')[0].id
            // console.log("filter", include)
            // console.log("exclude", exclude)
            // var offenses = {}
            // for (var fight of fights) {
            //     if (!offenses[fight.offense]) {
            //         offenses[fight.offense] = []
            //     }
            //     offenses[fight.offense].push(fight)
            // }

            // offenses = Object.keys(offenses).map(x => ({
            //     offense: x,
            //     fights: offenses[x]
            // }))

            offenses = Object.entries(offenseComps).sort(function compare(a, b) {
                if (a[1].w + a[1].l < b[1].w + b[1].l)
                    return 1;
                if (a[1].w + a[1].l > b[1].w + b[1].l)
                    return -1;
                return 0;
            }).filter(x => {
                if (include.length == 0)
                    return true
                else
                    return x[0].includes(include);
            }).filter(x => {
                if (exclude.length == 0)
                    return true
                else
                    return !x[0].includes(exclude);
            })

            $('#resultRows').html("")

            // console.log("offenses", offenses)

            var html = ""

            for (var i = 0; i < Math.min(100, offenses.length); i++) {
            // for (var offense of offenses) {
                var offense = offenses[i]

                var percent = (offense[1].w/(offense[1].l + offense[1].w) * 100).toFixed(1);

                html +=
// `
//         <div class="resultRow">
//             <div class="imageRow">
//                 <div class="fightIcons">
//                     ${imgHtml(offense[0])}
//                 </div>
//                 <div class="resultsContainer">
//                     <div class="results W">${offense[1].w}W</div>
//                     <div class="results L">${offense[1].l}L</div>
//                 </div>
//                 <div class="metaResultsPercent">
//                     ${isNaN(percent) ? "沒有可用的搜尋結果" : percent + " %"}
//                 </div>
//             </div>
//         </div>
// `
                `
<div class="resultRow">
    <div class="imageRow">
        <div class="metaFightLookup">
            ${imgHtml(offense[0])}
        </div>
        <div class="resultsContainer">
            <div class="metaResults W">
                ${offense[1].w}
            </div>
            <img class="metaAtkImg" src="battle_pvp_icon_win.png"></img>

            <div class="metaResults L">
                ${offense[1].l}
            </div>
            <img class="metaAtkImg" src="battle_pvp_icon_lose.png"></img>

            <div class="metaResultsPercent">
                ${isNaN(percent) ? "沒有可用的搜尋結果" : percent + " %"}
            </div>
        </div>
    </div>
</div>
`
            }

            $('#resultRows').html(html)
            $('#metaRows').html("")
        }
    });
}

function buildDefSearch() {
    heroes = [
        $('#buildDefHeroSelector0').select2('data')[0],
        $('#buildDefHeroSelector1').select2('data')[0],
        $('#buildDefHeroSelector2').select2('data')[0]
    ]

    var defenseKey = heroes.map(x => x.id).sort()
    // console.log("defkey", defenseKey);

    $('#buildDefResultRows').html("載入中..")
    var defenseHtml = imgHtml(defenseKey.join(","))
    $('#buildDefDefenseIcons').html("<br/>" + defenseHtml)


    var names = defenseKey.map(x => heroesById[x]).join(",")


    $.ajax({
        url: dev ? "http://127.0.0.1:5000/buildDef" : "https://z4tfy2r5kc.execute-api.us-west-2.amazonaws.com/dev/buildDef",
        //force to handle it as text
        dataType: "text",
        type: "POST",
        crossDomain: true,
        data: defenseKey.join(","),
        success: function(data) {
            //data downloaded so we call parseJSON function
            //and pass downloaded data
            var json = $.parseJSON(data);
            //now json variable contains data in json format
            //let's display a few items
            console.log("getDefResponse", json);

            offenseComps = json.data;

            if (!offenseComps) {
                $('#buildDefResultRows').html("沒有可用的搜尋結果")
                return
            }


            include = $('#buildDefHeroSelector3').select2('data')[0].id
            exclude = $('#buildDefHeroSelector4').select2('data')[0].id
            // console.log("filter", include)
            // console.log("exclude", exclude)
            // var offenses = {}
            // for (var fight of fights) {
            //     if (!offenses[fight.offense]) {
            //         offenses[fight.offense] = []
            //     }
            //     offenses[fight.offense].push(fight)
            // }

            // offenses = Object.keys(offenses).map(x => ({
            //     offense: x,
            //     fights: offenses[x]
            // }))

            offenses = Object.entries(offenseComps).sort(function compare(a, b) {
                if (a[1].w + a[1].l < b[1].w + b[1].l)
                    return 1;
                if (a[1].w + a[1].l > b[1].w + b[1].l)
                    return -1;
                return 0;
            }).filter(x => {
                if (include.length == 0)
                    return true
                else
                    return x[0].includes(include);
            }).filter(x => {
                if (exclude.length == 0)
                    return true
                else
                    return !x[0].includes(exclude);
            })

            $('#buildDefResultRows').html("")

            // console.log("offenses", offenses)

            var html = ""

            for (var i = 0; i < Math.min(200, offenses.length); i++) {
            // for (var offense of offenses) {
                var offense = offenses[i]

                var percent = (offense[1].l/(offense[1].l + offense[1].w) * 100).toFixed(1);

                html +=
// `
//         <div class="resultRow">
//             <div class="imageRow">
//                 <div class="fightIcons">
//                     ${imgHtml(offense[0])}
//                 </div>
//                 <div class="resultsContainer">
//                     <div class="results W">${offense[1].w}W</div>
//                     <div class="results L">${offense[1].l}L</div>
//                 </div>
//                 <div class="metaResultsPercent">
//                     ${isNaN(percent) ? "沒有可用的搜尋結果" : percent + " %"}
//                 </div>
//             </div>
//         </div>
// `
                `
<div class="resultRow">
    <div class="imageRow">
        <div class="metaFightLookup">


            <a href="${"gw-meta.html?def=" + offense[0].split(",").map(x => heroesById[x]).join(",")}">
            <div class="metaFightIcons">
                ${imgHtml(offense[0])}
                <div class="vSpace"></div>
            </div>
            </a>
        </div>
        <div class="resultsContainer">
            <div class="metaResults W">
                ${offense[1].l}
            </div>
            <img class="metaAtkImg" src="battle_pvp_icon_def.png"></img>

            <div class="metaResults L">
                ${offense[1].w}
            </div>
            <img class="metaAtkImg" src="battle_pvp_icon_defeat.png"></img>

            <div class="metaResultsPercent">
                ${isNaN(percent) ? "沒有可用的搜尋結果" : percent + " %"}
            </div>
        </div>
    </div>
</div>
`
            }

            $('#buildDefResultRows').html(html)
            $('#metaRows').html("")
        }
    });
}

async function fetchCache(url) {
    console.log("Fetching from url: " + url);
    var myHeaders = new Headers();
    myHeaders.append('pragma', 'no-cache');
    myHeaders.append('cache-control', 'no-cache');

    const response = await fetch(url, {
        method: 'GET',
        headers: myHeaders,
        mode: 'cors', // no-cors, *cors, same-origin
    });
    const text = await response.text();
    const json = JSON.parse(text);
    console.log("Finished fetching from url: " + url);

    return json;
}

function sortByAttribute (arr, attributeStr) {
    function compare(a, b) {
        if (a[attributeStr] < b[attributeStr])
            return -1;
        if (a[attributeStr] > b[attributeStr])
            return 1;
        return 0;
    }

    return arr.sort(compare);
}

var questionCircle = "https://raw.githubusercontent.com/fribbels/Fribbels-Epic-7-Optimizer/main/data/cachedimages/question_circle.png";
function imgHtml(offenseStr) {
    var heroIds = offenseStr.split(",")
    var heroNames = heroIds.map(x => heroesById[x])
    var imgHtml = heroNames.map(x => {
        return heroData[x] ?
        `<img class="portrait" title="${x}" src=${heroData[x].assets.icon}></img>` :
        `<img class="portrait" src=${questionCircle}></img>`
    })

    return imgHtml.join(`<div class="vSpace"></div>`)
}

function translate () {

  // Fribbels Epic 7 Guild War Meta Tracker
  $('h1:contains("Fribbels Epic 7 Guild War Meta Tracker")').text ('Fribbels 第七史詩 團戰 Meta 紀錄追蹤工具');

  // This app tracks attacks from top 30 ranked guild war matchups.
  $('p:contains("This app tracks attacks from top 30 ranked guild war matchups.")').text ('此工具紀錄追蹤排名前 30 公會的團戰對戰組合。');

  // Check out the Fribbels discord server for more info <a href="https://discord.gg/rDmB4Un7qg">https://discord.gg/rDmB4Un7qg</a>
  $('#intro').next ('p').html ('更多資訊請參考 Fribbels Discord 伺服器 <a href="https://discord.gg/rDmB4Un7qg">https://discord.gg/rDmB4Un7qg</a>');

  // Fighting a defense
  $('h2:contains("Fighting a defense")').text ('進攻組合');

  // Search for a defense team to find common offenses used against it
  $('p:contains("Search for a defense team to find common offenses used against it")').text ('選擇防守隊伍，以找出常見的進攻組合');

  // Optional: Filter teams including/excluding a unit
  $('p:contains("Optional: Filter teams including/excluding a unit")').text ('可選：指定包含或排除特定角色');

  // Building a defense
  $('h2:contains("Building a defense")').text ('建立防守隊伍');

  // Search for units to find common defenses using those units
  $('p:contains("Search for units to find common defenses using those units")').text ('選擇進攻隊伍，以找出常見的防守組合（較佳防禦率）');

  $('input[value="Search"]').val ('搜尋');
}


function transHero (name) {

  if (typeof HEROS_NAME_MAPPER[name] === 'undefined' || HEROS_NAME_MAPPER[name] === '') {

    if (typeof HEROS_NAME_NOT_IN_MAPPER[name] === 'undefined' ) {
      HEROS_NAME_MAPPER[name] = ''
      HEROS_NAME_NOT_IN_MAPPER[name] = ''
    }

    return name
  }

  return HEROS_NAME_MAPPER[name] + ' ' + name
}

function findTransedHero (name) {

  if (typeof HEROS_NAME_MAPPER_FLIPPED[name] === 'undefined' || HEROS_NAME_MAPPER_FLIPPED[name] === '')
    return name

  return HEROS_NAME_MAPPER_FLIPPED[name]
}

// 輸出 HEROS_NAME_MAPPER 完整文字結構到 console 以便複製貼上
function heros () {

  // 按照 key 排序 HEROS_NAME_MAPPER
  var ordered = [], all = '', missed = '';

  ordered = Object.keys(HEROS_NAME_MAPPER).sort()

  for (var name of ordered) {
    all += `"${name}": "${HEROS_NAME_MAPPER[name]}",\n`
  }

  for (var name of Object.keys(HEROS_NAME_NOT_IN_MAPPER)) {
    missed += `"${name}": "",\n`
  }

  console.log ('\n🔻🔻🔻🔻🔻\n完整清單：\n🔺🔺🔺🔺🔺\n\n', all)
  console.log ('\n🔻🔻🔻🔻🔻\n未翻譯清單：\n🔺🔺🔺🔺🔺\n\n', missed)
}


const HEROS_NAME_MAPPER = {
  "Abigail": "雅碧凱 (阿比)",
  "Abyssal Yufine": "深淵優芬妮 (暗木龍 玉玉龍 病龍)",
  "Achates": "雅卡泰絲 (火奶)",
  "Adin": "艾庭",
  "Adlay": "亞迪賴",
  "Adventurer Ras": "冒險家拉斯 (男主)",
  "Afternoon Soak Flan": "午時戲水芙蘭 (火芙 午時蘭 五十蘭)",
  "Ainos": "艾諾斯",
  "Ainos 2.0": "艾諾斯 2.0",
  "Ains": "艾因茲",
  "Ainz Ooal Gown": "安茲‧烏爾‧恭 (飛鼠 莫莫)",
  "Aither": "埃德勒 (小王子)",
  "Albedo": "雅爾貝德 (總管 病嬌)",
  "Alencia": "艾蓮西雅 (龍姨)",
  "Alexa": "雅莉莎 (小水刺)",
  "All-Rounder Wanda": "疑難雜症專家汪達",
  "Ambitious Tywin": "野心份子泰溫 (光泰溫)",
  "Amid": "雅咪德 (AMD amd)",
  "Amiki": "雅蜜琪",
  "Angel of Light Angelica": "光之天使安潔莉卡 (光水)",
  "Angelic Montmorancy": "守護天使蒙茉朗西 (包子頭 包頭 小水奶)",
  "Angelica": "安潔莉卡 (水奶)",
  "Apocalypse Ravi": "末日蘿菲 (暗蘿)",
  "Aramintha": "雅拉敏塔 (火響指 火法)",
  "Arbiter Vildred": "執行官維德瑞 (暗刺 暗帝)",
  "Archdemon's Shadow": "魔神的暗影 (暗女主 魔神女主)",
  "Architect Laika": "策畫者萊伊卡 (光蜻蜓)",
  "Aria": "艾莉雅 (大水奶)",
  "Armin": "亞敏 (木貓)",
  "Arowell": "雅洛薇",
  "Arunka": "亞露嘉 (大草原)",
  "Assassin Cartuja": "殺手卡爾圖哈 (暗熊)",
  "Assassin Cidd": "殺手席德 (暗席德)",
  "Assassin Coli": "殺手可麗",
  "Astromancer Elena": "星辰的神諭艾蕾娜 (光水琴)",
  "Auxiliary Lots": "輔助型拉茲 (暗拉 暗拉茲)",
  "Azalea": "亞潔理亞",
  "Baal & Sezan": "巴爾&塞尚 (火三眼 火巴)",
  "Bad Cat Armin": "壞壞貓亞敏 (暗亞敏)",
  "Baiken": "梅喧",
  "Basar": "巴薩爾 (埃及佬)",
  "Bask": "巴思克",
  "Batisse": "巴托斯 (小暗拳)",
  "Beehoo": "雨脩",
  "Belian": "伯里安 (光伯 光玻璃)",
  "Bellona": "維爾蘿娜 (木扇)",
  "Benevolent Romann": "仁慈的洛曼 (光洛曼)",
  "Benimaru": "紅丸",
  "Bernard": "伯納德",
  "Birgitta": "碧兒姬達",
  "Blaze Dingo": "烈火汀果",
  "Blood Blade Karin": "血劍卡琳 (血卡)",
  "Blood Moon Haste": "赤月的貴族海斯特 (暗海 暗正太)",
  "Blooming Lidica": "花園麗迪卡 (木弓)",
  "Bomb Model Kanna": "暴擊型卡農",
  "Briar Witch Iseria": "灰光森林的伊賽麗亞 (暗飛)",
  "Brieg": "布里克 (指揮官)",
  "Butcher Corps Inquisitor": "混沌教屠殺追擊者",
  "Byblis": "維波里絲 (微波 花園)",
  "Bystander Hwayoung": "",
  "Camilla": "卡蜜拉",
  "Captain Rikoris": "先鋒隊長里科黎司",
  "Carmainerose": "卡麥蘿茲 (火爪)",
  "Carrot": "卡蘿",
  "Cartuja": "卡爾圖哈",
  "Cecilia": "賽西莉亞 (火賽 火賽西)",
  "Celeste": "賽雷斯特",
  "Celestial Mercedes": "外太空的玫勒賽德絲",
  "Celine": "瑟琳 (木阿姨)",
  "Cerise": "賽瑞絲 (水弓)",
  "Cermia": "潔若米亞 (夏娜)",
  "Challenger Dominiel": "挑戰者多米妮爾 (暗兔)",
  "Champion Zerato": "終結者杰拉圖 (暗杰 暗傑 泥巴)",
  "Chaos Inquisitor": "屠殺部隊員",
  "Chaos Sect Axe": "混沌教巨斧大將軍 (暗斧)",
  "Charles": "查爾斯 (木老頭 劍聖)",
  "Charlotte": "夏綠蒂 (火呆毛)",
  "Chloe": "克蘿愛 (水錘)",
  "Choux": "小泡芙",
  "Christy": "克莉絲媞",
  "Church of Ilryos Axe": "伊利歐斯教斧兵",
  "Cidd": "席德 (木席德)",
  "Clarissa": "克萊莉莎 (水修女 修女)",
  "Claudia": "克勞蒂雅",
  "Closer Charles": "末日指揮官查爾斯 (暗查爾斯 收銀員)",
  "Coli": "可麗",
  "Command Model Laika": "指揮型萊伊卡 (木蜻蜓)",
  "Commander Lorina": "指揮官蘿里娜",
  "Commander Pavel": "司令官帕貝爾 (光帕)",
  "Conqueror Lilias": "支配者莉莉亞斯 (光LLYS)",
  "Corvus": "科爾布思",
  "Crescent Moon Rin": "新月舞姬鈴兒",
  "Crimson Armin": "紅焰亞敏 (光亞敏 光貓)",
  "Crozet": "克羅澤 (團長)",
  "Dark Corvus": "黑暗的科爾布思 (暗老頭 魔神王 暗魔神)",
  "Death Dealer Ray": "死亡探究者雷伊 (暗醫生)",
  "Desert Jewel Basar": "沙漠寶石巴薩爾 (光巴)",
  "Designer Lilibet": "設計師莉莉貝 (暗剪刀 暗LLB)",
  "Destina": "戴絲蒂娜 (木奶)",
  "Diene": "迪埃妮 (聖女)",
  "Dingo": "汀果",
  "Dizzy": "蒂姬 (DZ)",
  "Doll Maker Pearlhorizon": "製偶師波蘿萊珍 (木爪)",
  "Dominiel": "多米妮爾 (冰兔)",
  "Doris": "朵莉思",
  "Dragon Bride Senya": "龍之伴侶賽娜 (新娘)",
  "Dragon King Sharun": "龍王莎倫",
  "Eaton": "伊頓",
  "Eda": "艾妲 (水法)",
  "Edward Elric": "愛德華‧愛力克 (矮豆)",
  "Elena": "艾蕾娜 (水琴)",
  "Eligos": "艾利戈斯",
  "Elphelt": "愛爾菲特 (火兔 兔槍)",
  "Elson": "艾爾森",
  "Elvira": "艾碧拉 (水腿 水腳)",
  "Emilia": "愛蜜莉雅 (EMT)",
  "Empyrean Ilynav": "蒼穹伊莉娜芙 (光饅頭)",
  "Enott": "艾諾特",
  "Ervalen": "艾爾巴倫",
  "Eternal Wanderer Ludwig": "永劫漂流者魯特比 (暗魯特比 暗正太 魔術方塊)",
  "Ezra": "艾自拉",
  "Fairytale Tenebria": "童話泰妮布里雅 (水泰尼 水泰妮)",
  "Faithless Lidica": "無神論者麗迪卡 (光弓)",
  "Falconer Kluri": "鷹獵人可露莉 (鷹盾)",
  "Fallen Cecilia": "墮落的賽西莉亞 (暗龍 暗賽西)",
  "Fenris": "佩里斯",
  "Festive Eda": "慶典艾妲",
  "Fighter Maya": "戰鬥型瑪雅 (光瑪雅)",
  "Flan": "芙蘭",
  "Free Spirit Tieria": "永恆不變的黛莉亞 (光黛)",
  "Frida": "弗莉達 (福利達)",
  "Fumyr": "芙米爾",
  "Furious": "尤貝烏斯 (開水)",
  "General Purrgis": "大將法濟斯 (光狗)",
  "Glenn": "格倫",
  "Gloomyrain": "格魯美蘭 (光爪)",
  "Godmother": "教母",
  "Great Chief Khawana": "大族長卡瓦娜",
  "Guider Aither": "求道者埃德勒 (光王子)",
  "Gunther": "坤特 (坤哥)",
  "Harsetti": "赫爾賽蒂 (女帝)",
  "Hasol": "夏率",
  "Haste": "海斯特 (火正太)",
  "Hataan": "哈坦",
  "Hazel": "海茲",
  "Helen": "海倫",
  "Helga": "赫爾嘉",
  "Hellion Lua": "小惡魔路雅 (暗路雅)",
  "Holiday Yufine": "度假風優芬妮 (噴火龍 火龍)",
  "Holy Flame Adin": "聖炎的艾庭",
  "Hurado": "修拉杜 (光頭)",
  "Hwayoung": "和英 (火腿)",
  "Ian": "伊安",
  "Ilynav": "伊莉娜芙 (黑饅頭)",
  "Immortal Wukong": "不滅神機悟空",
  "Inferno Khawazu": "烈焰的卡瓦朱 (暗香蕉)",
  "Infinite Horizon Achates": "未知的可能性雅卡泰絲 (光火奶)",
  "Inheritor Amiki": "傳承雅蜜琪",
  "Iseria": "伊賽麗亞 (木飛劍)",
  "Jack-O": "潔克‧歐 (JKO)",
  "Januta": "扎努塔",
  "Jecht": "傑克托",
  "Jena": "捷娜",
  "Jenua": "濟紐亞 (雞牛鴨 狗團)",
  "Judge Kise": "審判者綺世 (光74 光綺世)",
  "Judith": "茱迪絲 (小火刺)",
  "Juni": "珠妮",
  "Kane": "該隱",
  "Karin": "卡琳 (水卡)",
  "Kawerik": "卡威利 (火卡)",
  "Kayron": "凱隆",
  "Ken": "肯恩 (火拳 火肯)",
  "Khawana": "卡瓦娜",
  "Khawazu": "卡瓦朱",
  "Kikirat v2": "奇奇拉特V.2 (機器人)",
  "Kiris": "奇麗絲 (毒弓)",
  "Kise": "綺世 (74)",
  "Kitty Clarissa": "貓咪克萊莉莎 (暗貓)",
  "Kizuna AI": "絆愛",
  "Kluri": "可露莉",
  "Krau": "克勞烏 (寶馬)",
  "Laia": "萊婭",
  "Landy": "蘭蒂 (LD)",
  "Last Piece Karin": "最後的碎片卡琳 (光卡琳)",
  "Last Rider Krau": "最後的騎士克勞烏 (光寶馬)",
  "Leah": "蕾婭",
  "Lena": "雷娜 (水拳)",
  "Leo": "雷歐",
  "Lethe": "麗希 (深淵 章魚)",
  "Lidica": "麗迪卡",
  "Lilias": "莉莉亞斯 (LLYS)",
  "Lilibet": "莉莉貝 (剪刀 LLB)",
  "Lilka": "莉珈",
  "Lionheart Cermia": "獅心王潔若米亞 (光獅子)",
  "Little Queen Charlotte": "年輕的女王夏綠蒂 (光呆毛 光夏綠蒂)",
  "Lone Crescent Bellona": "一輪孤月維爾蘿娜 (暗扇)",
  "Lorina": "蘿里娜",
  "Lots": "拉茲",
  "Lua": "路雅",
  "Lucy": "露西",
  "Ludwig": "魯特比 (矮子 皇帝)",
  "Luluca": "璐璐卡 (LLK)",
  "Luna": "露娜 (水龍)",
  "Magic Scholar Doris": "魔法學者朵莉思 (小光奶)",
  "Maid Chloe": "僕人克蘿愛 (光錘)",
  "Martial Artist Ken": "武鬥家肯恩 (暗拳 暗肯)",
  "Mascot Hazel": "吉祥物海茲",
  "Maya": "瑪雅",
  "Mediator Kawerik": "協調者卡威利 (暗卡)",
  "Melany": "玫拉妮",
  "Melissa": "梅麗莎 (吸血鬼 棺材妹)",
  "Mercedes": "玫勒賽德絲 (火女主)",
  "Mercenary Helga": "自由自在的傭兵赫爾嘉 (木斧)",
  "Midnight Gala Lilias": "夜宴莉莉亞斯 (木LLYS)",
  "Mighty Scout": "偵察兵瑪伊堤 (老鼠)",
  "Milim": "蜜莉姆",
  "Mirsa": "米勒莎",
  "Mistychain": "美絲緹彩 (水爪)",
  "Montmorancy": "蒙茉朗西",
  "Moon Bunny Dominiel": "月兔多米妮爾 (光兔 月兔)",
  "Mort": "魔勒",
  "Mucacha": "穆卡察",
  "Mui": "繆伊 (馬戲團)",
  "Muse Rima": "繆斯黎瑪",
  "Muwi": "武蔚",
  "Nahkwol": "落月",
  "Navy Captain Landy": "海軍上校蘭蒂 (光蘭蒂 光LD)",
  "Nemunas": "尼姆拉斯",
  "New Moon Luna": "新月露娜 (光水龍)",
  "Ocean Breeze Luluca": "海洋香氣璐璐卡 (木璐璐卡 木LLK)",
  "Operator Sigret": "操作員賽珂蘭特 (暗眼鏡 暗鐮刀)",
  "Orte": "奧樂緹",
  "Otillie": "奧緹莉爾",
  "Pavel": "帕貝爾 (木帕)",
  "Peacemaker Furious": "平衡的尤貝烏斯",
  "Pearlhorizon": "波蘿萊珍",
  "Peira": "沛伊拉 (水狼)",
  "Penelope": "潘尼羅佩",
  "Pernilla": "培妮拉",
  "Pirate Captain Flan": "海盜船長芙蘭 (暗芙蘭)",
  "Politis": "佛里蒂絲 (火法 火輪椅 火雙子)",
  "Purrgis": "法濟斯 (木狗)",
  "Pyllis": "費莉絲",
  "Ragnvald": "朗巴特",
  "Ram": "拉姆",
  "Ran": "嵐",
  "Ras": "拉斯 (男主)",
  "Ravi": "蘿菲 (火蘿菲)",
  "Ray": "雷伊",
  "Rem": "雷姆",
  "Remnant Violet": "殘影的菲奧雷托 (暗蘋果 暗gay 大哥)",
  "Requiem Roana": "鎮魂的羅安納 (暗木瓜)",
  "Requiemroar": "雷奎姆洛 (暗爪)",
  "Researcher Carrot": "研究者卡蘿 (卡羅)",
  "Revna": "蕾芙娜",
  "Righteous Thief Roozid": "義賊魯茲德 (木狗)",
  "Rikoris": "里科黎司 (光槍)",
  "Rima": "黎瑪",
  "Rimuru": "利姆路 (萌王)",
  "Rin": "鈴兒",
  "Riza Hawkeye": "莉莎‧霍克愛",
  "Roaming Warrior Leo": "流浪勇士雷歐 (暗雷歐)",
  "Roana": "羅安納 (木瓜)",
  "Romann": "洛曼 (羅曼)",
  "Roozid": "魯茲德",
  "Rose": "蘿季 (水蘿季 水羅 水羅季)",
  "Roy Mustang": "羅伊‧馬斯坦古 (大佐)",
  "Ruele of Light": "光之瑞兒 (光瑞 光奶)",
  "Sage Baal & Sezan": "賢者巴爾&塞尚 (光巴)",
  "Savior Adin": "救援者艾庭 (光艾庭)",
  "Schniel": "修尼爾 (國王 日野聰)",
  "Schuri": "修里 (火槍 火修里)",
  "Sea Phantom Politis": "海上幽靈佛里蒂絲 (暗雙)",
  "Seaside Bellona": "海邊的維爾蘿娜 (水扇)",
  "Senya": "賽娜",
  "Serene Purity Adin": "清玄的艾庭",
  "Serila": "塞麗拉",
  "Sez": "賽茲 (水刺)",
  "Shadow Knight Pyllis": "黑騎士費莉絲 (小暗盾)",
  "Shadow Rose": "暗影蘿季 (暗蘿季)",
  "Shalltear": "夏提雅",
  "Sharun": "莎倫",
  "Shepherd Jena": "引導者捷娜",
  "Shooting Star Achates": "流星雅卡泰絲 (暗火奶)",
  "Shuna": "朱菜",
  "Sigret": "賽珂蘭特 (眼鏡 水鐮刀)",
  "Silk": "席可",
  "Silver Blade Aramintha": "白銀刀刃的雅拉敏塔 (光響指 光法)",
  "Silvertide Christy": "銀波克莉絲媞 (小木盾)",
  "Sinful Angelica": "罪戾的安潔莉卡 (暗水奶 暗奶)",
  "Sol": "索爾",
  "Solitaria of the Snow": "雪國的蘇莉塔妮亞",
  "Sonia": "蘇尼婭",
  "Specimen Sez": "實驗體賽茲 (光刺 光賽茲)",
  "Specter Tenebria": "幻影的泰妮布里雅 (暗泰尼 暗泰妮)",
  "Spirit Eye Celine": "靈眼的瑟琳 (光阿姨)",
  "Straze": "史瑞杰思 (史哥)",
  "Summer Break Charlotte": "暑假夏綠蒂 (水呆毛 水夏綠蒂)",
  "Summer's Disciple Alexa": "夏天的學生雅莉莎",
  "Summertime Iseria": "南國的伊賽麗亞 (火飛劍)",
  "Surin": "蘇琳 (蘇林)",
  "Suthan": "斯坦",
  "Sven": "史賓",
  "Sylvan Sage Vivian": "森之賢者薇薇安",
  "Taeyou": "太悟",
  "Talaz": "達拉士",
  "Talia": "達黎兒",
  "Tamarinne": "塔瑪林爾 (偶像)",
  "Taranor Guard": "塔拉諾爾禁衛隊員 (水桶)",
  "Taranor Royal Guard": "塔拉諾爾王宮士兵",
  "Tempest Surin": "風雲蘇琳 (光蘇琳 光蘇林)",
  "Tenebria": "泰妮布里雅 (火泰妮 火泰尼)",
  "Tieria": "黛莉亞",
  "Top Model Luluca": "最強模特兒璐璐卡 (暗璐璐卡 暗LLK)",
  "Troublemaker Crozet": "不法之徒克羅澤 (暗團長)",
  "Twisted Eidolon Kayron": "扭曲的亡靈凱隆 (光凱隆)",
  "Tywin": "泰溫",
  "Unbound Knight Arowell": "自由騎士雅洛薇 (小光盾)",
  "Urban Shadow Choux": "都市暗影小泡芙 (暗泡芙)",
  "Verdant Adin": "新綠的艾庭",
  "Veronica": "貝洛妮卡",
  "Vigilante Leader Glenn": "自衛隊隊長格倫",
  "Vildred": "維德瑞 (木刺 25仔)",
  "Violet": "菲奧雷托 (木蘋果 木gay)",
  "Vivian": "薇薇安 (VVA)",
  "Wanda": "汪達",
  "Wanderer Silk": "流浪者席可 (光席可)",
  "Wandering Prince Cidd": "流浪王子席德 (光席德)",
  "Watcher Schuri": "注視者修里 (光修里)",
  "Westwind Executioner Schuri": "西風處刑者修里 (暗修里)",
  "Wild Angara": "野生安卡拉",
  "Yoonryoung": "尹凌",
  "Young Senya": "小小賽娜",
  "Yufine": "優芬妮 (木龍)",
  "Yulha": "律荷",
  "Yuna": "尤娜 (學生會長)",
  "Zahhak": "札哈克 (國師)",
  "Zealot Carmainerose": "傳道者卡麥蘿茲 (火爪)",
  "Zeno": "傑諾",
  "Zerato": "杰拉圖",
  "Zio": "智武 (暗皇帝 暗帝)",
  "ae-GISELLE": "ae-GISELLE",
  "ae-KARINA": "ae-KARINA (隊長 水拳)",
  "ae-NINGNING": "ae-NINGNING",
  "ae-WINTER": "ae-WINTER (冬天)",
};

const HEROS_NAME_NOT_IN_MAPPER = {}

var flipped = [];

for (i in HEROS_NAME_MAPPER)
  flipped[transHero (i)] = i;

const HEROS_NAME_MAPPER_FLIPPED = flipped;