---
title: "Go로 PNG 파일 공유 서버 만들기"
date: "2026-11-24"
category: "개발"
tags: [Go, Web Backend, File Upload, Security]
difficulty: "Project"
readTime: "5 min read"
summary: "Go로 PNG 업로드·다운로드 서버를 만들고, 파일 검증과 공유 링크를 붙여 외부 접속까지 확인한 과정"
---

Go를 공부하면서 파일 하나가 서버에 올라가고, 다시 공유 링크로 내려받아지는 과정을 직접 만들어 보고 싶었다. 브라우저에서만 되는 화면이 아니라 터미널의 `curl`로도 같은 기능을 사용할 수 있게 하는 것이 목표였다. 파일 업로드는 아무 내용이나 받아 저장하면 위험할 수 있어서, 이번에는 PNG만 허용하는 작은 서버로 범위를 정했다.

완성한 흐름은 간단하다. 사용자가 PNG를 보내면 서버가 형식을 확인해 별도 폴더에 저장하고, 추측하기 어려운 공유 링크를 돌려준다. 링크를 가진 사람은 원본 파일을 다운로드할 수 있다. 업로드에는 키가 필요하지만 다운로드에는 키가 필요하지 않다. 따라서 링크 자체도 함부로 공개하면 안 된다.

## 서버 연결부터 확인했다

처음에는 Ubuntu에서 Go 서버를 띄우고 브라우저와 `curl`로 `/health`를 열었다. 둘 다 `ok`가 나와서 서버가 요청을 받고 있다는 사실을 확인했다. 그다음 `curl`로 `sample.png`를 올리려 했지만 파일을 찾을 수 없다는 메시지가 나왔다. 서버 코드의 문제가 아니라 다운로드 폴더에 있는 실제 파일 이름이 `sample.png.png`였기 때문이다. 이름을 바로잡고 다시 보내자 서버가 `201 Created`를 응답했다.

이때 업로드와 다운로드를 별개로 확인해야 한다는 걸 알았다. 첫 버전은 저장된 파일명만 응답했기 때문에, 업로드가 성공해도 다른 사람이 사용할 공유 주소는 없었다. 그래서 공유 링크를 만들고 해당 링크로 파일을 내려받는 경로를 추가했다. 마지막으로 브라우저에서 파일을 고르는 화면을 붙였다.

- [파일 공유 웹 화면](https://syracuse-diameter-len-salary.trycloudflare.com/)
- [테스트용 PNG 다운로드](https://syracuse-diameter-len-salary.trycloudflare.com/s/603f61505c3166fe92ca58338f68278ffe9bebc7a084022f2b7c858fac5ba4c5)

Cloudflare Quick Tunnel로 로컬 Go 서버를 외부에 연결해 접속을 확인했다. 위 주소는 서버와 터널이 켜져 있을 때만 유효하고, 터널을 다시 시작하면 바뀔 수 있다. 따라서 상시 운영 서비스 주소라기보다 실습 당시의 확인용 주소다. [Cloudflare Quick Tunnel 안내](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/)

## 파일을 보내는 방법은 두 가지

웹 화면을 붙일 때 업로드 코드를 다시 만들 필요는 없었다. 브라우저의 `FormData`와 터미널의 `curl -F`가 둘 다 `file`이라는 이름으로 같은 API에 파일을 보낸다. 서버는 업로드 키와 파일을 확인한 뒤 파일을 저장하고, 응답 본문에 공유 링크 한 줄을 돌려준다. 다운로드는 그 링크를 여는 별도 요청이다.

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

확장자는 파일 이름만 바꿔도 달라진다. 그래서 `.png` 확장자 확인만으로는 충분하지 않다. 서버는 먼저 업로드 키를 검사하고 요청 크기를 제한한다. 이후 확장자와 실제 바이트에서 판별한 MIME 타입을 비교하고, Go의 PNG 디코더로 이미지가 끝까지 읽히는지도 확인한다. 한 파일은 최대 5 MiB로 제한했으며, 디코딩 전에 가로·세로와 총 픽셀 수도 확인한다. 아래는 MIME 확인과 디코딩 부분만 발췌한 코드다. [OWASP 파일 업로드 가이드](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)

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

이렇게 하면 사용자가 보낸 파일명이 저장 경로에 들어가지 않는다. 저장할 파일 이름은 링크의 토큰으로 계산하고, 다운로드 요청 때도 같은 계산으로 파일을 찾는다. 파일은 웹 화면과 분리한 폴더에 넣고 `os.OpenRoot`를 사용해 그 폴더 안에서만 읽고 쓰도록 했다. 또 업로드가 끝나기 전 파일이 다운로드되지 않도록 임시 이름으로 저장을 마친 뒤 최종 이름으로 바꾼다. [Go `os.Root` 문서](https://pkg.go.dev/os#Root)

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

이번 실습에서는 요청이 어느 단계에서 실패했는지 나눠 보는 것이 가장 도움이 됐다. `/health`의 `ok`는 서버 연결만 확인해 주고, `curl`의 파일 경로 오류는 서버에 도착하기 전 문제였다. `201 Created`가 나온 뒤에도 공유 링크로 다운로드하고 원본과 같은지 확인해야 전체 흐름을 검증할 수 있었다.

현재 공유 링크는 토큰을 아는 사람이면 내려받을 수 있고, 한 번 만든 링크를 취소하는 기능은 없다. 다음에는 잘못 공유한 링크를 폐기하는 기능을 추가하고, 고정 주소와 운영 환경을 마련해 임시 터널 없이도 사용할 수 있게 만들고 싶다.
