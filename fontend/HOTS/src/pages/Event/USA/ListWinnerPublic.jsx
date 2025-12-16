import { useState } from "react";

function ListWinnerPublic({ id }) {

    const [listData, setListData] = useState([

        {
            "column_2": "BG19932699",
            "PrizeRank": "1",
            "column_1": "朱O利"
        },
        {
            "column_2": "GS76193284",
            "PrizeRank": "2",
            "column_1": "羅O安"
        },
        {
            "column_2": "GE33872697",
            "PrizeRank": "2",
            "column_1": "林O文"
        },
        {
            "column_2": "GA86823330",
            "PrizeRank": "2",
            "column_1": "張O鴻"
        },
        {
            "column_2": "GB23980853",
            "PrizeRank": "2",
            "column_1": "王O云"
        },
        {
            "column_2": "GB-32322281",
            "PrizeRank": "2",
            "column_1": "劉O豐"
        },
        {
            "column_2": "GB30726294",
            "PrizeRank": "2",
            "column_1": "林O揚"
        },
        {
            "column_2": "GB21559137",
            "PrizeRank": "2",
            "column_1": "林O臻"
        },
        {
            "column_2": "GE33023718",
            "PrizeRank": "2",
            "column_1": "許O菘"
        },
        {
            "column_2": "GB-25977281",
            "PrizeRank": "2",
            "column_1": "黃O偉"
        },
        {
            "column_2": "GB42981025",
            "PrizeRank": "2",
            "column_1": "陳O柘"
        },
        {
            "column_2": "GB37060442",
            "PrizeRank": "2",
            "column_1": "劉O豐"
        },
        {
            "column_2": "GB43250853",
            "PrizeRank": "2",
            "column_1": "羅O蓮"
        },
        {
            "column_2": "GB-31322783",
            "PrizeRank": "2",
            "column_1": "林O昇"
        },
        {
            "column_2": "GE23249737",
            "PrizeRank": "2",
            "column_1": "張O枝"
        },
        {
            "column_2": "GB49643008",
            "PrizeRank": "2",
            "column_1": "林O賢"
        },
        {
            "column_2": "GB-44685044",
            "PrizeRank": "2",
            "column_1": "王O博"
        },
        {
            "column_2": "GB58709357",
            "PrizeRank": "2",
            "column_1": "黃O糴"
        },
        {
            "column_2": "JA-81168550",
            "PrizeRank": "2",
            "column_1": "王O淇"
        },
        {
            "column_2": "JK51831665",
            "PrizeRank": "2",
            "column_1": "紀O群"
        },
        {
            "column_2": "JL41181203",
            "PrizeRank": "2",
            "column_1": "徐O億"
        },
        {
            "column_2": "JA54690210",
            "PrizeRank": "2",
            "column_1": "林O儀"
        },
        {
            "column_2": "JV20108476",
            "PrizeRank": "2",
            "column_1": "李O"
        },
        {
            "column_2": "JA59098672",
            "PrizeRank": "2",
            "column_1": "盧O云"
        },
        {
            "column_2": "JA66087309",
            "PrizeRank": "2",
            "column_1": "楊O瑜"
        },
        {
            "column_2": "JA29087041",
            "PrizeRank": "2",
            "column_1": "何O燕"
        },
        {
            "column_2": "GN30176322",
            "PrizeRank": "3",
            "column_1": "余O德"
        },
        {
            "column_2": "GB-31406587",
            "PrizeRank": "3",
            "column_1": "游O婷"
        },
        {
            "column_2": "GE39586572",
            "PrizeRank": "3",
            "column_1": "楊O毅"
        },
        {
            "column_2": "GB02423477",
            "PrizeRank": "3",
            "column_1": "蔡O清"
        },
        {
            "column_2": "GB29141278",
            "PrizeRank": "3",
            "column_1": "陳O頻"
        },
        {
            "column_2": "GT46784082",
            "PrizeRank": "3",
            "column_1": "郭O"
        },
        {
            "column_2": "GB13906305",
            "PrizeRank": "3",
            "column_1": "李O欽"
        },
        {
            "column_2": "GN-90519492",
            "PrizeRank": "3",
            "column_1": "吳O菡"
        },
        {
            "column_2": "GB41972763",
            "PrizeRank": "3",
            "column_1": "尤O瑩"
        },
        {
            "column_2": "GB4130692",
            "PrizeRank": "3",
            "column_1": "王O昌"
        },
        {
            "column_2": "GE36778461",
            "PrizeRank": "3",
            "column_1": "陳O汝"
        },
        {
            "column_2": "GB44445879",
            "PrizeRank": "3",
            "column_1": "廖O喬"
        },
        {
            "column_2": "50440100",
            "PrizeRank": "3",
            "column_1": "梁O暐"
        },
        {
            "column_2": "GB50295750",
            "PrizeRank": "3",
            "column_1": "陳O伶"
        },
        {
            "column_2": "GB27594873",
            "PrizeRank": "3",
            "column_1": "林O萍"
        },
        {
            "column_2": "GB-45815196",
            "PrizeRank": "3",
            "column_1": "林O容"
        },
        {
            "column_2": "GE41989214",
            "PrizeRank": "3",
            "column_1": "李O萱"
        },
        {
            "column_2": "GE20890714",
            "PrizeRank": "3",
            "column_1": "陳O崑"
        },
        {
            "column_2": "GE26916485",
            "PrizeRank": "3",
            "column_1": "葉O合"
        },
        {
            "column_2": "GB-41395553",
            "PrizeRank": "3",
            "column_1": "簡O耘"
        },
        {
            "column_2": "GB50528141",
            "PrizeRank": "3",
            "column_1": "李O穎"
        },
        {
            "column_2": "GB36618252",
            "PrizeRank": "3",
            "column_1": "鍾O丞"
        },
        {
            "column_2": "GB52471755",
            "PrizeRank": "3",
            "column_1": "李O諭"
        },
        {
            "column_2": "GB33807109",
            "PrizeRank": "3",
            "column_1": "蔡O珊"
        },
        {
            "column_2": "GB88997683",
            "PrizeRank": "3",
            "column_1": "陳O安"
        },
        {
            "column_2": "JA65990573",
            "PrizeRank": "3",
            "column_1": "洪O峯"
        },
        {
            "column_2": "JL42442482",
            "PrizeRank": "3",
            "column_1": "張O遠"
        },
        {
            "column_2": "JA78144523",
            "PrizeRank": "3",
            "column_1": "黃O民"
        },
        {
            "column_2": "JV26063168",
            "PrizeRank": "3",
            "column_1": "周O麒"
        },
        {
            "column_2": "GA79091519",
            "PrizeRank": "3",
            "column_1": "詹O婕"
        },
        {
            "column_2": "JA73978719",
            "PrizeRank": "3",
            "column_1": "黃O葵"
        },
        {
            "column_2": "JA-75792449",
            "PrizeRank": "3",
            "column_1": "陳O志"
        },
        {
            "column_2": "JA86953257",
            "PrizeRank": "3",
            "column_1": "王O晏"
        },
        {
            "column_2": "JA89905032",
            "PrizeRank": "3",
            "column_1": "簡O欣"
        },
        {
            "column_2": "JA89905031",
            "PrizeRank": "3",
            "column_1": "簡OO妹"
        },
        {
            "column_2": "GC28115077",
            "PrizeRank": "4",
            "column_1": "吳O蓉"
        },
        {
            "column_2": "GE-38259375",
            "PrizeRank": "4",
            "column_1": "蘇O馨"
        },
        {
            "column_2": "GS27146521",
            "PrizeRank": "4",
            "column_1": "卓O誼"
        },
        {
            "column_2": "GB20211329",
            "PrizeRank": "4",
            "column_1": "蘇O霓"
        },
        {
            "column_2": "GB-13603463",
            "PrizeRank": "4",
            "column_1": "鍾O煌"
        },
        {
            "column_2": "GP25781907",
            "PrizeRank": "4",
            "column_1": "徐O霄"
        },
        {
            "column_2": "GZ12642711",
            "PrizeRank": "4",
            "column_1": "陳O燕"
        },
        {
            "column_2": "GB30147067",
            "PrizeRank": "4",
            "column_1": "張O誠"
        },
        {
            "column_2": "GB37941742",
            "PrizeRank": "4",
            "column_1": "白O宸"
        },
        {
            "column_2": "GB48176394",
            "PrizeRank": "4",
            "column_1": "黃O惠"
        },
        {
            "column_2": "GB-36941616",
            "PrizeRank": "4",
            "column_1": "彭O琪"
        },
        {
            "column_2": "GB24558004",
            "PrizeRank": "4",
            "column_1": "曾O睿"
        },
        {
            "column_2": "GB-30014068",
            "PrizeRank": "4",
            "column_1": "廖O佑"
        },
        {
            "column_2": "GB23835711",
            "PrizeRank": "4",
            "column_1": "張O優"
        },
        {
            "column_2": "GB33704357",
            "PrizeRank": "4",
            "column_1": "鄭O臻"
        },
        {
            "column_2": "GB37074511",
            "PrizeRank": "4",
            "column_1": "葉O原"
        },
        {
            "column_2": "GH25997152",
            "PrizeRank": "4",
            "column_1": "蘇O晟"
        },
        {
            "column_2": "GB-30544479",
            "PrizeRank": "4",
            "column_1": "陳O甄"
        },
        {
            "column_2": "GB43906951",
            "PrizeRank": "4",
            "column_1": "廖O懿"
        },
        {
            "column_2": "GB41477179",
            "PrizeRank": "4",
            "column_1": "陳O廷"
        },
        {
            "column_2": "GE34514112",
            "PrizeRank": "4",
            "column_1": "賴O聰"
        },
        {
            "column_2": "GB43739796",
            "PrizeRank": "4",
            "column_1": "蘇O絜"
        },
        {
            "column_2": "GM90094374",
            "PrizeRank": "4",
            "column_1": "陳O志"
        },
        {
            "column_2": "GB27727136",
            "PrizeRank": "4",
            "column_1": "張O雯"
        },
        {
            "column_2": "GH31411231",
            "PrizeRank": "4",
            "column_1": "陳O斌"
        },
        {
            "column_2": "GB39248254",
            "PrizeRank": "4",
            "column_1": "周O佑"
        },
        {
            "column_2": "GB51932223",
            "PrizeRank": "4",
            "column_1": "鄭O玉"
        },
        {
            "column_2": "GB-31108118",
            "PrizeRank": "4",
            "column_1": "陳O恩"
        },
        {
            "column_2": "GB35345446",
            "PrizeRank": "4",
            "column_1": "黃O在"
        },
        {
            "column_2": "JA60019725",
            "PrizeRank": "4",
            "column_1": "陳O慧"
        },
        {
            "column_2": "GB53721183",
            "PrizeRank": "4",
            "column_1": "陳O淮"
        },
        {
            "column_2": "JA56757334",
            "PrizeRank": "4",
            "column_1": "蘇O蓁"
        },
        {
            "column_2": "JA85775403",
            "PrizeRank": "4",
            "column_1": "張O欣"
        },
        {
            "column_2": "GE37114954",
            "PrizeRank": "4",
            "column_1": "黃O祈"
        },
        {
            "column_2": "GE37127858",
            "PrizeRank": "4",
            "column_1": "黃O毅"
        },
        {
            "column_2": "GE37133610",
            "PrizeRank": "4",
            "column_1": "謝O眞"
        },
        {
            "column_2": "JA82266590",
            "PrizeRank": "4",
            "column_1": "呂O臻"
        },
        {
            "column_2": "JV05341357",
            "PrizeRank": "4",
            "column_1": "陳O丞"
        },
        {
            "column_2": "JA77673866",
            "PrizeRank": "4",
            "column_1": "劉O婷"
        },
        {
            "column_2": "GE27940112",
            "PrizeRank": "4",
            "column_1": "朱O招"
        },
        {
            "column_2": "GE-38251354",
            "PrizeRank": "5",
            "column_1": "吳O緯"
        },
        {
            "column_2": "GP19895388",
            "PrizeRank": "5",
            "column_1": "周O柔"
        },
        {
            "column_2": "GB31521010",
            "PrizeRank": "5",
            "column_1": "羅O鈞"
        },
        {
            "column_2": "GB33819251",
            "PrizeRank": "5",
            "column_1": "黃O峰"
        },
        {
            "column_2": "GE39603401",
            "PrizeRank": "5",
            "column_1": "王O華"
        },
        {
            "column_2": "GB16536018",
            "PrizeRank": "5",
            "column_1": "廖O妤"
        },
        {
            "column_2": "GB38796701",
            "PrizeRank": "5",
            "column_1": "林O彥"
        },
        {
            "column_2": "GB47775687",
            "PrizeRank": "5",
            "column_1": "張O筑"
        },
        {
            "column_2": "GB50164691",
            "PrizeRank": "5",
            "column_1": "劉O國"
        },
        {
            "column_2": "JJ44492155",
            "PrizeRank": "5",
            "column_1": "謝O辰"
        },
        {
            "column_2": "GE40521694",
            "PrizeRank": "6",
            "column_1": "簡O珊"
        },
        {
            "column_2": "GE-39573606",
            "PrizeRank": "6",
            "column_1": "張O瑜"
        },
        {
            "column_2": "GE36032259",
            "PrizeRank": "6",
            "column_1": "林O秀"
        },
        {
            "column_2": "GB29141279",
            "PrizeRank": "6",
            "column_1": "賴O佑"
        },
        {
            "column_2": "GE-33006531",
            "PrizeRank": "6",
            "column_1": "張O維"
        },
        {
            "column_2": "GB29044673",
            "PrizeRank": "6",
            "column_1": "林O羽"
        },
        {
            "column_2": "GB-34829139",
            "PrizeRank": "6",
            "column_1": "林O宇"
        },
        {
            "column_2": "GE23255941",
            "PrizeRank": "6",
            "column_1": "陳O涵"
        },
        {
            "column_2": "GE34650453",
            "PrizeRank": "6",
            "column_1": "葉O綺"
        },
        {
            "column_2": "GB33230232",
            "PrizeRank": "6",
            "column_1": "洪O容"
        },
        {
            "column_2": "GB24090103",
            "PrizeRank": "6",
            "column_1": "成O睿"
        },
        {
            "column_2": "GB-33311236",
            "PrizeRank": "6",
            "column_1": "陳O尹"
        },
        {
            "column_2": "GB31482199",
            "PrizeRank": "6",
            "column_1": "黃O媛"
        },
        {
            "column_2": "GB29535138",
            "PrizeRank": "6",
            "column_1": "李O媛"
        },
        {
            "column_2": "GB35324461",
            "PrizeRank": "6",
            "column_1": "紀O岑"
        },
        {
            "column_2": "GB46528396",
            "PrizeRank": "6",
            "column_1": "黃O翔"
        },
        {
            "column_2": "38874089",
            "PrizeRank": "6",
            "column_1": "卓O孺"
        },
        {
            "column_2": "GB35552918",
            "PrizeRank": "6",
            "column_1": "呂O銘"
        },
        {
            "column_2": "GE34683462",
            "PrizeRank": "6",
            "column_1": "陳OO芬"
        },
        {
            "column_2": "GL86557547",
            "PrizeRank": "6",
            "column_1": "潘O賢"
        },
        {
            "column_2": "GB48557636",
            "PrizeRank": "6",
            "column_1": "劉O潔"
        },
        {
            "column_2": "GB51046552",
            "PrizeRank": "6",
            "column_1": "劉O瑤"
        },
        {
            "column_2": "GB40105068",
            "PrizeRank": "6",
            "column_1": "李O茹"
        },
        {
            "column_2": "GB51130410",
            "PrizeRank": "6",
            "column_1": "賴O芬"
        },
        {
            "column_2": "GB39381714",
            "PrizeRank": "6",
            "column_1": "張O瑩"
        },
        {
            "column_2": "GE41998979",
            "PrizeRank": "6",
            "column_1": "周O男"
        },
        {
            "column_2": "GE19670319",
            "PrizeRank": "6",
            "column_1": "張O仁"
        },
        {
            "column_2": "GB38840649",
            "PrizeRank": "6",
            "column_1": "許O慧"
        },
        {
            "column_2": "GB49563597",
            "PrizeRank": "6",
            "column_1": "朱O紅"
        },
        {
            "column_2": "GB59930649",
            "PrizeRank": "6",
            "column_1": "邱O婷"
        },
        {
            "column_2": "GB27033017",
            "PrizeRank": "6",
            "column_1": "鄭O祥"
        },
        {
            "column_2": "GB40408808",
            "PrizeRank": "6",
            "column_1": "張O宏"
        },
        {
            "column_2": "GE17682812",
            "PrizeRank": "6",
            "column_1": "龔O雀"
        },
        {
            "column_2": "GB64973709",
            "PrizeRank": "6",
            "column_1": "林O傑"
        },
        {
            "column_2": "GB-42462213",
            "PrizeRank": "6",
            "column_1": "尹O晴"
        },
        {
            "column_2": "JA64517013",
            "PrizeRank": "6",
            "column_1": "李O錦"
        },
        {
            "column_2": "JA52819147",
            "PrizeRank": "6",
            "column_1": "闕O暄"
        },
        {
            "column_2": "JA-58552187",
            "PrizeRank": "6",
            "column_1": "楊O宇"
        },
        {
            "column_2": "JA56716097",
            "PrizeRank": "6",
            "column_1": "邱O萍"
        },
        {
            "column_2": "JA70310247",
            "PrizeRank": "6",
            "column_1": "周O凱"
        },
        {
            "column_2": "JL41750012",
            "PrizeRank": "6",
            "column_1": "陳O斐"
        },
        {
            "column_2": "JA68301551",
            "PrizeRank": "6",
            "column_1": "陳O翔"
        },
        {
            "column_2": "GB47327473",
            "PrizeRank": "6",
            "column_1": "林O立"
        },
        {
            "column_2": "JA-69384452",
            "PrizeRank": "6",
            "column_1": "李O翰"
        },
        {
            "column_2": "JA56879344",
            "PrizeRank": "6",
            "column_1": "賴O芬"
        },
        {
            "column_2": "JV26608045",
            "PrizeRank": "6",
            "column_1": "簡O廷"
        },
        {
            "column_2": "JA61843148",
            "PrizeRank": "6",
            "column_1": "林O文"
        },
        {
            "column_2": "JA58799961",
            "PrizeRank": "6",
            "column_1": "廖O雄"
        },
        {
            "column_2": "GE25978693",
            "PrizeRank": "6",
            "column_1": "彭O夫"
        },
        {
            "column_2": "GL85548692",
            "PrizeRank": "6",
            "column_1": "楊O傑"
        },
        {
            "column_2": "GE37122241",
            "PrizeRank": "7",
            "column_1": "莊O柔"
        },
        {
            "column_2": "GE-39557067",
            "PrizeRank": "7",
            "column_1": "朱O寧"
        },
        {
            "column_2": "GE34032984",
            "PrizeRank": "7",
            "column_1": "何O蕙"
        },
        {
            "column_2": "GB21066964",
            "PrizeRank": "7",
            "column_1": "蔡O俐"
        },
        {
            "column_2": "GB25591489",
            "PrizeRank": "7",
            "column_1": "方O怡"
        },
        {
            "column_2": "GB15883577",
            "PrizeRank": "7",
            "column_1": "黃O桓"
        },
        {
            "column_2": "GE-38265160",
            "PrizeRank": "7",
            "column_1": "翁O倫"
        },
        {
            "column_2": "GC28110511",
            "PrizeRank": "7",
            "column_1": "郭O賢"
        },
        {
            "column_2": "GE43440362",
            "PrizeRank": "7",
            "column_1": "陳O恩"
        },
        {
            "column_2": "GB15955932",
            "PrizeRank": "7",
            "column_1": "陳O君"
        },
        {
            "column_2": "GB31959026",
            "PrizeRank": "7",
            "column_1": "羅O綾"
        },
        {
            "column_2": "GA89258454",
            "PrizeRank": "7",
            "column_1": "范O宜"
        },
        {
            "column_2": "GB28988187",
            "PrizeRank": "7",
            "column_1": "趙O喬"
        },
        {
            "column_2": "GB19814979",
            "PrizeRank": "7",
            "column_1": "游O慧"
        },
        {
            "column_2": "GB35739589",
            "PrizeRank": "7",
            "column_1": "林O心"
        },
        {
            "column_2": "GB27257113",
            "PrizeRank": "7",
            "column_1": "陳O雲"
        },
        {
            "column_2": "GB33936528",
            "PrizeRank": "7",
            "column_1": "孫O翎"
        },
        {
            "column_2": "GB24477955",
            "PrizeRank": "7",
            "column_1": "趙O芯"
        },
        {
            "column_2": "GB34107697",
            "PrizeRank": "7",
            "column_1": "林O廷"
        },
        {
            "column_2": "GB20094095",
            "PrizeRank": "7",
            "column_1": "李O如"
        },
        {
            "column_2": "GE34063334",
            "PrizeRank": "7",
            "column_1": "李O潔"
        },
        {
            "column_2": "GB33596467",
            "PrizeRank": "7",
            "column_1": "張O儀"
        },
        {
            "column_2": "GL-90029208",
            "PrizeRank": "7",
            "column_1": "林O佑"
        },
        {
            "column_2": "GB19688553",
            "PrizeRank": "7",
            "column_1": "陳O伎"
        },
        {
            "column_2": "GA85833834",
            "PrizeRank": "7",
            "column_1": "曹O惠"
        },
        {
            "column_2": "GB37809100",
            "PrizeRank": "7",
            "column_1": "林O倫"
        },
        {
            "column_2": "GB33517981",
            "PrizeRank": "7",
            "column_1": "汪O林"
        },
        {
            "column_2": "GB39487176",
            "PrizeRank": "7",
            "column_1": "姚O鈺"
        },
        {
            "column_2": "GB46758624",
            "PrizeRank": "7",
            "column_1": "陳O真"
        },
        {
            "column_2": "GB51190521",
            "PrizeRank": "7",
            "column_1": "蔡O達"
        },
        {
            "column_2": "GE44558915",
            "PrizeRank": "7",
            "column_1": "劉O泓"
        },
        {
            "column_2": "GB33820268",
            "PrizeRank": "7",
            "column_1": "黃O芳"
        },
        {
            "column_2": "GE23773003",
            "PrizeRank": "7",
            "column_1": "盧O卉"
        },
        {
            "column_2": "GB45021499",
            "PrizeRank": "7",
            "column_1": "劉O欣"
        },
        {
            "column_2": "GB37153335",
            "PrizeRank": "7",
            "column_1": "黃O綱"
        },
        {
            "column_2": "GB41418512",
            "PrizeRank": "7",
            "column_1": "林O葳"
        },
        {
            "column_2": "GE23772047",
            "PrizeRank": "7",
            "column_1": "許O蓮"
        },
        {
            "column_2": "GB34908791",
            "PrizeRank": "7",
            "column_1": "劉O怡"
        },
        {
            "column_2": "GB-33571236",
            "PrizeRank": "7",
            "column_1": "杜O蓉"
        },
        {
            "column_2": "HK35731289",
            "PrizeRank": "7",
            "column_1": "李O茹"
        },
        {
            "column_2": "GE19209045",
            "PrizeRank": "7",
            "column_1": "楊O棋"
        },
        {
            "column_2": "GB50615934",
            "PrizeRank": "7",
            "column_1": "陳O軒"
        },
        {
            "column_2": "GH24804229",
            "PrizeRank": "7",
            "column_1": "林O陵"
        },
        {
            "column_2": "GL93686854",
            "PrizeRank": "7",
            "column_1": "廖O婷"
        },
        {
            "column_2": "JA87199226",
            "PrizeRank": "7",
            "column_1": "張O國"
        },
        {
            "column_2": "JA69677840",
            "PrizeRank": "7",
            "column_1": "蔡O妏"
        },
        {
            "column_2": "GB53146093",
            "PrizeRank": "7",
            "column_1": "陳O幸"
        },
        {
            "column_2": "JA-70700445",
            "PrizeRank": "7",
            "column_1": "黃O霖"
        },
        {
            "column_2": "JA76163526",
            "PrizeRank": "7",
            "column_1": "陳O良"
        },
        {
            "column_2": "GB31646169",
            "PrizeRank": "7",
            "column_1": "黃O倫"
        },
        {
            "column_2": "JA77330522",
            "PrizeRank": "7",
            "column_1": "王O玲"
        },
        {
            "column_2": "JA60533386",
            "PrizeRank": "7",
            "column_1": "黃O榆"
        },
        {
            "column_2": "JV21189016",
            "PrizeRank": "7",
            "column_1": "盧O欣"
        },
        {
            "column_2": "JA85411216",
            "PrizeRank": "7",
            "column_1": "徐O佑"
        },
        {
            "column_2": "JR48850376",
            "PrizeRank": "7",
            "column_1": "張O文"
        },
        {
            "column_2": "JA57483947",
            "PrizeRank": "7",
            "column_1": "張O瀚"
        },
        {
            "column_2": "JA89217172",
            "PrizeRank": "7",
            "column_1": "許O萍"
        },
        {
            "column_2": "JV03284783",
            "PrizeRank": "7",
            "column_1": "楊O明"
        },
        {
            "column_2": "GL95609978",
            "PrizeRank": "7",
            "column_1": "劉O瑄"
        },
        {
            "column_2": "JV18132209",
            "PrizeRank": "7",
            "column_1": "徐O惠"
        },
        {
            "column_2": "GE36010271",
            "PrizeRank": "8",
            "column_1": "王O翔"
        },
        {
            "column_2": "GB13116765",
            "PrizeRank": "8",
            "column_1": "黃O敏"
        },
        {
            "column_2": "GE37301378",
            "PrizeRank": "8",
            "column_1": "蔡O家"
        },
        {
            "column_2": "GE37306388",
            "PrizeRank": "8",
            "column_1": "王O涵"
        },
        {
            "column_2": "GB26037873",
            "PrizeRank": "8",
            "column_1": "張O怡"
        },
        {
            "column_2": "GE37142366",
            "PrizeRank": "8",
            "column_1": "何O瑤"
        },
        {
            "column_2": "GB29965838",
            "PrizeRank": "8",
            "column_1": "徐O穗"
        },
        {
            "column_2": "GC26359654",
            "PrizeRank": "8",
            "column_1": "黃O瑋"
        },
        {
            "column_2": "GB-28430818",
            "PrizeRank": "8",
            "column_1": "郭O琳"
        },
        {
            "column_2": "GB29758473",
            "PrizeRank": "8",
            "column_1": "陳O蒂"
        },
        {
            "column_2": "GB29043828",
            "PrizeRank": "8",
            "column_1": "謝O孝"
        },
        {
            "column_2": "GB-29889510",
            "PrizeRank": "8",
            "column_1": "袁O惠"
        },
        {
            "column_2": "GB38589232",
            "PrizeRank": "8",
            "column_1": "蔡O君"
        },
        {
            "column_2": "GB-28823787",
            "PrizeRank": "8",
            "column_1": "楊O如"
        },
        {
            "column_2": "GB33913075",
            "PrizeRank": "8",
            "column_1": "陳O蓮"
        },
        {
            "column_2": "GB23013748",
            "PrizeRank": "8",
            "column_1": "陳O源"
        },
        {
            "column_2": "50903799",
            "PrizeRank": "8",
            "column_1": "鄧O毅"
        },
        {
            "column_2": "GB-44734643",
            "PrizeRank": "8",
            "column_1": "郭O君"
        },
        {
            "column_2": "GB23007669",
            "PrizeRank": "8",
            "column_1": "陳O汝"
        },
        {
            "column_2": "GB30389111",
            "PrizeRank": "8",
            "column_1": "鄧O萍"
        },
        {
            "column_2": "GE42500992",
            "PrizeRank": "8",
            "column_1": "龔O翎"
        },
        {
            "column_2": "GL85899716",
            "PrizeRank": "8",
            "column_1": "李O霈"
        },
        {
            "column_2": "GT-11237931",
            "PrizeRank": "8",
            "column_1": "周O宸"
        },
        {
            "column_2": "GB31410217",
            "PrizeRank": "8",
            "column_1": "陳O璇"
        },
        {
            "column_2": "GB44546557",
            "PrizeRank": "8",
            "column_1": "張O曄"
        },
        {
            "column_2": "D270003437",
            "PrizeRank": "8",
            "column_1": "麥O欣"
        },
        {
            "column_2": "GB-38957564",
            "PrizeRank": "8",
            "column_1": "謝O汝"
        },
        {
            "column_2": "GB43153385",
            "PrizeRank": "8",
            "column_1": "簡O田"
        },
        {
            "column_2": "GB35012645",
            "PrizeRank": "8",
            "column_1": "李O廷"
        },
        {
            "column_2": "GS97923951",
            "PrizeRank": "8",
            "column_1": "盧O翰"
        },
        {
            "column_2": "GB-44924191",
            "PrizeRank": "8",
            "column_1": "詹O珺"
        },
        {
            "column_2": "GB42546200",
            "PrizeRank": "8",
            "column_1": "陳O宜"
        },
        {
            "column_2": "GB33842037",
            "PrizeRank": "8",
            "column_1": "鄭O玲"
        },
        {
            "column_2": "GB47464765",
            "PrizeRank": "8",
            "column_1": "梁O合"
        },
        {
            "column_2": "GB35715571",
            "PrizeRank": "8",
            "column_1": "林O語"
        },
        {
            "column_2": "GB39766007",
            "PrizeRank": "8",
            "column_1": "張O婷"
        },
        {
            "column_2": "GB40296281",
            "PrizeRank": "8",
            "column_1": "邱O璿"
        },
        {
            "column_2": "GB27449451",
            "PrizeRank": "8",
            "column_1": "張O蓮"
        },
        {
            "column_2": "GC26402238",
            "PrizeRank": "8",
            "column_1": "陳OO芬"
        },
        {
            "column_2": "GE28155650",
            "PrizeRank": "8",
            "column_1": "蔡O雄"
        },
        {
            "column_2": "39696269",
            "PrizeRank": "8",
            "column_1": "柯O岷"
        },
        {
            "column_2": "GE35534214",
            "PrizeRank": "8",
            "column_1": "朱O安"
        },
        {
            "column_2": "GB45179596",
            "PrizeRank": "8",
            "column_1": "周O曄"
        },
        {
            "column_2": "GB48664949",
            "PrizeRank": "8",
            "column_1": "薛O梅"
        },
        {
            "column_2": "GB-35163596",
            "PrizeRank": "8",
            "column_1": "康O昀"
        },
        {
            "column_2": "GB50487616",
            "PrizeRank": "8",
            "column_1": "蔡O瑜"
        },
        {
            "column_2": "GE41985678",
            "PrizeRank": "8",
            "column_1": "李O諭"
        },
        {
            "column_2": "GB49099521",
            "PrizeRank": "8",
            "column_1": "何O文"
        },
        {
            "column_2": "GB21463700",
            "PrizeRank": "8",
            "column_1": "蒲O耕"
        },
        {
            "column_2": "GB33507126",
            "PrizeRank": "8",
            "column_1": "蔡O呈"
        },
        {
            "column_2": "GB41258538",
            "PrizeRank": "8",
            "column_1": "童O甄"
        },
        {
            "column_2": "GB54834196",
            "PrizeRank": "8",
            "column_1": "李O忠"
        },
        {
            "column_2": "GE38135252",
            "PrizeRank": "8",
            "column_1": "黃O嬌"
        },
        {
            "column_2": "GB45486099",
            "PrizeRank": "8",
            "column_1": "洪O蘋"
        },
        {
            "column_2": "GE41572450",
            "PrizeRank": "8",
            "column_1": "王O華"
        },
        {
            "column_2": "GB45253574",
            "PrizeRank": "8",
            "column_1": "游O雅"
        },
        {
            "column_2": "GB45497494",
            "PrizeRank": "8",
            "column_1": "林O萱"
        },
        {
            "column_2": "GB50473866",
            "PrizeRank": "8",
            "column_1": "鄭O恬"
        },
        {
            "column_2": "JA71626690",
            "PrizeRank": "8",
            "column_1": "賴O妘"
        },
        {
            "column_2": "JA53597342",
            "PrizeRank": "8",
            "column_1": "潘O凡"
        },
        {
            "column_2": "JA69168670",
            "PrizeRank": "8",
            "column_1": "陳O宏"
        },
        {
            "column_2": "JA54077259",
            "PrizeRank": "8",
            "column_1": "秦O慧"
        },
        {
            "column_2": "JV02910999",
            "PrizeRank": "8",
            "column_1": "陳O蒨"
        },
        {
            "column_2": "GB55123198",
            "PrizeRank": "8",
            "column_1": "姚O鈺"
        },
        {
            "column_2": "JA-63023961",
            "PrizeRank": "8",
            "column_1": "李O綾"
        },
        {
            "column_2": "JA74692017",
            "PrizeRank": "8",
            "column_1": "洪O貞"
        },
        {
            "column_2": "GB39184544",
            "PrizeRank": "8",
            "column_1": "蘇O碩"
        },
        {
            "column_2": "GE23795001",
            "PrizeRank": "8",
            "column_1": "李O芳"
        },
        {
            "column_2": "GC95695359",
            "PrizeRank": "8",
            "column_1": "王O瑜"
        },
        {
            "column_2": "JA55798186",
            "PrizeRank": "8",
            "column_1": "趙O瑜"
        },
        {
            "column_2": "JL43073291",
            "PrizeRank": "8",
            "column_1": "董O瑄"
        },
        {
            "column_2": "JA54905217",
            "PrizeRank": "8",
            "column_1": "郭O惠"
        },
        {
            "column_2": "GE37123437",
            "PrizeRank": "8",
            "column_1": "謝O芬"
        },
        {
            "column_2": "GE37133609",
            "PrizeRank": "8",
            "column_1": "黃O慧"
        },
        {
            "column_2": "JV24308090",
            "PrizeRank": "8",
            "column_1": "黃O霖"
        },
        {
            "column_2": "JA86404251",
            "PrizeRank": "8",
            "column_1": "蕭O雄"
        },
        {
            "column_2": "JA86404250",
            "PrizeRank": "8",
            "column_1": "張O珍"
        },
        {
            "column_2": "GT47643206",
            "PrizeRank": "8",
            "column_1": "翁O慧"
        },
        {
            "column_2": "JV19759658",
            "PrizeRank": "8",
            "column_1": "彭O夫"
        },
        {
            "column_2": "JA81362580",
            "PrizeRank": "8",
            "column_1": "陳O婷"
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
        "1": "頭獎: 雙人首爾來回機票",
        "2": "二獎: 丹寧包+燙布貼",
        "3": "三獎: 兔兔口袋短T",
        "4": "其他: 演唱會應援包",
        "5": "營多拌炒麵乙箱",
        "6": "兔兔吊飾",
        "7": "Pixel造型鑰匙圈組合-隨機 ",
        "8": "貼紙組合",
    };

    return (
        <>
            <div id={id} className="col-12 pattern-background vh-100 w-100 d-flex justify-content-center align-items-center px-0 page-section position-relative">


                <div className="position-absolute">

                    <div className="card shadow position-relative row card-desktop-5 px-4"  >

                        <div style={{ maxHeight: "70vh", overflow: "auto" }} className="py-5 ps-4">


                            <div className="row">
                                <div className="col-12 fw-semi-bold mb-4 fs-4">
                                    中獎名單
                                </div>

                                <ol className="text-start ps-5">
                                    <li>
                                        得獎者在2月28日前將發票正本寄出，逾期則自動放棄獎品。<br></br>
                                        中獎發票經予主辦單位後，將不予退還，由主辦單位全數轉捐予伊甸基金會。<br></br>
                                        收到兌獎人發票後，主辦單位會再次核實，如發票內容與活動條件不符將取消中獎資格。<br></br>
                                        <br></br>
                                        請把發票正本寄到以下地址:<br></br>
                                        營多食品有限公司<br></br>
                                        台北市大同區承德路三段232號3樓308室<br></br>
                                        02-2596-8296<br></br>
                                        <br></br>
                                    </li>
                                    <li>
                                        得獎者需填寫 google 表單兌換獎品<br></br>
                                        表單連結: <a href="https://forms.gle/MhgmyyKWJKCSbUos6" target="blank_">https://forms.gle/MhgmyyKWJKCSbUos6</a>
                                        <br></br>
                                    </li>
                                    <li>
                                        所有獎品將於3月底前寄出完畢。 會附上簽收單，得獎者收到後必須回簽並拍照回傳自IG:  indomie.tw。
                                    </li>
                                    <li>
                                        其他資訊也歡迎在 IG 私訊活動小編。
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
                                                        <th> 姓名</th>
                                                        <th> 統一發票號碼 </th>

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