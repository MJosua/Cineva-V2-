import { useState } from "react";

function ListWinnerPublic({ id }) {

    const [listData, setListData] = useState([

        {
            "column_2": "BG19932699",
            "PrizeRank": "1",
            "column_1": "æœ±Oåˆ©"
        },
        {
            "column_2": "GS76193284",
            "PrizeRank": "2",
            "column_1": "ç¾…Oå®‰"
        },
        {
            "column_2": "GE33872697",
            "PrizeRank": "2",
            "column_1": "æž—Oæ–‡"
        },
        {
            "column_2": "GA86823330",
            "PrizeRank": "2",
            "column_1": "å¼µOé´»"
        },
        {
            "column_2": "GB23980853",
            "PrizeRank": "2",
            "column_1": "çŽ‹Oäº‘"
        },
        {
            "column_2": "GB-32322281",
            "PrizeRank": "2",
            "column_1": "åŠ‰Oè±"
        },
        {
            "column_2": "GB30726294",
            "PrizeRank": "2",
            "column_1": "æž—Oæš"
        },
        {
            "column_2": "GB21559137",
            "PrizeRank": "2",
            "column_1": "æž—Oè‡»"
        },
        {
            "column_2": "GE33023718",
            "PrizeRank": "2",
            "column_1": "è¨±Oè˜"
        },
        {
            "column_2": "GB-25977281",
            "PrizeRank": "2",
            "column_1": "é»ƒOå‰"
        },
        {
            "column_2": "GB42981025",
            "PrizeRank": "2",
            "column_1": "é™³OæŸ˜"
        },
        {
            "column_2": "GB37060442",
            "PrizeRank": "2",
            "column_1": "åŠ‰Oè±"
        },
        {
            "column_2": "GB43250853",
            "PrizeRank": "2",
            "column_1": "ç¾…Oè“®"
        },
        {
            "column_2": "GB-31322783",
            "PrizeRank": "2",
            "column_1": "æž—Oæ˜‡"
        },
        {
            "column_2": "GE23249737",
            "PrizeRank": "2",
            "column_1": "å¼µOæž"
        },
        {
            "column_2": "GB49643008",
            "PrizeRank": "2",
            "column_1": "æž—Oè³¢"
        },
        {
            "column_2": "GB-44685044",
            "PrizeRank": "2",
            "column_1": "çŽ‹Oåš"
        },
        {
            "column_2": "GB58709357",
            "PrizeRank": "2",
            "column_1": "é»ƒOç³´"
        },
        {
            "column_2": "JA-81168550",
            "PrizeRank": "2",
            "column_1": "çŽ‹Oæ·‡"
        },
        {
            "column_2": "JK51831665",
            "PrizeRank": "2",
            "column_1": "ç´€Oç¾¤"
        },
        {
            "column_2": "JL41181203",
            "PrizeRank": "2",
            "column_1": "å¾Oå„„"
        },
        {
            "column_2": "JA54690210",
            "PrizeRank": "2",
            "column_1": "æž—Oå„€"
        },
        {
            "column_2": "JV20108476",
            "PrizeRank": "2",
            "column_1": "æŽO"
        },
        {
            "column_2": "JA59098672",
            "PrizeRank": "2",
            "column_1": "ç›§Oäº‘"
        },
        {
            "column_2": "JA66087309",
            "PrizeRank": "2",
            "column_1": "æ¥ŠOç‘œ"
        },
        {
            "column_2": "JA29087041",
            "PrizeRank": "2",
            "column_1": "ä½•Oç‡•"
        },
        {
            "column_2": "GN30176322",
            "PrizeRank": "3",
            "column_1": "ä½™Oå¾·"
        },
        {
            "column_2": "GB-31406587",
            "PrizeRank": "3",
            "column_1": "æ¸¸Oå©·"
        },
        {
            "column_2": "GE39586572",
            "PrizeRank": "3",
            "column_1": "æ¥ŠOæ¯…"
        },
        {
            "column_2": "GB02423477",
            "PrizeRank": "3",
            "column_1": "è”¡Oæ¸…"
        },
        {
            "column_2": "GB29141278",
            "PrizeRank": "3",
            "column_1": "é™³Oé »"
        },
        {
            "column_2": "GT46784082",
            "PrizeRank": "3",
            "column_1": "éƒ­O"
        },
        {
            "column_2": "GB13906305",
            "PrizeRank": "3",
            "column_1": "æŽOæ¬½"
        },
        {
            "column_2": "GN-90519492",
            "PrizeRank": "3",
            "column_1": "å³Oè¡"
        },
        {
            "column_2": "GB41972763",
            "PrizeRank": "3",
            "column_1": "å°¤Oç‘©"
        },
        {
            "column_2": "GB4130692",
            "PrizeRank": "3",
            "column_1": "çŽ‹Oæ˜Œ"
        },
        {
            "column_2": "GE36778461",
            "PrizeRank": "3",
            "column_1": "é™³Oæ±"
        },
        {
            "column_2": "GB44445879",
            "PrizeRank": "3",
            "column_1": "å»–Oå–¬"
        },
        {
            "column_2": "50440100",
            "PrizeRank": "3",
            "column_1": "æ¢Oæš"
        },
        {
            "column_2": "GB50295750",
            "PrizeRank": "3",
            "column_1": "é™³Oä¼¶"
        },
        {
            "column_2": "GB27594873",
            "PrizeRank": "3",
            "column_1": "æž—Oè"
        },
        {
            "column_2": "GB-45815196",
            "PrizeRank": "3",
            "column_1": "æž—Oå®¹"
        },
        {
            "column_2": "GE41989214",
            "PrizeRank": "3",
            "column_1": "æŽOè±"
        },
        {
            "column_2": "GE20890714",
            "PrizeRank": "3",
            "column_1": "é™³Oå´‘"
        },
        {
            "column_2": "GE26916485",
            "PrizeRank": "3",
            "column_1": "è‘‰Oåˆ"
        },
        {
            "column_2": "GB-41395553",
            "PrizeRank": "3",
            "column_1": "ç°¡Oè€˜"
        },
        {
            "column_2": "GB50528141",
            "PrizeRank": "3",
            "column_1": "æŽOç©Ž"
        },
        {
            "column_2": "GB36618252",
            "PrizeRank": "3",
            "column_1": "é¾Oä¸ž"
        },
        {
            "column_2": "GB52471755",
            "PrizeRank": "3",
            "column_1": "æŽOè«­"
        },
        {
            "column_2": "GB33807109",
            "PrizeRank": "3",
            "column_1": "è”¡OçŠ"
        },
        {
            "column_2": "GB88997683",
            "PrizeRank": "3",
            "column_1": "é™³Oå®‰"
        },
        {
            "column_2": "JA65990573",
            "PrizeRank": "3",
            "column_1": "æ´ªOå³¯"
        },
        {
            "column_2": "JL42442482",
            "PrizeRank": "3",
            "column_1": "å¼µOé "
        },
        {
            "column_2": "JA78144523",
            "PrizeRank": "3",
            "column_1": "é»ƒOæ°‘"
        },
        {
            "column_2": "JV26063168",
            "PrizeRank": "3",
            "column_1": "å‘¨Oéº’"
        },
        {
            "column_2": "GA79091519",
            "PrizeRank": "3",
            "column_1": "è©¹Oå©•"
        },
        {
            "column_2": "JA73978719",
            "PrizeRank": "3",
            "column_1": "é»ƒOè‘µ"
        },
        {
            "column_2": "JA-75792449",
            "PrizeRank": "3",
            "column_1": "é™³Oå¿—"
        },
        {
            "column_2": "JA86953257",
            "PrizeRank": "3",
            "column_1": "çŽ‹Oæ™"
        },
        {
            "column_2": "JA89905032",
            "PrizeRank": "3",
            "column_1": "ç°¡Oæ¬£"
        },
        {
            "column_2": "JA89905031",
            "PrizeRank": "3",
            "column_1": "ç°¡OOå¦¹"
        },
        {
            "column_2": "GC28115077",
            "PrizeRank": "4",
            "column_1": "å³Oè“‰"
        },
        {
            "column_2": "GE-38259375",
            "PrizeRank": "4",
            "column_1": "è˜‡Oé¦¨"
        },
        {
            "column_2": "GS27146521",
            "PrizeRank": "4",
            "column_1": "å“Oèª¼"
        },
        {
            "column_2": "GB20211329",
            "PrizeRank": "4",
            "column_1": "è˜‡Oéœ“"
        },
        {
            "column_2": "GB-13603463",
            "PrizeRank": "4",
            "column_1": "é¾Oç…Œ"
        },
        {
            "column_2": "GP25781907",
            "PrizeRank": "4",
            "column_1": "å¾Oéœ„"
        },
        {
            "column_2": "GZ12642711",
            "PrizeRank": "4",
            "column_1": "é™³Oç‡•"
        },
        {
            "column_2": "GB30147067",
            "PrizeRank": "4",
            "column_1": "å¼µOèª "
        },
        {
            "column_2": "GB37941742",
            "PrizeRank": "4",
            "column_1": "ç™½Oå®¸"
        },
        {
            "column_2": "GB48176394",
            "PrizeRank": "4",
            "column_1": "é»ƒOæƒ "
        },
        {
            "column_2": "GB-36941616",
            "PrizeRank": "4",
            "column_1": "å½­Oçª"
        },
        {
            "column_2": "GB24558004",
            "PrizeRank": "4",
            "column_1": "æ›¾Oç¿"
        },
        {
            "column_2": "GB-30014068",
            "PrizeRank": "4",
            "column_1": "å»–Oä½‘"
        },
        {
            "column_2": "GB23835711",
            "PrizeRank": "4",
            "column_1": "å¼µOå„ª"
        },
        {
            "column_2": "GB33704357",
            "PrizeRank": "4",
            "column_1": "é„­Oè‡»"
        },
        {
            "column_2": "GB37074511",
            "PrizeRank": "4",
            "column_1": "è‘‰OåŽŸ"
        },
        {
            "column_2": "GH25997152",
            "PrizeRank": "4",
            "column_1": "è˜‡Oæ™Ÿ"
        },
        {
            "column_2": "GB-30544479",
            "PrizeRank": "4",
            "column_1": "é™³Oç”„"
        },
        {
            "column_2": "GB43906951",
            "PrizeRank": "4",
            "column_1": "å»–Oæ‡¿"
        },
        {
            "column_2": "GB41477179",
            "PrizeRank": "4",
            "column_1": "é™³Oå»·"
        },
        {
            "column_2": "GE34514112",
            "PrizeRank": "4",
            "column_1": "è³´Oè°"
        },
        {
            "column_2": "GB43739796",
            "PrizeRank": "4",
            "column_1": "è˜‡Oçµœ"
        },
        {
            "column_2": "GM90094374",
            "PrizeRank": "4",
            "column_1": "é™³Oå¿—"
        },
        {
            "column_2": "GB27727136",
            "PrizeRank": "4",
            "column_1": "å¼µOé›¯"
        },
        {
            "column_2": "GH31411231",
            "PrizeRank": "4",
            "column_1": "é™³Oæ–Œ"
        },
        {
            "column_2": "GB39248254",
            "PrizeRank": "4",
            "column_1": "å‘¨Oä½‘"
        },
        {
            "column_2": "GB51932223",
            "PrizeRank": "4",
            "column_1": "é„­OçŽ‰"
        },
        {
            "column_2": "GB-31108118",
            "PrizeRank": "4",
            "column_1": "é™³Oæ©"
        },
        {
            "column_2": "GB35345446",
            "PrizeRank": "4",
            "column_1": "é»ƒOåœ¨"
        },
        {
            "column_2": "JA60019725",
            "PrizeRank": "4",
            "column_1": "é™³Oæ…§"
        },
        {
            "column_2": "GB53721183",
            "PrizeRank": "4",
            "column_1": "é™³Oæ·®"
        },
        {
            "column_2": "JA56757334",
            "PrizeRank": "4",
            "column_1": "è˜‡Oè“"
        },
        {
            "column_2": "JA85775403",
            "PrizeRank": "4",
            "column_1": "å¼µOæ¬£"
        },
        {
            "column_2": "GE37114954",
            "PrizeRank": "4",
            "column_1": "é»ƒOç¥ˆ"
        },
        {
            "column_2": "GE37127858",
            "PrizeRank": "4",
            "column_1": "é»ƒOæ¯…"
        },
        {
            "column_2": "GE37133610",
            "PrizeRank": "4",
            "column_1": "è¬Oçœž"
        },
        {
            "column_2": "JA82266590",
            "PrizeRank": "4",
            "column_1": "å‘‚Oè‡»"
        },
        {
            "column_2": "JV05341357",
            "PrizeRank": "4",
            "column_1": "é™³Oä¸ž"
        },
        {
            "column_2": "JA77673866",
            "PrizeRank": "4",
            "column_1": "åŠ‰Oå©·"
        },
        {
            "column_2": "GE27940112",
            "PrizeRank": "4",
            "column_1": "æœ±Oæ‹›"
        },
        {
            "column_2": "GE-38251354",
            "PrizeRank": "5",
            "column_1": "å³Oç·¯"
        },
        {
            "column_2": "GP19895388",
            "PrizeRank": "5",
            "column_1": "å‘¨OæŸ”"
        },
        {
            "column_2": "GB31521010",
            "PrizeRank": "5",
            "column_1": "ç¾…Oéˆž"
        },
        {
            "column_2": "GB33819251",
            "PrizeRank": "5",
            "column_1": "é»ƒOå³°"
        },
        {
            "column_2": "GE39603401",
            "PrizeRank": "5",
            "column_1": "çŽ‹Oè¯"
        },
        {
            "column_2": "GB16536018",
            "PrizeRank": "5",
            "column_1": "å»–Oå¦¤"
        },
        {
            "column_2": "GB38796701",
            "PrizeRank": "5",
            "column_1": "æž—Oå½¥"
        },
        {
            "column_2": "GB47775687",
            "PrizeRank": "5",
            "column_1": "å¼µOç­‘"
        },
        {
            "column_2": "GB50164691",
            "PrizeRank": "5",
            "column_1": "åŠ‰Oåœ‹"
        },
        {
            "column_2": "JJ44492155",
            "PrizeRank": "5",
            "column_1": "è¬Oè¾°"
        },
        {
            "column_2": "GE40521694",
            "PrizeRank": "6",
            "column_1": "ç°¡OçŠ"
        },
        {
            "column_2": "GE-39573606",
            "PrizeRank": "6",
            "column_1": "å¼µOç‘œ"
        },
        {
            "column_2": "GE36032259",
            "PrizeRank": "6",
            "column_1": "æž—Oç§€"
        },
        {
            "column_2": "GB29141279",
            "PrizeRank": "6",
            "column_1": "è³´Oä½‘"
        },
        {
            "column_2": "GE-33006531",
            "PrizeRank": "6",
            "column_1": "å¼µOç¶­"
        },
        {
            "column_2": "GB29044673",
            "PrizeRank": "6",
            "column_1": "æž—Oç¾½"
        },
        {
            "column_2": "GB-34829139",
            "PrizeRank": "6",
            "column_1": "æž—Oå®‡"
        },
        {
            "column_2": "GE23255941",
            "PrizeRank": "6",
            "column_1": "é™³Oæ¶µ"
        },
        {
            "column_2": "GE34650453",
            "PrizeRank": "6",
            "column_1": "è‘‰Oç¶º"
        },
        {
            "column_2": "GB33230232",
            "PrizeRank": "6",
            "column_1": "æ´ªOå®¹"
        },
        {
            "column_2": "GB24090103",
            "PrizeRank": "6",
            "column_1": "æˆOç¿"
        },
        {
            "column_2": "GB-33311236",
            "PrizeRank": "6",
            "column_1": "é™³Oå°¹"
        },
        {
            "column_2": "GB31482199",
            "PrizeRank": "6",
            "column_1": "é»ƒOåª›"
        },
        {
            "column_2": "GB29535138",
            "PrizeRank": "6",
            "column_1": "æŽOåª›"
        },
        {
            "column_2": "GB35324461",
            "PrizeRank": "6",
            "column_1": "ç´€Oå²‘"
        },
        {
            "column_2": "GB46528396",
            "PrizeRank": "6",
            "column_1": "é»ƒOç¿”"
        },
        {
            "column_2": "38874089",
            "PrizeRank": "6",
            "column_1": "å“Oå­º"
        },
        {
            "column_2": "GB35552918",
            "PrizeRank": "6",
            "column_1": "å‘‚OéŠ˜"
        },
        {
            "column_2": "GE34683462",
            "PrizeRank": "6",
            "column_1": "é™³OOèŠ¬"
        },
        {
            "column_2": "GL86557547",
            "PrizeRank": "6",
            "column_1": "æ½˜Oè³¢"
        },
        {
            "column_2": "GB48557636",
            "PrizeRank": "6",
            "column_1": "åŠ‰Oæ½”"
        },
        {
            "column_2": "GB51046552",
            "PrizeRank": "6",
            "column_1": "åŠ‰Oç‘¤"
        },
        {
            "column_2": "GB40105068",
            "PrizeRank": "6",
            "column_1": "æŽOèŒ¹"
        },
        {
            "column_2": "GB51130410",
            "PrizeRank": "6",
            "column_1": "è³´OèŠ¬"
        },
        {
            "column_2": "GB39381714",
            "PrizeRank": "6",
            "column_1": "å¼µOç‘©"
        },
        {
            "column_2": "GE41998979",
            "PrizeRank": "6",
            "column_1": "å‘¨Oç”·"
        },
        {
            "column_2": "GE19670319",
            "PrizeRank": "6",
            "column_1": "å¼µOä»"
        },
        {
            "column_2": "GB38840649",
            "PrizeRank": "6",
            "column_1": "è¨±Oæ…§"
        },
        {
            "column_2": "GB49563597",
            "PrizeRank": "6",
            "column_1": "æœ±Oç´…"
        },
        {
            "column_2": "GB59930649",
            "PrizeRank": "6",
            "column_1": "é‚±Oå©·"
        },
        {
            "column_2": "GB27033017",
            "PrizeRank": "6",
            "column_1": "é„­Oç¥¥"
        },
        {
            "column_2": "GB40408808",
            "PrizeRank": "6",
            "column_1": "å¼µOå®"
        },
        {
            "column_2": "GE17682812",
            "PrizeRank": "6",
            "column_1": "é¾”Oé›€"
        },
        {
            "column_2": "GB64973709",
            "PrizeRank": "6",
            "column_1": "æž—Oå‚‘"
        },
        {
            "column_2": "GB-42462213",
            "PrizeRank": "6",
            "column_1": "å°¹Oæ™´"
        },
        {
            "column_2": "JA64517013",
            "PrizeRank": "6",
            "column_1": "æŽOéŒ¦"
        },
        {
            "column_2": "JA52819147",
            "PrizeRank": "6",
            "column_1": "é—•Oæš„"
        },
        {
            "column_2": "JA-58552187",
            "PrizeRank": "6",
            "column_1": "æ¥ŠOå®‡"
        },
        {
            "column_2": "JA56716097",
            "PrizeRank": "6",
            "column_1": "é‚±Oè"
        },
        {
            "column_2": "JA70310247",
            "PrizeRank": "6",
            "column_1": "å‘¨Oå‡±"
        },
        {
            "column_2": "JL41750012",
            "PrizeRank": "6",
            "column_1": "é™³Oæ–"
        },
        {
            "column_2": "JA68301551",
            "PrizeRank": "6",
            "column_1": "é™³Oç¿”"
        },
        {
            "column_2": "GB47327473",
            "PrizeRank": "6",
            "column_1": "æž—Oç«‹"
        },
        {
            "column_2": "JA-69384452",
            "PrizeRank": "6",
            "column_1": "æŽOç¿°"
        },
        {
            "column_2": "JA56879344",
            "PrizeRank": "6",
            "column_1": "è³´OèŠ¬"
        },
        {
            "column_2": "JV26608045",
            "PrizeRank": "6",
            "column_1": "ç°¡Oå»·"
        },
        {
            "column_2": "JA61843148",
            "PrizeRank": "6",
            "column_1": "æž—Oæ–‡"
        },
        {
            "column_2": "JA58799961",
            "PrizeRank": "6",
            "column_1": "å»–Oé›„"
        },
        {
            "column_2": "GE25978693",
            "PrizeRank": "6",
            "column_1": "å½­Oå¤«"
        },
        {
            "column_2": "GL85548692",
            "PrizeRank": "6",
            "column_1": "æ¥ŠOå‚‘"
        },
        {
            "column_2": "GE37122241",
            "PrizeRank": "7",
            "column_1": "èŽŠOæŸ”"
        },
        {
            "column_2": "GE-39557067",
            "PrizeRank": "7",
            "column_1": "æœ±Oå¯§"
        },
        {
            "column_2": "GE34032984",
            "PrizeRank": "7",
            "column_1": "ä½•Oè•™"
        },
        {
            "column_2": "GB21066964",
            "PrizeRank": "7",
            "column_1": "è”¡Oä¿"
        },
        {
            "column_2": "GB25591489",
            "PrizeRank": "7",
            "column_1": "æ–¹Oæ€¡"
        },
        {
            "column_2": "GB15883577",
            "PrizeRank": "7",
            "column_1": "é»ƒOæ¡“"
        },
        {
            "column_2": "GE-38265160",
            "PrizeRank": "7",
            "column_1": "ç¿Oå€«"
        },
        {
            "column_2": "GC28110511",
            "PrizeRank": "7",
            "column_1": "éƒ­Oè³¢"
        },
        {
            "column_2": "GE43440362",
            "PrizeRank": "7",
            "column_1": "é™³Oæ©"
        },
        {
            "column_2": "GB15955932",
            "PrizeRank": "7",
            "column_1": "é™³Oå›"
        },
        {
            "column_2": "GB31959026",
            "PrizeRank": "7",
            "column_1": "ç¾…Oç¶¾"
        },
        {
            "column_2": "GA89258454",
            "PrizeRank": "7",
            "column_1": "èŒƒOå®œ"
        },
        {
            "column_2": "GB28988187",
            "PrizeRank": "7",
            "column_1": "è¶™Oå–¬"
        },
        {
            "column_2": "GB19814979",
            "PrizeRank": "7",
            "column_1": "æ¸¸Oæ…§"
        },
        {
            "column_2": "GB35739589",
            "PrizeRank": "7",
            "column_1": "æž—Oå¿ƒ"
        },
        {
            "column_2": "GB27257113",
            "PrizeRank": "7",
            "column_1": "é™³Oé›²"
        },
        {
            "column_2": "GB33936528",
            "PrizeRank": "7",
            "column_1": "å­«Oç¿Ž"
        },
        {
            "column_2": "GB24477955",
            "PrizeRank": "7",
            "column_1": "è¶™OèŠ¯"
        },
        {
            "column_2": "GB34107697",
            "PrizeRank": "7",
            "column_1": "æž—Oå»·"
        },
        {
            "column_2": "GB20094095",
            "PrizeRank": "7",
            "column_1": "æŽOå¦‚"
        },
        {
            "column_2": "GE34063334",
            "PrizeRank": "7",
            "column_1": "æŽOæ½”"
        },
        {
            "column_2": "GB33596467",
            "PrizeRank": "7",
            "column_1": "å¼µOå„€"
        },
        {
            "column_2": "GL-90029208",
            "PrizeRank": "7",
            "column_1": "æž—Oä½‘"
        },
        {
            "column_2": "GB19688553",
            "PrizeRank": "7",
            "column_1": "é™³Oä¼Ž"
        },
        {
            "column_2": "GA85833834",
            "PrizeRank": "7",
            "column_1": "æ›¹Oæƒ "
        },
        {
            "column_2": "GB37809100",
            "PrizeRank": "7",
            "column_1": "æž—Oå€«"
        },
        {
            "column_2": "GB33517981",
            "PrizeRank": "7",
            "column_1": "æ±ªOæž—"
        },
        {
            "column_2": "GB39487176",
            "PrizeRank": "7",
            "column_1": "å§šOéˆº"
        },
        {
            "column_2": "GB46758624",
            "PrizeRank": "7",
            "column_1": "é™³OçœŸ"
        },
        {
            "column_2": "GB51190521",
            "PrizeRank": "7",
            "column_1": "è”¡Oé”"
        },
        {
            "column_2": "GE44558915",
            "PrizeRank": "7",
            "column_1": "åŠ‰Oæ³“"
        },
        {
            "column_2": "GB33820268",
            "PrizeRank": "7",
            "column_1": "é»ƒOèŠ³"
        },
        {
            "column_2": "GE23773003",
            "PrizeRank": "7",
            "column_1": "ç›§Oå‰"
        },
        {
            "column_2": "GB45021499",
            "PrizeRank": "7",
            "column_1": "åŠ‰Oæ¬£"
        },
        {
            "column_2": "GB37153335",
            "PrizeRank": "7",
            "column_1": "é»ƒOç¶±"
        },
        {
            "column_2": "GB41418512",
            "PrizeRank": "7",
            "column_1": "æž—Oè‘³"
        },
        {
            "column_2": "GE23772047",
            "PrizeRank": "7",
            "column_1": "è¨±Oè“®"
        },
        {
            "column_2": "GB34908791",
            "PrizeRank": "7",
            "column_1": "åŠ‰Oæ€¡"
        },
        {
            "column_2": "GB-33571236",
            "PrizeRank": "7",
            "column_1": "æœOè“‰"
        },
        {
            "column_2": "HK35731289",
            "PrizeRank": "7",
            "column_1": "æŽOèŒ¹"
        },
        {
            "column_2": "GE19209045",
            "PrizeRank": "7",
            "column_1": "æ¥ŠOæ£‹"
        },
        {
            "column_2": "GB50615934",
            "PrizeRank": "7",
            "column_1": "é™³Oè»’"
        },
        {
            "column_2": "GH24804229",
            "PrizeRank": "7",
            "column_1": "æž—Oé™µ"
        },
        {
            "column_2": "GL93686854",
            "PrizeRank": "7",
            "column_1": "å»–Oå©·"
        },
        {
            "column_2": "JA87199226",
            "PrizeRank": "7",
            "column_1": "å¼µOåœ‹"
        },
        {
            "column_2": "JA69677840",
            "PrizeRank": "7",
            "column_1": "è”¡Oå¦"
        },
        {
            "column_2": "GB53146093",
            "PrizeRank": "7",
            "column_1": "é™³Oå¹¸"
        },
        {
            "column_2": "JA-70700445",
            "PrizeRank": "7",
            "column_1": "é»ƒOéœ–"
        },
        {
            "column_2": "JA76163526",
            "PrizeRank": "7",
            "column_1": "é™³Oè‰¯"
        },
        {
            "column_2": "GB31646169",
            "PrizeRank": "7",
            "column_1": "é»ƒOå€«"
        },
        {
            "column_2": "JA77330522",
            "PrizeRank": "7",
            "column_1": "çŽ‹OçŽ²"
        },
        {
            "column_2": "JA60533386",
            "PrizeRank": "7",
            "column_1": "é»ƒOæ¦†"
        },
        {
            "column_2": "JV21189016",
            "PrizeRank": "7",
            "column_1": "ç›§Oæ¬£"
        },
        {
            "column_2": "JA85411216",
            "PrizeRank": "7",
            "column_1": "å¾Oä½‘"
        },
        {
            "column_2": "JR48850376",
            "PrizeRank": "7",
            "column_1": "å¼µOæ–‡"
        },
        {
            "column_2": "JA57483947",
            "PrizeRank": "7",
            "column_1": "å¼µOç€š"
        },
        {
            "column_2": "JA89217172",
            "PrizeRank": "7",
            "column_1": "è¨±Oè"
        },
        {
            "column_2": "JV03284783",
            "PrizeRank": "7",
            "column_1": "æ¥ŠOæ˜Ž"
        },
        {
            "column_2": "GL95609978",
            "PrizeRank": "7",
            "column_1": "åŠ‰Oç‘„"
        },
        {
            "column_2": "JV18132209",
            "PrizeRank": "7",
            "column_1": "å¾Oæƒ "
        },
        {
            "column_2": "GE36010271",
            "PrizeRank": "8",
            "column_1": "çŽ‹Oç¿”"
        },
        {
            "column_2": "GB13116765",
            "PrizeRank": "8",
            "column_1": "é»ƒOæ•"
        },
        {
            "column_2": "GE37301378",
            "PrizeRank": "8",
            "column_1": "è”¡Oå®¶"
        },
        {
            "column_2": "GE37306388",
            "PrizeRank": "8",
            "column_1": "çŽ‹Oæ¶µ"
        },
        {
            "column_2": "GB26037873",
            "PrizeRank": "8",
            "column_1": "å¼µOæ€¡"
        },
        {
            "column_2": "GE37142366",
            "PrizeRank": "8",
            "column_1": "ä½•Oç‘¤"
        },
        {
            "column_2": "GB29965838",
            "PrizeRank": "8",
            "column_1": "å¾Oç©—"
        },
        {
            "column_2": "GC26359654",
            "PrizeRank": "8",
            "column_1": "é»ƒOç‘‹"
        },
        {
            "column_2": "GB-28430818",
            "PrizeRank": "8",
            "column_1": "éƒ­Oç³"
        },
        {
            "column_2": "GB29758473",
            "PrizeRank": "8",
            "column_1": "é™³Oè’‚"
        },
        {
            "column_2": "GB29043828",
            "PrizeRank": "8",
            "column_1": "è¬Oå­"
        },
        {
            "column_2": "GB-29889510",
            "PrizeRank": "8",
            "column_1": "è¢Oæƒ "
        },
        {
            "column_2": "GB38589232",
            "PrizeRank": "8",
            "column_1": "è”¡Oå›"
        },
        {
            "column_2": "GB-28823787",
            "PrizeRank": "8",
            "column_1": "æ¥ŠOå¦‚"
        },
        {
            "column_2": "GB33913075",
            "PrizeRank": "8",
            "column_1": "é™³Oè“®"
        },
        {
            "column_2": "GB23013748",
            "PrizeRank": "8",
            "column_1": "é™³Oæº"
        },
        {
            "column_2": "50903799",
            "PrizeRank": "8",
            "column_1": "é„§Oæ¯…"
        },
        {
            "column_2": "GB-44734643",
            "PrizeRank": "8",
            "column_1": "éƒ­Oå›"
        },
        {
            "column_2": "GB23007669",
            "PrizeRank": "8",
            "column_1": "é™³Oæ±"
        },
        {
            "column_2": "GB30389111",
            "PrizeRank": "8",
            "column_1": "é„§Oè"
        },
        {
            "column_2": "GE42500992",
            "PrizeRank": "8",
            "column_1": "é¾”Oç¿Ž"
        },
        {
            "column_2": "GL85899716",
            "PrizeRank": "8",
            "column_1": "æŽOéœˆ"
        },
        {
            "column_2": "GT-11237931",
            "PrizeRank": "8",
            "column_1": "å‘¨Oå®¸"
        },
        {
            "column_2": "GB31410217",
            "PrizeRank": "8",
            "column_1": "é™³Oç’‡"
        },
        {
            "column_2": "GB44546557",
            "PrizeRank": "8",
            "column_1": "å¼µOæ›„"
        },
        {
            "column_2": "D270003437",
            "PrizeRank": "8",
            "column_1": "éº¥Oæ¬£"
        },
        {
            "column_2": "GB-38957564",
            "PrizeRank": "8",
            "column_1": "è¬Oæ±"
        },
        {
            "column_2": "GB43153385",
            "PrizeRank": "8",
            "column_1": "ç°¡Oç”°"
        },
        {
            "column_2": "GB35012645",
            "PrizeRank": "8",
            "column_1": "æŽOå»·"
        },
        {
            "column_2": "GS97923951",
            "PrizeRank": "8",
            "column_1": "ç›§Oç¿°"
        },
        {
            "column_2": "GB-44924191",
            "PrizeRank": "8",
            "column_1": "è©¹Oçº"
        },
        {
            "column_2": "GB42546200",
            "PrizeRank": "8",
            "column_1": "é™³Oå®œ"
        },
        {
            "column_2": "GB33842037",
            "PrizeRank": "8",
            "column_1": "é„­OçŽ²"
        },
        {
            "column_2": "GB47464765",
            "PrizeRank": "8",
            "column_1": "æ¢Oåˆ"
        },
        {
            "column_2": "GB35715571",
            "PrizeRank": "8",
            "column_1": "æž—Oèªž"
        },
        {
            "column_2": "GB39766007",
            "PrizeRank": "8",
            "column_1": "å¼µOå©·"
        },
        {
            "column_2": "GB40296281",
            "PrizeRank": "8",
            "column_1": "é‚±Oç’¿"
        },
        {
            "column_2": "GB27449451",
            "PrizeRank": "8",
            "column_1": "å¼µOè“®"
        },
        {
            "column_2": "GC26402238",
            "PrizeRank": "8",
            "column_1": "é™³OOèŠ¬"
        },
        {
            "column_2": "GE28155650",
            "PrizeRank": "8",
            "column_1": "è”¡Oé›„"
        },
        {
            "column_2": "39696269",
            "PrizeRank": "8",
            "column_1": "æŸ¯Oå²·"
        },
        {
            "column_2": "GE35534214",
            "PrizeRank": "8",
            "column_1": "æœ±Oå®‰"
        },
        {
            "column_2": "GB45179596",
            "PrizeRank": "8",
            "column_1": "å‘¨Oæ›„"
        },
        {
            "column_2": "GB48664949",
            "PrizeRank": "8",
            "column_1": "è–›Oæ¢…"
        },
        {
            "column_2": "GB-35163596",
            "PrizeRank": "8",
            "column_1": "åº·Oæ˜€"
        },
        {
            "column_2": "GB50487616",
            "PrizeRank": "8",
            "column_1": "è”¡Oç‘œ"
        },
        {
            "column_2": "GE41985678",
            "PrizeRank": "8",
            "column_1": "æŽOè«­"
        },
        {
            "column_2": "GB49099521",
            "PrizeRank": "8",
            "column_1": "ä½•Oæ–‡"
        },
        {
            "column_2": "GB21463700",
            "PrizeRank": "8",
            "column_1": "è’²Oè€•"
        },
        {
            "column_2": "GB33507126",
            "PrizeRank": "8",
            "column_1": "è”¡Oå‘ˆ"
        },
        {
            "column_2": "GB41258538",
            "PrizeRank": "8",
            "column_1": "ç«¥Oç”„"
        },
        {
            "column_2": "GB54834196",
            "PrizeRank": "8",
            "column_1": "æŽOå¿ "
        },
        {
            "column_2": "GE38135252",
            "PrizeRank": "8",
            "column_1": "é»ƒOå¬Œ"
        },
        {
            "column_2": "GB45486099",
            "PrizeRank": "8",
            "column_1": "æ´ªOè˜‹"
        },
        {
            "column_2": "GE41572450",
            "PrizeRank": "8",
            "column_1": "çŽ‹Oè¯"
        },
        {
            "column_2": "GB45253574",
            "PrizeRank": "8",
            "column_1": "æ¸¸Oé›…"
        },
        {
            "column_2": "GB45497494",
            "PrizeRank": "8",
            "column_1": "æž—Oè±"
        },
        {
            "column_2": "GB50473866",
            "PrizeRank": "8",
            "column_1": "é„­Oæ¬"
        },
        {
            "column_2": "JA71626690",
            "PrizeRank": "8",
            "column_1": "è³´Oå¦˜"
        },
        {
            "column_2": "JA53597342",
            "PrizeRank": "8",
            "column_1": "æ½˜Oå‡¡"
        },
        {
            "column_2": "JA69168670",
            "PrizeRank": "8",
            "column_1": "é™³Oå®"
        },
        {
            "column_2": "JA54077259",
            "PrizeRank": "8",
            "column_1": "ç§¦Oæ…§"
        },
        {
            "column_2": "JV02910999",
            "PrizeRank": "8",
            "column_1": "é™³Oè’¨"
        },
        {
            "column_2": "GB55123198",
            "PrizeRank": "8",
            "column_1": "å§šOéˆº"
        },
        {
            "column_2": "JA-63023961",
            "PrizeRank": "8",
            "column_1": "æŽOç¶¾"
        },
        {
            "column_2": "JA74692017",
            "PrizeRank": "8",
            "column_1": "æ´ªOè²ž"
        },
        {
            "column_2": "GB39184544",
            "PrizeRank": "8",
            "column_1": "è˜‡Oç¢©"
        },
        {
            "column_2": "GE23795001",
            "PrizeRank": "8",
            "column_1": "æŽOèŠ³"
        },
        {
            "column_2": "GC95695359",
            "PrizeRank": "8",
            "column_1": "çŽ‹Oç‘œ"
        },
        {
            "column_2": "JA55798186",
            "PrizeRank": "8",
            "column_1": "è¶™Oç‘œ"
        },
        {
            "column_2": "JL43073291",
            "PrizeRank": "8",
            "column_1": "è‘£Oç‘„"
        },
        {
            "column_2": "JA54905217",
            "PrizeRank": "8",
            "column_1": "éƒ­Oæƒ "
        },
        {
            "column_2": "GE37123437",
            "PrizeRank": "8",
            "column_1": "è¬OèŠ¬"
        },
        {
            "column_2": "GE37133609",
            "PrizeRank": "8",
            "column_1": "é»ƒOæ…§"
        },
        {
            "column_2": "JV24308090",
            "PrizeRank": "8",
            "column_1": "é»ƒOéœ–"
        },
        {
            "column_2": "JA86404251",
            "PrizeRank": "8",
            "column_1": "è•­Oé›„"
        },
        {
            "column_2": "JA86404250",
            "PrizeRank": "8",
            "column_1": "å¼µOç"
        },
        {
            "column_2": "GT47643206",
            "PrizeRank": "8",
            "column_1": "ç¿Oæ…§"
        },
        {
            "column_2": "JV19759658",
            "PrizeRank": "8",
            "column_1": "å½­Oå¤«"
        },
        {
            "column_2": "JA81362580",
            "PrizeRank": "8",
            "column_1": "é™³Oå©·"
        },


    ]);

    const [item, setItem] = useState({});

    const groupedData = listData.reduce((acc, item) => {
        // Ensure PrizeRank is a string or number
        const rank = item.PrizeRank;

        // Create a new group if it doesn't exist
        if (!acc[rank]) {
            acc[rank] = [];
        }

        // Push item into corresponding PrizeRank group
        acc[rank].push(item);

        return acc;
    }, {});


    const prizeMapping = {
        "1": "é ­çŽ: é›™äººé¦–çˆ¾ä¾†å›žæ©Ÿç¥¨",
        "2": "äºŒçŽ: ä¸¹å¯§åŒ…+ç‡™å¸ƒè²¼",
        "3": "ä¸‰çŽ: å…”å…”å£è¢‹çŸ­T",
        "4": "å…¶ä»–: æ¼”å”±æœƒæ‡‰æ´åŒ…",
        "5": "ç‡Ÿå¤šæ‹Œç‚’éºµä¹™ç®±",
        "6": "å…”å…”åŠé£¾",
        "7": "Pixelé€ åž‹é‘°åŒ™åœˆçµ„åˆ-éš¨æ©Ÿ ",
        "8": "è²¼ç´™çµ„åˆ",
    };

    return (
        <>
            <div id={id} className="col-12 pattern-background vh-100 w-100 d-flex justify-content-center align-items-center px-0 page-section position-relative">


                <div className="position-absolute">

                    <div className="card shadow position-relative row card-desktop-5 px-4"  >

                        <div style={{ maxHeight: "70vh", overflow: "auto" }} className="py-5 ps-4">


                            <div className="row">
                                <div className="col-12 fw-semi-bold mb-4 fs-4">
                                    ä¸­çŽåå–®
                                </div>

                                <ol className="text-start ps-5">
                                    <li>
                                        å¾—çŽè€…åœ¨2æœˆ28æ—¥å‰å°‡ç™¼ç¥¨æ­£æœ¬å¯„å‡ºï¼Œé€¾æœŸå‰‡è‡ªå‹•æ”¾æ£„çŽå“ã€‚<br></br>
                                        ä¸­çŽç™¼ç¥¨ç¶“äºˆä¸»è¾¦å–®ä½å¾Œï¼Œå°‡ä¸äºˆé€€é‚„ï¼Œç”±ä¸»è¾¦å–®ä½å…¨æ•¸è½‰æäºˆä¼Šç”¸åŸºé‡‘æœƒã€‚<br></br>
                                        æ”¶åˆ°å…ŒçŽäººç™¼ç¥¨å¾Œï¼Œä¸»è¾¦å–®ä½æœƒå†æ¬¡æ ¸å¯¦ï¼Œå¦‚ç™¼ç¥¨å…§å®¹èˆ‡æ´»å‹•æ¢ä»¶ä¸ç¬¦å°‡å–æ¶ˆä¸­çŽè³‡æ ¼ã€‚<br></br>
                                        <br></br>
                                        è«‹æŠŠç™¼ç¥¨æ­£æœ¬å¯„åˆ°ä»¥ä¸‹åœ°å€:<br></br>
                                        ç‡Ÿå¤šé£Ÿå“æœ‰é™å…¬å¸<br></br>
                                        å°åŒ—å¸‚å¤§åŒå€æ‰¿å¾·è·¯ä¸‰æ®µ232è™Ÿ3æ¨“308å®¤<br></br>
                                        02-2596-8296<br></br>
                                        <br></br>
                                    </li>
                                    <li>
                                        å¾—çŽè€…éœ€å¡«å¯« google è¡¨å–®å…Œæ›çŽå“<br></br>
                                        è¡¨å–®é€£çµ: <a href="https://forms.gle/MhgmyyKWJKCSbUos6" target="blank_">https://forms.gle/MhgmyyKWJKCSbUos6</a>
                                        <br></br>
                                    </li>
                                    <li>
                                        æ‰€æœ‰çŽå“å°‡æ–¼3æœˆåº•å‰å¯„å‡ºå®Œç•¢ã€‚ æœƒé™„ä¸Šç°½æ”¶å–®ï¼Œå¾—çŽè€…æ”¶åˆ°å¾Œå¿…é ˆå›žç°½ä¸¦æ‹ç…§å›žå‚³è‡ªIG:  indomie.twã€‚
                                    </li>
                                    <li>
                                        å…¶ä»–è³‡è¨Šä¹Ÿæ­¡è¿Žåœ¨Â IGÂ ç§è¨Šæ´»å‹•å°ç·¨ã€‚
                                    </li>

                                </ol>

                                <div className="col-12 mt-3">
                                    <div className="table-responsive">

                                        {Object.keys(groupedData).map((rank) => (
                                            <table className="table table-sm table-striped" key={rank} border="1" style={{ marginBottom: "20px", width: "100%" }}>
                                                <thead>
                                                    <tr style={{ background: rank === "1" ? "red" : rank === "2" ? "blue" : "gray", color: "white" }}>
                                                        <th colSpan="7">{prizeMapping[rank] || `Prize Rank ${rank}`}</th>
                                                    </tr>
                                                    <tr>
                                                        <th> # </th>
                                                        <th> å§“å</th>
                                                        <th> çµ±ä¸€ç™¼ç¥¨è™Ÿç¢¼ </th>

                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {groupedData[rank].map((item, index) => (
                                                        <tr key={index}>
                                                            <td>{index + 1}</td>
                                                            <td>{item.column_1}</td>
                                                            <td>{item.column_2}</td>

                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ))}


                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>

            </div >
        </>

    )
}

export default ListWinnerPublic




