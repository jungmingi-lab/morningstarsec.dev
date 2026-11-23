---
title: "Go로 PNG 파일 공유 서버 만들기"
date: "2026-11-24"
category: "개발"
tags: [Go, Web Backend, File Upload, Security]
difficulty: "Project"
readTime: "5 min read"
summary: "Go 서버를 처음 띄운 날부터 PNG 업로드, 공유 링크, 외부 접속까지 확인한 기록"
---

## 서버는 켜졌는데 파일이 안 올라갔다

Ubuntu에서 Go 서버를 띄우고 브라우저와 `curl`로 `/health`를 열었다. 둘 다 `ok`가 나왔으니 이제 파일만 보내면 될 줄 알았다. 그런데 `curl`로 `sample.png`를 올리려니 파일을 찾을 수 없었다. 다운로드 폴더를 다시 확인해 보니 실제 이름은 `sample.png.png`였다. 파일 이름을 고치고 다시 보내자 `201 Created`가 나왔다.

처음 성공했을 때 응답에는 서버가 붙인 파일명만 나왔다. 그 뒤에 파일을 내려받을 수 있는 링크를 만들고, 브라우저에서 파일을 골라 올리는 화면을 붙였다.

- [파일 공유 웹 화면](https://syracuse-diameter-len-salary.trycloudflare.com/)
- [테스트용 PNG 다운로드](https://syracuse-diameter-len-salary.trycloudflare.com/s/603f61505c3166fe92ca58338f68278ffe9bebc7a084022f2b7c858fac5ba4c5)

Cloudflare Quick Tunnel로 내 PC의 Go 서버를 외부에 연결했다. 위 주소는 서버와 터널이 켜져 있을 때 열리고, 터널을 다시 켜면 주소가 바뀔 수 있다. 파일을 올릴 때는 키가 필요하고, 위 샘플은 링크만 열면 받을 수 있다. [Cloudflare Quick Tunnel 안내](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/)

## 파일을 보내는 방법은 두 가지

웹 화면을 붙일 때 업로드 코드를 다시 만들 필요는 없었다. 브라우저의 `FormData`와 터미널의 `curl -F`가 둘 다 `file`이라는 이름으로 같은 API에 파일을 보낸다. 서버는 파일을 저장한 뒤 응답 본문에 링크 한 줄을 돌려준다.

| 주소 | 하는 일 |
| --- | --- |
| `GET /` | 파일 선택 화면 열기 |
| `POST /api/files` | PNG 저장 후 `201 Created`와 공유 링크 반환 |
| `GET /s/{token}` | 링크에 연결된 PNG를 첨부 파일로 다운로드 |

업로드 키를 받은 사람은 Ubuntu 터미널에서도 아래처럼 쓸 수 있다. `sample.png`는 현재 폴더에 둔 PNG 파일이다.

```bash
read -rs -p '업로드 키: ' UPLOAD_KEY
echo
SHARE_URL=$(printf 'Authorization: Bearer %s\n' "$UPLOAD_KEY" | curl -fsS -H @- \
  -F 'file=@sample.png' https://syracuse-diameter-len-salary.trycloudflare.com/api/files)
unset UPLOAD_KEY
curl -fsS "$SHARE_URL" -o downloaded.png
cmp sample.png downloaded.png
```

## `.png`로 끝나는지만 보면 될까?

확장자는 이름을 바꾸면 달라진다. 그래서 파일 이름에서 `.png`를 확인한 뒤, 서버가 받은 바이트에서 MIME 타입을 확인하고 Go의 PNG 디코더로 이미지가 실제로 읽히는지도 확인했다. 업로드는 한 장에 최대 5 MiB로 제한했다. 디코딩 전에 이미지의 가로·세로와 총 픽셀 수도 확인한다. 아래는 MIME 확인과 디코딩 단계만 발췌한 코드다. [OWASP 파일 업로드 가이드](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)

```go
if http.DetectContentType(data) != "image/png" {
    http.Error(w, "파일 내용이 PNG 형식과 일치하지 않습니다.", http.StatusUnsupportedMediaType)
    return
}

// 가로·세로와 총 픽셀 수를 확인한 뒤 실행한다.
if _, err := png.Decode(bytes.NewReader(data)); err != nil {
    http.Error(w, "PNG 파일이 손상되었습니다.", http.StatusUnsupportedMediaType)
    return
}
```

## 서버를 다시 켜도 링크가 남게 하기

처음 버전에서는 링크의 토큰과 저장된 파일명을 메모리의 `map`으로 연결했다. 이 방식으로는 서버를 끄는 순간 연결 정보가 사라진다. 지금은 링크에 들어갈 난수 토큰을 만들고 그 SHA-256 값으로 파일명을 정한다. 다운로드 요청이 오면 같은 계산을 해서 파일을 찾을 수 있다.

```go
func storageName(token string) string {
    return fmt.Sprintf("%x.png", sha256.Sum256([]byte(token)))
}
```

이렇게 하면 업로드한 사람이 보낸 파일명이 저장 경로에 들어가지 않는다. 파일은 웹 화면과 분리한 폴더에 넣고, `os.OpenRoot`를 써서 그 폴더 안에서만 읽고 쓰게 했다. 업로드 중인 파일을 다운로드하지 않도록 임시 이름으로 끝까지 쓴 뒤 최종 이름으로 바꾼다. [Go `os.Root` 문서](https://pkg.go.dev/os#Root)

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

막혔을 때 가장 도움이 된 건 서버가 켜졌는지, `curl`이 파일을 찾았는지, 서버가 파일을 받았는지를 따로 확인하는 일이었다. 이번에는 이름을 고치는 것만으로 업로드가 됐지만, 다운로드까지 붙이고 보니 파일이 어디에 저장되는지와 서버를 껐다 켜도 다시 찾을 수 있는지가 더 오래 고민할 부분이었다. 다음엔 잘못 공유한 링크를 지울 수 있게 하고 싶다.
