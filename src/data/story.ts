/**
 * /story content. Edit words here, not in the components.
 * Every string is { en, sw }. Items marked `// CONFIRM` need Arnold's sign-off before merge,
 * and the Swahili needs Edwin's proofread.
 */
export type Lang = 'en' | 'sw'
export interface L {
  en: string
  sw: string
}
export const t = (l: L, lang: Lang) => l[lang]

/* ------------------------------------------------------------------ links */
const WA_TEXT: L = {
  en: "Hi Ramani-Taka team, I read your story and I'd like to talk about partnering.",
  sw: 'Habari timu ya Ramani-Taka, nimesoma safari yenu na ningependa kuzungumza kuhusu ushirikiano.',
}
export const LINKS = {
  whatsapp: (lang: Lang) => `https://wa.me/27630391211?text=${encodeURIComponent(WA_TEXT[lang])}`,
  tiktok: 'https://www.tiktok.com/@fixnairobi3',
}
export const VIDEOS = {
  s1: 'F0gkaru3-oE',
  s2: 'Vodt1QI95m4',
}

/* ----------------------------------------------------------------- photos */
export interface StoryPhoto {
  /** Base name in /public/story. sm = 960w, lg = up to 1600w. */
  name: string
  /** Width of the -lg file (for srcSet), and its height. */
  w: number
  h: number
  alt: string
}
export const PHOTOS = {
  squad: { name: 's1-founders-squad', w: 1600, h: 901, alt: 'Arnold Magezi and Edwin Macharia standing in front of volunteers holding shovels and rakes.' },
  mwiki: { name: 's1-mwiki-dumpsite', w: 1196, h: 674, alt: 'Volunteers and young children shovelling a large dumpsite of mixed plastic waste.' },
  y2b: { name: 'y2b-dar-es-salaam', w: 1264, h: 843, alt: 'Edwin and forum organisers on stage at the Youth to Business Forum holding a certificate.' },
} satisfies Record<string, StoryPhoto>

/* ------------------------------------------------------------------- hero */
export const HERO = {
  eyebrow: { en: 'Our story', sw: 'Safari yetu' },
  title: { en: 'Two strangers, one trash pile, and a map of every street.', sw: 'Wageni wawili, rundo moja la taka, na ramani ya kila mtaa.' },
  body: {
    en: "Ramani-Taka started with a TikTok video and a direct message. Here's how we got here, what we got wrong, and where we're going next.",
    sw: 'Ramani-Taka ilianza na video ya TikTok na ujumbe mmoja wa moja kwa moja. Hapa ni jinsi tulivyofika hapa, tulichokosea, na tunakoelekea.',
  },
  badges: [
    { en: 'Founded 2026', sw: 'Ilianzishwa 2026' },
    { en: 'Bootstrapped', sw: 'Bila ufadhili wa nje' },
    { en: 'Nairobi · Kampala · Dar es Salaam', sw: 'Nairobi · Kampala · Dar es Salaam' },
  ],
  jumps: [
    { id: 'origin', label: { en: 'How it started', sw: 'Jinsi ilivyoanza' } },
    { id: 'timeline', label: { en: 'Timeline', sw: 'Kumbukumbu' } },
    { id: 'honest', label: { en: 'The honest part', sw: 'Ukweli wenyewe' } },
    { id: 'vision', label: { en: 'Where this goes', sw: 'Tunakoelekea' } },
    { id: 'roadmap', label: { en: 'Roadmap', sw: 'Mpango wa kazi' } },
    { id: 'partner', label: { en: 'Partner with us', sw: 'Shirikiana nasi' } },
  ],
}

