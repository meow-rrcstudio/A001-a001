// components/markdown-content.tsx
// notion-to-md 가 생성한 Markdown 문자열을 HTML 로 렌더링합니다.
// react-markdown + remark-gfm(표/체크박스 등) + rehype-raw/sanitize(임베드된 HTML 안전 처리)를 사용합니다.
// 별도의 "use client" 가 없으므로 서버 컴포넌트로 렌더링되어 JS 번들을 늘리지 않습니다.
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose-blog">
      <ReactMarkdown
        // remarkBreaks: 노션에서 문단 안에 넣은 줄바꿈(Shift+Enter)을 화면에서도 줄바꿈으로 표시
        remarkPlugins={[remarkGfm, remarkBreaks]}
        // rehypeRaw 로 Notion 에서 넘어온 원시 HTML 을 파싱하고, rehypeSanitize 로 XSS 위험 요소를 제거합니다.
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // 이미지(코드 블록 내 이미지 포함)는 반응형으로 표시합니다.
          img: ({ node, ...props }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img {...props} alt={props.alt ?? ""} loading="lazy" className="mx-auto rounded-lg" />
          ),
          // 외부 링크는 새 탭에서 열리도록 처리합니다.
          a: ({ node, href, ...props }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
              {...props}
            />
          ),
          // 표는 모바일에서 화면 밖으로 넘치지 않도록 좌우 스크롤 가능한 래퍼로 감쌉니다.
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 -mx-4 px-4">
              <table className="min-w-full text-sm" {...props} />
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
