// lib/ai/reading-chat.ts
// 해석을 받은 뒤 이어지는 면담(추가 질문)의 형식 정의입니다.
//
// 지금까지 후속 답변은 lib/mock-reading.ts 의 고정 문구였습니다. 무엇을
// 물어도 같은 말이 돌아와서, 뽑은 카드와 아무 상관이 없었습니다.
//
// 여기서 정하는 것은 두 가지입니다.
//   1) 샨티의 답 (reply)
//   2) 카드를 더 봐야 할 때, 어떻게 더 볼지 (draw)
//
// ⚠️ 이 파일은 화면과 서버가 함께 봅니다. 서버 전용(api key 등) 코드를
//    여기에 넣지 마세요.

/** 추가로 뽑을 카드 한 자리 */
export interface ChatDrawPosition {
  label: string
  guide: string
}

/**
 * 카드를 더 봐야 할 때 샨티가 내놓는 요청.
 *
 * · mode="shanti" — 이 몸이 대신 뽑아준다. 사실 확인에 가까운 물음
 *   ("그래서 언제쯤이야?")일 때. 화면이 바로 뽑아 이어서 읽어줍니다.
 * · mode="user"   — 네가 직접 뽑아라. 묻는 이의 마음이 실려야 하는 물음
 *   ("그 사람한테 연락해도 될까?")일 때. 카드 고르기 화면으로 넘어갑니다.
 */
export interface ChatDrawRequest {
  mode: "shanti" | "user"
  /** 뽑기 직전에 건네는 말 */
  intro: string
  positions: ChatDrawPosition[]
}

export interface ChatReply {
  reply: string
  draw?: ChatDrawRequest | null
}

/** 한 번에 더 뽑을 수 있는 최대 장수 — 면담이 끝없이 늘어지지 않도록 */
export const CHAT_DRAW_MAX = 3

export const CHAT_JSON_SCHEMA = {
  type: "object",
  properties: {
    reply: {
      type: "string",
      description:
        "물음에 대한 샨티의 답. 이미 뽑힌 카드를 근거로 삼는다. 2~5문장. 문단이 나뉘면 줄바꿈으로.",
    },
    draw: {
      type: "object",
      nullable: true,
      description: "카드를 더 봐야 할 때만. 필요 없으면 넣지 않는다.",
      properties: {
        mode: {
          type: "string",
          enum: ["shanti", "user"],
          description: "shanti=이 몸이 대신 뽑음, user=묻는 이가 직접 뽑음",
        },
        intro: { type: "string", description: "뽑기 직전에 건네는 말. 1~2문장." },
        positions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string", description: "이 자리가 무엇인지" },
              guide: { type: "string", description: "무엇을 떠올리며 뽑을지" },
            },
            required: ["label", "guide"],
            propertyOrdering: ["label", "guide"],
          },
          description: `1~${CHAT_DRAW_MAX}장`,
        },
      },
      required: ["mode", "intro", "positions"],
      propertyOrdering: ["mode", "intro", "positions"],
    },
  },
  required: ["reply"],
  // 답이 먼저 흘러나오고, 뽑기 요청은 그 뒤에 붙습니다.
  propertyOrdering: ["reply", "draw"],
} as const

/** 면담 지시 — 페르소나 뒤에 붙습니다 */
export const CHAT_INSTRUCTION = `@task{
목적=이미_본_타로점을_두고_이어지는_물음에_답한다,
출력=JSON_한_덩어리만|설명문_없이
}
@rule{
근거=이미_뽑힌_카드와_앞서_한_해석|카드와_무관한_일반론은_금지,
인용=답_속에_카드_이름을_최소_한_번은_짚어라,
길이=2~5문장|장황하지_않게,
반복금지=앞서_한_말을_그대로_되풀이하지_말_것,
되묻기=물음이_모호하면_되물어도_된다
}
@draw_rule{
목적=이미_뽑힌_카드로_답이_안_나오는데_억지로_끼워맞추지_않기_위해_있다,
넣는때=아래_중_하나라도_맞으면_넣는다:
  (1)_처음_물음에_없던_새로운_국면·새_인물·새_선택지가_나왔다,
  (2)_시간이_옮겨갔다("그럼_다음달은","그_뒤에는"),
  (3)_이미_뽑힌_카드로는_같은_말을_되풀이하게_된다,
  (4)_묻는_이가_"다시_뽑아줘"·"더_봐줘"라고_했다,
안_넣는때=이미_뽑힌_카드로_충분히_답할_수_있을_때|감정을_받아주기만_하면_되는_말일_때,
mode=shanti|사실을_확인하는_물음("언제쯤","어느_쪽이_유리해")은_이_몸이_대신_뽑는다,
mode=user|묻는_이의_마음이_실려야_하는_물음("연락해도_될까","이_사람_어때")은_직접_뽑게_한다,
장수=1~${CHAT_DRAW_MAX}장|필요한_만큼만|보통_1~2장,
reply=draw를_넣을_때도_reply는_반드시_쓴다,
reply.순서=(1)_왜_지금_카드로는_모자란지_한_마디|(2)_몇_장을_뽑자고_청한다,
reply.예=흐음..._이건_지금_깔린_패로는_안_보이는구나._한_장만_더_뽑아보겠냥?
}`