/* ----------------------------------------------------------------- origin */
export const ORIGIN = {
  label: { en: 'How it started', sw: 'Jinsi ilivyoanza' },
  chapters: [
    {
      n: '01',
      title: { en: 'The coach', sw: 'Kocha' },
      body: {
        en: "In February 2026, Arnold Magezi, a Ugandan developer, came to Kenya with AIESEC to coach basketball in public schools for six weeks. He'd spent years chasing one question: how do you reward people for doing good? First it was a cryptocurrency idea. Then XPNC, a game where you volunteer in real life to level up. Every version taught him the same thing: the idea needs real people on real streets.",
        sw: 'Mwezi Februari 2026, Arnold Magezi, msanidi programu kutoka Uganda, alikuja Kenya kupitia AIESEC kufundisha mpira wa kikapu katika shule za umma kwa wiki sita. Kwa miaka mingi amekuwa akitafuta jibu la swali moja: unawezaje kumtuza mtu kwa kutenda wema? Kwanza lilikuwa wazo la sarafu ya kidijitali. Kisha XPNC, mchezo ambapo unajitolea katika maisha halisi ili kupanda ngazi. Kila hatua ilimfundisha jambo moja: wazo hili linahitaji watu halisi kwenye mitaa halisi.',
      },
    },
    {
      n: '02',
      title: { en: 'The cleaner', sw: 'Msafishaji' },
      body: {
        en: "Across the city, Edwin Macharia was already doing the work. As Fix Nairobi, he'd pick a neglected corner, clean it, and post the before-and-after on TikTok. No budget, no sponsor. Just gloves, bags and a phone.",
        sw: 'Upande mwingine wa jiji, Edwin Macharia alikuwa tayari anafanya kazi hiyo. Kwa jina la Fix Nairobi, alichagua kona iliyosahaulika, akaisafisha, na kuweka video ya kabla na baada kwenye TikTok. Hakuna bajeti, hakuna mfadhili. Glavu tu, mifuko na simu.',
      },
    },
    {
      n: '03',
      title: { en: 'The message', sw: 'Ujumbe' },
      body: {
        en: 'In March 2026, Arnold saw one of those reels and messaged Edwin. His thinking was simple: people who show civic duty without being asked should be the ambassadors of whatever gets built. Edwin brought the community. Arnold brought the code. Ramani-Taka, Swahili for "trash map", is the first thing they built together.',
        sw: 'Mwezi Machi 2026, Arnold aliona moja ya video hizo na kumtumia Edwin ujumbe. Wazo lake lilikuwa rahisi: watu wanaotimiza wajibu wao wa kiraia bila kuombwa ndio wanaopaswa kuwa mabalozi wa chochote kitakachojengwa. Edwin alileta jamii. Arnold alileta msimbo. Ramani-Taka, yaani "ramani ya taka", ndicho kitu cha kwanza walichojenga pamoja.',
      },
    },
  ],
  photo: PHOTOS.squad,
  caption: { en: 'Arnold and Edwin with the squad, Amazing Trash Race Season 1.', sw: 'Arnold na Edwin pamoja na kikosi, Amazing Trash Race Msimu wa 1.' },
}

/* --------------------------------------------------------------- founders */
export const FOUNDERS = {
  label: { en: 'The founders', sw: 'Waanzilishi' },
  people: [
    {
      name: 'Arnold Magezi',
      img: '/story/arnold-magezi.webp',
      imgW: 449,
      imgH: 544,
      alt: 'Portrait of Arnold Magezi',
      role: { en: 'Co-founder · Technical Lead', sw: 'Mwanzilishi mwenza · Kiongozi wa Teknolojia' },
      bio: {
        en: 'Developer and social entrepreneur from Uganda, working where Web3 and AI meet civic life. He builds the map, the reward systems and the data behind Ramani-Taka.',
        sw: 'Msanidi programu na mjasiriamali wa kijamii kutoka Uganda, anayefanya kazi mahali ambapo Web3 na AI zinakutana na maisha ya kiraia. Anajenga ramani, mifumo ya zawadi na data inayoendesha Ramani-Taka.',
      },
      quote: {
        en: '"I want to build a self-circulating ecosystem of goodness, where people who care for their city and for each other get rewarded for it."',
        sw: '"Nataka kujenga mfumo wa wema unaojiendeleza wenyewe, ambapo watu wanaojali jiji lao na wanaojaliana wanapata tuzo kwa hilo."',
      },
    },
    {
      name: 'Edwin Macharia',
      img: '/story/edwin-macharia.webp',
      imgW: 640,
      imgH: 640,
      alt: 'Portrait of Edwin Macharia',
      role: { en: 'Co-founder · Community Lead', sw: 'Mwanzilishi mwenza · Kiongozi wa Jamii' },
      bio: {
        en: 'Edwin started Fix Nairobi with a phone and a pair of gloves. With a background in marketing and project management, he turned his before-and-after clips into a movement: neighbours joining in, kids grabbing shovels, students signing up by the dozen. An environmental steward and educator, he believes caring for your city should be a lifestyle young people are proud of. At Ramani-Taka he leads the community: mobilising volunteers, running the Amazing Trash Race on the ground, and representing the team on stages like the Youth to Business Forum.',
        sw: 'Edwin alianzisha Fix Nairobi akiwa na simu na jozi ya glavu. Akiwa na uzoefu katika masoko na usimamizi wa miradi, aligeuza video zake za kabla na baada kuwa vuguvugu: majirani kujiunga, watoto kushika majembe, wanafunzi kujisajili kwa wingi. Ni mlinzi na mwalimu wa mazingira anayeamini kwamba kutunza jiji lako kunapaswa kuwa mtindo wa maisha ambao vijana wanajivunia. Katika Ramani-Taka anaongoza jamii: kuhamasisha wajitolea, kuendesha Amazing Trash Race uwanjani, na kuiwakilisha timu kwenye majukwaa kama Youth to Business Forum.',
      },
      quote: {
        en: '"I bring a passion for community and environmental stewardship, driving us toward a future of shared growth and sustainability."',
        sw: '"Ninaleta shauku ya jamii na utunzaji wa mazingira, ikituongoza kuelekea mustakabali wa ukuaji wa pamoja na uendelevu."',
      },
      link: { href: LINKS.tiktok, label: { en: 'Follow Fix Nairobi on TikTok ↗', sw: 'Fuata Fix Nairobi kwenye TikTok ↗' } },
    },
  ],
}

