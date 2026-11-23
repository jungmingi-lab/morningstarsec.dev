---
title: "Go로 PNG 파일 공유 서버 만들기"
date: "2026-11-24"
category: "개발"
tags: [Go, Web Backend, File Upload, Security]
difficulty: "Project"
readTime: "5 min read"
summary: "Go로 웹과 curl에서 쓰는 파일 공유 서버를 만들고, 파일 검증과 외부 HTTPS 접속까지 확인한 기록"
---

## 어떤 서비스를 만들었나

PNG 파일을 올리면 다운로드 링크가 나오는 작은 서비스를 만들었다. 브라우저에서는 파일을 선택해 올리고, 터미널에서는 `curl`로 같은 서버에 올릴 수 있다. 링크를 받은 사람은 별도의 업로드 키 없이 PNG를 다운로드할 수 있다.

- [파일 공유 웹 화면](https://syracuse-diameter-len-salary.trycloudflare.com/)
- [테스트용 PNG 다운로드](https://syracuse-diameter-len-salary.trycloudflare.com/s/603f61505c3166fe92ca58338f68278ffe9bebc7a084022f2b7c858fac5ba4c5)

공개 주소는 미션 시연을 위해 Cloudflare Quick Tunnel로 연결했다. 내 PC의 Go 서버와 터널이 켜져 있는 동안 접속할 수 있고, 터널을 다시 시작하면 주소가 바뀔 수 있다. 업로드에는 관리자에게 받은 키가 필요하다. 위 테스트 이미지는 키 없이 받을 수 있다. [Cloudflare Quick Tunnel 안내](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/)

## 브라우저와 curl이 같은 서버를 쓴다

처음에는 `GET /health`에 `ok`를 돌려주는 코드부터 시작했다. 브라우저와 `curl`에서 모두 응답을 받은 뒤 `POST /api/files`와 `GET /s/{token}`을 추가했다. 사진을 보내는 화면은 `FormData`, 터미널은 `curl -F`를 쓰지만 둘 다 `file`이라는 이름으로 데이터를 같은 주소에 보낸다.

| 주소 | 하는 일 |
| --- | --- |
| `GET /` | 파일 선택 화면 열기 |
| `POST /api/files` | PNG 저장 후 `201 Created`와 공유 링크 반환 |
| `GET /s/{token}` | 링크에 연결된 PNG를 첨부 파일로 다운로드 |

업로드 키를 받은 사람은 Ubuntu 터미널에서도 아래처럼 쓸 수 있다. `sample.png`는 현재 폴더에 둔 PNG 파일이다.

```bash
read -rs -p '업로드 키: ' UPLOAD_KEY; echo
SHARE_URL=$(printf 'Authorization: Bearer %s\n' "$UPLOAD_KEY" | curl -fsS -H @- \
  -F 'file=@sample.png' https://syracuse-diameter-len-salary.trycloudflare.com/api/files)
unset UPLOAD_KEY
curl -fsS "$SHARE_URL" -o downloaded.png
cmp sample.png downloaded.png
```

## 파일을 저장하기 전에 확인한 것

파일명이 `.png`로 끝나는지 확인하고, 서버가 읽은 바이트를 `http.DetectContentType`에 넣어 MIME 타입이 `image/png`인지 확인했다. 그다음 Go의 PNG 디코더로 실제로 읽을 수 있는 이미지인지 검사했다. 요청 본문과 파일 크기를 모두 제한하고, 디코딩 전에 가로·세로와 총 픽셀 수도 확인했다. 지금은 PNG 한 장, 최대 5 MiB를 받는다. [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html), [Go `net/http` 문서](https://pkg.go.dev/net/http)

저장할 때는 원본 파일명을 사용하지 않았다. 서버가 난수 토큰을 만들고, 그 토큰의 SHA-256 값을 파일명으로 쓴다. 링크 요청이 오면 토큰 형식을 확인한 뒤 같은 해시를 계산해서 파일을 찾는다. 저장 폴더는 웹 페이지와 분리했고, 파일 열기와 저장은 `os.OpenRoot`로 제한했다. 새 파일은 임시 이름으로 모두 쓴 뒤 최종 이름으로 바꾼다. 다운로드에는 첨부 파일 헤더를 쓴다. [Go `os.Root` 문서](https://pkg.go.dev/os#Root)

```go
func storageName(token string) string {
    return fmt.Sprintf("%x.png", sha256.Sum256([]byte(token)))
}
```

처음에는 토큰과 파일명을 Go의 메모리에 저장했다. 서버를 다시 켜면 이 연결 정보가 사라졌다. 지금은 토큰에서 파일명을 다시 계산할 수 있어서 같은 저장 폴더와 주소를 쓰면 재시작 후에도 공유 링크가 유지된다.

## 직접 확인한 결과

| 확인한 동작 | 결과 |
| --- | --- |
| 공개 주소에서 브라우저로 PNG 업로드·다운로드 | 성공, 원본과 다운로드 파일 일치 |
| 공개 주소에서 curl로 PNG 업로드·다운로드 | 성공, 원본과 다운로드 파일 일치 |
| 업로드 키 없이 전송 | `401 Unauthorized` |
| `.txt` 확장자 또는 PNG가 아닌 내용 | `415 Unsupported Media Type` |
| 5 MiB 초과 | `413 Request Entity Too Large` |
| 존재하지 않는 공유 링크 | `404 Not Found` |
| 새 서버 인스턴스가 기존 저장 폴더 사용 | 기존 링크로 다운로드 성공 |

## 만들면서 배운 점

처음에는 업로드가 실패해서 Go 코드를 확인했는데, 실제 원인은 Windows에 저장된 파일 이름이었다. `sample.png`라고 생각한 파일이 `sample.png.png`였다. 이때 서버의 `/health`와 실제 업로드 응답을 따로 확인하니 어느 단계가 실패했는지 좁힐 수 있었다.

파일을 받는 기능에서는 저장되는 경로와 내려받는 방법까지 함께 설계해야 했다. 다음에는 공유 링크의 삭제와 만료 기능을 붙이고, 고정 주소에서도 같은 검증을 해보고 싶다.
