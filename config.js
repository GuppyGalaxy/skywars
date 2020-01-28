const { watchFile, readFileSync } = require("fs");

const CONFIG_FILE = "./config.json";
function resyncConfig() {
    "use strict";
    console.log("Syncing the config at ", new Date());
    const content = readFileSync(CONFIG_FILE, {
        encoding: "utf8",
    });
    let data;
    try {
        data = JSON.parse(content);
    } catch (e) {
        console.error("Config is not valid JSON, ", new Date());
        return;
    }
    Object.assign(exports, data);
    console.log("Config synced at ", new Date());
}
watchFile(CONFIG_FILE, {
    interval: 1000,
    persistent: false,
}, (current, previous) => {
    "use strict";
    if (current.birthtimeMs !== previous.birthtimeMs) {
        console.log("Config birth date changed from ", previous.birthtime, " to ", current.birthtime);
    }
    if (current.atimeMs !== previous.atimeMs) {
        console.log("Config access date changed from ", previous.atime, " to ", current.atime);
    }
    if (current.ctimeMs !== previous.ctimeMs) {
        console.log("Config change date changed from ", previous.ctime, " to ", current.ctime);
    }
    if (current.size !== previous.size) {
        console.log("Config size changed from ", previous.size, " to ", current.size);
    }
    if (current.mtimeMs !== previous.mtimeMs) {
        console.log("Config modify date changed from ", previous.mtime, " to ", current.mtime);
        resyncConfig();
    }
});
resyncConfig();
