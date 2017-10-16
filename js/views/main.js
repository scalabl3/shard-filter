var elapsed = 0;
var users = 1;
var users_max = 1;
var users_target = 180000;
var growth_time = 91;
var variation = 0.1; // percent
var end_time = 300;
var recede_time = 210;

var shards = 20;
var publishes = 0;
var filtered = 0;
var total_publish = 0;
var total_filtered = 0;
var shards_min = 20;
var shards_max = 1;
var publishes_max = 0;
var filtered_max = 0;
var shard_ratio = 12;

var interval = null;

function reset(){
    elapsed = 0;
    users = 1;
    users_max = 1;
    growth_time = 91;
    variation = 0.1; // percent

    variation = 0.1; // percent
    end_time = 300;
    recede_time = 210;

    shards = 20;
    publishes = 0;
    filtered = 0;
    total_publish = 0;
    total_filtered = 0;
    shards_min = 20;
    shards_max = 1;
    publishes_max = 0;
    filtered_max = 0;
}

function updateTimeElapsed() {
    var date = new Date(null);
    date.setSeconds(elapsed); // specify value for SECONDS here
    var result = date.toISOString().substr(11, 8);
    $("#time-elapsed").text(result);
}

function getRandomInclusive(min, max) {
    //min = Math.ceil(min);
    //max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}

function rampUsers(){
    if (elapsed < growth_time) {
        //console.log(users, elapsed);
        users = Math.floor(Math.sin(elapsed * Math.PI / 180) * users_target);
    }
    else if (elapsed > recede_time) {
        var random = getRandomInclusive(1,variation);
        var amt = Math.floor(users * random / 100);
        //console.log(users, elapsed, random, amt);
        users -= amt;
    }
    else if (elapsed > growth_time) {
        var random = getRandomInclusive(1,variation);
        var diff = (getRandomInclusive(0,1) == 1 ? 1 : -1);
        var amt = Math.floor(users * random / 100 * diff);
        //console.log(users, elapsed, random, amt);
        users += amt;
    }

    if (users > users_max) {
        users_max = users;
    }

    publishes = Math.ceil(users / 8);
    filtered = 0;
    for (var k = 0; k < publishes; k++) {
        if (shardMessage(shards)) {
            filtered += 1;
        }
    }
    shards = Math.floor(publishes / shard_ratio);
    //console.log(shards, publishes, filtered, shard_ratio);

    total_publish += publishes;
    total_filtered += filtered;

    publishes_max = (publishes > publishes_max ? publishes : publishes_max);
    shards_max = (shards > shards_max ? shards : shards_max);
    filtered_max = (filtered > filtered_max ? filtered : filtered_max);
}

function updateMainStats() {
    $("#ishardratio").text(shard_ratio);
    $("#users-current").text(users);
    $("#users-max").text(users_max);
    $("#shards-min").text(shards_min);
    $("#shards-max").text(shards_max);
    $("#pub-max").text(publishes_max);
    $("#iuser").text(users);
    $("#ishard").text(shards);
    $("#ipublish").text(publishes);
    $("#ifilter").text(filtered);
    $("#itotalpublish").text(total_publish);
    $("#itotalfilter").text(total_filtered);
    $("#iavgfilter").text(Math.round(total_filtered/elapsed));
    $("#ifilter-max").text(filtered_max);

    updateTimeElapsed();
}

function go() {
    reset();
    if (interval) {
        clearInterval(interval);
    }
    interval = setInterval(function(){
        if (elapsed > 60 * 8) {
            clearInterval(interval);
        }
        elapsed += 1;
        rampUsers();
        updateMainStats();
    }, 250);
}

$(function(){
    'use strict';

    $('#spinner').spinner({
        min: 1,
        max: 22,
        step: 1,
        stop: function(event, ui) {
            // console.log(event);
            // console.log(ui);
            shard_ratio = parseInt(event.target.value);
        }
    }).val(shard_ratio);

    $("#run").click(function(){
        go();
    });

});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    elapsed += 1;
    rampUsers();
    updateMainStats();
    await sleep(1000);
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

// New function to calculate shards
function crc32(str) {

    function Utf8Encode(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048)) {

                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }

        return utftext;
    }

    str = Utf8Encode(str);

    var table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D";

    if (typeof(crc) == "undefined") {
        crc = 0;
    }
    var x = 0;
    var y = 0;

    crc = crc ^ (-1);

    for (var i = 0, iTop = str.length; i < iTop; i++) {
        y = ( crc ^ str.charCodeAt(i) ) & 0xFF;
        x = "0x" + table.substr(y * 9, 8);
        crc = ( crc >>> 8 ) ^ x;
    }
    return crc ^ (-1);
}

function shardMessage(shards) {
    return crc32(guid()) % shards + 1 == shards
}

