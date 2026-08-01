// eslint.config.mjs
// 린트 설정. ESLint 9 부터 쓰는 "플랫 설정" 형식입니다.
//
// ┌─ 왜 생겼나 ───────────────────────────────────────────────────────
// │ package.json 에 lint 스크립트는 있었지만 설정 파일도, eslint 자체도
// │ 없었습니다. 그래서 `pnpm lint` 는 한 번도 돌 수 없었고, 타입 검사
// │ (tsc)만으로 버텨왔습니다. tsc 는 타입만 봅니다 — 훅 의존성이 빠졌다든지
// │ 안 쓰는 변수가 남았다든지는 아무도 안 보고 있었습니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ FlatCompat(@eslint/eslintrc)으로 감싸지 마세요. 인터넷에 도는 예제가
//    대부분 그 방식인데, ESLint 10 에서는 설정을 검사하다 "Converting
//    circular structure to JSON" 으로 죽습니다. Next 16 의 eslint-config-next
//    는 플랫 설정 배열을 그대로 내주므로 펴서 쓰면 됩니다.
//
// ⚠️ 규칙을 늘리기 전에 생각해 보세요. 이 저장소는 "왜 이렇게 했는지"를
//    주석으로 남기는 결이라, 사람이 판단해서 남겨둔 것을 기계가 지우게
//    하면 안 됩니다.
import coreWebVitals from "eslint-config-next/core-web-vitals"
import typescript from "eslint-config-next/typescript"

const config = [
  {
    // 사람이 쓴 코드만 봅니다. 빌드 산출물·의존성을 넣으면 몇 분씩 걸리고
    // 고칠 수도 없는 경고가 쏟아집니다.
    ignores: [".next/**", "node_modules/**", "public/**", ".v0/**", "next-env.d.ts"],
  },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // "안 쓰지만 일부러 둔 것"을 봐줍니다.
      //   _character   앞에 밑줄을 붙여 "안 쓴다"고 표시한 인자
      //   { node, ...props }  react-markdown 이 넘겨주는 값 중 안 쓰는 것.
      //                       나머지(...props)를 받으려면 이름을 적어야만
      //                       빼낼 수 있어서, 이건 사람의 실수가 아닙니다.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
]

export default config