/* --------------------------------------------------------------- timeline */
export interface Milestone {
  date: L
  title: L
  body: L
  award?: boolean
  stats?: { value: string; label: L }[]
  photo?: StoryPhoto
  caption?: L
  video?: { id: string; label: L }
  link?: { to: string; label: L }
}
export const TIMELINE = {
  label: { en: 'The scrapbook', sw: 'Kumbukumbu za safari' },
  intro: { en: 'Every milestone so far, with the receipts.', sw: 'Kila hatua hadi sasa, pamoja na ushahidi.' },
  awardChip: { en: 'Award', sw: 'Tuzo' },
  watchOnYouTube: { en: 'Watch on YouTube ↗', sw: 'Tazama YouTube ↗' },
  items: [
    {
      date: { en: 'Feb 2026', sw: 'Feb 2026' },
      title: { en: 'Arriving in Kenya with AIESEC', sw: 'Kuwasili Kenya na AIESEC' },
      body: { en: 'Arnold comes to coach basketball in Kenyan public schools for six weeks.', sw: 'Arnold anakuja kufundisha mpira wa kikapu katika shule za umma za Kenya kwa wiki sita.' },
    },
    {
      date: { en: 'Mar 2026', sw: 'Mac 2026' },
      title: { en: 'The first message', sw: 'Ujumbe wa kwanza' },
      body: {
        en: 'One Fix Nairobi before-and-after reel leads to a DM. The partnership begins.',
        sw: 'Video moja ya kabla na baada ya Fix Nairobi inaleta ujumbe wa moja kwa moja. Ushirikiano unaanza.',
      },
    },
    {
      date: { en: 'Apr 2026', sw: 'Apr 2026' }, // CONFIRM: Season 1 race month (inferred from 19 Apr 2026 screenshots)
      title: { en: 'The Amazing Trash Race, Season 1 · Mwiki', sw: 'The Amazing Trash Race, Msimu wa 1 · Mwiki' },
      body: {
        en: 'Our first gamified cleanup: squads raced to clear dumpsites in Mwiki. Kids from the neighbourhood grabbed shovels and joined in.',
        sw: 'Usafi wetu wa kwanza wa kimchezo: vikundi vilishindana kusafisha madampo Mwiki. Watoto wa mtaani walichukua majembe na kujiunga.',
      },
      stats: [
        { value: '50', label: { en: 'sign-ups', sw: 'waliojisajili' } },
        { value: '20', label: { en: 'racers on the day', sw: 'washindani siku yenyewe' } },
        { value: '600 kg+', label: { en: 'of waste cleared', sw: 'za taka zimeondolewa' } },
      ],
      photo: PHOTOS.mwiki,
      caption: { en: 'Mwiki, Season 1. The neighbourhood joined in.', sw: 'Mwiki, Msimu wa 1. Mtaa mzima ulijiunga.' },
      video: { id: VIDEOS.s1, label: { en: 'Watch the Season 1 mini-documentary', sw: 'Tazama filamu fupi ya Msimu wa 1' } },
    },
    {
      date: { en: '2026', sw: '2026' },
      title: { en: 'We reported to NEMA', sw: 'Tuliripoti kwa NEMA' },
      body: {
        en: "We sent the National Environment Management Authority our Season 1 impact report: the numbers, plus an honest audit of what went wrong. They responded. We wrote back. We're still waiting on the next step, and we kept going anyway.",
        sw: 'Tulituma kwa Mamlaka ya Taifa ya Usimamizi wa Mazingira (NEMA) ripoti ya athari ya Msimu wa 1: takwimu, pamoja na ukaguzi wa kweli wa tulichokosea. Walijibu. Tukawajibu. Bado tunasubiri hatua inayofuata, na tumeendelea na kazi.',
      },
    },
    {
      date: { en: 'Mid 2026', sw: 'Katikati ya 2026' },
      title: { en: 'The map went live', sw: 'Ramani ilianza kufanya kazi' },
      body: {
        en: 'ramani-taka.co.ke launches: anonymous photo-and-GPS reports, AI photo checks, verified clean-ups and reporting over WhatsApp.',
        sw: 'ramani-taka.co.ke inazinduliwa: ripoti za picha na GPS bila kujitambulisha, ukaguzi wa picha kwa AI, uthibitisho wa usafi, na kuripoti kupitia WhatsApp.',
      },
      link: { to: '/app', label: { en: 'Open the map →', sw: 'Fungua ramani →' } },
    },
    {
      date: { en: '15 Aug 2026', sw: '15 Ago 2026' },
      title: { en: 'Season 2 · with AIESEC at Kenyatta University', sw: 'Msimu wa 2 · pamoja na AIESEC Chuo Kikuu cha Kenyatta' },
      body: {
        en: 'Bigger, sharper and run on our own app: digital tickets, squads, marshals logging weights on the spot, and a live leaderboard.',
        sw: 'Mkubwa zaidi, makini zaidi, na ukiendeshwa kwenye programu yetu wenyewe: tiketi za kidijitali, vikundi, wasimamizi wanaorekodi uzito papo hapo, na jedwali la matokeo la moja kwa moja.',
      },
      // CONFIRM: Season 2 stats. App recorded 21 registrations, 11 squads, 200 kg over 4 weigh-ins (3 squads).
      // Arnold remembers "50+ volunteers and ~600 kg". Only the squads tile shows until confirmed.
      stats: [{ value: '11', label: { en: 'squads', sw: 'vikundi' } }],
      video: { id: VIDEOS.s2, label: { en: 'Watch Season 2', sw: 'Tazama Msimu wa 2' } },
      link: { to: '/nairobi/race/leaderboard', label: { en: 'See the leaderboard →', sw: 'Tazama matokeo →' } },
    },
    {
      date: { en: '2026', sw: '2026' }, // CONFIRM: Youth to Business Forum month
      award: true,
      title: { en: '4th place · Youth to Business Forum, Dar es Salaam', sw: 'Nafasi ya 4 · Youth to Business Forum, Dar es Salaam' },
      body: {
        en: "We pitched Dar-Takataka, Ramani-Taka's plan for Dar es Salaam, at the Youth to Business Forum hosted by AIESEC in Tanzania. Edwin travelled to Dar es Salaam to represent us, and we placed 4th.",
        sw: 'Tuliwasilisha Dar-Takataka, mpango wa Ramani-Taka kwa Dar es Salaam, kwenye Youth to Business Forum iliyoandaliwa na AIESEC Tanzania. Edwin alisafiri hadi Dar es Salaam kutuwakilisha, na tukashika nafasi ya 4.',
      },
      photo: PHOTOS.y2b,
      caption: { en: 'Receiving the certificate in Dar es Salaam. Photo: AIESEC in Tanzania.', sw: 'Kupokea cheti Dar es Salaam. Picha: AIESEC Tanzania.' },
    },
    {
      date: { en: 'Nov 2026', sw: 'Nov 2026' },
      title: { en: 'Three cities, one map', sw: 'Miji mitatu, ramani moja' },
      body: {
        en: 'Nairobi, Kampala and Dar es Salaam are all on the map, and Ramani-Taka now installs as an app on your phone.',
        sw: 'Nairobi, Kampala na Dar es Salaam zote ziko kwenye ramani, na Ramani-Taka sasa inaweza kusakinishwa kama programu kwenye simu yako.',
      },
      link: { to: '/install', label: { en: 'Get the app →', sw: 'Pata programu →' } },
    },
  ] satisfies Milestone[],
}

