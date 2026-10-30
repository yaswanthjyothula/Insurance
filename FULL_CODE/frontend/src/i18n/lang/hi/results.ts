import type { Messages } from "@/i18n/en";

/** "results" messages in Hindi. */
const messages: Partial<Messages> = {
  "results.loading.title": "आपके नतीजे लोड हो रहे हैं…",
  "results.loading.hint": "अगर आपने अभी आकलन पूरा नहीं किया है, तो हम आपको वहीं वापस ले जाएँगे।",

  "results.header.stage": "चरण 2 / 4: कवर की ज़रूरत और अंतर का विश्लेषण",
  "results.header.title": "आपकी अनुमानित कवर ज़रूरत",
  "results.header.defaultSummary": "आपके परिवार की भविष्य की आय की भरपाई और कर्ज़ की देनदारियों पर आधारित निश्चित गणना।",
  "results.method.groupLabel": "गणना की पद्धति",
  "results.method.netNeeds": "नेट ज़रूरत",
  "results.method.hlv": "ह्यूमन लाइफ वैल्यू",
  "results.method.gapLine": "{amount} का अंतर",

  "results.banner.covered": "आप सुरक्षित हैं",
  "results.banner.recommended": "सुझाया गया जीवन कवर",
  "results.banner.hlvGap": "ह्यूमन लाइफ वैल्यू का अंतर",
  "results.banner.noExtra": "अतिरिक्त कवर की ज़रूरत नहीं",
  "results.banner.surplus":
    "इस पद्धति के अनुसार आपका मौजूदा कवर और तरल संपत्तियाँ अनुमानित ज़रूरत से {amount} अधिक हैं। आप अगले चरण में फिर भी प्लान की तुलना कर सकते हैं।",
  "results.banner.roundedUp": "आपके शुद्ध अंतर {amount} को ऊपर की ओर पूर्णांकित किया गया",
  "results.banner.about": "लगभग {amount}",
  "results.banner.netNeedsExplain":
    "कुल वित्तीय दायित्व में से आपका मौजूदा जीवन कवर और तरल संपत्तियाँ घटाने पर मिली रकम। यह पूंजी कोष आपके परिवार का जीवन-स्तर बिना कर्ज़ के संकट के बनाए रखता है।",
  "results.banner.hlvExplain":
    "व्यक्तिगत खर्च घटाने के बाद {age} वर्ष की उम्र तक आपकी कमाई क्षमता का वर्तमान मूल्य, उसमें आपके कर्ज़ जोड़कर, और जो आपके पास पहले से है वह घटाकर।",

  "results.summary.title": "गणना का सारांश",
  "results.summary.totalGrossNeed": "कुल ज़रूरत",
  "results.summary.existingCover": "मौजूदा जीवन कवर",
  "results.summary.liquidAssets": "तरल संपत्तियाँ",
  "results.summary.humanLifeValue": "ह्यूमन लाइफ वैल्यू",
  "results.summary.outstandingLiabilities": "बकाया देनदारियाँ",
  "results.summary.remainingGap": "बचा हुआ अंतर",
  "results.summary.recommendedCover": "सुझाया गया कवर",

  "results.composition.ariaLabel": "यह संख्या कैसे बनी",
  "results.composition.netNeedsTitle": "ज़रूरत की बनावट (कुल {amount})",
  "results.composition.hlvTitle": "ह्यूमन लाइफ वैल्यू का ब्योरा",
  "results.composition.netNeedsHint": "हर रुपया किसी बताए गए दायित्व से जुड़ा है।",
  "results.composition.hlvHint": "आपकी भविष्य की कमाई आज आपके परिवार के लिए कितनी मायने रखती है।",
  "results.composition.returnBadge": "भुगतान पर {rate}% रिटर्न",
  "results.composition.assumptions": "मान्यताएँ:",
  "results.composition.chartLabel": "कुल ज़रूरत में हर हिस्से की हिस्सेदारी",
  "results.composition.segmentTitle": "{title}: {percent}%",
  "results.composition.partHeading": "{n}. {title}",

  "results.part.income.title": "आय की भरपाई",
  "results.part.income.descInflation":
    "हर आश्रित को जितने समय तक सहारा चाहिए, उतने समय के लिए {monthly}/माह के घरेलू खर्च का वर्तमान मूल्य, {inflation}% महंगाई और भुगतान पर {rate}% रिटर्न मानकर।",
  "results.part.income.descNoInflation":
    "हर आश्रित को जितने समय तक सहारा चाहिए, उतने समय के लिए {monthly}/माह के घरेलू खर्च का वर्तमान मूल्य, महंगाई और भुगतान पर {rate}% रिटर्न मानकर।",
  "results.part.liabilities.title": "देनदारियाँ और कर्ज़",
  "results.part.liabilities.desc": "आपके बताए होम लोन, पर्सनल और अन्य कर्ज़ों का पूरा भुगतान।",
  "results.part.liabilities.none": "कोई ऋण नहीं बताया गया।",
  "results.part.goals.title": "भविष्य के लक्ष्य",
  "results.part.goals.desc": "इनकी महंगाई-समायोजित, डिस्काउंट की गई लागत: {goals}।",
  "results.part.goals.none": "कोई लक्ष्य नहीं बताया गया।",
  "results.part.buffer.title": "तत्काल सुरक्षा राशि",
  "results.part.buffer.desc": "इलाज और बदलाव के खर्चों के लिए तैयार रखा गया आपातकालीन और अंतिम खर्च का कोष।",

  "results.hlv.value.title": "ह्यूमन लाइफ वैल्यू",
  "results.hlv.value.desc": "{years} वर्ष की शुद्ध कमाई का वर्तमान मूल्य।",
  "results.hlv.horizon.title": "कमाई की अवधि",
  "results.hlv.horizon.value": "{years} वर्ष",
  "results.hlv.horizon.desc": "उम्र {age} से रिटायरमेंट ({retire}) तक।",
  "results.hlv.consumption.title": "व्यक्तिगत खर्च",
  "results.hlv.consumption.desc": "आपकी आय का वह हिस्सा जो आप अपने ऊपर खर्च करते हैं, आपके आश्रितों के आधार पर।",
  "results.hlv.wage.title": "वेतन में बढ़त",
  "results.hlv.wage.desc": "प्रति वर्ष {rate}% की दर से डिस्काउंट किया गया।",

  "results.scenario.ariaLabel": "परिदृश्य सिम्युलेशन",
  "results.scenario.title": "जीवन की घटनाओं का सिम्युलेशन करें",
  "results.scenario.hint": "देखें कि कोई बदलाव आपके अंतर को कैसे बदलेगा। आपके अपने जवाब कभी नहीं बदलते।",
  "results.scenario.customLink": "अपना असल जीवन परिदृश्य (AI)",
  "results.scenario.running": "परिदृश्य चल रहा है",
  "results.scenario.error": "हम वह परिदृश्य नहीं चला सके। कृपया फिर कोशिश करें।",
  "results.scenario.impact": "परिदृश्य का असर: {title}",
  "results.scenario.gapChangeNetNeeds": "अंतर में बदलाव (नेट ज़रूरत): {change}",
  "results.scenario.gapChangeHlv": "अंतर में बदलाव (HLV): {change}",
  "results.scenario.none": "कोई नहीं",
  "results.scenario.incomeNote":
    "आय बदलने से नेट ज़रूरत का नतीजा नहीं बदलता। इस परिदृश्य का असर देखने के लिए ऊपर ह्यूमन लाइफ वैल्यू चुनें।",
  "results.scenario.noChangeNote": "चुनी गई पद्धति में यह परिदृश्य आपके अंतर को नहीं बदलता।",
  "results.scenario.currentGap": "मौजूदा अंतर",
  "results.scenario.simulatedGap": "सिम्युलेट किया गया अंतर",
  "results.scenario.premiumChange": "संकेतात्मक प्रीमियम में बदलाव",
  "results.scenario.premiumPerYear": "{amount}/वर्ष",
  "results.scenario.netNeedsOnly": "केवल नेट ज़रूरत",

  "results.preset.anotherChild.label": "+1 आश्रित बच्चा",
  "results.preset.anotherChild.desc": "शिक्षा का एक लक्ष्य जोड़ता है और खर्च 15% बढ़ाता है",
  "results.preset.loanCleared.label": "सभी ऋण चुकाएँ",
  "results.preset.loanCleared.desc": "देनदारियाँ शून्य हो जाती हैं",
  "results.preset.loanCleared.off": "आपने कोई ऋण नहीं बताया है",
  "results.preset.retire55.label": "जल्दी रिटायरमेंट (55)",
  "results.preset.retire55.desc": "कमाई की अवधि घटाता है",
  "results.preset.retire55.offAge": "आपकी उम्र पहले से 55 या उससे अधिक है",
  "results.preset.retire55.offRetire": "आप पहले से 55 या उससे पहले रिटायर होते हैं",
  "results.preset.incomeDrop.label": "आय में 20% गिरावट",
  "results.preset.incomeDrop.desc": "ह्यूमन लाइफ वैल्यू पद्धति में दिखता है",
  "results.preset.fallbackLabel": "परिदृश्य",

  "results.methodology.title": "यह गणना कैसे की गई",
  "results.methodology.limitations": "सीमाएँ",

  "results.nav.edit": "मेरे जवाब बदलें",
  "results.nav.continue": "चरण 3 पर जाएँ: प्लान चुनें और अपनी पसंद से बदलें",
};
export default messages;
