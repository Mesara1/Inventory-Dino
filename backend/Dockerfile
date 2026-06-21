FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/main.go && \
    CGO_ENABLED=0 GOOS=linux go build -o seed ./cmd/seed/main.go && \
    CGO_ENABLED=0 GOOS=linux go build -o import_transactions ./cmd/import_transactions/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/
COPY --from=builder /app/main .
COPY --from=builder /app/seed .
COPY --from=builder /app/import_transactions .
EXPOSE 8080
CMD ["./main"]