/* ---------------------------------------------------------------- honest */
export const HONEST = {
  label: { en: 'The honest part', sw: 'Ukweli wenyewe' },
  title: { en: 'What Season 1 taught us.', sw: 'Tulichojifunza kutoka Msimu wa 1.' },
  items: [
    {
      title: { en: "We hoped it would go viral. It didn't.", sw: 'Tulitarajia ingesambaa mtandaoni. Haikusambaa.' },
      body: {
        en: "Season 1 got a handful of views and a lot of quiet. We ran Season 2 anyway, and that's when people started noticing.",
        sw: 'Msimu wa 1 ulipata watazamaji wachache na ukimya mwingi. Tuliendesha Msimu wa 2 hata hivyo, na hapo ndipo watu walianza kutuona.',
      },
    },
    {
      title: { en: 'Clean spots were dirty again in two weeks.', sw: 'Maeneo safi yalichafuka tena ndani ya wiki mbili.' },
      body: {
        en: "Without bins or follow-up, cleared dumpsites filled straight back up. A one-day cleanup isn't a solution. That's why we built a map that remembers.",
        sw: 'Bila mapipa wala ufuatiliaji, madampo tuliyosafisha yalijaa tena. Usafi wa siku moja si suluhisho. Ndiyo maana tulijenga ramani isiyosahau.',
      },
    },
    {
      title: { en: 'We guessed the weight.', sw: 'Tulikadiria uzito.' },
      body: {
        en: 'No scales in Season 1, so we estimated by counting bags. In Season 2, marshals logged weights in the app.',
        sw: 'Hatukuwa na mizani katika Msimu wa 1, kwa hiyo tulikadiria kwa kuhesabu mifuko. Katika Msimu wa 2, wasimamizi walirekodi uzito kwenye programu.',
      },
    },
    {
      title: { en: 'We had nowhere to send the waste.', sw: 'Hatukuwa na mahali pa kupeleka taka.' },
      body: {
        en: 'Everything went into one mixed bag, and most of it ended up at the dump. Sorting at source and recycling partners are on our list.',
        sw: 'Kila kitu kiliingia kwenye mfuko mmoja uliochanganyika, na nyingi ziliishia kwenye dampo. Kutenganisha taka mahali zinapotoka na washirika wa kuzichakata viko kwenye orodha yetu.',
      },
    },
    {
      title: { en: 'No institutional funding, yet.', sw: 'Bado hatuna ufadhili wa taasisi.' },
      body: {
        en: 'Everything so far is founder- and community-funded. Every shilling raised is on our public ledger.',
        sw: 'Kila kitu hadi sasa kimefadhiliwa na waanzilishi na jamii. Kila shilingi inayochangwa iko kwenye daftari letu la wazi.',
      },
      link: { to: '/nairobi/funds', label: { en: 'See the ledger →', sw: 'Tazama daftari →' } },
    },
  ],
}

