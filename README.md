# Server Allocator of Dynamic SkyWars

A script that will manage the runtime of the SkyWars game servers on Guppy Galaxy

## Configuration

You will need to create a config.json file following this general format
```JavaScript
{ 
    "available_game_server_ports": [1234, 1235, 12744, 25566], // Required, include at least one port
    "server_setups": [ // Required, include at least one setup
        {
            "location_file_skywars_chests": "./storage/skywars_chests/one.yml", // Optional, if not set, include in the template
            "location_file_skywars_config": "./storage/skywars_configs/one.yml", // Optional, if not set, include in the template
            "location_file_skywars_kits": "./storage/skywars_kits/one.yml", // Optional, if not set, include in the template
            "location_file_skywars_loot": "./storage/skywars_loot/one.yml", // Optional, if not set, include in the template
            "location_folder_template": "./storage/templates/one", // Required, location of template to copy from.
            "location_spigot_jar": "./storage/jars/spigot-1.8.8.jar", // Required, location of jar file for server.
            "max_players": 5, // optional, if not set will use from the server.properties in the template
            "server_runtime_memory_megabytes": 512, // Optional, if not set will be 512mb
            "server_startup_memory_megabytes": 512 // Optional, if not set will be 512mb
        }
    ]
}
```

The script will aim to have all ports in use.
It will choose a random setup from the list of options every time it starts a server.
It is possible for the same setup to be used on multiple servers at once.

Changes to template data or config will only take effect on future server creation,
servers that are already online will need to end their current game in order to shut down the server and load up a fresh setup.
