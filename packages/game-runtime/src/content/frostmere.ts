import type { AdventureDefinition } from "../../../shared/src";

export const frostmereAdventure: AdventureDefinition = {
  meta: {
    id: "adv_frostmere_house",
    title: "The Last Bell at Frostmere House",
    initialRoomId: "room_great_hall",
    initialTurnsRemaining: 8
  },
  rooms: {
    room_great_hall: {
      id: "room_great_hall",
      name: "Great Hall",
      description:
        "A cold central hall with a covered body near the stair. The tower door stands above the landing.",
      exitIds: [
        "exit_great_hall_to_bell_tower",
        "exit_great_hall_to_study",
        "exit_great_hall_to_servants_hall",
        "exit_great_hall_to_winter_garden"
      ],
      interactiveIds: [
        "int_great_hall_body",
        "int_great_hall_stair",
        "int_great_hall_tower_door"
      ],
      tags: ["hub", "crime_scene"]
    },
    room_study: {
      id: "room_study",
      name: "Study",
      description:
        "Alden's private office. Ledgers sit beside a cold fireplace and an open wall safe.",
      exitIds: ["exit_study_to_great_hall"],
      interactiveIds: [
        "int_study_desk",
        "int_study_ledgers",
        "int_study_fireplace",
        "int_study_safe"
      ],
      tags: ["motive"]
    },
    room_servants_hall: {
      id: "room_servants_hall",
      name: "Servants' Hall",
      description:
        "A narrow warm room with drying coats, kitchen ledgers, and a servant bell board.",
      exitIds: [
        "exit_servants_hall_to_great_hall",
        "exit_servants_hall_to_bell_tower"
      ],
      interactiveIds: [
        "int_servants_hall_coat_hooks",
        "int_servants_hall_bell_board",
        "int_servants_hall_kitchen_ledger"
      ],
      tags: ["npc_home"]
    },
    room_bell_tower: {
      id: "room_bell_tower",
      name: "Bell Tower",
      description:
        "A cramped tower chamber with a frayed bell rope, latched window, and metal fragments near the platform.",
      exitIds: [
        "exit_bell_tower_to_great_hall",
        "exit_bell_tower_to_servants_hall"
      ],
      interactiveIds: [
        "int_bell_tower_rope",
        "int_bell_tower_clapper_mount",
        "int_bell_tower_window_latch",
        "int_bell_tower_platform_edge"
      ],
      tags: ["crime_scene"]
    },
    room_winter_garden: {
      id: "room_winter_garden",
      name: "Winter Garden",
      description:
        "A glass-roofed conservatory choked with frost and snow tracked in from outside.",
      exitIds: [
        "exit_winter_garden_to_great_hall",
        "exit_winter_garden_to_coach_yard"
      ],
      interactiveIds: [
        "int_winter_garden_snow_trail",
        "int_winter_garden_broken_planter",
        "int_winter_garden_glass_door"
      ],
      tags: ["route"]
    },
    room_coach_yard: {
      id: "room_coach_yard",
      name: "Coach Yard",
      description:
        "Coaches sit under drifts. A lantern burns in the stable arch though no one admits lighting it.",
      exitIds: [
        "exit_coach_yard_to_winter_garden",
        "exit_coach_yard_to_gatehouse"
      ],
      interactiveIds: [
        "int_coach_yard_stable_arch",
        "int_coach_yard_snowbank",
        "int_coach_yard_coach_box"
      ],
      tags: ["evidence"]
    },
    room_gatehouse: {
      id: "room_gatehouse",
      name: "Gatehouse",
      description:
        "The outer gate creaks in the wind. By dawn, the road crew will clear the pass.",
      exitIds: ["exit_gatehouse_to_coach_yard"],
      interactiveIds: [
        "int_gatehouse_gate",
        "int_gatehouse_road_bell",
        "int_gatehouse_evidence_satchel"
      ],
      tags: ["final_threshold"]
    }
  },
  exits: {
    exit_great_hall_to_bell_tower: {
      id: "exit_great_hall_to_bell_tower",
      fromRoomId: "room_great_hall",
      toRoomId: "room_bell_tower",
      direction: "north",
      aliases: ["north", "bell tower", "tower"],
      visible: true,
      locked: true,
      failureText: "The tower door is locked for now."
    },
    exit_great_hall_to_study: {
      id: "exit_great_hall_to_study",
      fromRoomId: "room_great_hall",
      toRoomId: "room_study",
      direction: "east",
      aliases: ["east", "study"],
      visible: true
    },
    exit_great_hall_to_servants_hall: {
      id: "exit_great_hall_to_servants_hall",
      fromRoomId: "room_great_hall",
      toRoomId: "room_servants_hall",
      direction: "west",
      aliases: ["west", "servants hall", "servants' hall"],
      visible: true
    },
    exit_great_hall_to_winter_garden: {
      id: "exit_great_hall_to_winter_garden",
      fromRoomId: "room_great_hall",
      toRoomId: "room_winter_garden",
      direction: "south",
      aliases: ["south", "winter garden", "garden"],
      visible: true
    },
    exit_study_to_great_hall: {
      id: "exit_study_to_great_hall",
      fromRoomId: "room_study",
      toRoomId: "room_great_hall",
      direction: "west",
      aliases: ["west", "great hall", "hall"],
      visible: true
    },
    exit_servants_hall_to_great_hall: {
      id: "exit_servants_hall_to_great_hall",
      fromRoomId: "room_servants_hall",
      toRoomId: "room_great_hall",
      direction: "east",
      aliases: ["east", "great hall", "hall"],
      visible: true
    },
    exit_servants_hall_to_bell_tower: {
      id: "exit_servants_hall_to_bell_tower",
      fromRoomId: "room_servants_hall",
      toRoomId: "room_bell_tower",
      direction: "north-east",
      aliases: ["north-east", "northeast", "bell tower", "tower"],
      visible: true,
      locked: true,
      failureText: "The service stair is locked for now."
    },
    exit_bell_tower_to_great_hall: {
      id: "exit_bell_tower_to_great_hall",
      fromRoomId: "room_bell_tower",
      toRoomId: "room_great_hall",
      direction: "south",
      aliases: ["south", "great hall", "hall"],
      visible: true
    },
    exit_bell_tower_to_servants_hall: {
      id: "exit_bell_tower_to_servants_hall",
      fromRoomId: "room_bell_tower",
      toRoomId: "room_servants_hall",
      direction: "south-west",
      aliases: ["south-west", "southwest", "servants hall", "servants' hall"],
      visible: true
    },
    exit_winter_garden_to_great_hall: {
      id: "exit_winter_garden_to_great_hall",
      fromRoomId: "room_winter_garden",
      toRoomId: "room_great_hall",
      direction: "north",
      aliases: ["north", "great hall", "hall"],
      visible: true
    },
    exit_winter_garden_to_coach_yard: {
      id: "exit_winter_garden_to_coach_yard",
      fromRoomId: "room_winter_garden",
      toRoomId: "room_coach_yard",
      direction: "south",
      aliases: ["south", "coach yard", "yard"],
      visible: true
    },
    exit_coach_yard_to_winter_garden: {
      id: "exit_coach_yard_to_winter_garden",
      fromRoomId: "room_coach_yard",
      toRoomId: "room_winter_garden",
      direction: "north",
      aliases: ["north", "winter garden", "garden"],
      visible: true
    },
    exit_coach_yard_to_gatehouse: {
      id: "exit_coach_yard_to_gatehouse",
      fromRoomId: "room_coach_yard",
      toRoomId: "room_gatehouse",
      direction: "south",
      aliases: ["south", "gatehouse", "gate"],
      visible: true
    },
    exit_gatehouse_to_coach_yard: {
      id: "exit_gatehouse_to_coach_yard",
      fromRoomId: "room_gatehouse",
      toRoomId: "room_coach_yard",
      direction: "north",
      aliases: ["north", "coach yard", "yard"],
      visible: true
    }
  },
  interactives: {
    int_great_hall_body: {
      id: "int_great_hall_body",
      roomId: "room_great_hall",
      name: "covered body",
      aliases: ["body", "covered body"],
      visibleFromStart: true
    },
    int_great_hall_stair: {
      id: "int_great_hall_stair",
      roomId: "room_great_hall",
      name: "stair",
      aliases: ["stair", "stairs"],
      visibleFromStart: true
    },
    int_great_hall_tower_door: {
      id: "int_great_hall_tower_door",
      roomId: "room_great_hall",
      name: "tower door",
      aliases: ["tower door", "door"],
      visibleFromStart: true
    },
    int_study_desk: {
      id: "int_study_desk",
      roomId: "room_study",
      name: "desk",
      aliases: ["desk"],
      visibleFromStart: true
    },
    int_study_ledgers: {
      id: "int_study_ledgers",
      roomId: "room_study",
      name: "ledgers",
      aliases: ["ledgers", "ledger"],
      visibleFromStart: true
    },
    int_study_fireplace: {
      id: "int_study_fireplace",
      roomId: "room_study",
      name: "fireplace",
      aliases: ["fireplace"],
      visibleFromStart: true
    },
    int_study_safe: {
      id: "int_study_safe",
      roomId: "room_study",
      name: "open wall safe",
      aliases: ["safe", "wall safe"],
      visibleFromStart: true
    },
    int_servants_hall_coat_hooks: {
      id: "int_servants_hall_coat_hooks",
      roomId: "room_servants_hall",
      name: "coat hooks",
      aliases: ["coat hooks", "coats"],
      visibleFromStart: true
    },
    int_servants_hall_bell_board: {
      id: "int_servants_hall_bell_board",
      roomId: "room_servants_hall",
      name: "servant bell board",
      aliases: ["bell board", "servant bell board"],
      visibleFromStart: true
    },
    int_servants_hall_kitchen_ledger: {
      id: "int_servants_hall_kitchen_ledger",
      roomId: "room_servants_hall",
      name: "kitchen ledger",
      aliases: ["kitchen ledger"],
      visibleFromStart: true
    },
    int_bell_tower_rope: {
      id: "int_bell_tower_rope",
      roomId: "room_bell_tower",
      name: "bell rope",
      aliases: ["bell rope", "rope"],
      visibleFromStart: true
    },
    int_bell_tower_clapper_mount: {
      id: "int_bell_tower_clapper_mount",
      roomId: "room_bell_tower",
      name: "clapper mount",
      aliases: ["clapper mount", "mount"],
      visibleFromStart: true
    },
    int_bell_tower_window_latch: {
      id: "int_bell_tower_window_latch",
      roomId: "room_bell_tower",
      name: "window latch",
      aliases: ["window latch", "latch"],
      visibleFromStart: true
    },
    int_bell_tower_platform_edge: {
      id: "int_bell_tower_platform_edge",
      roomId: "room_bell_tower",
      name: "platform edge",
      aliases: ["platform edge", "edge"],
      visibleFromStart: true
    },
    int_winter_garden_snow_trail: {
      id: "int_winter_garden_snow_trail",
      roomId: "room_winter_garden",
      name: "snow trail",
      aliases: ["snow trail", "trail"],
      visibleFromStart: true
    },
    int_winter_garden_broken_planter: {
      id: "int_winter_garden_broken_planter",
      roomId: "room_winter_garden",
      name: "broken planter",
      aliases: ["broken planter", "planter"],
      visibleFromStart: true
    },
    int_winter_garden_glass_door: {
      id: "int_winter_garden_glass_door",
      roomId: "room_winter_garden",
      name: "glass door",
      aliases: ["glass door", "door"],
      visibleFromStart: true
    },
    int_coach_yard_stable_arch: {
      id: "int_coach_yard_stable_arch",
      roomId: "room_coach_yard",
      name: "stable arch",
      aliases: ["stable arch", "arch"],
      visibleFromStart: true
    },
    int_coach_yard_snowbank: {
      id: "int_coach_yard_snowbank",
      roomId: "room_coach_yard",
      name: "snowbank",
      aliases: ["snowbank", "snow bank"],
      visibleFromStart: true
    },
    int_coach_yard_coach_box: {
      id: "int_coach_yard_coach_box",
      roomId: "room_coach_yard",
      name: "coach box",
      aliases: ["coach box"],
      visibleFromStart: true
    },
    int_gatehouse_gate: {
      id: "int_gatehouse_gate",
      roomId: "room_gatehouse",
      name: "outer gate",
      aliases: ["gate", "outer gate"],
      visibleFromStart: true
    },
    int_gatehouse_road_bell: {
      id: "int_gatehouse_road_bell",
      roomId: "room_gatehouse",
      name: "road bell",
      aliases: ["road bell"],
      visibleFromStart: true
    },
    int_gatehouse_evidence_satchel: {
      id: "int_gatehouse_evidence_satchel",
      roomId: "room_gatehouse",
      name: "evidence satchel",
      aliases: ["evidence satchel", "satchel"],
      visibleFromStart: true
    }
  },
  npcs: {
    npc_mina_arlen: {
      id: "npc_mina_arlen",
      name: "Mina Arlen",
      role: "Housekeeper",
      initialRoomId: "room_servants_hall",
      initialTrust: 0
    },
    npc_theo_rusk: {
      id: "npc_theo_rusk",
      name: "Theo Rusk",
      role: "Apprentice Clockmaker",
      initialRoomId: "room_study",
      initialTrust: 0
    },
    npc_captain_vale: {
      id: "npc_captain_vale",
      name: "Captain Rowan Vale",
      role: "Stranded Constable",
      initialRoomId: "room_great_hall",
      initialTrust: 0
    }
  },
  items: {
    item_brass_service_key: {
      id: "item_brass_service_key",
      name: "Brass Service Key",
      description: "A narrow key for the tower service stair.",
      aliases: ["brass service key", "service key", "key"],
      carryable: true
    },
    item_torn_ledger_page: {
      id: "item_torn_ledger_page",
      name: "Torn Ledger Page",
      description: "A torn page that points toward Alden's stolen design sale.",
      aliases: ["torn ledger page", "ledger page", "page"],
      carryable: true
    },
    item_soot_stained_gloves: {
      id: "item_soot_stained_gloves",
      name: "Soot-Stained Gloves",
      description: "Gloves marked with dark workshop soot.",
      aliases: ["soot-stained gloves", "gloves"],
      carryable: true
    },
    item_vial_laudanum: {
      id: "item_vial_laudanum",
      name: "Vial of Laudanum",
      description: "A small vial with a bitter medicinal smell.",
      aliases: ["vial of laudanum", "laudanum", "vial"],
      carryable: true
    },
    item_cracked_bell_clapper: {
      id: "item_cracked_bell_clapper",
      name: "Cracked Bell Clapper",
      description: "A damaged piece of the bell mechanism.",
      aliases: ["cracked bell clapper", "bell clapper", "clapper"],
      carryable: true
    }
  }
};