/* ---------------------------------------------------------------- vision */
export type LayerTone = 'green' | 'gold' | 'coral'
export const VISION = {
  label: { en: 'Where this goes', sw: 'Tunakoelekea' },
  title: { en: "Trash is a data problem before it's a cleaning problem.", sw: 'Taka ni tatizo la data kabla ya kuwa tatizo la usafi.' },
  body: {
    en: 'Nobody can fix what nobody has mapped. So we digitise the problem first, make fixing it fun, and turn the result into data the next generation of solutions can use.',
    sw: 'Hakuna anayeweza kurekebisha kisichowekwa kwenye ramani. Kwa hiyo tunaweka tatizo kidijitali kwanza, tunafanya kulitatua kuwe kwa furaha, na tunageuza matokeo kuwa data ambayo suluhisho za kizazi kijacho zinaweza kutumia.',
  },
  /** Listed foundation first (1 → 4). Desktop shows 1 at the bottom. */
  layers: [
    {
      status: { en: 'Live', sw: 'Hai' },
      tone: 'green' as LayerTone,
      title: { en: 'Map the problem', sw: 'Weka tatizo kwenye ramani' },
      body: {
        en: 'Anyone with a phone can photograph a trash pile and pin it to a live map. Running in Nairobi, Kampala and Dar es Salaam.',
        sw: 'Mtu yeyote mwenye simu anaweza kupiga picha ya rundo la taka na kuliweka kwenye ramani hai. Inafanya kazi Nairobi, Kampala na Dar es Salaam.',
      },
    },
    {
      status: { en: 'Building', sw: 'Tunajenga' },
      tone: 'gold' as LayerTone,
      title: { en: 'Reward the fixers', sw: 'Tuza wanaosafisha' },
      body: {
        en: 'Bounties on the worst hotspots, paid to the people who clear them. Micro-jobs today, tokens tomorrow: a first step into the digital economy for young people.',
        sw: 'Zawadi kwa maeneo mabaya zaidi, zinazolipwa kwa wanaoyasafisha. Kazi ndogo leo, tokeni kesho: hatua ya kwanza ya vijana kuingia kwenye uchumi wa kidijitali.',
      },
    },
    {
      status: { en: 'Next', sw: 'Ijayo' },
      tone: 'gold' as LayerTone,
      title: { en: 'Waste data intelligence', sw: 'Akili ya data ya taka' },
      body: {
        en: 'An open, verifiable record of hotspots, bins and trees that county governments, NGOs, recyclers and CSR funders can act on.',
        sw: 'Rekodi ya wazi inayoweza kuthibitishwa ya maeneo ya taka, mapipa na miti, ambayo serikali za kaunti, mashirika yasiyo ya kiserikali, wachakataji na wafadhili wanaweza kuifanyia kazi.',
      },
    },
    {
      status: { en: 'Idea stage', sw: 'Hatua ya wazo' },
      tone: 'coral' as LayerTone,
      title: { en: 'Machines that clean', sw: 'Mashine zinazosafisha' },
      body: {
        en: 'Robots and connected sensors, guided by our data to wherever the waste is worst.',
        sw: 'Roboti na vihisi vilivyounganishwa, vinavyoongozwa na data yetu hadi mahali taka zilipo nyingi zaidi.',
      },
    },
  ],
  labLabel: { en: 'From the lab: ideas, not products', sw: 'Kutoka maabara: mawazo, si bidhaa' },
  lab: [
    {
      title: { en: "Nairobi's first trash-picking robot", sw: 'Roboti ya kwanza ya Nairobi ya kuokota taka' },
      body: {
        en: 'Honest status: an idea. No parts list, no prototype yet. The plan is to let our heatmap tell a low-cost robot where the worst hotspots are.',
        sw: 'Hali halisi: ni wazo. Hakuna orodha ya vipuri wala mfano bado. Mpango ni ramani yetu ya joto imwonyeshe roboti wa gharama nafuu mahali maeneo mabaya zaidi yalipo.',
      },
    },
    {
      title: { en: 'Smart bins', sw: 'Mapipa mahiri' },
      body: { en: "Bins and sensors that report when they're full, feeding straight into the map.", sw: 'Mapipa na vihisi vinavyoripoti yanapojaa, na kutuma taarifa moja kwa moja kwenye ramani.' },
    },
    {
      title: { en: 'Centimetre-precise positioning', sw: 'Mahali sahihi kwa sentimita' },
      body: {
        en: "We're exploring precise-positioning networks such as GEODNET, so a robot could navigate to a hotspot to within centimetres.",
        sw: 'Tunachunguza mitandao ya kupima mahali kwa usahihi kama GEODNET, ili roboti aweze kufika kwenye eneo la taka kwa usahihi wa sentimita.',
      },
    },
  ],
}

