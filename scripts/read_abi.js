var fs = require("fs");

let target = process.argv[2];

let data = fs.readFileSync(target);

let abi = JSON.parse(data.toString()).abi;

let errors = [];
let events = [];
let views = [];
let wfuns = [];

for (let item of abi) {
  if(item.type == "error") {
    errors.push(item)
    continue;
  }
  if (item.type == "event") {
    events.push(item);
    continue;
  }
  if (item.type == "function") {
    if (item.stateMutability == "view") {
      views.push(item);
      continue;
    }

    wfuns.push(item);
    continue;
  }
  console.log(item.type, item.stateMutability);
}

for (let item of errors) {
  console.log(item.type, item.name);
}
for (let item of events) {
  console.log(item.type, item.name);
}
for (let item of views) {
  console.log(item.type, item.stateMutability, item.name);
}
for (let item of wfuns) {
  console.log(item.type, item.stateMutability, item.name);
}
