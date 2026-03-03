var array = [1, 2, 3, 4, 5];
console.log("array: ", array, typeof array);

var array_map = array.map(item => item);
console.log("array_map: ", array_map, typeof array_map);

var array2 = [1];
console.log("array2: ", array2, typeof array2);
for(i of array2) {
    console.log("i: ", i);
}


// var map = new Map();
// map.set("a", 1);
// map.set("b", 2);
// map.set("c", 3);
// map.set("d", 4);
// map.set("e", 5);
// console.log("map: ", map, typeof map);
// console.log("map[a]", map.get("a"));

// var object = {3: "a", 4: "b", 5: "c", 6: "d", 7: "e"};
// console.log("object: ", object[1], object[2], object[3], object[4], object[5], typeof object);

// for(let k of Object.keys(object)) {
//     console.log(object[k]);
// }

// for(let k in object) {

//     console.log(object[k]);
// }

// // let str_json = "[{\"1\": \"a\"}, {\"2\": \"b\"}, {\"3\": \"c\"}, {\"4\": \"d\"}, {\"5\": \"e\"}]";
// // let json = JSON.parse(str_json);
// // console.log("json: ", json, typeof json);
// // console.log("json[0]", json[0], json[0][1], typeof json[0]);
// // console.log("json[1]", json[1], json[1][2], typeof json[1]);
// // console.log("json[2]", json[2], json[2][3], typeof json[2]);
// // console.log("json[3]", json[3], json[3][4], typeof json[3]);
// // console.log("json[4]", json[4], json[4][5], typeof json[4]);