/* --------------------------------------------------------------- roadmap */
export const ROADMAP = {
  label: { en: 'Roadmap', sw: 'Mpango wa kazi' },
  columns: [
    {
      title: { en: 'Now', sw: 'Sasa' },
      items: [
        { en: 'Ramani-Taka on the Google Play Store', sw: 'Ramani-Taka kwenye Google Play Store' },
        { en: 'Cleanup events on the map that anyone can join', sw: 'Matukio ya usafi kwenye ramani ambayo yeyote anaweza kujiunga nayo' },
        { en: 'Every hotspot tracked from reported to cleared', sw: 'Kila eneo linafuatiliwa kutoka kuripotiwa hadi kusafishwa' },
      ],
    },
    {
      title: { en: 'Next', sw: 'Ijayo' },
      items: [
        { en: 'A swipeable feed of hotspots and cleanups', sw: 'Mlisho wa maeneo ya taka na matukio ya usafi' },
        { en: 'Tree mapping and survival tracking', sw: 'Kuweka miti kwenye ramani na kufuatilia uhai wake' },
        { en: 'Dustbin mapping: full, damaged or missing', sw: 'Kuweka mapipa kwenye ramani: yamejaa, yameharibika au hayapo' },
        { en: 'Offline reporting and photo verification', sw: 'Kuripoti bila mtandao na uthibitisho wa picha' },
        { en: 'Your impact totals: kilos, trees and bins', sw: 'Jumla ya mchango wako: kilo, miti na mapipa' },
      ],
    },
    {
      title: { en: 'Later', sw: 'Baadaye' },
      items: [
        { en: 'Bounties and micro-jobs paid out through the map', sw: 'Zawadi na kazi ndogo zinazolipwa kupitia ramani' },
        { en: 'An open data layer for partners', sw: 'Data ya wazi kwa washirika' },
        { en: 'Amazing Trash Race Season 3, and the first races in Kampala and Dar es Salaam', sw: 'Msimu wa 3 wa Amazing Trash Race, na mashindano ya kwanza Kampala na Dar es Salaam' },
        { en: 'A first robot prototype', sw: 'Mfano wa kwanza wa roboti' },
      ],
    },
  ],
}

