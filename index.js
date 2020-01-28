const CONFIG = require("./config.js");
const { join } = require("path");
const { spawn } = require("child_process");
const { copyFile, mkdir, rmdir, unlink, readdir, realpath } = require("fs").promises;
/**
 * @param {number} server_port The port to use, will be placed in the server.properties
 * @param {CONFIG.GameServerMapSettings} server_config Settings for cloning the server
 */
async function setupServerEnvironment(server_port, server_config) {
    "use strict";
    server_ports_in_use.add(server_port);
    if (typeof server_port !== "number") {
        throw new Error("Server port not valid");
    }
    try {
        await mkdir(`./server_runtimes/server_${server_port}`, {
            recursive: true,
        });
    } catch (e) {
        if (e.code !== "EEXIST") {
            throw e;
        }
    }
    await cpDir(server_config.location_folder_template, `./server_runtimes/server_${server_port}`);
    if (server_config.location_file_skywars_loot) {
        await copyFile(server_config.location_file_skywars_loot, `./server_runtimes/server_${server_port}/plugins/GuppySkywars/loot.yml`);
    }
    if (server_config.location_file_skywars_kits) {
        await copyFile(server_config.location_file_skywars_kits, `./server_runtimes/server_${server_port}/plugins/GuppySkywars/kits.yml`);
    }
    if (server_config.location_file_skywars_config) {
        await copyFile(server_config.location_file_skywars_config, `./server_runtimes/server_${server_port}/plugins/GuppySkywars/config.yml`);
    }
    if (server_config.location_file_skywars_chests) {
        await copyFile(server_config.location_file_skywars_chests, `./server_runtimes/server_${server_port}/plugins/GuppySkywars/chests.yml`);
    }
    const jar = await realpath(server_config.location_spigot_jar);
    if (typeof server_config.max_players !== "number" && server_config.max_players !== undefined && server_config.max_players !== null) {
        throw new Error("Max players not the correct type");
    }
    const args = [];
    if (typeof server_config.server_runtime_memory_megabytes === "number" && isFinite(server_config.server_runtime_memory_megabytes)) {
        args.push(`-Xmx${server_config.server_runtime_memory_megabytes}M`);
    } else {
        args.push("-Xmx512M");
    }
    if (typeof server_config.server_startup_memory_megabytes === "number" && isFinite(server_config.server_startup_memory_megabytes)) {
        args.push(`-Xms${server_config.server_startup_memory_megabytes}M`);
    } else {
        args.push("-Xms512M");
    }
    args.push("-Dcom.mojang.eula.agree=true", "-jar", jar, "--host", "127.0.0.1", "--port", server_port.toString());
    if (server_config.max_players) {
        args.push("--max-players", server_config.max_players.toString());
    }
    const cmd = `java`;
    const child = spawn(cmd, args, {
        cwd: `./server_runtimes/server_${server_port}`,
        detached: false,
        stdio: "pipe",
    });
    // child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    return child;
}
/** @type {Set<number>} */
const server_ports_in_use = new Set();
async function cpDir(origin, destination) {
    "use strict";
    try {
        await mkdir(destination);
    } catch (e) {
        if (e.code !== "EEXIST") {
            throw e;
        }
    }
    const dirents = await readdir(origin, {
        encoding: "utf8",
        withFileTypes: true,
    });
    while (dirents.length) {
        let entry = dirents.pop();
        const entryOriginPath = join(origin, entry.name);
        const entryDestinationPath = join(destination, entry.name);
        if (entry.isDirectory()) {
            entry = null; // allow the garbage collector to do it's job
            await cpDir(entryOriginPath, entryDestinationPath);
        } else if (entry.isFile()) {
            entry = null; // allow the garbage collector to do it's job
            await copyFile(entryOriginPath, entryDestinationPath);
        } else {
            throw new Error(entryOriginPath + " is not a directory, nor is it a file");
        }
    }
}
async function deleteDir(destination) {
    "use strict";
    const dirents = await readdir(destination, {
        encoding: "utf8",
        withFileTypes: true,
    });
    while (dirents.length) {
        let entry = dirents.pop();
        const entryDestinationPath = join(destination, entry.name);
        if (entry.isDirectory()) {
            entry = null; // allow the garbage collector to do it's job
            await deleteDir(entryDestinationPath);
        } else if (entry.isFile()) {
            entry = null; // allow the garbage collector to do it's job
            await unlink(entryDestinationPath);
        } else {
            throw new Error(destination + " is not a directory, nor is it a file");
        }
    }
    await rmdir(destination, {
        emfileWait: 1000,
        maxBusyTries: 5,
        recursive: true,
    });
}
function runStartupActions() {
    "use strict";
    if (!CONFIG.available_game_server_ports.length) {
        console.error("No possible game server ports");
        return;
    }
    if (!CONFIG.server_setups.length) {
        console.error("No possible game server setups");
        return;
    }
    for (const port of CONFIG.available_game_server_ports) {
        if (server_ports_in_use.has(port)) continue;
        const server_setup = CONFIG.server_setups[Math.floor(Math.random() * CONFIG.server_setups.length)];

        setupServerEnvironment(port, server_setup).then((child) => {
            "use strict";
            child.on("exit", (code, signal) => {
                "use strict";
                if (typeof code === "number") {
                    if (code) {
                        console.warn(`Game server with port ${port} ended with code ${code}`);
                    }
                } else if (signal) {
                    console.warn(`Game server with port ${port} ended with signal ${signal}`);
                }
                deleteDir(`./server_runtimes/server_${port}`).then(() => {
                    "use strict";
                    console.log(`Game server with port ${port} has been deleted`);
                    server_ports_in_use.delete(port);
                }, error => {
                    "use strict";
                    console.error(`Game server with port ${port} failed to delete. Will not free up the port. `, error);
                });
            });
            let last_console_output = "";
            child.stdout.on("data", (chunk) => {
                "use strict";
                if (typeof chunk === "string") {
                    last_console_output += chunk;
                } else if (Buffer.isBuffer(chunk)) {
                    last_console_output += chunk.toString();
                } else {
                    console.error("Unrecognised form of chunk: ", chunk);
                }
                processLineOfOutput();
            });
            let has_stopped = false;
            function processLineOfOutput() {
                "use strict";
                const data = last_console_output.split("\n");
                last_console_output = data.pop() || "";
                for (const i of data) {
                    const info = i.slice(17);
                    try {
                        const res = JSON.parse(info);
                        if (res.gameUpdate === "gameCountdown") {
                            console.log(`Game on port ${port} is now in countdown`);
                        } else if (res.gameUpdate === "gameStart") {
                            console.log(`Game on port ${port} has started`);
                        } else if (res.gameUpdate === "gameEnd") {
                            if (!has_stopped) {
                                has_stopped = true;
                                console.log(`Game on port ${port} has ended`);
                                child.stdin.write("stop\n");
                            }
                        }
                    } catch {}
                }
            }
        }, (error) => {
            "use strict";
            server_ports_in_use.delete(port);
            console.error(error, port, server_setup);
        });
    }
}
setInterval(runStartupActions, 60000);
runStartupActions();
