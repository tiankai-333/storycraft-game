import type { WorldTranslations } from "../world-registry";

export const frostmereTranslations: WorldTranslations = {
  rooms: {
    room_great_hall: { zh: "大厅", en: "Great Hall" },
    room_study: { zh: "书房", en: "Study" },
    room_servants_hall: { zh: "仆人厅", en: "Servants' Hall" },
    room_bell_tower: { zh: "钟楼", en: "Bell Tower" },
    room_winter_garden: { zh: "冬季花园", en: "Winter Garden" },
    room_coach_yard: { zh: "马车场", en: "Coach Yard" },
    room_gatehouse: { zh: "门房", en: "Gatehouse" },
  },

  roomDescriptions: {
    room_great_hall: {
      zh: "冰冷的中央大厅，楼梯旁有一具被覆盖的尸体。塔楼门矗立在楼梯平台之上。",
    },
    room_study: {
      zh: "奥登的私人办公室。冰冷的壁炉旁堆着账本，墙上保险柜敞开着。",
    },
    room_servants_hall: {
      zh: "狭窄温暖的房间，挂着晾干的衣物、厨房账本和仆人铃牌。",
    },
    room_bell_tower: {
      zh: "狭窄的塔楼房间，磨损的钟绳、上闩的窗户，平台附近闪烁着金属碎片。",
    },
    room_winter_garden: {
      zh: "玻璃屋顶的温室被冰霜覆盖，外面的积雪被踩进了室内。",
    },
    room_coach_yard: {
      zh: "马车埋在雪堆下。马厩拱门处亮着一盏灯笼，但没人承认点燃过它。",
    },
    room_gatehouse: {
      zh: "外门在风中吱呀作响。黎明时分，修路队将打通山口。",
    },
  },

  npcs: {
    npc_mina_arlen: { zh: "米娜·阿伦", en: "Mina Arlen" },
    npc_theo_rusk: { zh: "西奥·拉斯克", en: "Theo Rusk" },
    npc_captain_vale: { zh: "罗恩·韦尔队长", en: "Captain Vale" },
  },

  npcRoles: {
    npc_mina_arlen: { zh: "管家", en: "Housekeeper" },
    npc_theo_rusk: { zh: "钟表学徒", en: "Apprentice Clockmaker" },
    npc_captain_vale: { zh: "被困警官", en: "Stranded Constable" },
  },

  items: {
    item_brass_service_key: { zh: "黄铜服务钥匙", en: "Brass Service Key" },
    item_torn_ledger_page: { zh: "撕碎的账本页", en: "Torn Ledger Page" },
    item_soot_stained_gloves: {
      zh: "沾满煤灰的手套",
      en: "Soot-Stained Gloves",
    },
    item_vial_laudanum: { zh: "鸦片酊药瓶", en: "Vial of Laudanum" },
    item_cracked_bell_clapper: {
      zh: "破裂的钟锤",
      en: "Cracked Bell Clapper",
    },
  },

  clues: {
    clue_watch_stopped_1147: {
      zh: "停在11:47的手表",
      en: "Watch Stopped at 11:47",
    },
    clue_servant_bell_after_death: {
      zh: "死后响起的仆人铃",
      en: "Servant Bell After Death",
    },
    clue_stolen_design_motive: {
      zh: "被盗设计的动机",
      en: "Stolen Design Motive",
    },
    clue_soot_marked_garden_route: {
      zh: "花园的煤灰足迹",
      en: "Soot-Marked Garden Route",
    },
    clue_drugged_before_fall: {
      zh: "坠楼前被下药",
      en: "Drugged Before Fall",
    },
    clue_tower_staged: { zh: "钟楼被伪装过", en: "Tower Staged" },
  },

  endings: {
    ending_bell_rings_true: { zh: "钟声清越", en: "The Bell Rings True" },
    ending_snow_covers_tracks: {
      zh: "大雪掩盖踪迹",
      en: "Snow Covers the Tracks",
    },
    ending_apprentice_confession: {
      zh: "学徒的忏悔",
      en: "The Apprentice's Confession",
    },
    ending_rushed_accusation: {
      zh: "仓促的裁决",
      en: "A Hasty Verdict",
    },
    ending_false_accusation: {
      zh: "指控错了人",
      en: "The Wrong Hand",
    },
    ending_vale_accused: { zh: "队长的怒火", en: "The Constable's Fury" },
    ending_private_dead_end: {
      zh: "寒风中的低语",
      en: "Whispers in the Cold",
    },
    ending_dawn_breaks_unanswered: {
      zh: "黎明无答",
      en: "Dawn Breaks, Unanswered",
    },
  },

  endingSummaries: {
    ending_bell_rings_true: {
      zh: "西奥被捕。米娜确认了仆人铃的细节。韦尔提交了完整报告。道路打通时，真相得以保存。",
      en: "Theo is arrested. Mina confirms the servant bell detail. Vale files a complete report. When the road opens, truth survives.",
    },
    ending_snow_covers_tracks: {
      zh: "你的指控未能说服任何人。案件在沉默和大雪中坍塌。",
      en: "Your accusation fails to convince. The case collapses into silence and snow.",
    },
    ending_apprentice_confession: {
      zh: "西奥私下坦白并交出了被盗合同碎片。公开的正义并不完整，但你心中已明了真相。",
      en: "Theo confesses privately and hands over the torn contract. Public justice is incomplete, but you know the truth.",
    },
    ending_rushed_accusation: {
      zh: "你公开指认了西奥，但证据不足。韦尔勉强执行了逮捕。此案在法庭上可能站不住脚。",
      en: "You name Theo publicly, but the evidence is thin. Vale makes the arrest reluctantly.",
    },
    ending_false_accusation: {
      zh: "你指控了米娜·阿伦。韦尔虽存疑但仍做了样子。米娜的悲伤化为冰冷。真凶随修路队逍遥法外。",
      en: "You accuse Mina Arlen. Vale is skeptical but makes a show of authority. The real killer walks free.",
    },
    ending_vale_accused: {
      zh: "你把矛头指向了韦尔队长。他勃然大怒。米娜沉默地注视着一切。道路打通时，西奥悄然溜走。",
      en: "You turn on Captain Vale. He is incensed. When the road opens, Theo slips away unnoticed.",
    },
    ending_private_dead_end: {
      zh: "你私下指控了西奥，但没有给予怜悯或确保足够证据，话语在冷空气中消散。一切如故。西奥警惕地注视着你，直到黎明。",
      en: "You make a private accusation against Theo, but without mercy or enough evidence, the words dissolve. Nothing changes.",
    },
    ending_dawn_breaks_unanswered: {
      zh: "黎明穿透了冰霜。修路队打通了山口，嫌疑人在你揭开真相之前四散而去。此案悬而未决。",
      en: "Dawn breaks. The road crew clears the pass and suspects scatter before you can name the truth. The case goes unresolved.",
    },
  },

  consequences: {
    conseq_broke_mina_trust: { zh: "破坏了米娜的信任", en: "Broke Mina's Trust" },
    conseq_tipped_off_theo: {
      zh: "打草惊蛇——惊动了西奥",
      en: "Tipped Off Theo",
    },
    conseq_captain_rushed_case: {
      zh: "韦尔队长催促结案",
      en: "Captain Rushed the Case",
    },
    conseq_used_private_key: {
      zh: "使用了私人钥匙",
      en: "Used Private Key",
    },
    conseq_spent_dawn_turn: {
      zh: "耗尽了黎明前的最后时间",
      en: "Spent Dawn Turn",
    },
    conseq_made_public_accusation: {
      zh: "公开指控",
      en: "Made Public Accusation",
    },
    conseq_offered_theo_mercy: {
      zh: "向西奥施以怜悯",
      en: "Offered Theo Mercy",
    },
  },

  interactives: {
    int_great_hall_body: { zh: "尸体" },
    int_great_hall_stair: { zh: "楼梯" },
    int_great_hall_tower_door: { zh: "塔楼门" },
    int_study_desk: { zh: "书桌" },
    int_study_ledgers: { zh: "账本" },
    int_study_fireplace: { zh: "壁炉" },
    int_study_safe: { zh: "保险柜" },
    int_servants_hall_coat_hooks: { zh: "衣物钩" },
    int_servants_hall_bell_board: { zh: "仆人铃牌" },
    int_servants_hall_kitchen_ledger: { zh: "厨房账本" },
    int_bell_tower_rope: { zh: "钟绳" },
    int_bell_tower_clapper_mount: { zh: "钟锤支架" },
    int_bell_tower_window_latch: { zh: "窗户插销" },
    int_bell_tower_platform_edge: { zh: "平台边缘" },
    int_winter_garden_snow_trail: { zh: "雪地足迹" },
    int_winter_garden_broken_planter: { zh: "破碎花盆" },
    int_winter_garden_glass_door: { zh: "玻璃门" },
    int_coach_yard_stable_arch: { zh: "马厩拱门" },
    int_coach_yard_snowbank: { zh: "雪堆" },
    int_coach_yard_coach_box: { zh: "马车车厢" },
    int_gatehouse_gate: { zh: "外门" },
    int_gatehouse_road_bell: { zh: "路铃" },
    int_gatehouse_evidence_satchel: { zh: "证据袋" },
  },

  strengths: {
    none: { zh: "无" },
    weak: { zh: "薄弱" },
    standard: { zh: "确凿" },
    strong: { zh: "铁证" },
  },

  messages: {
    "You do not see anything like that to search here.":
      "这里没有你可以搜索的东西。",
    "Dawn has arrived; there is no time left for another meaningful search.":
      "黎明已至，没有时间再进行有意义的搜索了。",
    "Dawn has arrived; there is no time left for another conversation.":
      "黎明已至，没有时间再进行对话了。",
    "Dawn has arrived; it is too late for an accusation.":
      "黎明已至，已经来不及指控了。",
    "The investigation is over. There is nothing more to discuss.":
      "调查已经结束，没什么可讨论的了。",
    "The investigation is over. There is nothing left to use.":
      "调查已经结束，没有什么可用的了。",
    "The investigation is already over.":
      "调查已经结束了。",
    "You cannot go that way from here.":
      "从这里无法前往那个方向。",
    "You do not have that item.":
      "你没有那件物品。",
    "You do not have that item in your inventory.":
      "你的物品栏中没有那件物品。",
    "Use what on what? Specify a target.":
      "把什么用在什么上？请指定目标。",
    "You cannot use that here.":
      "你无法在这里使用它。",
    "The person you need is not here.":
      "你需要的人不在这里。",
    "You do not see anyone by that name here.":
      "你在这里看不到那个人。",
    "You cannot discuss that topic with them.":
      "你无法和他们讨论那个话题。",
    "You do not know anyone by that name.":
      "你不知道那个人是谁。",
    "You need to name a known item to take.":
      "你需要说出一个已知的物品名称才能拾取。",
    "The tower door is locked for now.":
      "塔楼门目前是锁着的。",
    "The service stair is locked for now.":
      "服务楼梯目前是锁着的。",
    "That way is locked.":
      "那边是锁着的。",
    "A broken watch in Alden's pocket is stopped at 11:47, earlier than the household's midnight story.":
      "奥登口袋里一块破碎的手表停在11:47，比家中众人所说的午夜更早。",
    "You have already checked the body. The stopped watch remains your clearest time marker.":
      "你已经检查过尸体了。停摆的手表仍是你最清晰的时间标记。",
    "A torn ledger page names Theo's automaton designs among assets Alden planned to sell.":
      "一张撕碎的账本页显示奥登计划出售西奥的自动机械设计。",
    "The desk has already yielded the torn ledger page and its motive.":
      "书桌上已经找到了撕碎的账本页和动机线索。",
    "The bell board shows the tower signal rang after Alden was already dead.":
      "铃牌显示塔楼信号是在奥登已经死后才响起的。",
    "The bell board still points to a signal after the likely time of death.":
      "铃牌仍然指向一个在可能死亡时间之后发出的信号。",
    "Behind the coats you find a brass service key hidden in a coat pocket. Mina will not be pleased that you searched here.":
      "在衣物后面你找到了一把藏在口袋里的黄铜服务钥匙。米娜不会高兴你搜查了这里。",
    "You have already searched the coat hooks.":
      "你已经搜查过衣物钩了。",
    "Narrow soot-marked footprints cross the frost and double back toward the Coach Yard.":
      "狭窄的煤灰足迹穿过冰霜，然后折返回马车场方向。",
    "The doubled-back soot-marked trail remains visible in the frost.":
      "折返的煤灰足迹在冰霜中依然可见。",
    "A vial of laudanum is tucked into the snowbank, making the fall look less like an accident.":
      "一个鸦片酊药瓶藏在雪堆中，让坠落看起来不像意外。",
    "The snowbank has already given up the laudanum evidence.":
      "雪堆中已经找到了鸦片酊证据。",
    "You find only a crushed cork in the snow. Someone has been here before you — the real evidence is gone.":
      "你在雪中只找到了一个被压碎的瓶塞。有人在你之前来过——真正的证据已经消失了。",
    "The cracked clapper mount shows the tower mechanism was tampered with and the fall was staged.":
      "破裂的钟锤支架显示塔楼机制被人动过手脚，坠落是被伪装的。",
    "The clapper mount has already shown you how the tower scene was staged.":
      "钟锤支架已经向你展示了塔楼现场是如何被伪装的。",
    "The brass key turns in the lock. The tower door clicks open.":
      "黄铜钥匙在锁中转动。塔楼门咔嗒一声打开了。",
    "The tower is already unlocked.":
      "塔楼已经解锁了。",
    "Theo goes pale when you show him the ledger page. 'He was selling my work — my life's work!' He backs away. 'I need to leave. I'll be at the gatehouse.'":
      "西奥看到你出示的账本页时脸色苍白。'他在卖我的作品——我毕生的心血！'他向后退去。'我得离开。我在门房等你。'",
    "Theo stares at the soot-stained gloves. 'Those are not — anyone could have...' He cannot finish the sentence. 'I need air. I'll be at the gatehouse.'":
      "西奥盯着沾满煤灰的手套。'这些不是——任何人都有可能……'他说不下去了。'我需要透透气。我在门房等你。'",
    "Using the item spends one investigation turn.":
      "使用物品消耗了一个调查回合。",
    "New area unlocked.":
      "新区域已解锁。",
    "The search spends one investigation turn.":
      "搜索消耗了一个调查回合。",
    "The conversation spends one investigation turn.":
      "对话消耗了一个调查回合。",
    "The accusation spends one investigation turn.":
      "指控消耗了一个调查回合。",
    "Dawn breaks through the frost. The road crew clears the pass, and the suspects scatter. Snow Covers the Tracks.":
      "黎明穿透了冰霜。修路队打通了山口，嫌疑人四散而去。大雪掩盖了踪迹。",
    "Dawn Breaks, Unanswered: Dawn breaks through the frost. The road crew clears the pass, and the suspects scatter before you can name the truth. The case goes unresolved.":
      "黎明无答：黎明穿透了冰霜。修路队打通了山口，嫌疑人在你揭开真相之前四散而去。此案悬而未决。",
    "Snow Covers the Tracks: Your accusation fails to convince. The case collapses into silence and snow.":
      "大雪掩盖踪迹：你的指控未能说服任何人。案件在沉默和大雪中坍塌。",
    "A Hasty Verdict: You name Theo publicly, but the evidence is thin. Vale makes the arrest reluctantly. The case may not hold at trial.":
      "仓促的裁决：你公开指认了西奥，但证据不足。韦尔勉强执行了逮捕。此案在法庭上可能站不住脚。",
    "The Wrong Hand: You accuse Mina Arlen. Vale is skeptical but makes a show of authority. Mina's grief turns cold. The real killer walks free with the road crew.":
      "指控错了人：你指控了米娜·阿伦。韦尔虽存疑但仍做了样子。米娜的悲伤化为冰冷。真凶随修路队逍遥法外。",
    "The Constable's Fury: You turn on Captain Vale. He is incensed by the accusation. Mina watches in silence. When the road opens, Theo slips away unnoticed.":
      "队长的怒火：你把矛头指向了韦尔队长。他勃然大怒。米娜沉默地注视着一切。道路打通时，西奥悄然溜走。",
    "Whispers in the Cold: You make a private accusation against Theo, but without offering mercy or securing enough evidence, the words dissolve into the cold air. Nothing changes. Theo watches you carefully until dawn.":
      "寒风中的低语：你私下指控了西奥，但没有给予怜悯或确保足够证据，话语在冷空气中消散。一切如故。西奥警惕地注视着你，直到黎明。",
    "Mina straightens her apron. 'If you need something, ask plainly. I have duties to attend to.'":
      "米娜整理了一下围裙。'如果你有什么需要，直说吧。我还有事要做。'",
    "Mina's expression tightens. 'Master Alden was... a difficult man. He met with Theo after supper that night — I saw them heading toward the Study. He was not kind to those he considered beneath him.'":
      "米娜的表情变得紧绑。'奥登老爷是个……很难相处的人。那天晚饭后他和西奥见了面——我看到他们朝书房走去。他对那些他认为地位低下的人并不友善。'",
    "Mina's eyes narrow. 'I do not discuss household matters with strangers.'":
      "米娜眯起眼睛。'我不会和陌生人讨论家务事。'",
    "Mina lowers her voice. 'The servant bell from the tower rang well after midnight — but I know the body was already cold when it rang. Someone was up there, making it look like an accident.'":
      "米娜压低声音。'塔楼的仆人铃在午夜之后才响起——但我知道铃响时尸体已经凉了。有人在那里制造假象，让人以为是意外。'",
    "Mina's jaw sets. 'There are locked doors in this house for a reason.'":
      "米娜咬紧了嘴唇。'这栋房子里有锁着的门是有原因的。'",
    "Mina reaches into her apron and produces a narrow brass key. 'The service stair to the tower. Use it carefully — and do not let Captain Vale see how you got it.'":
      "米娜从围裙里掏出一把窄窄的黄铜钥匙。'通往塔楼的服务楼梯钥匙。小心使用——别让韦尔队长看到你是怎么得到的。'",
    "Theo startles, then steadies himself. 'Oh — you are the magistrate. I was just... working. On repairs.'":
      "西奥被吓了一跳，然后稳住自己。'哦——你是法官。我只是……在工作。做维修。'",
    "A flicker of pride crosses Theo's face. 'My automaton designs were my life's work. Master Alden kept them in the Study safe — said he was protecting my interests.' His voice drops. 'I am not so sure anymore.'":
      "一丝自豪掠过西奥的脸。'我的自动机械设计是我毕生的心血。奥登老爷把它们放在书房保险柜里——说是为了保护我的利益。'他的声音低了下去。'我现在不太确定了。'",
    "Theo's face drains of color when he sees the gloves. 'Where did you — those could belong to anyone. The workshops are always sooty.' He takes a step back. 'I need some air. I'll be at the gatehouse.'":
      "西奥看到手套时脸色煞白。'你在哪里——这可能是任何人的。工坊总是有煤灰的。'他后退了一步。'我需要透透气。我在门房等你。'",
    "Theo freezes when he sees the torn page. 'He was going to sell them. My designs — he was going to sell them and send me away.' His voice cracks. 'I need to leave. I'll wait at the gatehouse.'":
      "西奥看到撕碎的账本页时僵住了。'他要卖掉它们。我的设计——他要卖掉它们然后把我赶走。'他的声音颤抖着。'我得离开。我在门房等你。'",
    "Theo slumps against the gatehouse wall. 'You know, don't you? About the designs — about everything.' He stares at the snow. 'He was going to throw my life away. I just... I wanted him to stop. I never meant for it to end like this.'":
      "西奥靠在门房的墙上。'你知道的，对吧？关于设计——关于一切。'他盯着雪地。'他要把我的生命毁掉。我只是……我想让他停下来。我从没想过会变成这样。'",
    "Captain Vale taps his boot impatiently. 'Well? Have you found anything useful, or are we standing around until the road opens?'":
      "韦尔队长不耐烦地敲着靴子。'怎么样？你找到什么有用的东西了吗，还是我们要一直站到路打通？'",
    "Vale scowls. 'Come back when you have something solid. I will not file a report on guesswork.'":
      "韦尔皱眉。'等你有了确凿的证据再来。我不会凭猜测写报告。'",
    "Vale considers your evidence carefully. 'This is substantive. If you can name a suspect and back it up, I will file a complete report. The bruising on the body looked wrong for a simple fall — I noticed that myself.'":
      "韦尔仔细审视你的证据。'这很有说服力。如果你能指名嫌疑人并提供支持，我会提交完整的报告。尸体上的淤伤看起来不像是简单的坠落——我自己就注意到了。'",
    "Vale glances at the window. 'The road opens at dawn. Once it does, people scatter and evidence walks away. We need a name before then.'":
      "韦尔看向窗户。'黎明时山路会打通。一旦打通，人们就会四散，证据也会消失。我们需要在那之前确定一个名字。'",
    "We have already exchanged pleasantries.":
      "我们已经寒暄过了。",
    "Mina shakes her head. 'I have told you what I know about the Master.'":
      "米娜摇头。'我已经告诉了你我所知道的关于老爷的事。'",
    "'I have told you about the bell. Someone rang it after Alden was already dead.'":
      "'我已经告诉过你关于铃声的事。有人在奥登死后敲响了钟。'",
    "'I have already given you what you need for the tower. Be careful.'":
      "'我已经给了你通往塔楼所需的东西。小心行事。'",
    "Theo nods nervously. 'Yes?'":
      "西奥紧张地点头。'什么事？'",
    "'I told you about my designs. Master Alden was supposed to protect them.'":
      "'我跟你说过我的设计。奥登老爷本应保护它们的。'",
    "Theo fidgets with his cuffs. 'I do not know what you mean.'":
      "西奥摆弄着袖口。'我不知道你在说什么。'",
    "Theo avoids your gaze. 'I have nothing more to say about those.'":
      "西奥避开你的目光。'关于那些我没什么可说的了。'",
    "Theo looks puzzled. 'What ledger? I keep my notes in the workshop.'":
      "西奥一脸困惑。'什么账本？我的笔记都在工坊里。'",
    "Theo refuses to discuss the ledger further.":
      "西奥拒绝进一步讨论账本的事。",
    "Theo shakes his head. 'I do not know what you want from me.'":
      "西奥摇头。'我不知道你想从我这里得到什么。'",
    "'I have told you everything. What happens now is up to you.'":
      "'我已经把一切都告诉你了。接下来发生什么取决于你。'",
    "Vale crosses his arms. 'What now?'":
      "韦尔交叉双臂。'又怎么了？'",
    "'I have reviewed your evidence. Make your accusation when ready.'":
      "'我已经审阅了你的证据。准备好时提出你的指控。'",
    "'Time is running out. I need a name.'":
      "'时间不多了。我需要一个名字。'",
  },
};
