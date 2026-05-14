# JWT Authentication Patterns

## Overview
- ใช้ JWT เก็บใน `httpOnly cookie` (ป้องกัน XSS)
- Token expire: 24 ชั่วโมง
- Payload ใน JWT: `user_id`, `role`, `exp`

## Go: Sign Token
```go
type JWTClaims struct {
    UserID uint   `json:"user_id"`
    Role   string `json:"role"`
    jwt.RegisteredClaims
}

func SignToken(userID uint, role string, secret string) (string, error) {
    claims := JWTClaims{
        UserID: userID,
        Role:   role,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
        },
    }
    return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
}
```

## Go: JWT Middleware
```go
func JWTMiddleware(secret string) gin.HandlerFunc {
    return func(c *gin.Context) {
        tokenStr, err := c.Cookie("token")
        if err != nil {
            response.Error(c, http.StatusUnauthorized, "unauthorized")
            c.Abort()
            return
        }
        claims := &JWTClaims{}
        token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (any, error) {
            return []byte(secret), nil
        })
        if err != nil || !token.Valid {
            response.Error(c, http.StatusUnauthorized, "invalid token")
            c.Abort()
            return
        }
        c.Set("claims", claims)
        c.Next()
    }
}
```

## Go: Set Cookie on Login
```go
func (h *Handler) Login(c *gin.Context) {
    // ... validate credentials ...
    token, _ := auth.SignToken(user.UserID, string(user.Role), h.config.JWTSecret)
    c.SetCookie("token", token, 86400, "/", "", false, true) // httpOnly=true
    response.Success(c, gin.H{"role": user.Role})
}
```

## Password Hashing (bcrypt)
```go
import "golang.org/x/crypto/bcrypt"

func HashPassword(plain string) (string, error) {
    b, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
    return string(b), err
}

func CheckPassword(plain, hashed string) bool {
    return bcrypt.CompareHashAndPassword([]byte(hashed), []byte(plain)) == nil
}
```

## Next.js: Auth Context
```typescript
// lib/auth.ts — ดึง user info จาก /api/v1/auth/me
export async function getMe(): Promise<User | null> {
    const res = await fetch('/api/v1/auth/me', { credentials: 'include' })
    if (!res.ok) return null
    const { data } = await res.json()
    return data
}
```

## Next.js: Protected Route (middleware.ts)
```typescript
export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')
    if (!token && !request.nextUrl.pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/login', request.url))
    }
}
export const config = { matcher: ['/((?!login|_next).*)'] }
```
