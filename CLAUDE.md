# 이 저장소에서 일하는 방법

## 일을 마치고 보고할 때

**미리보기 링크를 반드시 함께 적습니다.** 무엇을 고쳤는지 글로만 설명하면
아리님이 링크를 찾으러 Vercel 이나 GitHub 을 뒤져야 합니다. 바뀐 화면은
눈으로 봐야 아는 것이라, 링크가 없는 보고는 절반만 한 보고입니다.

- **브랜치 미리보기** (통합 전에 확인할 자리):
  `https://soulseoul-git-<브랜치이름>-r1meow-rrcstudio.vercel.app`
  정확한 주소는 Vercel MCP 의 `list_deployments` 로 가져옵니다 —
  브랜치 이름이 길면 Vercel 이 줄여서 짓기 때문에 손으로 지으면 틀립니다
  (`meta.branchAlias` 가 진짜 주소입니다).
- **운영** (main 에 통합한 뒤): https://soulseoul.xyz
- 화면이 여럿 바뀌었으면 **바뀐 화면마다** 바로 갈 수 있는 주소를 답니다
  (`.../design-1859`, `.../nope-nope` 처럼). 첫 화면 링크만 주면
  아리님이 거기서부터 다시 찾아 들어가야 합니다.
- 배포가 아직 READY 가 아니면 그 사실을 함께 적습니다. 열리지 않는 링크를
  주면 "고장났나" 하고 한 번 더 확인하게 됩니다.

미리보기 주소는 Vercel 로그인이 되어 있어야 열립니다 (Deployment
Protection). 아리님 브라우저에서는 그냥 열립니다.

## 프로젝트

- Vercel: 팀 `r1meow-rrcstudio` · 프로젝트 `soulseoul`
- 디자인시스템: `/design-1859` (링크되지 않은 비공개 페이지)
- 화면 검사: `node scripts/check-header-scrim.mjs` (배포된 주소를 인자로
  줄 수 있습니다)