/* ------------------------------------------------------- thanks + partner */
export const THANKS = {
  label: { en: "Who's helped us", sw: 'Waliotusaidia' },
  body: {
    en: 'AIESEC brought Arnold to Kenya, mobilised students for Season 2 at Kenyatta University, and hosted the Youth to Business Forum in Tanzania. Thank you to every warrior, marshal and neighbour who picked up a bag.',
    sw: 'AIESEC ilimleta Arnold Kenya, ilihamasisha wanafunzi kwa Msimu wa 2 katika Chuo Kikuu cha Kenyatta, na iliandaa Youth to Business Forum nchini Tanzania. Asante kwa kila shujaa, msimamizi na jirani aliyeokota mfuko.',
  },
}

export const PARTNER = {
  label: { en: 'Partner with us', sw: 'Shirikiana nasi' },
  title: { en: 'Build this with us.', sw: 'Jenga hili pamoja nasi.' },
  body: {
    en: "We're looking for partners: counties, companies, universities, recyclers, and anyone who wants cleaner East African cities.",
    sw: 'Tunatafuta washirika: kaunti, kampuni, vyuo vikuu, wachakataji taka, na yeyote anayetaka miji safi zaidi Afrika Mashariki.',
  },
  whatsapp: { en: 'Talk to us on WhatsApp', sw: 'Ongea nasi WhatsApp' },
  tiktok: { en: 'Follow us on TikTok', sw: 'Tufuate TikTok' },
  cleanup: { to: '/app?to=cleanups', label: { en: 'Join a cleanup →', sw: 'Jiunga na usafi →' } },
  report: { to: '/app?action=report', label: { en: 'Report a spot →', sw: 'Ripoti eneo →' } },
  signature: { en: 'Arnold Magezi & Edwin Macharia, co-founders', sw: 'Arnold Magezi na Edwin Macharia, waanzilishi wenza' },
}

export const PAGE = {
  backHome: { en: '← Ramani-Taka', sw: '← Ramani-Taka' },
  playVideo: { en: 'Play video', sw: 'Cheza video' },
}
