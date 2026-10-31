/**
 * Sama's Love Requests ❤️ — each request opens WhatsApp with a cute Egyptian Arabic
 * draft for Ahmed. Several variants per request so it doesn't get repetitive.
 */
export type RequestId = 'chocolate' | 'hug' | 'call' | 'miss' | 'hungry' | 'private';

export interface LoveRequest {
  id: RequestId;
  emoji: string;
  label: { ar: string; en: string };
  /** Background gradient classes for the button. */
  tint: string;
  messages: string[];
}

export const LOVE_REQUESTS: LoveRequest[] = [
  {
    id: 'chocolate',
    emoji: '🍫',
    label: { ar: 'عايزة شوكولاتة', en: 'I want chocolate' },
    tint: 'from-[#f6d5c3] to-[#e9b8a0]',
    messages: [
      'أحمد 🍫 دي حالة طوارئ شوكولاتة رسمية، محتاجة دعم فوري يا بطل 🚨',
      'يا أحمد، الشوكولاتة بتنادي عليا وأنا مش قادرة أرفض… هاتلي واحدة بقى 🥺🍫',
      'بلاغ عاجل: مستوى الشوكولاتة في دمي واطي جدًا 📉🍫 الحقني يا أحمد!',
    ],
  },
  {
    id: 'hug',
    emoji: '🧸',
    label: { ar: 'محتاجة حضن', en: 'I need a hug' },
    tint: 'from-blush-100 to-blush-200',
    messages: [
      'أحمد 🧸 أنا محتاجة حضن كبير دلوقتي حالًا، ومش هقبل بأقل من كده 🤗',
      'يا أحمد، الحضن بتاعك وحشني أوي… ابعتلي واحد على الأقل لحد ما أشوفك 🧸❤️',
      'طلب رسمي: حضن واحد كبير ودافي من أحمد، يتسلم في أقرب وقت 🤗📦',
    ],
  },
  {
    id: 'call',
    emoji: '📞',
    label: { ar: 'كلمني يا أحمد', en: 'Call me, Ahmed' },
    tint: 'from-lav-100 to-lav-200',
    messages: [
      'أحمد 📞 كلمني دلوقتي، عايزة أسمع صوتك 🥺❤️',
      'يا أحمد، صوتك وحشني… رن عليا لما تفضى؟ 📞💕',
      'تنبيه: سما مستنية مكالمة من أحمد حالًا 📞⏰ ومفيش أعذار 😂',
    ],
  },
  {
    id: 'miss',
    emoji: '💋',
    label: { ar: 'وحشتني', en: 'I miss you' },
    tint: 'from-[#ffd1e3] to-[#ffb3cf]',
    messages: [
      'أحمد 💋 وحشتني أوي أوي أوي',
      'على فكرة يا أحمد… إنت وحشتني ومش عارفة أعمل إيه في نفسي 🥺💋',
      'وحشتني قد السما… وإنت عارف إن السما كبيرة أوي 💋🌙',
    ],
  },
  {
    id: 'hungry',
    emoji: '🍕',
    label: { ar: 'جعانة', en: "I'm hungry" },
    tint: 'from-cream-100 to-[#ffe0b8]',
    messages: [
      'أحمد 🍕 أنا جعانة جدًا… والجوع ده مسؤوليتك إنت 😂',
      'يا أحمد، معدتي بتعمل حفلة ومحتاجة بيتزا عشان تهدى 🍕🎉',
      'سما جعانة = سما متعصبة 😤 الحل الوحيد: أكل، ودلوقتي 🍕🍟',
    ],
  },
  {
    id: 'private',
    emoji: '💌',
    label: { ar: 'رسالة خاصة', en: 'Private message' },
    tint: 'from-lav-200 to-blush-200',
    messages: [
      'أحمد 💌 عندي رسالة خاصة ليك إنت بس:\n',
      'يا أحمد، دي رسالة سرية من سما 🤫💌\n',
      'من سما لأحمد، بكل حب 💌\n',
    ],
  },
];

export function randomRequestMessage(req: LoveRequest, exclude?: string): string {
  if (req.messages.length < 2) return req.messages[0];
  let m: string;
  do m = req.messages[Math.floor(Math.random() * req.messages.length)];
  while (m === exclude);
  return m;
}
