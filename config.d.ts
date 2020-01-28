namespace Config {
    export interface GameServerMapSettings {
        location_file_skywars_config?: string;
        location_file_skywars_chests?: string;
        location_file_skywars_loot?: string;
        location_file_skywars_kits?: string;
        location_folder_template: string;
        location_spigot_jar: string;
        max_players?: number;
        server_runtime_memory_megabytes?: number;
        server_startup_memory_megabytes?: number;
    }
}
interface Config {
    available_game_server_ports: number[];
    server_setups: Config.GameServerMapSettings[];
}
const Config: Config;
export = Config;
